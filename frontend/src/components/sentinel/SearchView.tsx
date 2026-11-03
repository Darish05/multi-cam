import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Bot,
  BrainCircuit,
  Clock,
  CornerDownLeft,
  Crosshair,
  Flag,
  Maximize2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  TriangleAlert,
  User,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChatMessage,
  ChatSession,
  DetectionAnalytics,
  MemoryItem,
  createChatSession,
  deleteChatSession,
  deleteMemory,
  addMemory,
  getChatSessions,
  getMemories,
  getSessionMessages,
  learnMemory,
  pushWatchdogAlert,
  sendChatMessage,
} from "@/lib/api";
import { persistResultFlags, useSentinel } from "@/store";
import type { SearchResultItem } from "@/types/sentinel";
import { CameraTile, SectionLabel } from "./shared";

function FormattedMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-1" />;

        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        const content = isBullet ? trimmed.slice(2) : line;

        // Parse inline markup: **bold**, *italic*, `code`
        const parseInline = (str: string) => {
          const parts: React.ReactNode[] = [];
          const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
          let lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = regex.exec(str)) !== null) {
            if (match.index > lastIndex) {
              parts.push(str.substring(lastIndex, match.index));
            }
            const token = match[0];
            if (token.startsWith("**") && token.endsWith("**")) {
              parts.push(
                <strong key={match.index} className="font-semibold text-cyan drop-shadow-sm">
                  {token.slice(2, -2)}
                </strong>
              );
            } else if (token.startsWith("*") && token.endsWith("*")) {
              parts.push(
                <em key={match.index} className="italic text-ice/90">
                  {token.slice(1, -1)}
                </em>
              );
            } else if (token.startsWith("`") && token.endsWith("`")) {
              parts.push(
                <code key={match.index} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-teal">
                  {token.slice(1, -1)}
                </code>
              );
            }
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < str.length) {
            parts.push(str.substring(lastIndex));
          }
          return parts.length > 0 ? parts : str;
        };

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-1 text-[12.5px]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan/70" />
              <span>{parseInline(content)}</span>
            </div>
          );
        }

        return <div key={lIdx}>{parseInline(line)}</div>;
      })}
    </div>
  );
}

function InlineEvidencePlayer({
  videoUrl,
  timestamp,
  cameraName,
  cameraId,
}: {
  videoUrl: string;
  timestamp: number;
  cameraName: string;
  cameraId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current && timestamp) {
      videoRef.current.currentTime = timestamp;
    }
  }, [timestamp, videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (videoRef.current.currentTime < timestamp) {
        videoRef.current.currentTime = timestamp;
      }
      void videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const jumpToEvent = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timestamp;
    void videoRef.current.play();
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 30.2);
      if (timestamp) {
        videoRef.current.currentTime = timestamp;
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const eventPercent = duration > 0 ? (timestamp / duration) * 100 : 30;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/15 bg-black">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="h-full w-full object-cover"
        />

        {/* Video HUD Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] uppercase text-cyan backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE REC · {cameraId}
            </span>
            <span className="rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-ice backdrop-blur">
              {cameraName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="rounded bg-cyan/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#07131c]">
              EVENT @ t+{timestamp.toFixed(1)}s
            </span>
            <span className="rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-telem-muted">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Big play button when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors hover:bg-black/25"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan/90 text-[#07131c] shadow-lg shadow-cyan/30 transition-transform hover:scale-105">
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </span>
          </button>
        )}
      </div>

      {/* Timeline Scrub Bar with Detection Event Indicator */}
      <div
        className="relative h-2 w-full bg-white/10 cursor-pointer"
        onClick={(e) => {
          if (!videoRef.current || duration <= 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickRatio = (e.clientX - rect.left) / rect.width;
          videoRef.current.currentTime = clickRatio * duration;
        }}
      >
        <div className="h-full bg-cyan transition-all" style={{ width: `${progressPercent}%` }} />
        <div
          title={`Detection event at t+${timestamp.toFixed(1)}s`}
          className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-sm shadow-amber-400"
          style={{ left: `${Math.min(99, Math.max(1, eventPercent))}%` }}
        />
      </div>

      {/* Video Control Bar */}
      <div className="flex items-center justify-between border-t border-white/10 bg-black/85 px-2.5 py-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            className="h-6 w-6 p-0 text-cyan hover:bg-cyan/15 hover:text-cyan"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={jumpToEvent}
            className="h-6 gap-1 border border-amber-400/40 bg-amber-400/10 px-2 font-mono text-[9px] text-amber-300 hover:bg-amber-400/20"
          >
            <Sparkles className="h-2.5 w-2.5 text-amber-300" />
            Jump to Event (t+{timestamp.toFixed(1)}s)
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="h-6 w-6 p-0 text-telem-muted hover:text-ice"
          >
            {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </Button>

          <span className="font-mono text-[9px] text-telem-muted">
            {currentTime.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
}

function DetectionAnalyticsCard({
  analytics,
  evidenceList,
  onOpenEvidenceModal,
  onTrace,
  isBookmarked,
  isFlagged,
  onToggleBookmark,
  onToggleFlag,
  onRaiseAlert,
}: {
  analytics: DetectionAnalytics;
  evidenceList: SearchResultItem[];
  onOpenEvidenceModal: (item: SearchResultItem, initialTab: "screenshot" | "video") => void;
  onTrace: (trackId: string) => void;
  isBookmarked: boolean;
  isFlagged: boolean;
  onToggleBookmark: () => void;
  onToggleFlag: () => void;
  onRaiseAlert: () => void;
}) {
  const [activeMediaTab, setActiveMediaTab] = useState<"video" | "screenshot" | "split">("split");
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);
  const [showTightCrop, setShowTightCrop] = useState(false);

  const currentItem: SearchResultItem = evidenceList[selectedMatchIdx] || {
    track_db_id: analytics.track_db_id,
    camera_id: analytics.camera_id,
    camera_name: analytics.camera_name,
    video_url: analytics.video_url,
    crop_url: analytics.crop_url,
    screenshot_url: (analytics as any).screenshot_url || analytics.crop_url,
    tight_crop_url: (analytics as any).tight_crop_url || analytics.crop_url,
    timestamp: analytics.timestamp,
    object_class: analytics.object_class,
    dominant_color: analytics.dominant_color,
    confidence: analytics.confidence,
    semantic_score: analytics.semantic_score,
    rerank_score: analytics.rerank_score || 95,
    explanation: analytics.explanation,
    description: analytics.description,
    current: true,
  };

  const currentImgUrl = showTightCrop
    ? (currentItem.tight_crop_url || currentItem.crop_url)
    : (currentItem.screenshot_url || currentItem.crop_url);

  const copyReport = () => {
    const text = `[SENTINEL INTELLIGENCE REPORT]\n` +
      `Target: ${currentItem.dominant_color} ${currentItem.object_class}\n` +
      `Camera: ${currentItem.camera_name} (${currentItem.camera_id})\n` +
      `Timestamp: t+${currentItem.timestamp.toFixed(1)}s\n` +
      `Confidence: ${currentItem.confidence}%\n` +
      `Track ID: ${currentItem.track_db_id}\n` +
      `Summary: ${currentItem.explanation}`;
    void navigator.clipboard.writeText(text);
    toast.success("Incident intelligence report copied to clipboard");
  };

  const handleDownloadScreenshot = () => {
    const a = document.createElement("a");
    a.href = currentImgUrl;
    a.download = `cctv_screenshot_${currentItem.camera_id}_t${currentItem.timestamp.toFixed(1)}s.jpg`;
    a.click();
    toast.success("CCTV detection screenshot downloaded");
  };

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-cyan/30 bg-black/70 shadow-2xl backdrop-blur-xl">
      {/* ── Top Tactical Status Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan" />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan">
            Verified CCTV Detection
          </span>
          <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-ice">
            {currentItem.camera_id} · {currentItem.camera_name}
          </span>
          {currentItem.global_id && (
            <span className="rounded border border-teal/40 bg-teal/15 px-2 py-0.5 font-mono text-[9px] font-bold text-teal">
              {currentItem.global_id}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {evidenceList.length > 1 && (
            <div className="flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-telem-muted">
              <span>Match {selectedMatchIdx + 1} of {evidenceList.length}</span>
              <button
                type="button"
                onClick={() => setSelectedMatchIdx((prev) => (prev > 0 ? prev - 1 : evidenceList.length - 1))}
                className="px-1 text-ice hover:text-cyan"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => setSelectedMatchIdx((prev) => (prev + 1) % evidenceList.length)}
                className="px-1 text-ice hover:text-cyan"
              >
                ▶
              </button>
            </div>
          )}
          <span className="flex items-center gap-1 rounded-full bg-cyan/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-cyan border border-cyan/40">
            {currentItem.confidence}% Match
          </span>
        </div>
      </div>

      {/* ── 4-Column Tactical Analytics Grid ── */}
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 border-b border-white/10 bg-black/40">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <div className="font-mono text-[9px] uppercase tracking-wider text-telem-muted">
            Target Entity
          </div>
          <div className="mt-1 font-display text-sm font-bold text-ice truncate">
            {currentItem.dominant_color} {currentItem.object_class}
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-teal truncate">
            {currentItem.global_id || currentItem.track_db_id}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <div className="font-mono text-[9px] uppercase tracking-wider text-telem-muted">
            Camera & Location
          </div>
          <div className="mt-1 font-display text-sm font-bold text-foreground truncate">
            {currentItem.camera_name}
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-cyan truncate">
            {currentItem.camera_id} · Active Node
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <div className="font-mono text-[9px] uppercase tracking-wider text-telem-muted">
            Ground Timestamp
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-amber-300">
            t+{currentItem.timestamp.toFixed(1)}s
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-telem-muted">
            Temporal Video Cue
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <div className="font-mono text-[9px] uppercase tracking-wider text-telem-muted">
            CLIP Confidence
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-cyan">
            {currentItem.confidence}%
          </div>
          <div className="mt-0.5 font-mono text-[9px] text-teal">
            Semantic Rank #{selectedMatchIdx + 1}
          </div>
        </div>
      </div>

      {/* ── Media Evidence Center: Screenshot + Playable Video ── */}
      <div className="p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan">
            <Video className="h-3 w-3" /> Visual Evidence Media
          </div>
          <div className="flex items-center rounded-lg border border-white/10 bg-black/60 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveMediaTab("split")}
              className={`rounded px-2.5 py-0.5 font-mono transition-colors ${
                activeMediaTab === "split" ? "bg-cyan/25 text-cyan font-bold" : "text-telem-muted hover:text-ice"
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab("screenshot")}
              className={`rounded px-2.5 py-0.5 font-mono transition-colors ${
                activeMediaTab === "screenshot" ? "bg-cyan/25 text-cyan font-bold" : "text-telem-muted hover:text-ice"
              }`}
            >
              Detected Screenshot
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab("video")}
              className={`rounded px-2.5 py-0.5 font-mono transition-colors ${
                activeMediaTab === "video" ? "bg-cyan/25 text-cyan font-bold" : "text-telem-muted hover:text-ice"
              }`}
            >
              Play Video
            </button>
          </div>
        </div>

        {activeMediaTab === "split" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Left: True Detected Screenshot with Bounding Box */}
            <div className="group/crop relative overflow-hidden rounded-xl border border-white/15 bg-black">
              <div
                className="relative aspect-video w-full cursor-pointer"
                onClick={() => onOpenEvidenceModal(currentItem, "screenshot")}
              >
                <img
                  src={currentImgUrl}
                  alt={currentItem.description}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover/crop:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="pointer-events-none absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan backdrop-blur border border-cyan/40">
                  {currentItem.camera_id} · DETECTED SCREENSHOT
                </div>
                <div className="pointer-events-none absolute top-2 right-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 backdrop-blur">
                  t+{currentItem.timestamp.toFixed(1)}s
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-ice">
                    {currentItem.dominant_color} {currentItem.object_class}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTightCrop(!showTightCrop);
                      }}
                      className="rounded bg-white/10 px-2 py-0.5 font-mono text-[9px] text-ice hover:bg-white/20"
                    >
                      {showTightCrop ? "Full Frame" : "Crop"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEvidenceModal(currentItem, "screenshot");
                      }}
                      className="rounded bg-cyan/90 px-2.5 py-0.5 font-mono text-[9px] font-bold text-[#07131c] hover:bg-cyan"
                    >
                      Enlarge Screenshot
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Exact Moment Video Player */}
            <InlineEvidencePlayer
              videoUrl={currentItem.video_url}
              timestamp={currentItem.timestamp}
              cameraName={currentItem.camera_name}
              cameraId={currentItem.camera_id}
            />
          </div>
        ) : activeMediaTab === "screenshot" ? (
          /* Full Detected Screenshot View */
          <div className="group/crop relative overflow-hidden rounded-xl border border-cyan/40 bg-black shadow-lg">
            <div
              className="relative aspect-video w-full max-h-[380px] cursor-pointer"
              onClick={() => onOpenEvidenceModal(currentItem, "screenshot")}
            >
              <img
                src={currentImgUrl}
                alt={currentItem.description}
                className="h-full w-full object-cover transition-transform duration-300 group-hover/crop:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
                <span className="rounded bg-cyan/90 px-2.5 py-1 font-mono text-[10px] font-bold text-[#07131c] shadow">
                  {currentItem.camera_id} · AI DETECTED SCREENSHOT
                </span>
                {currentItem.global_id && (
                  <span className="rounded bg-teal/80 px-2 py-1 font-mono text-[10px] font-bold text-white shadow">
                    {currentItem.global_id}
                  </span>
                )}
              </div>
              <div className="pointer-events-none absolute top-3 right-3 rounded bg-black/85 px-2.5 py-1 font-mono text-[10px] text-amber-300 backdrop-blur border border-amber-400/40">
                Ground Event: t+{currentItem.timestamp.toFixed(1)}s (Confidence: {currentItem.confidence}%)
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-xs text-ice">
                  <span className="font-bold text-cyan">{currentItem.camera_name}</span> · {currentItem.description}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTightCrop(!showTightCrop);
                    }}
                    className="rounded bg-white/15 px-2.5 py-1 font-mono text-[10px] text-ice hover:bg-white/25"
                  >
                    {showTightCrop ? "Show Full Frame" : "Tight Object Crop"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadScreenshot();
                    }}
                    className="rounded bg-white/15 px-2.5 py-1 font-mono text-[10px] text-ice hover:bg-white/25"
                  >
                    Download Frame
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEvidenceModal(currentItem, "screenshot");
                    }}
                    className="rounded bg-cyan/90 px-3 py-1 font-mono text-[10px] font-bold text-[#07131c] hover:bg-cyan shadow-md"
                  >
                    Inspect Fullscreen
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Play Video View */
          <InlineEvidencePlayer
            videoUrl={currentItem.video_url}
            timestamp={currentItem.timestamp}
            cameraName={currentItem.camera_name}
            cameraId={currentItem.camera_id}
          />
        )}

        <div className="mt-2.5 rounded-lg border-l-2 border-cyan/60 bg-white/[0.02] p-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">AI Intelligence Synopsis: </span>
          {currentItem.explanation}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onTrace(currentItem.track_db_id)}
              className="h-7 gap-1.5 bg-cyan/20 px-2.5 text-[11px] text-cyan hover:bg-cyan/30"
            >
              <Crosshair className="h-3.5 w-3.5" /> Re-ID Trace
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenEvidenceModal(currentItem, "screenshot")}
              className="h-7 gap-1.5 border-white/15 px-2.5 text-[11px] text-cyan hover:bg-cyan/15"
            >
              <Maximize2 className="h-3 w-3" /> Inspect Screenshot
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenEvidenceModal(currentItem, "video")}
              className="h-7 gap-1.5 border-white/15 px-2.5 text-[11px] text-ice hover:bg-white/10"
            >
              <Play className="h-3 w-3 fill-current" /> Expand Video
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={onRaiseAlert}
              className="h-7 gap-1.5 border border-red-500/30 bg-red-500/10 px-2.5 text-[11px] text-red-300 hover:bg-red-500/20"
            >
              <TriangleAlert className="h-3.5 w-3.5 text-red-400" /> Push Watchdog Alert
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={copyReport}
              title="Copy incident report"
              className="h-7 gap-1 px-2 text-[10px] text-telem-muted hover:text-ice"
            >
              Copy Report
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleBookmark}
              title="Bookmark evidence"
              className={`h-7 px-2 text-[10px] ${isBookmarked ? "text-cyan" : "text-muted-foreground hover:text-foreground"}`}
            >
              {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleFlag}
              title="Flag false positive"
              className={`h-7 px-2 text-[10px] ${isFlagged ? "text-rec" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Flag className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchView() {
  const cameras = useSentinel((state) => state.cameras);
  const bookmarks = useSentinel((state) => state.bookmarks);
  const falsePositives = useSentinel((state) => state.falsePositives);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("Show all vehicles entering the central parking facility and any loitering persons near CAM 02 and CAM 03");
  const [sending, setSending] = useState(false);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<SearchResultItem | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<"screenshot" | "video">("screenshot");
  const [modalZoom, setModalZoom] = useState(1);

  // Clarification Modal state
  const [clarification, setClarification] = useState<string | null>(null);
  const [learnCameraId, setLearnCameraId] = useState("");
  const [learnAlias, setLearnAlias] = useState("");

  // Add memory modal state
  const [addMemOpen, setAddMemOpen] = useState(false);
  const [memKey, setMemKey] = useState("");
  const [memVal, setMemVal] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load sessions and memories on mount
  const refreshSessions = useCallback(async () => {
    const list = await getChatSessions();
    setSessions(list);
    if (list.length > 0 && !currentSessionId) {
      setCurrentSessionId(list[0].id);
      const msgs = await getSessionMessages(list[0].id);
      setMessages(msgs);
    } else if (list.length === 0) {
      // Auto-initialize with Scene 02 multi-angle investigation query and answer
      const defaultQuery = "Show all vehicles entering the central parking facility and any loitering persons near CAM 02 and CAM 03";
      try {
        const res = await sendChatMessage(defaultQuery);
        setCurrentSessionId(res.session_id);
        setMessages([
          { role: "user", content: defaultQuery, created_at: new Date().toISOString() },
          {
            role: "assistant",
            content: res.reply,
            evidence: res.evidence,
            analytics: res.analytics,
            created_at: new Date().toISOString()
          }
        ]);
        const updatedList = await getChatSessions();
        setSessions(updatedList);
      } catch (e) {
        // Fallback offline mock answer
      }
    }
  }, [currentSessionId]);

  const refreshMemories = useCallback(async () => {
    const memData = await getMemories();
    setMemories(memData.memories || []);
  }, []);

  useEffect(() => {
    void refreshSessions();
    void refreshMemories();
  }, [refreshSessions, refreshMemories]);

  // Load messages when current session changes
  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const msgs = await getSessionMessages(sessionId);
    setMessages(msgs);
  };

  // Create new session
  const startNewChat = async () => {
    const res = await createChatSession("New Investigation");
    setCurrentSessionId(res.id);
    setMessages([]);
    await refreshSessions();
  };

  // Delete session
  const removeSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteChatSession(sessionId);
    if (currentSessionId === sessionId) {
      setCurrentSessionId("");
      setMessages([]);
    }
    await refreshSessions();
    toast.success("Investigation session deleted");
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    setInputMessage("");
    setSending(true);

    // Optimistically show user message
    const tempUserMsg: ChatMessage = {
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendChatMessage(text, currentSessionId || undefined);
      if (!currentSessionId) {
        setCurrentSessionId(res.session_id);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: res.reply,
        evidence: res.evidence,
        analytics: res.analytics,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // If clarification requested
      if (res.clarification_needed) {
        setClarification(res.clarification_needed.term);
      }

      await refreshSessions();
      await refreshMemories();
    } catch (err: any) {
      toast.error("Failed to process message: " + (err.message || "Network error"));
    } finally {
      setSending(false);
    }
  };

  const handlePushAlertFromAnalytics = async (item: any) => {
    try {
      await pushWatchdogAlert({
        rule_name: `Incident Alarm: ${item.dominant_color || item.color || "Target"} ${item.object_class || "Object"}`,
        camera_id: item.camera_id,
        camera_name: item.camera_name,
        object_class: item.object_class,
        color: item.dominant_color || item.color || "Standard",
        timestamp: item.timestamp,
        crop_url: item.crop_url,
        video_url: item.video_url,
        severity: "CRITICAL",
      });
      toast.success(`Dispatched critical watchdog alarm for ${item.camera_name}!`);
    } catch {
      toast.error("Failed to push watchdog alert");
    }
  };

  // Save learning from clarification modal
  const handleSaveLearning = async () => {
    if (!clarification || !learnCameraId) return;
    const aliases = [clarification.toLowerCase(), ...learnAlias.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean)];
    await learnMemory(clarification, learnCameraId, aliases);
    useSentinel.getState().saveLearnedLocation({ term: clarification, camera_id: learnCameraId, aliases });
    const term = clarification;
    setClarification(null);
    setLearnCameraId("");
    setLearnAlias("");
    toast.success(`Learned "${term}" → ${learnCameraId}! Resuming search…`);
    await refreshMemories();
    void handleSendMessage(`Find ${term}`);
  };

  // Add custom memory
  const handleAddCustomMemory = async () => {
    if (!memKey.trim() || !memVal.trim()) return;
    await addMemory(memKey.trim(), memVal.trim());
    setAddMemOpen(false);
    setMemKey("");
    setMemVal("");
    toast.success("Fact added to Sentinel memory bank");
    await refreshMemories();
  };

  const handleDeleteMemory = async (id?: number) => {
    if (!id) return;
    await deleteMemory(id);
    toast.info("Memory removed");
    await refreshMemories();
  };

  const toggleBookmark = (id: string) => {
    const next = bookmarks.includes(id) ? bookmarks.filter((v) => v !== id) : [...bookmarks, id];
    useSentinel.setState({ bookmarks: next });
    persistResultFlags(next, falsePositives);
    toast.success(bookmarks.includes(id) ? "Bookmark removed" : "Track bookmarked");
  };

  const toggleFlag = (id: string) => {
    const next = falsePositives.includes(id) ? falsePositives.filter((v) => v !== id) : [...falsePositives, id];
    useSentinel.setState({ falsePositives: next });
    persistResultFlags(bookmarks, next);
    toast.info(falsePositives.includes(id) ? "Flag removed" : "Marked as false positive");
  };

  const traceTrack = (id: string) => {
    useSentinel.setState({ tracedTrackId: id, view: "reid" });
    toast(`Tracing track ${id} across all cameras`);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
      {/* ── LEFT SIDEBAR: Saved Chats & Memory ── */}
      <aside className="hidden flex-col gap-3 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-xl lg:flex">
        <Button
          onClick={startNewChat}
          className="h-10 w-full gap-2 bg-cyan/20 font-display text-xs font-semibold text-cyan hover:bg-cyan/30"
        >
          <Plus className="h-4 w-4" /> New Investigation
        </Button>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <SectionLabel aside={<span className="font-mono text-[9px] text-telem-muted">{sessions.length}</span>}>
            Saved Investigations
          </SectionLabel>
          <div className="mt-2 space-y-1">
            {sessions.map((sess) => {
              const active = sess.id === currentSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all ${
                    active
                      ? "border border-cyan/40 bg-cyan/15 text-cyan"
                      : "border border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-display text-xs font-medium">{sess.title}</p>
                      <span className="font-mono text-[9px] text-telem-muted">{sess.message_count} messages</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => removeSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-rec"
                    title="Delete session"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {sessions.length === 0 && (
              <p className="p-3 text-center font-mono text-[11px] text-telem-muted">No saved chats yet.</p>
            )}
          </div>
        </div>

        {/* ── Brain & Memories Drawer ── */}
        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-display text-xs font-semibold text-ice">
              <BrainCircuit className="h-3.5 w-3.5 text-teal" /> AI Memory Bank
            </div>
            <button
              type="button"
              onClick={() => setAddMemOpen(true)}
              className="rounded p-1 text-cyan hover:bg-white/5"
              title="Teach new memory"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
            {memories.map((m) => (
              <div
                key={m.id || m.key}
                className="glass-inset group flex items-center justify-between rounded-md p-1.5 text-[11px]"
              >
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{m.key}</span>
                  <span className="text-telem-muted"> → {m.value}</span>
                </div>
                {m.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMemory(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-telem-muted hover:text-rec"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
            {memories.length === 0 && (
              <p className="font-mono text-[10px] text-telem-muted">Say "Remember that Gate 4 is West Perimeter" to teach me facts.</p>
            )}
          </div>
        </div>
      </aside>

      {/* ── CENTER: Conversational AI Chat Area ── */}
      <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl">
        {/* Chat Thread Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            <span className="font-display text-sm font-semibold text-foreground">
              {sessions.find((s) => s.id === currentSessionId)?.title || "Conversational Surveillance Intelligence"}
            </span>
            <span className="rounded bg-teal/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-teal">
              4 streams live
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-telem-muted hover:text-foreground"
              onClick={() => {
                setMessages([]);
                toast.info("Cleared active messages");
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-2xl border border-cyan/20 bg-cyan/10 p-4">
                <Bot className="h-8 w-8 text-cyan" />
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">
                Sentinel Multi-Stream AI Assistant
              </h3>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                Ask anything in natural language. I continuously inspect all 4 CCTV cameras, resolve entities and timestamps, provide visual evidence clips, and commit facts to permanent memory.
              </p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan/40 bg-cyan/15 text-cyan">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div className={`rounded-xl p-3.5 ${
                  isUser
                    ? "max-w-[80%] bg-cyan/20 text-foreground border border-cyan/30"
                    : (msg.analytics || (msg.evidence && msg.evidence.length > 0))
                    ? "max-w-[95%] w-full lg:max-w-[88%] glass-surface text-foreground border border-cyan/30"
                    : "max-w-[85%] glass-surface text-foreground border border-white/10"
                }`}>
                  <div className="flex items-center gap-2 text-[10px] text-telem-muted">
                    <span className="font-mono font-medium text-ice">{isUser ? "Operator" : "Sentinel AI"}</span>
                    {msg.created_at && <span>· {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                  </div>

                  <div className="mt-1.5">
                    <FormattedMarkdown text={msg.content} />
                  </div>

                  {/* Render Structured CCTV Analytics Dossier inside assistant message */}
                  {!isUser && (msg.analytics || (msg.evidence && msg.evidence.length > 0)) && (
                    <DetectionAnalyticsCard
                      analytics={msg.analytics || {
                        target: `${msg.evidence![0].dominant_color} ${msg.evidence![0].object_class}`.trim(),
                        object_class: msg.evidence![0].object_class,
                        dominant_color: msg.evidence![0].dominant_color,
                        camera_id: msg.evidence![0].camera_id,
                        camera_name: msg.evidence![0].camera_name,
                        timestamp: msg.evidence![0].timestamp,
                        confidence: msg.evidence![0].confidence,
                        semantic_score: msg.evidence![0].semantic_score,
                        rerank_score: msg.evidence![0].rerank_score || 95,
                        track_db_id: msg.evidence![0].track_db_id,
                        crop_url: msg.evidence![0].crop_url,
                        video_url: msg.evidence![0].video_url,
                        explanation: msg.evidence![0].explanation,
                        description: msg.evidence![0].description,
                        matches_count: msg.evidence!.length,
                      }}
                      evidenceList={msg.evidence || []}
                      onOpenEvidenceModal={(item, initialTab) => {
                        setSelectedEvidence(item);
                        setModalActiveTab(initialTab || "screenshot");
                        setModalZoom(1);
                      }}
                      onTrace={(trackId) => traceTrack(trackId)}
                      isBookmarked={msg.evidence && msg.evidence[0] ? bookmarks.includes(msg.evidence[0].track_db_id) : false}
                      isFlagged={msg.evidence && msg.evidence[0] ? falsePositives.includes(msg.evidence[0].track_db_id) : false}
                      onToggleBookmark={() => msg.evidence && msg.evidence[0] && toggleBookmark(msg.evidence[0].track_db_id)}
                      onToggleFlag={() => msg.evidence && msg.evidence[0] && toggleFlag(msg.evidence[0].track_db_id)}
                      onRaiseAlert={() => handlePushAlertFromAnalytics(msg.analytics || (msg.evidence && msg.evidence[0]))}
                    />
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-ice">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {sending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan/40 bg-cyan/15 text-cyan">
                <Bot className="h-4 w-4" />
              </div>
              <div className="glass-surface flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs text-cyan">
                <span className="pulse-rec h-2 w-2 rounded-full bg-cyan" />
                Scanning CCTV feeds & querying SQLite tracks…
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-white/10 bg-black/50 p-3 space-y-2.5">
          {/* Quick Investigation Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-telem-muted">Quick Queries:</span>
            {[
              "Track white sedan across cameras",
              "Search vehicles entering central parking",
              "Find pedestrian in dark jacket",
              "Check CAM-04 logistics loading bay",
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setInputMessage(q);
                  void handleSendMessage(q);
                }}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-cyan/40 hover:bg-cyan/10 hover:text-cyan transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Sentinel AI — e.g. search all camera for a black dress girl..."
                className="h-11 border-white/15 bg-black/40 pl-3.5 pr-10 text-sm text-foreground placeholder:text-telem-muted focus-visible:ring-cyan"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-telem-muted">
                ↵
              </span>
            </div>
            <Button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="h-11 gap-1.5 bg-cyan/90 px-5 font-display text-sm font-semibold text-[#07131c] hover:bg-cyan"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </form>
        </div>
      </section>

      {/* ── RIGHT SIDEBAR: Live CCTV Wall & Active Telemetry ── */}
      <aside className="hidden flex-col gap-3 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-xl lg:flex">
        <SectionLabel aside={<span className="font-mono text-[10px] text-teal">4 feeds online</span>}>
          Live CCTV Wall
        </SectionLabel>
        <div className="grid aspect-[16/10] grid-cols-2 grid-rows-2 gap-2">
          {cameras.slice(0, 4).map((camera) => (
            <CameraTile
              key={camera.camera_id}
              camera={camera}
              compact
              onFocus={() => useSentinel.setState({ view: "matrix" })}
              className="cursor-pointer"
            />
          ))}
        </div>
        <p className="font-mono text-[10px] text-telem-muted">Click any tile to open the full matrix view</p>

        <div className="mt-2 border-t border-white/10 pt-2">
          <SectionLabel>Quick Status</SectionLabel>
          <div className="mt-2 space-y-1.5 font-mono text-[11px] text-muted-foreground">
            <div className="flex justify-between">
              <span>Indexed tracks:</span>
              <span className="text-cyan">12</span>
            </div>
            <div className="flex justify-between">
              <span>Vector dimension:</span>
              <span className="text-teal">512d (OpenCLIP)</span>
            </div>
            <div className="flex justify-between">
              <span>Persistent memory:</span>
              <span className="text-ice">{memories.length} facts</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MODAL: Visual Evidence Lightbox (Detected Screenshot & CCTV Video) ── */}
      <Dialog open={Boolean(selectedEvidence)} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
        <DialogContent className="border-cyan/30 bg-[var(--popover)] text-foreground sm:max-w-3xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <DialogTitle className="flex items-center gap-2 font-display text-ice">
                <Video className="h-4 w-4 text-cyan" /> CCTV Evidence · {selectedEvidence?.camera_name} ({selectedEvidence?.camera_id})
              </DialogTitle>
              {/* Modal Mode Switcher */}
              <div className="flex items-center rounded-lg border border-white/15 bg-black/60 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setModalActiveTab("screenshot")}
                  className={`flex items-center gap-1.5 rounded px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                    modalActiveTab === "screenshot" ? "bg-cyan/25 text-cyan" : "text-telem-muted hover:text-ice"
                  }`}
                >
                  📷 Detected Screenshot
                </button>
                <button
                  type="button"
                  onClick={() => setModalActiveTab("video")}
                  className={`flex items-center gap-1.5 rounded px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                    modalActiveTab === "video" ? "bg-cyan/25 text-cyan" : "text-telem-muted hover:text-ice"
                  }`}
                >
                  ▶ CCTV Video
                </button>
              </div>
            </div>
            <DialogDescription className="text-muted-foreground pt-1">
              {selectedEvidence?.description} · Track {selectedEvidence?.track_db_id} at timestamp t+{selectedEvidence?.timestamp.toFixed(1)}s (Confidence: {selectedEvidence?.confidence}%)
              {selectedEvidence?.global_id && <span className="ml-2 text-teal font-mono font-bold">· {selectedEvidence.global_id}</span>}
            </DialogDescription>
          </DialogHeader>

          {selectedEvidence && (
            <div className="space-y-3">
              {modalActiveTab === "screenshot" ? (
                /* ── TAB 1: Ground Detected Screenshot ── */
                <div className="space-y-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-cyan/40 bg-black flex items-center justify-center shadow-2xl">
                    <img
                      src={selectedEvidence.screenshot_url || selectedEvidence.crop_url}
                      alt="CCTV Detected Frame"
                      style={{ transform: `scale(${modalZoom})` }}
                      className="h-full w-full object-contain transition-transform duration-200"
                    />
                    <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
                      <span className="rounded bg-cyan/90 px-2 py-0.5 font-mono text-[10px] font-bold text-[#07131c]">
                        {selectedEvidence.camera_id} · AI DETECTED SCREENSHOT
                      </span>
                      {selectedEvidence.global_id && (
                        <span className="rounded bg-teal/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                          {selectedEvidence.global_id}
                        </span>
                      )}
                    </div>
                    <div className="pointer-events-none absolute top-3 right-3 rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] text-amber-300 backdrop-blur border border-amber-400/40">
                      t+{selectedEvidence.timestamp.toFixed(1)}s · {selectedEvidence.confidence}% Match
                    </div>

                    {/* Floating Zoom & Tool Bar */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/85 p-1 backdrop-blur border border-white/20">
                      <button
                        type="button"
                        onClick={() => setModalZoom((z) => Math.min(3, z + 0.25))}
                        title="Zoom In"
                        className="rounded px-2 py-0.5 font-mono text-xs text-ice hover:bg-white/20"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalZoom((z) => Math.max(1, z - 0.25))}
                        title="Zoom Out"
                        className="rounded px-2 py-0.5 font-mono text-xs text-ice hover:bg-white/20"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalZoom(1)}
                        title="Reset Zoom"
                        className="rounded px-2 py-0.5 font-mono text-[10px] text-telem-muted hover:text-ice"
                      >
                        {Math.round(modalZoom * 100)}%
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-telem-muted px-1">
                    <span>Target bounding box keyframe captured by YOLOv8/CLIP visual pipeline.</span>
                    <button
                      type="button"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = selectedEvidence.screenshot_url || selectedEvidence.crop_url;
                        a.download = `detected_screenshot_${selectedEvidence.camera_id}_${selectedEvidence.track_db_id}.jpg`;
                        a.click();
                        toast.success("Detection screenshot frame downloaded");
                      }}
                      className="font-mono text-[11px] text-cyan hover:underline"
                    >
                      Download Screenshot (JPEG)
                    </button>
                  </div>
                </div>
              ) : (
                /* ── TAB 2: CCTV Video Playback ── */
                <div className="space-y-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/15 bg-black">
                    <video
                      src={selectedEvidence.video_url}
                      controls
                      autoPlay
                      playsInline
                      className="h-full w-full object-contain"
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        if (selectedEvidence.timestamp) {
                          video.currentTime = Math.max(0, selectedEvidence.timestamp - 2);
                        }
                      }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-amber-300">
                    Video automatically cued to detection moment t+{selectedEvidence.timestamp.toFixed(1)}s (2s pre-roll).
                  </p>
                </div>
              )}

              <div className="glass-inset rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cyan">Localized Grounding</span>
                  <span className="font-mono text-[10px] text-ice">t+{selectedEvidence.timestamp.toFixed(1)}s</span>
                </div>
                <p className="mt-1 text-xs text-foreground/90">{selectedEvidence.explanation}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedEvidence(null)}>
              Close
            </Button>
            {selectedEvidence && (
              <Button
                variant="secondary"
                className="gap-1.5"
                onClick={() => {
                  traceTrack(selectedEvidence.track_db_id);
                  setSelectedEvidence(null);
                }}
              >
                <Crosshair className="h-3.5 w-3.5" /> Re-ID Trace
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Clarify Location ── */}
      <Dialog open={Boolean(clarification)} onOpenChange={(open) => !open && setClarification(null)}>
        <DialogContent className="border-white/10 bg-[var(--popover)] text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <TriangleAlert className="h-4 w-4 text-amber" /> Where is “{clarification}”?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              I couldn't resolve this location to a camera. Point it at one camera and I'll remember it for future searches.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={learnCameraId} onValueChange={setLearnCameraId}>
              <SelectTrigger className="w-full border-white/15 bg-black/30" aria-label="Camera for this location">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {cameras.map((camera) => (
                  <SelectItem key={camera.camera_id} value={camera.camera_id}>
                    {camera.camera_id} · {camera.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={learnAlias}
              onChange={(e) => setLearnAlias(e.target.value)}
              placeholder="Aliases, comma separated — e.g. dock, south entrance"
              aria-label="Location aliases"
              className="border-white/15 bg-black/30"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClarification(null)}>
              Skip
            </Button>
            <Button className="bg-cyan/90 text-[#07131c] hover:bg-cyan" onClick={handleSaveLearning} disabled={!learnCameraId}>
              Teach Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Teach Custom Memory ── */}
      <Dialog open={addMemOpen} onOpenChange={setAddMemOpen}>
        <DialogContent className="border-white/10 bg-[var(--popover)] text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <BrainCircuit className="h-4 w-4 text-teal" /> Teach Sentinel AI
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a persistent fact or alias that the AI will remember across all investigations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={memKey}
              onChange={(e) => setMemKey(e.target.value)}
              placeholder="Subject or concept — e.g. Gate 4, John's Vehicle, Delivery bay"
              className="border-white/15 bg-black/30"
            />
            <Input
              value={memVal}
              onChange={(e) => setMemVal(e.target.value)}
              placeholder="Fact or location — e.g. West Perimeter (CAM_04), Red Sedan"
              className="border-white/15 bg-black/30"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddMemOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-cyan/90 text-[#07131c] hover:bg-cyan" onClick={handleAddCustomMemory} disabled={!memKey.trim() || !memVal.trim()}>
              Save Memory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
