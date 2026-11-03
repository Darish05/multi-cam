import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Car,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Download,
  ExternalLink,
  Film,
  GitBranch,
  Layers,
  MapPin,
  Play,
  RotateCcw,
  Route,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Video,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getJourney } from "@/lib/api";
import { useSentinel } from "@/store";
import type { JourneyStep, ReconstructedJourney, SplicedCut } from "@/types/sentinel";
import { Chip, SectionLabel, StatBlock } from "./shared";

export default function ReidView() {
  const tracedTrackId = useSentinel((state) => state.tracedTrackId);
  const [queryInput, setQueryInput] = useState("track the white sedan across all camera angles");
  const [activeQuery, setActiveQuery] = useState("track the white sedan across all camera angles");
  const [journey, setJourney] = useState<ReconstructedJourney | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJourneyData("track the white sedan");
  }, []);
  
  // Stitched video player state
  const stitchedVideoRef = useRef<HTMLVideoElement>(null);
  const [montageCurrentTime, setMontageCurrentTime] = useState(0);
  const [activeCutIndex, setActiveCutIndex] = useState<number>(0);

  // Step inspection modal
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);
  const [stepModalTab, setStepModalTab] = useState<"screenshot" | "video">("screenshot");
  const [modalZoom, setModalZoom] = useState(1);

  const fetchJourneyData = (targetQuery: string) => {
    setLoading(true);
    getJourney(targetQuery)
      .then((data) => {
        if (data) {
          setJourney(data);
          setActiveQuery(targetQuery);
          setActiveCutIndex(0);
          toast.success(`Journey reconstructed for "${data.target_name}" (${data.confidence}%)`);
        } else {
          toast.error("Could not trace multi-camera journey");
        }
      })
      .catch((err) => {
        toast.error(err?.message || "Error fetching journey");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleQuerySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = queryInput.trim();
    if (!clean) return;
    fetchJourneyData(clean);
  };

  const handleSeekMontageCut = (cut: SplicedCut, idx: number) => {
    if (stitchedVideoRef.current) {
      stitchedVideoRef.current.currentTime = cut.montage_start;
      stitchedVideoRef.current.play().catch(() => {});
      setActiveCutIndex(idx);
    }
  };

  const openStepModal = (step: JourneyStep, tab: "screenshot" | "video") => {
    setSelectedStep(step);
    setStepModalTab(tab);
    setModalZoom(1);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 select-text">
      {/* ── 1. QUERY-DRIVEN TRACKING COMMAND HEADER ── */}
      <section className="glass-surface target-panel rounded-2xl p-4 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal/40 bg-teal/15 text-teal shadow-lg shadow-teal/10">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold tracking-wide text-ice">
                  Query-Driven Cross-Camera Journey
                </h2>
                <span className="rounded-full bg-teal/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-teal border border-teal/40">
                  Stitched Video Montage · Cuts & Merges
                </span>
              </div>
              <p className="font-mono text-[11px] text-telem-muted">
                Accepts any natural language tracking query · Slices and splices detection intervals across CCTV feeds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] text-cyan">
              CAM_01 → CAM_02 → CAM_03 → CAM_04
            </span>
          </div>
        </div>

        {/* ── Natural Language Search Input Bar ── */}
        <form onSubmit={handleQuerySubmit} className="mt-3.5 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Enter tracking target (e.g. 'track the red sedan', 'track person in dark jacket', 'follow the white truck')..."
              className="h-10 w-full rounded-xl border border-white/15 bg-black/60 pl-9 pr-24 font-mono text-xs text-ice placeholder:text-telem-muted focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => setQueryInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-telem-muted hover:text-ice text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-cyan text-[#07131c] hover:bg-cyan/90 font-mono text-xs font-bold shrink-0 h-10 px-4"
          >
            {loading ? "Reconstructing…" : "Track Target Across Cameras"}
          </Button>
        </form>

        {/* Quick Target Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">
            Quick Targets:
          </span>
          {[
            { label: "White Sedan (VIRAT #1042)", query: "track the white sedan" },
            { label: "Dark Jacket Pedestrian", query: "track person in dark jacket" },
            { label: "Logistics Delivery Van", query: "track the white truck" },
            { label: "Red Sedan Ingress", query: "track the red car" },
          ].map((item) => (
            <button
              key={item.query}
              type="button"
              onClick={() => {
                setQueryInput(item.query);
                fetchJourneyData(item.query);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal/10 px-2.5 py-1 font-mono text-xs text-teal hover:border-cyan/50 hover:bg-cyan/15 hover:text-cyan transition-all"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className="glass-surface flex flex-col items-center justify-center gap-3 rounded-2xl p-8 border border-cyan/30">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <Route className="h-10 w-10 animate-spin text-cyan" />
          </div>
          <div className="font-mono text-xs tracking-widest text-cyan uppercase">
            Splicing Cross-Camera Feeds & Generating Video Montage…
          </div>
          <p className="font-mono text-[10px] text-telem-muted">
            Extracting detection intervals along target path (CAM_01 → CAM_02 → CAM_03 → CAM_04)
          </p>
        </div>
      )}

      {/* Operator Standby State */}
      {!journey && !loading && (
        <section className="glass-surface target-panel rounded-2xl p-12 text-center border border-white/10 flex flex-col items-center justify-center min-h-[380px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal/40 bg-teal/10 text-teal mb-4 shadow-xl shadow-teal/10">
            <Route className="h-8 w-8" />
          </div>
          <h3 className="font-display text-lg font-bold text-ice tracking-wide">
            Awaiting Target Tracking Query
          </h3>
          <p className="mt-2 max-w-md font-mono text-xs text-telem-muted leading-relaxed">
            Enter a target description above to trace an entity across CCTV cameras and dynamically generate the single continuous spliced video montage with camera transition cuts and timestamps.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3.5 py-1.5 font-mono text-[11px] text-teal">
            <span className="pulse-rec inline-block h-1.5 w-1.5 rounded-full bg-teal" />
            Real CCTV Feeds Online & Indexed (CAM_01 → CAM_04)
          </div>
        </section>
      )}

      {journey && !loading && (
        <section className="flex flex-col gap-4">
          {/* ── 2. SINGLE STITCHED VIDEO MONTAGE ("CUTS & MERGES") ── */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-cyan/50 bg-gradient-to-b from-[#0a1524] to-[#040910] p-4 shadow-2xl shadow-cyan/10">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/40 bg-cyan/15 text-cyan">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm md:text-base font-bold tracking-wide text-ice">
                      Single Stitched Video Montage ("Cuts & Merges")
                    </h3>
                    <span className="rounded bg-teal/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-teal border border-teal/40">
                      Seamless Playback
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-telem-muted">
                    Dynamically spliced detection intervals along target path · Camera transition cuts, timestamp overlays, and watermarks in one seamless video
                  </p>
                </div>
              </div>

              {/* Download & Actions */}
              <div className="flex items-center gap-2">
                {journey.stitched_video_url && (
                  <a
                    href={journey.stitched_video_url}
                    download={`sentinel_stitched_${journey.global_id || "montage"}.mp4`}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-ice hover:bg-white/10 hover:border-cyan transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan" />
                    <span>Download Stitched MP4</span>
                  </a>
                )}
              </div>
            </div>

            {/* Video Player Frame with Spliced Overlay HUD */}
            <div className="mt-3.5 relative aspect-video w-full overflow-hidden rounded-xl border border-cyan/30 bg-black shadow-2xl">
              <video
                ref={stitchedVideoRef}
                src={journey.stitched_video_url || "/data/videos/stitched_red_car.mp4"}
                controls
                playsInline
                className="h-full w-full object-cover"
                onTimeUpdate={(e) => {
                  const t = e.currentTarget.currentTime;
                  setMontageCurrentTime(t);
                  if (journey.spliced_cuts) {
                    const idx = journey.spliced_cuts.findIndex(
                      (c) => t >= c.montage_start && t < c.montage_end
                    );
                    if (idx !== -1 && idx !== activeCutIndex) {
                      setActiveCutIndex(idx);
                    }
                  }
                }}
              />

              {/* Real-Time Camera Cut Floating Badge Overlay */}
              {journey.spliced_cuts && journey.spliced_cuts[activeCutIndex] && (
                <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 z-10">
                  <div className="flex items-center gap-1.5 rounded-lg border border-cyan/50 bg-black/85 px-2.5 py-1 font-mono text-[10px] font-bold text-cyan backdrop-blur shadow-lg">
                    <span className="pulse-rec inline-block h-2 w-2 rounded-full bg-cyan" />
                    <span>CUT 0{activeCutIndex + 1}: {journey.spliced_cuts[activeCutIndex].camera_id} · {journey.spliced_cuts[activeCutIndex].camera_name}</span>
                  </div>
                  <div className="rounded-lg border border-amber-400/50 bg-black/85 px-2.5 py-1 font-mono text-[10px] text-amber-300 backdrop-blur">
                    {journey.spliced_cuts[activeCutIndex].time_string}
                  </div>
                </div>
              )}
            </div>

            {/* Spliced Camera Cuts Jump Navigator */}
            {journey.spliced_cuts && journey.spliced_cuts.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-telem-muted">
                  <span className="flex items-center gap-1.5">
                    <Scissors className="h-3 w-3 text-cyan" />
                    <span>Camera Transition Cuts in Spliced Montage (Click to jump):</span>
                  </span>
                  <span className="text-cyan">
                    Current Position: {montageCurrentTime.toFixed(1)}s
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {journey.spliced_cuts.map((cut, idx) => {
                    const isActive = activeCutIndex === idx;
                    return (
                      <button
                        key={cut.cut_index}
                        type="button"
                        onClick={() => handleSeekMontageCut(cut, idx)}
                        className={`group flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                          isActive
                            ? "border-cyan bg-cyan/20 ring-1 ring-cyan shadow-md shadow-cyan/20"
                            : "border-white/10 bg-black/40 hover:border-cyan/40 hover:bg-cyan/5"
                        }`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                          isActive ? "bg-cyan text-[#07131c]" : "bg-white/10 text-cyan"
                        }`}>
                          0{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className={`font-display text-xs font-semibold truncate ${
                            isActive ? "text-cyan" : "text-ice group-hover:text-cyan"
                          }`}>
                            {cut.camera_id} · {cut.camera_name.split(" ")[0]}
                          </div>
                          <div className="font-mono text-[9px] text-amber-300 truncate">
                            {cut.time_string} ({cut.montage_start.toFixed(1)}s)
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── 3. FORENSIC AI TIMELINE SUMMARY ── */}
          <div className="glass-surface rounded-2xl p-4 border border-cyan/30">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan">
                  Forensic AI Timeline Summary
                </span>
                <span className="font-mono text-[10px] text-ice">· {journey.target_name}</span>
                {journey.global_id && (
                  <span className="rounded bg-teal/20 px-2 py-0.5 font-mono text-[9px] font-bold text-teal border border-teal/40">
                    {journey.global_id}
                  </span>
                )}
                {journey.plate && (
                  <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 border border-amber-400/40">
                    Plate: {journey.plate}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-amber-300">Total Transit: {journey.total_duration}</span>
                <span className="text-teal">Re-ID Match: {journey.confidence}%</span>
              </div>
            </div>

            {/* Deduplication & Identity Clustering Note */}
            {journey.deduplication_note && (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/10 p-2.5 text-xs text-teal">
                <ShieldCheck className="h-4 w-4 shrink-0 text-teal" />
                <span><strong>Multi-Camera Re-ID Continuity:</strong> {journey.deduplication_note}</span>
              </div>
            )}

            {/* Structured Chronological Summary with Ground Timestamps */}
            {journey.timeline_summary && (
              <div className="mt-3.5 flex flex-col gap-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-telem-muted">
                  Ground Chronological Waypoints:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {journey.timeline_summary.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/50 p-2.5 font-mono text-xs text-ice"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan/20 text-cyan text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="leading-snug text-foreground/90">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trajectory Breadcrumb Arrow Chain */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 overflow-x-auto py-1 border-t border-white/5 pt-3">
              {journey.steps.map((step, idx) => (
                <div key={step.node_id} className="flex items-center gap-2">
                  <div
                    onClick={() => openStepModal(step, "screenshot")}
                    className="group/node flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 transition-all hover:border-cyan hover:bg-cyan/10"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan/20 font-mono text-[10px] font-bold text-cyan">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-display text-xs font-semibold text-foreground group-hover/node:text-cyan">
                        {step.camera_name}
                      </div>
                      <div className="font-mono text-[9px] text-amber-300">
                        {step.time_string.split(" ")[0]} · t+{step.timestamp.toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  {idx < journey.steps.length - 1 && (
                    <div className="flex items-center text-cyan/70">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. NODE-BY-NODE CHRONOLOGICAL CCTV EVIDENCE CHAIN ── */}
          <div className="space-y-4">
            <SectionLabel aside={<span className="font-mono text-[10px] text-cyan">Sequential Multi-Camera Proof</span>}>
              Chronological CCTV Evidence Chain (Individual Camera Streams)
            </SectionLabel>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {journey.steps.map((step, idx) => (
                <motion.div
                  key={step.node_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-surface overflow-hidden rounded-xl border border-white/10 p-3.5"
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan/20 font-mono text-xs font-bold text-cyan">
                        0{idx + 1}
                      </span>
                      <div>
                        <div className="font-display text-sm font-bold text-ice">
                          {step.camera_name} <span className="font-mono text-[10px] text-cyan">({step.camera_id})</span>
                        </div>
                        <div className="font-mono text-[10px] text-telem-muted">
                          {step.action} · {step.transit_time}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="rounded-full bg-teal/20 px-2 py-0.5 font-mono text-[10px] font-bold text-teal border border-teal/40">
                        {step.similarity}% Match
                      </span>
                      <div className="font-mono text-[10px] text-amber-300 mt-0.5">
                        {step.time_string}
                      </div>
                    </div>
                  </div>

                  {/* Media Hierarchy: Detected Keyframe Screenshot First, Then Video */}
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {/* 1. Detected Screenshot Keyframe with Bounding Box */}
                    <div className="overflow-hidden rounded-lg border border-cyan/40 bg-black group/shot">
                      <div className="flex items-center justify-between bg-black/80 px-2 py-1 font-mono text-[9px]">
                        <span className="uppercase text-cyan font-bold">Detected Screenshot</span>
                        <span className="text-amber-300">t+{step.timestamp.toFixed(1)}s</span>
                      </div>
                      <div
                        className="relative aspect-video w-full cursor-pointer"
                        onClick={() => openStepModal(step, "screenshot")}
                      >
                        <img
                          src={step.screenshot_url || step.crop_url}
                          alt={step.note}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover/shot:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                          <span className="font-mono text-[9px] text-ice">
                            {step.camera_id} Keyframe
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openStepModal(step, "screenshot");
                            }}
                            className="rounded bg-cyan/90 px-2 py-0.5 font-mono text-[9px] font-bold text-[#07131c] hover:bg-cyan"
                          >
                            Inspect Keyframe
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. CCTV Video Player Directly Starts at Exact Moment */}
                    <div className="overflow-hidden rounded-lg border border-white/15 bg-black">
                      <div className="flex items-center justify-between bg-black/80 px-2 py-1 font-mono text-[9px]">
                        <span className="uppercase text-cyan">Starts at t+{step.timestamp.toFixed(1)}s</span>
                        <span className="text-ice">Live CCTV Feed</span>
                      </div>
                      <div className="relative aspect-video w-full bg-black">
                        <video
                          src={step.video_url}
                          controls
                          playsInline
                          className="h-full w-full object-cover"
                          onLoadedMetadata={(e) => {
                            e.currentTarget.currentTime = step.timestamp;
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footnote Synopsis */}
                  <div className="mt-2.5 rounded-lg border-l-2 border-teal/60 bg-white/[0.02] p-2 text-xs text-muted-foreground flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">Sighting Log: </span>
                      {step.note}
                    </div>
                    {step.global_id && (
                      <span className="rounded bg-teal/15 px-2 py-0.5 font-mono text-[9px] text-teal shrink-0">
                        {step.global_id}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Lightbox Dialog for Inspecting Step in Full (Screenshot & Video) ── */}
      <Dialog open={Boolean(selectedStep)} onOpenChange={(open) => !open && setSelectedStep(null)}>
        <DialogContent className="border-cyan/30 bg-[var(--popover)] text-foreground sm:max-w-3xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <DialogTitle className="flex items-center gap-2 font-display text-ice">
                <Video className="h-4 w-4 text-cyan" /> {selectedStep?.camera_name} ({selectedStep?.camera_id})
              </DialogTitle>
              {/* Tab Switcher */}
              <div className="flex items-center rounded-lg border border-white/15 bg-black/60 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStepModalTab("screenshot")}
                  className={`rounded px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                    stepModalTab === "screenshot" ? "bg-cyan/25 text-cyan" : "text-telem-muted hover:text-ice"
                  }`}
                >
                  📷 Detected Keyframe
                </button>
                <button
                  type="button"
                  onClick={() => setStepModalTab("video")}
                  className={`rounded px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                    stepModalTab === "video" ? "bg-cyan/25 text-cyan" : "text-telem-muted hover:text-ice"
                  }`}
                >
                  ▶ CCTV Video
                </button>
              </div>
            </div>
            <DialogDescription className="text-muted-foreground pt-1">
              {selectedStep?.note} · Sighted at {selectedStep?.time_string} (Match: {selectedStep?.similarity}%)
            </DialogDescription>
          </DialogHeader>

          {selectedStep && (
            <div className="space-y-3">
              {stepModalTab === "screenshot" ? (
                /* Tab 1: Full Detected Screenshot with Bounding Box */
                <div className="space-y-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-cyan/40 bg-black flex items-center justify-center shadow-2xl">
                    <img
                      src={selectedStep.screenshot_url || selectedStep.crop_url}
                      alt="CCTV Ground Keyframe"
                      style={{ transform: `scale(${modalZoom})` }}
                      className="h-full w-full object-contain transition-transform duration-200"
                    />
                    <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
                      <span className="rounded bg-cyan/90 px-2 py-0.5 font-mono text-[10px] font-bold text-[#07131c]">
                        {selectedStep.camera_id} · GROUND KEYFRAME
                      </span>
                      {selectedStep.global_id && (
                        <span className="rounded bg-teal/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                          {selectedStep.global_id}
                        </span>
                      )}
                    </div>
                    <div className="pointer-events-none absolute top-3 right-3 rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] text-amber-300 backdrop-blur border border-amber-400/40">
                      {selectedStep.time_string} · t+{selectedStep.timestamp.toFixed(1)}s
                    </div>

                    {/* Zoom Tools */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/85 p-1 backdrop-blur border border-white/20">
                      <button
                        type="button"
                        onClick={() => setModalZoom((z) => Math.min(3, z + 0.25))}
                        className="rounded px-2 py-0.5 font-mono text-xs text-ice hover:bg-white/20"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalZoom((z) => Math.max(1, z - 0.25))}
                        className="rounded px-2 py-0.5 font-mono text-xs text-ice hover:bg-white/20"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalZoom(1)}
                        className="rounded px-2 py-0.5 font-mono text-[10px] text-telem-muted hover:text-ice"
                      >
                        {Math.round(modalZoom * 100)}%
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-telem-muted px-1">
                    <span>AI Detection Keyframe with ground spatial bounding box.</span>
                    <button
                      type="button"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = selectedStep.screenshot_url || selectedStep.crop_url;
                        a.download = `reid_keyframe_${selectedStep.camera_id}_t${selectedStep.timestamp.toFixed(1)}s.jpg`;
                        a.click();
                        toast.success("Downloaded detected keyframe");
                      }}
                      className="font-mono text-[11px] text-cyan hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Download Keyframe (JPEG)
                    </button>
                  </div>
                </div>
              ) : (
                /* Tab 2: CCTV Video Playback */
                <div className="space-y-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                    <video
                      src={selectedStep.video_url}
                      controls
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                      onLoadedMetadata={(e) => {
                        e.currentTarget.currentTime = selectedStep.timestamp;
                      }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-amber-300">
                    Starts exactly at detection moment t+{selectedStep.timestamp.toFixed(1)}s in {selectedStep.camera_name}.
                  </p>
                </div>
              )}

              <div className="glass-inset rounded-lg p-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between font-mono text-[10px] text-cyan">
                  <span>TRANSIT: {selectedStep.transit_time}</span>
                  <span className="text-amber-300">CUE: t+{selectedStep.timestamp.toFixed(1)}s</span>
                </div>
                <p className="mt-1 text-foreground/90">{selectedStep.note}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedStep(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
