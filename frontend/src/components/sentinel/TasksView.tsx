import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  CheckCircle2,
  Cpu,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { executeVisionTask, getPlates } from "@/lib/api";
import type { LicensePlateItem, VisionTaskResult } from "@/types/sentinel";
import { SectionLabel, StatBlock } from "./shared";

const QUICK_COMMANDS = [
  { label: "Count Cars", cmd: "count the number of cars", icon: Car },
  { label: "Count People", cmd: "count the number of people", icon: Users },
  { label: "Note Number Plates", cmd: "note all the number plates of the cars", icon: Cpu },
  { label: "Warehouse Cargo", cmd: "detect trucks and cargo at warehouse", icon: Video },
];

export default function TasksView() {
  const [command, setCommand] = useState("note all the number plates of the cars");
  const [executing, setExecuting] = useState(false);
  const [taskResult, setTaskResult] = useState<VisionTaskResult | null>(null);
  const [allPlates, setAllPlates] = useState<LicensePlateItem[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<LicensePlateItem | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [taskModalTab, setTaskModalTab] = useState<"screenshot" | "video">("screenshot");
  const [taskModalZoom, setTaskModalZoom] = useState(1);

  useEffect(() => {
    void runTask("note all the number plates of the cars");
    getPlates().then((data) => setAllPlates(data));
  }, []);

  const runTask = async (cmdToRun: string) => {
    const clean = cmdToRun.trim();
    if (!clean || executing) return;
    setExecuting(true);
    try {
      const res = await executeVisionTask(clean);
      if (res) {
        setTaskResult(res);
        toast.success(`Task completed: ${res.title}`);
      }
    } catch {
      toast.error("Failed to execute vision analytics task");
    } finally {
      setExecuting(false);
    }
  };

  const exportReport = () => {
    if (!taskResult) return;
    const jsonStr = JSON.stringify(taskResult, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel_task_${taskResult.task_type}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Vision task intelligence report exported");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      {/* ── Top Command Deck ── */}
      <section className="glass-surface target-panel rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold tracking-wide text-ice">
                Vision Tasks & ANPR Engine
              </h2>
              <p className="font-mono text-[10px] text-telem-muted">
                Issue analytical CCTV commands — car/people counting, plate OCR, and spatial metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportReport}
              disabled={!taskResult}
              className="h-8 gap-1.5 border-white/15 text-xs text-ice hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" /> Export Report
            </Button>
          </div>
        </div>

        {/* Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runTask(command);
          }}
          className="mt-3.5 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Give any vision task command — e.g. count number of cars, note all number plates, count people..."
              className="h-11 border-white/15 bg-black/50 pl-3.5 pr-10 text-sm text-foreground placeholder:text-telem-muted focus-visible:ring-amber-400"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-telem-muted">
              ↵
            </span>
          </div>
          <Button
            type="submit"
            disabled={executing || !command.trim()}
            className="h-11 gap-2 bg-amber-400/90 px-5 font-display text-xs font-semibold text-[#07131c] hover:bg-amber-400"
          >
            {executing ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#07131c] border-t-transparent" />
                Executing…
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> Run Task
              </>
            )}
          </Button>
        </form>

        {/* Quick Task Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">
            Quick Commands:
          </span>
          {QUICK_COMMANDS.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.cmd}
                type="button"
                onClick={() => {
                  setCommand(q.cmd);
                  void runTask(q.cmd);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-muted-foreground transition-all hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-200"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Main Results View ── */}
      {taskResult && (
        <section className="flex flex-col gap-4">
          {/* Executive KPI Bar */}
          <div className="glass-surface rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/40">
                  {taskResult.task_type.toUpperCase()} RESULT
                </span>
                <h3 className="mt-1 font-display text-base font-bold text-foreground">
                  {taskResult.title}
                </h3>
              </div>
              <div className="font-mono text-[11px] text-cyan">
                Analyzed 4 Streams · Status: Complete
              </div>
            </div>

            <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
              {taskResult.summary}
            </p>

            {/* Cross-Camera Re-ID Deduplication Banner */}
            {taskResult.deduplication_summary && (
              <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-teal/40 bg-teal/15 p-2.5 text-xs text-teal">
                <ShieldCheck className="h-4 w-4 shrink-0 text-teal" />
                <div>
                  <span className="font-bold text-ice">Cross-Camera Re-ID Deduplication Verified: </span>
                  <span>{taskResult.deduplication_summary}</span>
                </div>
              </div>
            )}

            {/* Metric Blocks */}
            {taskResult.metrics && taskResult.metrics.length > 0 && (
              <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {taskResult.metrics.map((m, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-telem-muted">
                      {m.label}
                    </div>
                    <div className="mt-1 font-display text-sm font-bold text-ice truncate">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Deduplicated Global Entities Roster (For People & Car Counting) ── */}
          {taskResult.entities && taskResult.entities.length > 0 && (
            <div className="glass-surface rounded-xl p-4 border border-teal/40">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-teal">
                    Unified Entity Census
                  </span>
                  <span className="font-mono text-[10px] text-ice">· {taskResult.entities.length} Unique Individuals / Vehicles</span>
                </div>
                <span className="rounded bg-teal/20 px-2 py-0.5 font-mono text-[10px] font-bold text-teal border border-teal/40">
                  Global Re-ID Verified
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {taskResult.entities.map((ent: any) => (
                  <div key={ent.id} className="overflow-hidden rounded-xl border border-white/15 bg-black/60 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div>
                          <span className="rounded bg-teal/20 px-2 py-0.5 font-mono text-[10px] font-bold text-teal border border-teal/40">
                            {ent.id}
                          </span>
                          <h4 className="mt-1 font-display text-sm font-bold text-ice">
                            {ent.name}
                          </h4>
                        </div>
                        <span className="rounded-full bg-cyan/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan border border-cyan/40">
                          1 Unique {ent.type === "person" ? "Person" : "Vehicle"}
                        </span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        {/* Detected Screenshot */}
                        <div
                          className="group/thumb relative aspect-video overflow-hidden rounded-lg border border-cyan/40 bg-black cursor-pointer"
                          onClick={() => {
                            setSelectedEntity(ent);
                            setTaskModalTab("screenshot");
                            setTaskModalZoom(1);
                          }}
                        >
                          <img
                            src={ent.screenshot_url || ent.crop_url}
                            alt={ent.name}
                            className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[8px] font-bold text-cyan">
                            📷 Detected Screenshot
                          </span>
                        </div>

                        {/* Telemetry */}
                        <div className="flex flex-col justify-between font-mono text-[10px] text-telem-muted">
                          <div>
                            <span className="text-ice font-bold">Tracked Across:</span>
                            <div className="mt-1 space-y-0.5 text-[9px] text-cyan">
                              {ent.cameras.map((c: string) => (
                                <div key={c}>• {c}</div>
                              ))}
                            </div>
                          </div>
                          <div className="text-teal text-[9px] font-bold">
                            Re-ID Match: {ent.confidence}%
                          </div>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        {ent.note}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/10 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEntity(ent);
                          setTaskModalTab("screenshot");
                          setTaskModalZoom(1);
                        }}
                        className="rounded bg-cyan/90 px-2.5 py-1 font-mono text-[10px] font-bold text-[#07131c] hover:bg-cyan"
                      >
                        Inspect Screenshot
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEntity(ent);
                          setTaskModalTab("video");
                          setTaskModalZoom(1);
                        }}
                        className="rounded border border-white/20 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-ice hover:bg-white/15"
                      >
                        Play Video
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ANPR License Plates Table (When plates are extracted) ── */}
          {(taskResult.plates || allPlates).length > 0 && taskResult.task_type === "license_plates" && (
            <div className="glass-surface rounded-xl p-4">
              <SectionLabel aside={<span className="font-mono text-[10px] text-cyan">{(taskResult.plates || allPlates).length} Plates Logged</span>}>
                Automated Number Plate Recognition (ANPR) Audit Log
              </SectionLabel>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-telem-muted">
                      <th className="py-2.5 px-3">Plate Number</th>
                      <th className="py-2.5 px-3">Vehicle Class & Color</th>
                      <th className="py-2.5 px-3">CCTV Camera Location</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">OCR Confidence</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Evidence Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(taskResult.plates || allPlates).map((plate) => (
                      <tr key={plate.id} className="transition-colors hover:bg-white/[0.03]">
                        {/* Embossed license plate visual */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-black/80 px-2.5 py-1 font-mono text-[11px] font-bold text-ice shadow-inner tracking-wider">
                            <span className="text-[9px] text-amber-400">IND</span>
                            {plate.plate}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-sans font-medium text-foreground">
                            {plate.color} {plate.vehicle_type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-cyan font-medium">{plate.camera_name}</span>
                          <span className="text-telem-muted ml-1">({plate.camera_id})</span>
                        </td>
                        <td className="py-3 px-3 text-amber-300">
                          {plate.time_string} <span className="text-[10px] text-telem-muted">(t+{plate.timestamp.toFixed(1)}s)</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-teal">{plate.confidence}%</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            plate.status.includes("Staff") || plate.status.includes("Registered")
                              ? "bg-teal/20 text-teal border border-teal/40"
                              : plate.status.includes("Visitor")
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                              : "bg-blue-400/20 text-blue-300 border border-blue-400/40"
                          }`}>
                            <ShieldCheck className="h-2.5 w-2.5" />
                            {plate.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedPlate(plate)}
                            className="h-6 gap-1 border border-cyan/40 bg-cyan/15 px-2 text-[10px] text-cyan hover:bg-cyan/25"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" /> Play Video
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Multi-Camera Breakdown Grid (For vehicle & people counting) ── */}
          {taskResult.breakdown && taskResult.breakdown.length > 0 && (
            <div className="glass-surface rounded-xl p-4">
              <SectionLabel aside={<span className="font-mono text-[10px] text-cyan">{taskResult.breakdown.length} Camera Zones Analyzed</span>}>
                Zone-by-Zone Multi-Stream Census Breakdown
              </SectionLabel>

              <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {taskResult.breakdown.map((zone) => (
                  <div key={zone.camera_id} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    {/* Zone Thumbnail */}
                    {zone.crop_url && (
                      <div className="relative aspect-video w-full bg-black">
                        <img src={zone.crop_url} alt={zone.camera_name} className="h-full w-full object-cover" />
                        <span className="absolute top-2 left-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-cyan">
                          {zone.camera_id}
                        </span>
                        <span className="absolute bottom-2 right-2 rounded bg-amber-400/90 px-2 py-0.5 font-mono text-[10px] font-bold text-[#07131c]">
                          Count: {zone.count}
                        </span>
                      </div>
                    )}

                    <div className="p-3">
                      <div className="font-display text-sm font-semibold text-foreground">
                        {zone.camera_name}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {zone.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Lightbox / Inspection Modal for Selected Plate or Entity ── */}
      <Dialog
        open={Boolean(selectedPlate || selectedEntity)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlate(null);
            setSelectedEntity(null);
          }
        }}
      >
        <DialogContent className="border-cyan/30 bg-[var(--popover)] text-foreground sm:max-w-3xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <DialogTitle className="flex items-center gap-2 font-display text-ice">
                <Video className="h-4 w-4 text-cyan" /> CCTV Evidence · {selectedPlate ? `Plate: ${selectedPlate.plate}` : selectedEntity?.name}
              </DialogTitle>
              {/* Switcher */}
              <div className="flex items-center rounded-lg border border-white/15 bg-black/60 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTaskModalTab("screenshot")}
                  className={`rounded px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                    taskModalTab === "screenshot" ? "bg-cyan/25 text-cyan" : "text-telem-muted hover:text-ice"
                  }`}
                >
                  📷 Detected Screenshot
                </button>
                <button
                  type="button"
                  onClick={() => setTaskModalTab("video")}
                  className={`rounded px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                    taskModalTab === "video" ? "bg-cyan/25 text-cyan" : "text-telem-muted hover:text-ice"
                  }`}
                >
                  ▶ CCTV Video
                </button>
              </div>
            </div>
            <DialogDescription className="text-muted-foreground pt-1">
              {selectedPlate
                ? `${selectedPlate.color} ${selectedPlate.vehicle_type} · ${selectedPlate.camera_name} (Confidence: ${selectedPlate.confidence}%)`
                : `${selectedEntity?.note} · ${selectedEntity?.id}`}
            </DialogDescription>
          </DialogHeader>

          {/* Modal Content */}
          <div className="space-y-3">
            {taskModalTab === "screenshot" ? (
              /* Tab 1: Full Detected Screenshot with Bounding Box */
              <div className="space-y-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-cyan/40 bg-black flex items-center justify-center shadow-2xl">
                  <img
                    src={selectedPlate?.screenshot_url || selectedPlate?.crop_url || selectedEntity?.screenshot_url || selectedEntity?.crop_url}
                    alt="CCTV Detected Frame"
                    style={{ transform: `scale(${taskModalZoom})` }}
                    className="h-full w-full object-contain transition-transform duration-200"
                  />
                  <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
                    <span className="rounded bg-cyan/90 px-2 py-0.5 font-mono text-[10px] font-bold text-[#07131c]">
                      {selectedPlate?.camera_id || "MULTI-NODE"} · AI DETECTED SCREENSHOT
                    </span>
                    {selectedEntity?.id && (
                      <span className="rounded bg-teal/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        {selectedEntity.id}
                      </span>
                    )}
                  </div>

                  {/* Zoom Controls */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/85 p-1 backdrop-blur border border-white/20">
                    <button
                      type="button"
                      onClick={() => setTaskModalZoom((z) => Math.min(3, z + 0.25))}
                      className="rounded px-2 py-0.5 font-mono text-xs text-ice hover:bg-white/20"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskModalZoom((z) => Math.max(1, z - 0.25))}
                      className="rounded px-2 py-0.5 font-mono text-xs text-ice hover:bg-white/20"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskModalZoom(1)}
                      className="rounded px-2 py-0.5 font-mono text-[10px] text-telem-muted hover:text-ice"
                    >
                      {Math.round(taskModalZoom * 100)}%
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-telem-muted px-1">
                  <span>AI Ground Detection Keyframe with spatial bounding box.</span>
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = selectedPlate?.screenshot_url || selectedPlate?.crop_url || selectedEntity?.screenshot_url || selectedEntity?.crop_url;
                      a.download = `cctv_task_evidence_${Date.now()}.jpg`;
                      a.click();
                      toast.success("Detected screenshot downloaded");
                    }}
                    className="font-mono text-[11px] text-cyan hover:underline"
                  >
                    Download Screenshot (JPEG)
                  </button>
                </div>
              </div>
            ) : (
              /* Tab 2: Live CCTV Video */
              <div className="space-y-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                  <video
                    src={selectedPlate?.video_url || selectedEntity?.video_url || "/data/videos/cam_01_main_gate.mp4"}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                    onLoadedMetadata={(e) => {
                      if (selectedPlate?.timestamp) {
                        e.currentTarget.currentTime = selectedPlate.timestamp;
                      }
                    }}
                  />
                </div>
                <p className="font-mono text-[10px] text-amber-300">
                  Video cued directly to event timestamp in surveillance feed.
                </p>
              </div>
            )}

            {selectedPlate && (
              <div className="glass-inset rounded-lg p-2.5 text-xs text-muted-foreground">
                Plate: <strong className="text-amber-300 font-mono">{selectedPlate.plate}</strong> · Status: <span className="text-teal font-medium">{selectedPlate.status}</span> · OCR Confidence: <span className="text-cyan">{selectedPlate.confidence}%</span>
              </div>
            )}
            {selectedEntity && (
              <div className="glass-inset rounded-lg p-2.5 text-xs text-muted-foreground flex items-center justify-between">
                <span>Unified Entity: <strong className="text-cyan font-mono">{selectedEntity.id}</strong></span>
                <span className="text-teal font-mono">Re-ID Match: {selectedEntity.confidence}%</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedPlate(null);
                setSelectedEntity(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
