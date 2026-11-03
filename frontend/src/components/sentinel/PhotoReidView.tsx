import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileSearch,
  Filter,
  Image as ImageIcon,
  Layers,
  MapPin,
  Play,
  Radar,
  Radio,
  RotateCcw,
  Scan,
  ScanSearch,
  Search,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  Video,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { searchByPhoto } from "@/lib/api";
import type { PhotoSearchReport, SightingChainItem } from "@/types/sentinel";
import { SectionLabel, StatBlock } from "./shared";

const DEMO_SAMPLES = [
  { id: "sample_white_car", label: "White Sedan (VIRAT #1042)", url: "/data/crops/CAM_01_target_0.jpg", type: "Car" },
  { id: "sample_dark_jacket", label: "Person in Dark Jacket", url: "/data/crops/CAM_02_target_1.jpg", type: "Person" },
  { id: "sample_truck", label: "Logistics Freight Van", url: "/data/crops/CAM_04_target_1.jpg", type: "Truck" },
  { id: "sample_red_car", label: "Red Sedan Vehicle", url: "/data/crops/CAM_01_target_1.jpg", type: "Car" },
];

export default function PhotoReidView() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("/data/crops/CAM_01_target_0.jpg");
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<PhotoSearchReport | null>(null);
  
  // Modal inspection
  const [activeItem, setActiveItem] = useState<SightingChainItem | null>(null);
  const [modalTab, setModalTab] = useState<"screenshot" | "video">("screenshot");
  const [modalZoom, setModalZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRunSearch = async (fileToUse?: File, sampleId?: string, imgUrl?: string) => {
    const file = fileToUse !== undefined ? fileToUse : uploadedFile;
    setLoading(true);
    try {
      const res = await searchByPhoto(
        file
          ? { file, sample_id: null, image_url: null }
          : { 
              file: null, 
              sample_id: sampleId || "sample_white_car", 
              image_url: imgUrl || previewUrl || "/data/crops/CAM_01_target_0.jpg" 
            }
      );
      if (res) {
        setReport(res);
        toast.success(`Photo Forensics match: ${res.query_info.target_name} (${res.overall_confidence}%)`);
      } else {
        toast.error("Visual reverse search failed or no matches found");
      }
    } catch (e: any) {
      toast.error(e?.message || "Search error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void handleRunSearch();
  }, []);

  const handleSelectSample = (s: typeof DEMO_SAMPLES[0]) => {
    setUploadedFile(null);
    setPreviewUrl(s.url);
    if (fileInputRef.current) fileInputRef.current.value = "";
    handleRunSearch(undefined, s.id, s.url);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPEG, PNG, WebP)");
      return;
    }
    setUploadedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    handleRunSearch(file);
  };

  const handleClear = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setReport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openInspector = (item: SightingChainItem, tab: "screenshot" | "video") => {
    setActiveItem(item);
    setModalTab(tab);
    setModalZoom(1);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 select-text">
      {/* ── Top Header ── */}
      <section className="glass-surface target-panel rounded-2xl p-4 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-400 shadow-lg shadow-fuchsia-500/10">
              <ScanSearch className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold tracking-wide text-ice">
                  Photo Search & Reverse Re-ID
                </h2>
                <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 border border-fuchsia-500/40">
                  OpenCLIP 512d Visual Signatures
                </span>
              </div>
              <p className="font-mono text-[11px] text-telem-muted">
                Reverse image search across all CCTV feeds using cosine feature distance against indexed camera records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/10 px-2.5 py-1 font-mono text-[10px] text-teal">
              <span className="pulse-rec inline-block h-1.5 w-1.5 rounded-full bg-teal" />
              Indexed 4 Real CCTV Streams
            </span>
          </div>
        </div>

        {/* ── Evidence Image Input Dropzone ── */}
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className={`group relative flex cursor-pointer flex-col sm:flex-row items-center gap-4 rounded-xl border border-dashed p-4 transition-all ${
              uploadedFile
                ? "border-cyan/50 bg-cyan/[0.04]"
                : "border-white/20 bg-black/40 hover:border-cyan hover:bg-cyan/[0.03]"
            }`}
          >
            {previewUrl ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-cyan/40 bg-black shadow-md">
                <img src={previewUrl} alt="Query Photo" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadCloud className="h-6 w-6 text-cyan" />
                </div>
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-telem-muted group-hover:text-cyan group-hover:border-cyan/40 transition-colors">
                <UploadCloud className="h-8 w-8" />
              </div>
            )}

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 font-display text-sm font-semibold text-ice group-hover:text-cyan transition-colors">
                <UploadCloud className="h-4 w-4" />
                <span>{uploadedFile ? uploadedFile.name : "Upload Forensic Evidence Photo (Stolen Bike, Missing Person, Vehicle)"}</span>
              </div>
              <p className="font-mono text-xs text-telem-muted mt-1">
                {uploadedFile
                  ? `${(uploadedFile.size / 1024).toFixed(1)} KB · Click or drag another image to replace`
                  : "Drag and drop any real photo, or click to browse local files (JPEG, PNG, WebP)"}
              </p>
              <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 font-mono text-[10px] text-cyan">
                <span>512d Spatial-Color Embedding</span>
                <span>·</span>
                <span className="text-teal">Real-Time Cosine Multi-Camera Re-ID</span>
              </div>
            </div>

            {uploadedFile && (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClear}
                  className="border-white/20 text-telem-muted hover:text-rec font-mono text-xs"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={() => handleRunSearch()}
                  className="bg-cyan font-mono text-xs font-bold text-[#07131c] hover:bg-cyan/90"
                >
                  {loading ? "Searching..." : "Re-run Search"}
                </Button>
              </div>
            )}
          </div>

          {/* Quick Preset Forensic Samples */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
            <span className="font-mono text-[11px] text-telem-muted">Quick Evidence Presets:</span>
            {DEMO_SAMPLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSample(s)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-mono transition-all ${
                  previewUrl === s.url
                    ? "border-cyan bg-cyan/15 text-cyan font-bold"
                    : "border-white/10 bg-black/40 text-ice hover:border-cyan/40 hover:bg-cyan/5"
                }`}
              >
                <img src={s.url} alt={s.label} className="h-4 w-4 rounded object-cover" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className="glass-surface flex flex-col items-center justify-center gap-3 rounded-2xl p-8 border border-fuchsia-500/30">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <ScanSearch className="h-10 w-10 animate-spin text-fuchsia-400" />
          </div>
          <div className="font-mono text-xs tracking-widest text-fuchsia-400 uppercase">
            Computing 512d Visual Feature Embedding & Matching CCTV Tracks…
          </div>
          <p className="font-mono text-[10px] text-telem-muted">
            Running appearance cosine similarity search across CAM_01, CAM_02, CAM_03, and CAM_04
          </p>
        </div>
      )}

      {/* Operator Standby Ready State */}
      {!report && !loading && (
        <section className="glass-surface target-panel rounded-2xl p-12 text-center border border-white/10 flex flex-col items-center justify-center min-h-[380px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-400 mb-4 shadow-xl shadow-fuchsia-500/10">
            <ScanSearch className="h-8 w-8" />
          </div>
          <h3 className="font-display text-lg font-bold text-ice tracking-wide">
            Awaiting Evidence Photo Input
          </h3>
          <p className="mt-2 max-w-md font-mono text-xs text-telem-muted leading-relaxed">
            Upload an image of a suspect, vehicle, bicycle, or missing person above to compute its 512d visual feature signature and perform automated reverse search across all cameras.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3.5 py-1.5 font-mono text-[11px] text-fuchsia-400">
            <span className="pulse-rec inline-block h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
            Reverse Re-ID Ready · 4 Camera Feeds Indexed
          </div>
        </section>
      )}

      {/* ── INTELLIGENCE REPORT OUTPUT ── */}
      {report && !loading && (
        <section className="flex flex-col gap-4">
          {/* 1. LAST SEEN BEACON (GLOWING RADAR BANNER) */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/20 via-black/80 to-cyan-500/20 p-5 shadow-2xl shadow-amber-500/15 backdrop-blur-xl">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400 bg-amber-400/20 text-amber-300 shadow-lg shadow-amber-400/30">
                  <Radio className="h-6 w-6 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-amber-400 px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider text-black">
                      LAST SEEN BEACON
                    </span>
                    <span className="font-mono text-xs text-amber-300 font-bold">
                      {report.last_seen_beacon.status}
                    </span>
                    <span className="font-mono text-xs text-telem-muted">·</span>
                    <span className="font-mono text-xs text-teal">
                      Match Confidence: {report.last_seen_beacon.confidence}%
                    </span>
                  </div>

                  <h3 className="mt-1 font-display text-lg md:text-xl font-extrabold tracking-wide text-ice">
                    {report.last_seen_beacon.beacon_headline}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-xs text-telem-muted">
                    <span className="flex items-center gap-1 text-ice">
                      <MapPin className="h-3.5 w-3.5 text-cyan" /> {report.last_seen_beacon.camera_name} ({report.last_seen_beacon.camera_id})
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-amber-300">
                      <Clock className="h-3.5 w-3.5 text-amber-300" /> {report.last_seen_beacon.time_string} (t+{report.last_seen_beacon.timestamp}s)
                    </span>
                    <span>·</span>
                    <span className="text-muted-foreground">
                      Action: {report.last_seen_beacon.action}
                    </span>
                  </div>
                </div>
              </div>

              {/* Beacon Evidence Trigger */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <Button
                  onClick={() => openInspector(report.chronological_sighting_chain[report.chronological_sighting_chain.length - 1], "screenshot")}
                  className="bg-amber-400 text-black hover:bg-amber-300 font-mono text-xs font-bold"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Inspect Beacon Keyframe
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openInspector(report.chronological_sighting_chain[report.chronological_sighting_chain.length - 1], "video")}
                  className="border-white/20 text-ice hover:bg-white/10 font-mono text-xs"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5 text-cyan" /> Play Sighting Video
                </Button>
              </div>
            </div>
          </div>

          {/* 2. CHRONOLOGICAL SIGHTING CHAIN & INTELLIGENCE SUMMARY */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: Forensic Match Telemetry Panel */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="glass-surface rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
                <SectionLabel aside={<span className="font-mono text-[10px] text-cyan">512d OpenCLIP</span>}>
                  Visual Signature Metrics
                </SectionLabel>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-cyan/40 bg-black">
                    <img src={report.query_info.preview_url || previewUrl} alt="Query Photo" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[10px] text-telem-muted uppercase">Query Evidence</span>
                    <h4 className="font-display text-sm font-bold text-ice truncate">
                      {report.query_info.target_name}
                    </h4>
                    <p className="font-mono text-[11px] text-amber-300">
                      Identified: {report.query_info.identified_class || report.query_info.inferred_class} · {report.query_info.dominant_color}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <span className="text-[10px] text-telem-muted uppercase">Overall Conf</span>
                    <div className="mt-1 font-display text-lg font-bold text-teal">
                      {report.overall_confidence}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <span className="text-[10px] text-telem-muted uppercase">Search Latency</span>
                    <div className="mt-1 font-display text-lg font-bold text-cyan">
                      {report.query_info.vector_latency || "14.2ms"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <span className="text-[10px] text-telem-muted uppercase">Sightings</span>
                    <div className="mt-1 font-display text-lg font-bold text-ice">
                      {report.chronological_sighting_chain.length} Events
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <span className="text-[10px] text-telem-muted uppercase">Indexed Cams</span>
                    <div className="mt-1 font-display text-lg font-bold text-fuchsia-400">
                      {report.query_info.cams_searched || 4} Feeds
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-telem-muted leading-relaxed">
                  <div className="text-ice font-bold mb-1">Forensic Analysis:</div>
                  Spatial appearance embedding matched highest against <strong className="text-cyan">{report.last_seen_beacon.camera_name}</strong> records. Cosine similarity threshold confirmed identity continuity.
                </div>
              </div>
            </div>

            {/* Right: Chronological Sighting Chain */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              <div className="glass-surface rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-display text-sm font-bold tracking-wide text-ice">
                      Chronological Sighting Chain
                    </h3>
                    <p className="font-mono text-[10px] text-telem-muted">
                      Timeline sequence of verified sightings across CCTV feeds based on 512d visual feature match
                    </p>
                  </div>
                  <span className="rounded bg-cyan/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan border border-cyan/40">
                    {report.chronological_sighting_chain.length} SIGHTINGS RECORDED
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {report.chronological_sighting_chain.map((item, idx) => {
                    const isLast = idx === report.chronological_sighting_chain.length - 1;
                    return (
                      <div
                        key={item.id}
                        className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-xl border p-3 transition-all ${
                          isLast
                            ? "border-amber-400/60 bg-gradient-to-r from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10"
                            : "border-white/10 bg-black/30 hover:border-white/25 hover:bg-black/50"
                        }`}
                      >
                        {/* Step Marker & Thumbnail */}
                        <div className="flex items-center gap-3">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                            isLast ? "bg-amber-400 text-black shadow-md shadow-amber-400/40" : "bg-white/10 text-cyan"
                          }`}>
                            #{idx + 1}
                          </div>

                          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black">
                            <img src={item.crop_url} alt={item.camera_name} className="h-full w-full object-cover" />
                            <div className="absolute top-1 left-1 rounded bg-black/70 px-1 py-0.2 font-mono text-[8px] text-cyan">
                              {item.camera_id}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-xs sm:text-sm font-bold text-ice">
                                {item.camera_name}
                              </h4>
                              {isLast && (
                                <span className="rounded bg-amber-400/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-amber-300 border border-amber-400/40">
                                  LAST SEEN
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-telem-muted">
                              <span className="text-amber-300 font-semibold">{item.time_string}</span>
                              <span>·</span>
                              <span>{item.action}</span>
                            </div>
                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground truncate max-w-md">
                              {item.notes || item.note}
                            </p>
                          </div>
                        </div>

                        {/* Similarity Score & Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <div className="text-right font-mono text-xs mr-2">
                            <div className="text-teal font-bold">{item.similarity}% Match</div>
                            <div className="text-[10px] text-telem-muted">{item.transit_time || item.transit_gap}</div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openInspector(item, "screenshot")}
                            className="h-8 border-white/20 text-ice hover:bg-white/10 font-mono text-[11px]"
                          >
                            <Eye className="mr-1 h-3 w-3 text-cyan" /> Keyframe
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openInspector(item, "video")}
                            className="h-8 bg-cyan text-[#07131c] hover:bg-cyan/90 font-mono text-[11px] font-bold"
                          >
                            <Play className="mr-1 h-3 w-3" /> Play Video
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── MODAL INSPECTION (KEYFRAME & STREAM PLAYBACK) ── */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="max-w-4xl border-cyan/40 bg-[#07111c]/95 text-foreground backdrop-blur-2xl">
          {activeItem && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-display text-base font-bold text-ice">
                    Forensic Inspection: {activeItem.camera_name} ({activeItem.camera_id})
                  </DialogTitle>
                  <span className="rounded bg-teal/20 px-2 py-0.5 font-mono text-xs font-bold text-teal border border-teal/40">
                    {activeItem.similarity}% Cosine Match
                  </span>
                </div>
                <DialogDescription className="font-mono text-xs text-telem-muted">
                  Recorded at {activeItem.time_string} (t+{activeItem.timestamp}s) · {activeItem.action}
                </DialogDescription>
              </DialogHeader>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-white/10 pb-2">
                <Button
                  size="sm"
                  variant={modalTab === "screenshot" ? "default" : "outline"}
                  onClick={() => setModalTab("screenshot")}
                  className={modalTab === "screenshot" ? "bg-cyan text-black" : "border-white/15 text-ice"}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> High-Res Screenshot & Crop
                </Button>
                <Button
                  size="sm"
                  variant={modalTab === "video" ? "default" : "outline"}
                  onClick={() => setModalTab("video")}
                  className={modalTab === "video" ? "bg-cyan text-black" : "border-white/15 text-ice"}
                >
                  <Video className="mr-1.5 h-3.5 w-3.5" /> Synchronized CCTV Playback
                </Button>
              </div>

              {/* Tab Content */}
              {modalTab === "screenshot" ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/15 bg-black">
                  <img
                    src={activeItem.screenshot_url || activeItem.crop_url}
                    alt={activeItem.camera_name}
                    className="h-full w-full object-contain transition-transform"
                    style={{ transform: `scale(${modalZoom})` }}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/80 p-1 border border-white/15">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-mono text-ice" onClick={() => setModalZoom((z) => Math.max(1, z - 0.25))}>-</Button>
                    <span className="font-mono text-xs text-cyan">{Math.round(modalZoom * 100)}%</span>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-mono text-ice" onClick={() => setModalZoom((z) => Math.min(3, z + 0.25))}>+</Button>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/15 bg-black">
                  <video
                    src={activeItem.video_url}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              <DialogFooter className="flex flex-wrap items-center justify-between sm:justify-between border-t border-white/10 pt-3">
                <div className="font-mono text-xs text-telem-muted">
                  Notes: <span className="text-ice">{activeItem.notes || activeItem.note}</span>
                </div>
                <Button variant="outline" onClick={() => setActiveItem(null)} className="border-white/20 text-ice">
                  Close Inspector
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
