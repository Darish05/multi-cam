import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Cpu,
  Crosshair,
  LayoutGrid,
  MessageSquareText,
  Radar,
  Route,
  Scan,
  Search,
  ShieldAlert,
  Sparkles,
  Tv,
  X,
} from "lucide-react";
import { useSentinel } from "@/store";
import type { ViewName } from "@/types/sentinel";
import IngestionView from "./IngestionView";
import MatrixView from "./MatrixView";
import PhotoReidView from "./PhotoReidView";
import ReidView from "./ReidView";
import SearchView from "./SearchView";
import TasksView from "./TasksView";
import WatchdogView from "./WatchdogView";
import { StatusDot, useUtcClock } from "./shared";

interface AppDefinition {
  view: ViewName;
  label: string;
  icon: any;
  color: string;
}

const APPS: AppDefinition[] = [
  {
    view: "search",
    label: "Conversational Search",
    icon: MessageSquareText,
    color: "from-cyan-500/25 to-blue-500/25 border-cyan/40 text-cyan shadow-cyan/15",
  },
  {
    view: "reid",
    label: "Cross-Camera Journey",
    icon: Route,
    color: "from-teal-500/25 to-emerald-500/25 border-teal/40 text-teal shadow-teal/15",
  },
  {
    view: "photo_reid",
    label: "Photo Forensics & Re-ID",
    icon: Scan,
    color: "from-fuchsia-500/25 to-pink-500/25 border-fuchsia-400/40 text-fuchsia-400 shadow-fuchsia-500/15",
  },
  {
    view: "tasks",
    label: "Vision Tasks & ANPR",
    icon: Cpu,
    color: "from-amber-500/25 to-orange-500/25 border-amber-400/40 text-amber-300 shadow-amber-400/15",
  },
  {
    view: "watchdog",
    label: "Watchdog Alerts",
    icon: ShieldAlert,
    color: "from-red-500/25 to-rose-500/25 border-red-500/40 text-red-400 shadow-red-500/15",
  },
  {
    view: "matrix",
    label: "CCTV Matrix Wall",
    icon: Clapperboard,
    color: "from-blue-500/25 to-indigo-500/25 border-blue-400/40 text-blue-400 shadow-blue-400/15",
  },
  {
    view: "ingestion",
    label: "Camera Ingestion",
    icon: Radar,
    color: "from-violet-500/25 to-purple-500/25 border-violet-400/40 text-violet-400 shadow-violet-400/15",
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden>
        <rect width="48" height="48" rx="12" fill="#101c2c" />
        <path d="M24 7 38 12v11c0 9-5.8 14.7-14 18-8.2-3.3-14-9-14-18V12z" fill="none" stroke="#93b8ff" strokeWidth="2.5" />
        <path d="M15.5 24s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" fill="none" stroke="#49ced3" strokeWidth="2" />
        <circle cx="24" cy="24" r="2.7" fill="#49ced3" />
      </svg>
      <div>
        <div className="font-display text-[15px] font-bold leading-none tracking-wide text-ice">SENTINEL</div>
        <div className="font-mono text-[8px] uppercase tracking-[0.3em] text-telem-muted">video intelligence</div>
      </div>
    </div>
  );
}

function TelemetryFooter() {
  const cameras = useSentinel((state) => state.cameras);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 2000);
    return () => window.clearInterval(id);
  }, []);
  const online = cameras.filter((camera) => camera.status === "online").length;
  const gpu = 32 + ((tick * 7) % 26);
  const tracks = 320 + ((tick * 13) % 40);
  const vectors = 128400 + tick * 37;
  return (
    <footer className="flex h-9 shrink-0 items-center gap-4 overflow-x-auto border-t border-white/10 bg-black/40 px-4 font-mono text-[10px] tracking-wider text-telem-muted backdrop-blur">
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="pulse-rec inline-block h-1.5 w-1.5 rounded-full bg-teal" /> NOMINAL
      </span>
      <span className="whitespace-nowrap">GPU <span className="text-cyan">{gpu}%</span></span>
      <span className="whitespace-nowrap">CAMERAS <span className="text-cyan">{online}/{cameras.length}</span></span>
      <span className="whitespace-nowrap">TRACKS <span className="text-cyan">{tracks}</span></span>
      <span className="whitespace-nowrap">VECTORS <span className="text-cyan">{vectors.toLocaleString()}</span></span>
      <span className="whitespace-nowrap">EMBED <span className="text-teal">OpenCLIP·512d</span></span>
      <span className="ml-auto whitespace-nowrap text-telem-muted">SENTINEL v2.4 · live CCTV dataset pipeline</span>
    </footer>
  );
}

export default function Workspace() {
  const view = useSentinel((state) => state.view);
  const set = useSentinel((state) => state.set);
  const hydrate = useSentinel((state) => state.hydrate);
  const clock = useUtcClock();
  const [booting, setBooting] = useState(true);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [appSearch, setAppSearch] = useState("");

  useEffect(() => {
    hydrate();
    const id = window.setTimeout(() => setBooting(false), 700);
    return () => window.clearTimeout(id);
  }, [hydrate]);

  // Handle escape key to close launcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLauncherOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentApp = APPS.find((a) => a.view === view) || APPS[0];
  const CurrentIcon = currentApp.icon;

  const filteredApps = APPS.filter((a) =>
    a.label.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen flex-col bg-[#070d14] text-foreground select-none">
      {/* ── ODOO-STYLE MINIMALIST TOP BAR (No horizontal tabs) ── */}
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-4 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          {/* Odoo 9-Dots / App Switcher Button */}
          <button
            type="button"
            onClick={() => setLauncherOpen(true)}
            title="Odoo App Launcher (Switch Apps)"
            className="group flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-cyan transition-all hover:scale-105 hover:border-cyan/60 hover:bg-cyan/15 hover:text-cyan hover:shadow-lg hover:shadow-cyan/20"
          >
            <LayoutGrid className="h-5 w-5 transition-transform group-hover:rotate-6" />
          </button>

          <div className="h-5 w-px bg-white/15" />

          <Logo />

          {/* Odoo-style App Breadcrumb & Switcher Trigger */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
            <span className="hidden sm:inline font-mono text-[11px] text-telem-muted">Sentinel OS</span>
            <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-white/20" />
            <button
              type="button"
              onClick={() => setLauncherOpen(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 font-display text-[13px] font-semibold text-ice transition-colors hover:bg-white/5 hover:text-cyan"
            >
              <CurrentIcon className="h-4 w-4 text-cyan" />
              <span>{currentApp.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-telem-muted" />
            </button>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLauncherOpen(true)}
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-xs font-medium text-cyan hover:bg-cyan/20 transition-all shadow-sm shadow-cyan/10"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>App Drawer</span>
          </button>

          <span className="hidden items-center gap-1.5 font-mono text-[10px] tracking-wider text-teal lg:flex">
            <StatusDot status="online" /> ALL SYSTEMS NOMINAL
          </span>
          <span className="font-mono text-[11px] text-ice">{clock}</span>
        </div>
      </header>

      {/* ── MAIN WORKSPACE VIEW ── */}
      <main className="relative min-h-0 flex-1 sentinel-grid">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {view === "search" && <SearchView />}
            {view === "reid" && <ReidView />}
            {view === "photo_reid" && <PhotoReidView />}
            {view === "tasks" && <TasksView />}
            {view === "watchdog" && <WatchdogView />}
            {view === "matrix" && <MatrixView />}
            {view === "ingestion" && <IngestionView />}
          </motion.div>
        </AnimatePresence>

        {booting && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[var(--background)]">
            <Logo />
            <p className="font-mono text-[11px] tracking-[0.2em] text-cyan">INITIALISING FEEDS…</p>
          </div>
        )}
      </main>

      {/* ── MINIMALIST ODOO-STYLE APPS LAUNCHER OVERLAY (Icon & App Name Only) ── */}
      <AnimatePresence>
        {launcherOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-3xl p-6 md:p-12 overflow-y-auto"
          >
            {/* Top Bar with Minimalist Search & Close */}
            <div className="flex items-center justify-between max-w-4xl mx-auto w-full border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-cyan">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold tracking-wide text-ice">
                    Applications
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-56 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-telem-muted" />
                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="Search apps…"
                    autoFocus
                    className="h-9 w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3 text-xs text-ice placeholder:text-telem-muted focus:border-cyan focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setLauncherOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-muted-foreground transition-all hover:bg-white/10 hover:text-ice"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Strictly Minimalist Grid: Icon + App Name Only */}
            <div className="flex-1 flex items-center justify-center py-10 max-w-4xl mx-auto w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 md:gap-12 w-full justify-items-center">
                {filteredApps.map((app) => {
                  const Icon = app.icon;
                  const isCurrent = app.view === view;
                  return (
                    <motion.div
                      key={app.view}
                      whileHover={{ scale: 1.08, translateY: -6 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        set({ view: app.view });
                        setLauncherOpen(false);
                      }}
                      className="group flex flex-col items-center justify-center cursor-pointer p-2 select-none text-center"
                    >
                      {/* App Icon Tile */}
                      <div
                        className={`relative flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-3xl border bg-gradient-to-br shadow-xl transition-all duration-300 ${
                          app.color
                        } ${
                          isCurrent
                            ? "ring-2 ring-cyan ring-offset-4 ring-offset-[#070d14] scale-105"
                            : "hover:ring-1 hover:ring-white/40 group-hover:shadow-2xl"
                        }`}
                      >
                        <Icon className="h-9 w-9 md:h-11 md:w-11 transition-transform duration-300 group-hover:scale-110" />

                        {/* Active Indicator Pulse */}
                        {isCurrent && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan border border-[#070d14]" />
                          </span>
                        )}
                      </div>

                      {/* Strictly App Name Only */}
                      <div className="mt-3">
                        <span
                          className={`font-display text-xs md:text-sm font-semibold tracking-wide transition-colors ${
                            isCurrent
                              ? "text-cyan font-bold"
                              : "text-ice group-hover:text-cyan"
                          }`}
                        >
                          {app.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Launcher Footer Info */}
            <div className="text-center font-mono text-xs text-telem-muted border-t border-white/10 pt-4 max-w-4xl mx-auto w-full">
              Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-ice font-mono text-[10px]">Esc</kbd> to close app launcher
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TelemetryFooter />
    </div>
  );
}
