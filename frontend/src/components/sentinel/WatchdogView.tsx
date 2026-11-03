import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Crosshair,
  Flame,
  Play,
  Plus,
  Radio,
  ShieldAlert,
  Trash2,
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
  acknowledgeWatchdogAlert,
  createWatchdogRule,
  deleteWatchdogRule,
  getWatchdogAlerts,
  getWatchdogRules,
  simulateWatchdogAlert,
} from "@/lib/api";
import { useSentinel } from "@/store";
import type { WatchdogAlert, WatchdogRule } from "@/types/sentinel";
import { CameraTile, SectionLabel } from "./shared";

// Sound synthesizer using Web Audio API for alert sounds
function playAlertChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.25);

    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(1100, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.25);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.25);
    }, 120);
  } catch {
    // Audio context prevented by browser policy until interaction
  }
}

export default function WatchdogView() {
  const cameras = useSentinel((state) => state.cameras);
  const [alerts, setAlerts] = useState<WatchdogAlert[]>([]);
  const [rules, setRules] = useState<WatchdogRule[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<WatchdogAlert | null>(null);

  // New Rule Dialog
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleCameraId, setRuleCameraId] = useState("CAM_01");
  const [ruleClass, setRuleClass] = useState("Car");
  const [ruleColor, setRuleColor] = useState("Red");
  const [ruleSeverity, setRuleSeverity] = useState("CRITICAL");

  const refreshData = useCallback(async () => {
    const alertList = await getWatchdogAlerts();
    const ruleList = await getWatchdogRules();
    setAlerts(alertList);
    setRules(ruleList);
  }, []);

  useEffect(() => {
    void refreshData();
    const interval = setInterval(() => {
      void refreshData();
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleSimulateAlert = async () => {
    const res = await simulateWatchdogAlert();
    if (res?.alert) {
      if (soundEnabled) playAlertChime();
      toast.error(`🚨 WATCHDOG ALERT: ${res.alert.rule_name} on ${res.alert.camera_name}`, {
        duration: 5000,
      });
      await refreshData();
    }
  };

  const handleAcknowledge = async (id: number) => {
    await acknowledgeWatchdogAlert(id);
    toast.success("Alert acknowledged and resolved");
    await refreshData();
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim()) return;
    await createWatchdogRule({
      name: ruleName.trim(),
      camera_id: ruleCameraId,
      object_class: ruleClass,
      color: ruleColor,
      severity: ruleSeverity,
    });
    setNewRuleOpen(false);
    setRuleName("");
    toast.success(`Watchdog trigger rule created`);
    await refreshData();
  };

  const handleDeleteRule = async (id: number) => {
    await deleteWatchdogRule(id);
    toast.info("Rule deleted");
    await refreshData();
  };

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ── LEFT: Watchdog Alerts Feed ── */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* Banner */}
        <section className="glass-surface relative overflow-hidden rounded-xl border border-red-500/30 p-4">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/15 text-red-400">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-bold text-foreground">
                    Sentinel Watchdog Threat Engine
                  </h2>
                  <span className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-red-400">
                    <Radio className="h-3 w-3 animate-ping" /> {activeAlerts.length} Active Alarms
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Proactive multi-camera threat triggers. Automatically raises visual & audible alarms when target criteria match.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-muted-foreground"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute audio alarms" : "Enable audio alarms"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan" /> : <VolumeX className="h-4 w-4" />}
                {soundEnabled ? "Siren On" : "Muted"}
              </Button>
              <Button
                size="sm"
                onClick={handleSimulateAlert}
                className="h-8 gap-1.5 bg-red-500/90 px-3 font-display text-xs font-semibold text-white hover:bg-red-600"
              >
                <Flame className="h-3.5 w-3.5 fill-current" /> Raise Simulated Alert
              </Button>
            </div>
          </div>
        </section>

        {/* Active Alarms Feed */}
        <section className="flex flex-col gap-3">
          <SectionLabel aside={<span className="font-mono text-[10px] text-red-400">{activeAlerts.length} unacknowledged</span>}>
            Active Raised Alarms
          </SectionLabel>

          {activeAlerts.length === 0 && (
            <div className="glass-inset flex flex-col items-center justify-center rounded-xl p-8 text-center">
              <CheckCircle className="h-8 w-8 text-teal" />
              <p className="mt-2 font-display text-sm font-semibold text-foreground">All Clear · No Active Alarms</p>
              <p className="mt-1 text-xs text-muted-foreground">
                All 4 CCTV feeds match safe baselines. Click "Raise Simulated Alert" to trigger a demonstration alarm.
              </p>
            </div>
          )}

          <AnimatePresence>
            {activeAlerts.map((alert) => (
              <motion.article
                key={alert.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className={`glass-surface rounded-xl border p-3.5 transition-all ${
                  alert.severity === "CRITICAL"
                    ? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                    : "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.12)]"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div
                    onClick={() => setSelectedEvidence(alert)}
                    role="button"
                    tabIndex={0}
                    className="feed-sheen group/thumb relative h-[88px] w-[140px] shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/15 bg-black"
                  >
                    <img src={alert.crop_url} alt={alert.rule_name} className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <span className="rounded-full bg-cyan p-1.5 text-black">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                    </div>
                    <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1 font-mono text-[9px] text-cyan">
                      {alert.camera_id}
                    </span>
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 font-mono text-[9px] text-ice">
                      t+{alert.timestamp.toFixed(1)}s
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                        alert.severity === "CRITICAL" ? "bg-red-500/25 text-red-400" : "bg-amber-500/25 text-amber-300"
                      }`}>
                        🚨 {alert.severity} ALARM
                      </span>
                      <span className="font-mono text-xs font-semibold text-ice">{alert.camera_name}</span>
                      <span className="font-mono text-[10px] text-telem-muted">
                        t+{alert.timestamp.toFixed(1)}s
                      </span>
                    </div>

                    <h4 className="mt-1 font-display text-sm font-bold text-foreground">
                      {alert.rule_name}
                    </h4>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Detected <strong className="text-foreground">{alert.color} {alert.object_class}</strong> triggering rule constraints on CCTV feed {alert.camera_id}.
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 gap-1.5 bg-cyan/20 px-2.5 text-xs text-cyan hover:bg-cyan/30"
                        onClick={() => setSelectedEvidence(alert)}
                      >
                        <Play className="h-3 w-3 fill-current" /> Play Evidence Clip
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 gap-1.5 px-2.5 text-xs"
                        onClick={() => {
                          useSentinel.setState({ tracedTrackId: `TRK-000${alert.id}`, view: "reid" });
                          toast(`Tracing entity across all cameras`);
                        }}
                      >
                        <Crosshair className="h-3 w-3" /> Re-ID Trace
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1.5 px-2.5 text-xs text-teal hover:bg-teal/10"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Acknowledge Alert
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </section>

        {/* Resolved History */}
        {acknowledgedAlerts.length > 0 && (
          <section className="mt-2 flex flex-col gap-2">
            <SectionLabel aside={<span className="font-mono text-[10px] text-telem-muted">{acknowledgedAlerts.length} past</span>}>
              Resolved Alert History
            </SectionLabel>
            <div className="space-y-1.5">
              {acknowledgedAlerts.map((alert) => (
                <div key={alert.id} className="glass-inset flex items-center justify-between rounded-lg p-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-3.5 w-3.5 text-teal" />
                    <span className="font-medium text-foreground">{alert.rule_name}</span>
                    <span className="font-mono text-[10px] text-telem-muted">{alert.camera_name} · t+{alert.timestamp.toFixed(1)}s</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-teal">RESOLVED</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── RIGHT: Watchdog Rules Configuration ── */}
      <aside className="flex min-w-0 flex-col gap-4">
        <section className="glass-surface rounded-xl border border-white/10 p-3.5">
          <div className="flex items-center justify-between">
            <SectionLabel>Active Threat Triggers</SectionLabel>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNewRuleOpen(true)}
              className="h-7 gap-1 border-cyan/40 bg-cyan/10 px-2 text-xs text-cyan hover:bg-cyan/20"
            >
              <Plus className="h-3 w-3" /> Add Rule
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="glass-inset group flex flex-col gap-1.5 rounded-lg border border-white/5 p-2.5 transition-all hover:border-white/15"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-xs font-semibold text-foreground">
                    {rule.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-telem-muted hover:text-rec transition-opacity"
                    title="Delete rule"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-telem-muted">
                  <span className="rounded bg-white/5 px-1 py-0.5 text-ice">{rule.camera_id}</span>
                  {rule.color && <span className="rounded bg-white/5 px-1 py-0.5 text-cyan">{rule.color}</span>}
                  {rule.object_class && <span className="rounded bg-white/5 px-1 py-0.5 text-teal">{rule.object_class}</span>}
                  <span className={`ml-auto font-bold ${rule.severity === "CRITICAL" ? "text-red-400" : "text-amber-300"}`}>
                    {rule.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mini Camera Grid */}
        <section className="glass-surface rounded-xl border border-white/10 p-3">
          <SectionLabel aside={<span className="font-mono text-[10px] text-teal">4 streams</span>}>
            CCTV Feeds Covered
          </SectionLabel>
          <div className="mt-2 grid aspect-[16/10] grid-cols-2 grid-rows-2 gap-2">
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
        </section>
      </aside>

      {/* ── MODAL: Video Evidence Player ── */}
      <Dialog open={Boolean(selectedEvidence)} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
        <DialogContent className="border-white/10 bg-[var(--popover)] text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-red-400">
              <ShieldAlert className="h-4 w-4" /> Watchdog Incident Evidence · {selectedEvidence?.camera_name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedEvidence?.rule_name} · Triggered at timestamp t+{selectedEvidence?.timestamp.toFixed(1)}s ({selectedEvidence?.color} {selectedEvidence?.object_class})
            </DialogDescription>
          </DialogHeader>
          {selectedEvidence && (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-red-500/30 bg-black">
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
              <div className="glass-inset rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Watchdog Detection Grounding
                  </span>
                  <span className="font-mono text-[10px] text-ice">t+{selectedEvidence.timestamp.toFixed(1)}s</span>
                </div>
                <p className="mt-1 text-xs text-foreground/90">
                  Target entity ({selectedEvidence.color} {selectedEvidence.object_class}) breached perimeter trigger at {selectedEvidence.camera_name}.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedEvidence(null)}>
              Close
            </Button>
            {selectedEvidence && !selectedEvidence.acknowledged && (
              <Button
                variant="default"
                className="bg-teal text-black hover:bg-teal/90"
                onClick={() => {
                  handleAcknowledge(selectedEvidence.id);
                  setSelectedEvidence(null);
                }}
              >
                Acknowledge Alert
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Create Watchdog Rule ── */}
      <Dialog open={newRuleOpen} onOpenChange={setNewRuleOpen}>
        <DialogContent className="border-white/10 bg-[var(--popover)] text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Plus className="h-4 w-4 text-cyan" /> New Watchdog Trigger Rule
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Define a proactive condition that raises an alarm whenever a matching entity is detected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase text-telem-muted">Rule Title</label>
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Red Vehicle Intrusion at Main Gate"
                className="mt-1 border-white/15 bg-black/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-[10px] uppercase text-telem-muted">Target Camera</label>
                <Select value={ruleCameraId} onValueChange={setRuleCameraId}>
                  <SelectTrigger className="mt-1 border-white/15 bg-black/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map((c) => (
                      <SelectItem key={c.camera_id} value={c.camera_id}>
                        {c.camera_id} · {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-telem-muted">Severity</label>
                <Select value={ruleSeverity} onValueChange={setRuleSeverity}>
                  <SelectTrigger className="mt-1 border-white/15 bg-black/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-[10px] uppercase text-telem-muted">Entity Class</label>
                <Select value={ruleClass} onValueChange={setRuleClass}>
                  <SelectTrigger className="mt-1 border-white/15 bg-black/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Person">Person</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Bicycle">Bicycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-telem-muted">Color</label>
                <Input
                  value={ruleColor}
                  onChange={(e) => setRuleColor(e.target.value)}
                  placeholder="e.g. Red, Black, White"
                  className="mt-1 border-white/15 bg-black/30"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewRuleOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-cyan/90 text-black hover:bg-cyan" onClick={handleCreateRule} disabled={!ruleName.trim()}>
              Arm Watchdog Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
