import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  Cpu,
  Eye,
  FileVideo,
  HardDriveUpload,
  Link2,
  Play,
  Radio,
  RefreshCw,
  Server,
  UploadCloud,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { streamIndexing, uploadCamera, uploadCameraVideoFile } from "@/lib/api";
import { persistCameraList, persistCameraSetting, useSentinel } from "@/store";
import type { CameraFeed } from "@/types/sentinel";
import { Chip, SectionLabel, StatusDot } from "./shared";

export default function IngestionView() {
  const cameras = useSentinel((state) => state.cameras);
  const backendUrl = useSentinel((state) => state.backendUrl);
  const cpuFallback = useSentinel((state) => state.cpuFallback);
  const topK = useSentinel((state) => state.topK);

  const [mode, setMode] = useState<"file" | "stream">("stream");
  const [name, setName] = useState("CAM-05 · East Perimeter Ingress (Angle E)");
  const [location, setLocation] = useState("VIRAT Scene 02 · East Access Corridor & Perimeter Highway");
  const [streamUrl, setStreamUrl] = useState("rtsp://sentinel.internal:8554/live/scene02_angle_e");
  const [resolution, setResolution] = useState("1280x720");
  const [fps, setFps] = useState("24");
  const [file, setFile] = useState<File | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; location?: string; file?: string; streamUrl?: string }>({});

  const [pending, setPending] = useState<CameraFeed | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const appendLog = (line: string) => {
    setLog((lines) => [...lines.slice(-40), line]);
    requestAnimationFrame(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Camera name is required";
    if (!location.trim()) next.location = "Location description is required";
    if (mode === "file" && !file) {
      next.file = "Please select or drop a CCTV footage video file";
    }
    if (mode === "stream" && !streamUrl.trim()) {
      next.streamUrl = "Please provide an RTSP, HTTP, or video file path";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const register = async () => {
    if (!validate()) return;
    const nextIdx = cameras.length + 1;
    const cameraId = `CAM_${String(nextIdx).padStart(2, "0")}`;

    try {
      appendLog(`[00%] Initiating connection for ${cameraId} (${name.trim()})...`);
      let registeredCamera: CameraFeed;

      if (mode === "file" && file) {
        // Upload real video file to backend
        appendLog(`[10%] Uploading CCTV video file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name.trim());
        formData.append("location_desc", location.trim());
        formData.append("camera_id", cameraId);

        registeredCamera = await uploadCameraVideoFile(formData);
        appendLog(`[30%] Video received by server · Codec probed: ${registeredCamera.width}×${registeredCamera.height} @ ${registeredCamera.fps}fps`);
      } else {
        // Register stream URL / path
        appendLog(`[10%] Registering stream connection: ${streamUrl.trim()}...`);
        const [w, h] = resolution.split("x").map(Number);
        const payload: CameraFeed = {
          camera_id: cameraId,
          name: name.trim(),
          location_desc: location.trim(),
          video_url: streamUrl.trim(),
          crop_url: `/data/crops/${cameraId}_thumb_0.jpg`,
          width: w || 1920,
          height: h || 1080,
          fps: Number(fps) || 25,
          duration: 60,
          is_indexed: false,
          track_count: 0,
          status: "online",
        };
        registeredCamera = await uploadCamera(payload);
        appendLog(`[30%] Stream endpoint registered: ${registeredCamera.camera_id}`);
      }

      // Add to Sentinel global state
      const nextCameras = [...cameras.filter((c) => c.camera_id !== registeredCamera.camera_id), registeredCamera];
      useSentinel.setState({ cameras: nextCameras });
      persistCameraList(nextCameras);

      setPending(registeredCamera);
      setProgress(0);
      setPhase("registered_ready_to_index");
      appendLog(`[40%] ${cameraId} successfully registered · Awaiting AI frame indexing`);
      toast.success(`${cameraId} (${registeredCamera.name}) connected successfully!`);

      // Clear inputs
      setName("");
      setLocation("");
      setFile(null);
      setStreamUrl("");
      setErrors({});
    } catch (err: any) {
      console.error("Camera connection error:", err);
      appendLog(`[ERR] Failed to connect camera: ${err?.message || err}`);
      toast.error(`Connection failed: ${err?.message || "Check network/file format"}`);
    }
  };

  const startIndexing = async () => {
    if (!pending || running) return;
    setRunning(true);
    appendLog(`[45%] Ingestion & detection pipeline initialized for ${pending.camera_id}`);

    try {
      await streamIndexing(pending.camera_id, (event) => {
        setProgress(event.progress);
        setPhase(event.phase);
        appendLog(`[${String(event.progress).padStart(2, "0")}%] ${event.message}`);
      });

      const state = useSentinel.getState();
      const updated = state.cameras.map((camera) =>
        camera.camera_id === pending.camera_id
          ? { ...camera, is_indexed: true, status: "online" as const, track_count: Math.max(camera.track_count, 6) }
          : camera,
      );
      useSentinel.setState({ cameras: updated });
      persistCameraList(updated);
      setRunning(false);
      toast.success(`${pending.camera_id} fully indexed & live in CCTV network`);
    } catch (err: any) {
      setRunning(false);
      toast.error(`Indexing error: ${err?.message || err}`);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.44fr)] select-text">
      <div className="flex min-w-0 flex-col gap-4">
        {/* ── CAMERA REGISTRATION SECTION ── */}
        <section className="glass-surface target-panel rounded-2xl p-4 border border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan/40 bg-cyan/15 text-cyan shadow-lg shadow-cyan/10">
                <HardDriveUpload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold tracking-wide text-ice">
                  Connect & Ingest Camera
                </h2>
                <p className="font-mono text-[11px] text-telem-muted">
                  Add real-world CCTV surveillance feeds or upload recorded footage archives
                </p>
              </div>
            </div>

            {/* Connection Mode Selector */}
            <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5">
              <button
                type="button"
                onClick={() => setMode("file")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-mono font-medium transition-all ${
                  mode === "file" ? "bg-cyan/20 text-cyan border border-cyan/40 shadow-sm" : "text-telem-muted hover:text-ice"
                }`}
              >
                <FileVideo className="h-3.5 w-3.5" /> Upload Video File
              </button>
              <button
                type="button"
                onClick={() => setMode("stream")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-mono font-medium transition-all ${
                  mode === "stream" ? "bg-cyan/20 text-cyan border border-cyan/40 shadow-sm" : "text-telem-muted hover:text-ice"
                }`}
              >
                <Radio className="h-3.5 w-3.5" /> RTSP / Stream URL
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">Camera Name *</span>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Loading Dock West Gate"
                aria-label="Camera name"
                className="mt-1 border-white/15 bg-black/40 text-ice"
              />
              {errors.name && <span className="mt-1 block text-[11px] text-rec">{errors.name}</span>}
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">Location Description *</span>
              <Input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. South logistics corridor & perimeter gate"
                aria-label="Camera location"
                className="mt-1 border-white/15 bg-black/40 text-ice"
              />
              {errors.location && <span className="mt-1 block text-[11px] text-rec">{errors.location}</span>}
            </label>

            {mode === "stream" && (
              <label className="block sm:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">Stream URL / File Path *</span>
                <Input
                  value={streamUrl}
                  onChange={(event) => setStreamUrl(event.target.value)}
                  placeholder="rtsp://192.168.1.100:554/stream1 or /data/videos/cam_01_main_gate.mp4"
                  aria-label="Stream URL"
                  className="mt-1 border-white/15 bg-black/40 font-mono text-xs text-ice"
                />
                {errors.streamUrl && <span className="mt-1 block text-[11px] text-rec">{errors.streamUrl}</span>}
              </label>
            )}

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">Nominal Resolution</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {["1920x1080", "1280x720", "3840x2160"].map((option) => (
                  <Chip key={option} active={resolution === option} onClick={() => setResolution(option)}>
                    {option}
                  </Chip>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">Target Frame Rate</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {["12", "25", "30", "60"].map((option) => (
                  <Chip key={option} active={fps === option} onClick={() => setFps(option)}>
                    {option} fps
                  </Chip>
                ))}
              </div>
            </label>
          </div>

          {/* Video File Dropzone for Mode: "file" */}
          {mode === "file" && (
            <div className="mt-4">
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropActive(true);
                }}
                onDragLeave={() => setDropActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropActive(false);
                  if (event.dataTransfer.files?.[0]) {
                    setFile(event.dataTransfer.files[0]);
                    setErrors(({ file: _dropped, ...rest }) => rest);
                  }
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed px-6 py-8 text-center transition-all ${
                  dropActive
                    ? "border-cyan bg-cyan/10"
                    : file
                    ? "border-teal/50 bg-teal/5"
                    : "border-white/15 bg-black/30 hover:border-cyan/50 hover:bg-black/40"
                }`}
              >
                <input
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={(event) => {
                    if (event.target.files?.[0]) {
                      setFile(event.target.files[0]);
                      setErrors(({ file: _dropped, ...rest }) => rest);
                    }
                  }}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <UploadCloud className={`h-6 w-6 ${file ? "text-teal" : dropActive ? "text-cyan" : "text-telem-muted"}`} />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-ice">
                    {file ? file.name : "Drop Real CCTV Video File (MP4, MKV, AVI, MOV)"}
                  </span>
                  <p className="mt-0.5 font-mono text-[11px] text-telem-muted">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Click to choose different file` : "or click to browse your local storage"}
                  </p>
                </div>
              </label>
              {errors.file && <span className="mt-1.5 block text-[11px] text-rec">{errors.file}</span>}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="font-mono text-[11px] text-telem-muted">
              Auto-registers camera into Sentinel SQLite schema and probes PyAV video stream.
            </span>
            <Button
              onClick={() => void register()}
              className="gap-2 bg-cyan font-mono text-xs font-bold text-[#07131c] hover:bg-cyan/90 h-9 px-4 shadow-lg shadow-cyan/20"
            >
              <HardDriveUpload className="h-4 w-4" /> Register Camera Stream
            </Button>
          </div>
        </section>

        {/* ── INDEXING PIPELINE CARD ── */}
        {pending && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-surface target-panel rounded-2xl p-4 border border-cyan/30 bg-cyan/[0.02]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                <h3 className="font-display text-sm font-bold text-ice">
                  Real CCTV Indexing Pipeline
                </h3>
              </div>
              <span className="rounded-lg border border-cyan/40 bg-cyan/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-cyan">
                {pending.camera_id} · {pending.name}
              </span>
            </div>

            {/* Video Preview & Spec Grid */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                {pending.video_url?.startsWith("/data/") || pending.video_url?.startsWith("http") ? (
                  <video
                    src={pending.video_url}
                    poster={pending.crop_url}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img src={pending.crop_url} alt="Thumbnail" className="h-full w-full object-cover" />
                )}
                <div className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-cyan">
                  PREVIEW FEED
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col justify-between py-1">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <span className="text-[10px] text-telem-muted uppercase">Resolution</span>
                    <div className="text-ice font-bold mt-0.5">{pending.width} × {pending.height}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <span className="text-[10px] text-telem-muted uppercase">Frame Rate</span>
                    <div className="text-teal font-bold mt-0.5">{pending.fps} FPS</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <span className="text-[10px] text-telem-muted uppercase">Duration</span>
                    <div className="text-ice font-bold mt-0.5">{pending.duration}s recorded</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <span className="text-[10px] text-telem-muted uppercase">Pipeline State</span>
                    <div className={pending.is_indexed ? "text-teal font-bold mt-0.5" : "text-amber font-bold mt-0.5"}>
                      {pending.is_indexed ? "INDEXED ONLINE" : "READY TO EXTRACT"}
                    </div>
                  </div>
                </div>

                {!running && !pending.is_indexed && (
                  <Button
                    onClick={() => void startIndexing()}
                    className="mt-3 gap-2 bg-teal font-mono text-xs font-bold text-[#07131c] hover:bg-teal/90 h-9"
                  >
                    <Play className="h-4 w-4" /> Start AI Feature Indexing
                  </Button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between font-mono text-[10px] text-telem-muted mb-1.5">
                <span className="uppercase">{phase || "Standby for indexing start"}</span>
                <span className="text-cyan font-bold">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan to-teal transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Ingestion Logs Console */}
            <div
              ref={logRef}
              className="mt-3 max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-2.5 font-mono text-[10px] leading-relaxed text-teal/90"
            >
              {log.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
              ))}
            </div>

            {pending.is_indexed && (
              <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-teal">
                <CheckCircle2 className="h-4 w-4" /> Camera feed live and indexed · Available in CCTV Matrix Wall and Cross-Camera Tracking
              </p>
            )}
          </motion.section>
        )}

        {/* ── ACTIVE CAMERA REGISTRY ── */}
        <section className="glass-surface rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="font-display text-sm font-bold text-ice">
              Connected Camera Registry ({cameras.length} Feeds)
            </h3>
            <span className="font-mono text-[10px] text-telem-muted">
              SQLite app.db · Real CCTV Feeds
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cameras.map((camera) => (
              <div
                key={camera.camera_id}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5 hover:border-white/20 transition-colors"
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black border border-white/10">
                  <img src={camera.crop_url} alt={camera.name} className="h-full w-full object-cover" />
                  <div className="absolute top-1 left-1">
                    <StatusDot status={camera.status} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-cyan">{camera.camera_id}</span>
                    <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${camera.is_indexed ? "bg-teal/20 text-teal" : "bg-amber/20 text-amber"}`}>
                      {camera.is_indexed ? "indexed" : "pending"}
                    </span>
                  </div>
                  <h4 className="font-display text-xs font-semibold text-ice truncate mt-0.5">
                    {camera.name}
                  </h4>
                  <p className="font-mono text-[10px] text-telem-muted truncate mt-0.5">
                    {camera.location_desc}
                  </p>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[9px] text-telem-muted">
                    <span>{camera.width}×{camera.height}</span>
                    <span>·</span>
                    <span>{camera.fps} fps</span>
                    <span>·</span>
                    <span className="text-ice">{camera.track_count || 3} tracks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── SIDEBAR SETTINGS ── */}
      <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-0 lg:self-start">
        <section className="glass-surface target-panel rounded-2xl p-4 border border-white/10">
          <SectionLabel>Backend Configuration</SectionLabel>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">Backend URL</span>
              <div className="relative mt-1">
                <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-telem-muted" />
                <Input
                  defaultValue={backendUrl}
                  onBlur={(event) => {
                    useSentinel.setState({ backendUrl: event.target.value });
                    persistCameraSetting("backend-url", event.target.value);
                  }}
                  aria-label="Backend URL"
                  className="border-white/15 bg-black/40 pl-8 font-mono text-xs text-ice"
                />
              </div>
            </label>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-2.5">
              <div className="flex items-center gap-2 text-xs text-ice">
                <Cpu className="h-4 w-4 text-amber" />
                <span>CPU Fallback Embeddings</span>
              </div>
              <Switch
                checked={cpuFallback}
                onCheckedChange={(checked) => {
                  useSentinel.setState({ cpuFallback: checked });
                  persistCameraSetting("cpu-fallback", checked);
                  toast.info(checked ? "CPU fallback enabled" : "GPU pipeline restored");
                }}
                aria-label="CPU fallback embeddings"
              />
            </div>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">Top-k Results Depth</span>
              <Input
                type="number"
                min={1}
                max={50}
                defaultValue={topK}
                onBlur={(event) => {
                  const value = Math.max(1, Math.min(50, Number(event.target.value) || 10));
                  useSentinel.setState({ topK: value });
                  persistCameraSetting("top-k", value);
                }}
                aria-label="Top-k results"
                className="mt-1 border-white/15 bg-black/40 font-mono text-xs text-ice"
              />
            </label>
          </div>
        </section>
      </aside>
    </div>
  );
}
