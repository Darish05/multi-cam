import { useState } from "react";
import { Expand } from "lucide-react";
import { useSentinel } from "@/store";
import type { ViewName } from "@/types/sentinel";
import { CameraTile, Chip, SectionLabel, StatusDot } from "./shared";

type LayoutMode = "2x2" | "3x3" | "focus";

const LAYOUTS: { value: LayoutMode; label: string }[] = [
  { value: "2x2", label: "2 × 2" },
  { value: "3x3", label: "3 × 3" },
  { value: "focus", label: "Focus" },
];

function NoSignalTile() {
  return (
    <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-white/10 bg-black/40">
      <span className="font-mono text-[10px] tracking-[0.2em] text-telem-muted">NO SIGNAL · SLOT EMPTY</span>
    </div>
  );
}

export default function MatrixView() {
  const cameras = useSentinel((state) => state.cameras);
  const layout = useSentinel((state) => state.layout);
  const set = useSentinel((state) => state.set);
  const [focusId, setFocusId] = useState(cameras[0]?.camera_id ?? "CAM_01");
  const focused = cameras.find((camera) => camera.camera_id === focusId) ?? cameras[0];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <section className="glass-inset flex flex-wrap items-center gap-2 rounded-lg px-3 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-telem-muted">Layout</span>
        {LAYOUTS.map((option) => (
          <Chip key={option.value} active={layout === option.value} onClick={() => set({ layout: option.value })}>
            {option.label}
          </Chip>
        ))}
        <span className="ml-auto font-mono text-[10px] text-teal">
          {cameras.filter((camera) => camera.status === "online").length}/{cameras.length} streams online
        </span>
      </section>

      {layout === "focus" && focused ? (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
          <CameraTile camera={focused} focused className="min-h-[380px]" />
          <div className="flex flex-col gap-2">
            {cameras
              .filter((camera) => camera.camera_id !== focused.camera_id)
              .map((camera) => (
                <CameraTile key={camera.camera_id} camera={camera} compact onFocus={() => setFocusId(camera.camera_id)} className="aspect-video cursor-pointer" />
              ))}
          </div>
        </div>
      ) : (
        <div className={`grid flex-1 content-start items-start gap-2.5 ${layout === "2x2" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
          {cameras.map((camera) => (
            <div key={camera.camera_id} className="glass-surface rounded-lg p-2">
              <CameraTile
                camera={camera}
                onFocus={() => {
                  setFocusId(camera.camera_id);
                  set({ layout: "focus" });
                }}
                className={layout === "2x2" ? "aspect-video" : "aspect-video"}
              />
              <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <StatusDot status={camera.status} />
                  <span className="truncate font-display text-[12px] font-bold text-foreground">{camera.name}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Focus ${camera.camera_id}`}
                  onClick={() => {
                    setFocusId(camera.camera_id);
                    set({ layout: "focus" });
                  }}
                  className="rounded-sm p-1 text-telem-muted transition-colors hover:text-cyan"
                >
                  <Expand className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 flex items-center gap-3 px-0.5 font-mono text-[9px] text-telem-muted">
                <span>{camera.fps} fps</span>
                <span>{camera.width}×{camera.height}</span>
                <span className="text-cyan/80">{camera.track_count} tracks</span>
              </div>
            </div>
          ))}
          {layout === "3x3" && Array.from({ length: 9 - cameras.length }).map((_, index) => <NoSignalTile key={index} />)}
        </div>
      )}

      <section className="glass-surface rounded-xl p-3">
        <SectionLabel>Camera registry</SectionLabel>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-telem-muted">
                <th className="pb-1.5 pr-3 font-medium">ID</th>
                <th className="pb-1.5 pr-3 font-medium">Name</th>
                <th className="pb-1.5 pr-3 font-medium">Location</th>
                <th className="pb-1.5 pr-3 font-medium">Indexed</th>
                <th className="pb-1.5 font-medium">Tracks</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {cameras.map((camera) => (
                <tr key={camera.camera_id} className="border-t border-white/5">
                  <td className="py-1.5 pr-3 font-mono text-[11px] text-cyan">{camera.camera_id}</td>
                  <td className="py-1.5 pr-3 text-foreground">{camera.name}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{camera.location_desc}</td>
                  <td className="py-1.5 pr-3">
                    <span className={camera.is_indexed ? "font-mono text-[10px] text-teal" : "font-mono text-[10px] text-amber"}>
                      {camera.is_indexed ? "YES" : "PENDING"}
                    </span>
                  </td>
                  <td className="py-1.5 font-mono text-[11px] text-foreground">{camera.track_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-[10px] text-telem-muted">New cameras register on the ingestion view.</p>
      </section>
    </div>
  );
}
