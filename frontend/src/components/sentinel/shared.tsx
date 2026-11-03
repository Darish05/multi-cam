import { useEffect, useState } from "react";
import type { CameraFeed } from "@/types/sentinel";

export function useUtcClock(tickMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
}

export function formatStamp(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function StatusDot({ status, className = "" }: { status: CameraFeed["status"]; className?: string }) {
  const map: Record<CameraFeed["status"], string> = {
    online: "bg-teal shadow-[0_0_8px_var(--teal)]",
    indexing: "bg-amber shadow-[0_0_8px_var(--amber)] animate-pulse",
    degraded: "bg-rec shadow-[0_0_8px_var(--rec)] animate-pulse",
  };
  return <span aria-hidden className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${map[status]} ${className}`} />;
}

export function Chip({
  active = false,
  children,
  onClick,
  title,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide transition-colors duration-150 ${
        active
          ? "border-cyan/60 bg-cyan/15 text-cyan"
          : "border-border bg-white/[0.03] text-muted-foreground hover:border-cyan/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function CameraTile({
  camera,
  className = "",
  onFocus,
  focused = false,
  compact = false,
}: {
  camera: CameraFeed;
  className?: string;
  onFocus?: (() => void) | undefined;
  focused?: boolean;
  compact?: boolean;
}) {
  const [stamp, setStamp] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStamp((value) => (value + 1) % camera.duration), 1000);
    return () => window.clearInterval(id);
  }, [camera.duration]);

  return (
    <figure
      onClick={onFocus}
      role={onFocus ? "button" : undefined}
      tabIndex={onFocus ? 0 : undefined}
      onKeyDown={(event) => {
        if (onFocus && (event.key === "Enter" || event.key === " ")) onFocus();
      }}
      className={`feed-sheen group relative min-h-0 overflow-hidden rounded-md border bg-black/50 outline-none transition-all duration-200 ${
        focused ? "border-cyan/70 shadow-[0_0_0_1px_var(--cyan)]" : "border-white/10 hover:border-cyan/50"
      } ${className}`}
    >
      <video
        src={camera.video_url}
        poster={camera.crop_url}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="scanline-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-2 py-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-widest text-white/90">{camera.camera_id}</span>
        <span className="flex items-center gap-1.5">
          <span className="pulse-rec inline-block h-1.5 w-1.5 rounded-full bg-rec shadow-[0_0_6px_var(--rec)]" />
          <span className="font-mono text-[9px] tracking-widest text-white/80">REC</span>
        </span>
      </div>
      {!compact && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
          <span className="truncate text-[11px] font-medium text-white/90">{camera.name}</span>
          <span className="font-mono text-[10px] text-teal/90">
            {camera.status === "online" ? "LIVE" : camera.status.toUpperCase()} · {formatStamp(stamp)}
          </span>
        </div>
      )}
    </figure>
  );
}

export function SectionLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-telem-muted">{children}</h2>
      {aside}
    </div>
  );
}

export function StatBlock({ label, value, accent = false }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="glass-inset rounded-md px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-telem-muted">{label}</div>
      <div className={`font-display text-sm font-semibold ${accent ? "text-cyan" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
