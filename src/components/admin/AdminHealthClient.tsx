"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { HealthReport, HealthMetric } from "@/lib/health-check";

function StatusBadge({ status }: { status: "ok" | "warning" | "exceeded" }) {
  const styles = {
    ok:       "bg-lime/10 text-lime",
    warning:  "bg-amber-500/10 text-amber-400",
    exceeded: "bg-[#FF5A3C]/10 text-[#FF5A3C]",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
      uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

function MetricBar({ metric }: { metric: HealthMetric }) {
  const barColor =
    metric.status === "exceeded" ? "bg-[#FF5A3C]" :
    metric.status === "warning"  ? "bg-amber-400" :
    "bg-lime";

  const pctCapped = Math.min(metric.pct, 100);

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[#6B6F76] uppercase tracking-widest font-medium mb-1">
            {metric.label}
          </p>
          <p className="text-2xl font-bold text-[#F7F6F1] font-heading">
            {metric.value.toLocaleString()}
            <span className="text-sm font-normal text-[#6B6F76] ml-1">
              / {metric.threshold.toLocaleString()}
            </span>
          </p>
        </div>
        <StatusBadge status={metric.status} />
      </div>
      <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pctCapped}%` }}
        />
      </div>
      <p className="text-[11px] text-[#525252] mt-1.5">{metric.pct}% of limit</p>
    </div>
  );
}

export default function AdminHealthClient({
  report,
  resumed,
  keptPaused,
}: {
  report:      HealthReport;
  resumed?:    boolean;
  keptPaused?: boolean;
}) {
  const [killActive, setKillActive] = useState(report.killActive);
  const [toggling,   setToggling]   = useState(false);

  useEffect(() => {
    if (resumed)    toast.success("Operations resumed successfully");
    if (keptPaused) toast.info("App remains paused");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleKillSwitch() {
    setToggling(true);
    try {
      const res = await fetch("/api/admin/kill-switch/toggle", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          active: !killActive,
          reason: !killActive ? "Manually paused by admin" : undefined,
        }),
      });
      if (res.ok) {
        setKillActive((prev) => !prev);
        toast.success(killActive ? "Operations resumed" : "App paused");
      }
    } catch {
      toast.error("Failed to toggle kill switch");
    } finally {
      setToggling(false);
    }
  }

  const hasAlerts = report.metrics.some((m) => m.status !== "ok");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F7F6F1]">
            System Health
          </h1>
          <p className="text-[#6B6F76] text-sm mt-1">
            Last checked: {new Date(report.checkedAt).toLocaleString()}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleKillSwitch}
          disabled={toggling}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
            text-sm transition-all disabled:opacity-50 ${
            killActive
              ? "bg-lime text-[#0A0A0A]"
              : "bg-[#FF5A3C]/10 text-[#FF5A3C] border border-[#FF5A3C]/30 hover:bg-[#FF5A3C]/20"
          }`}
        >
          {toggling ? "…" : killActive ? "▶ Resume operations" : "⏸ Pause app"}
        </button>
      </div>

      {/* Kill switch banner */}
      {killActive && (
        <div className="bg-[#FF5A3C]/10 border border-[#FF5A3C]/30 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-[#FF5A3C] text-lg">⏸</span>
            <div>
              <p className="font-semibold text-[#FF5A3C] text-sm">App is paused</p>
              <p className="text-[#a3a3a3] text-xs mt-0.5">
                {report.killReason ?? "Manually paused"}
                {report.killActivatedAt && (
                  <> · since {new Date(report.killActivatedAt).toLocaleString()}</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All-clear banner */}
      {!hasAlerts && !killActive && (
        <div className="bg-lime/5 border border-lime/20 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <span className="text-lime">✓</span>
            <p className="text-sm text-lime font-medium">All systems within limits</p>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {report.metrics.map((m) => (
          <MetricBar key={m.type} metric={m} />
        ))}
      </div>

      {/* Threshold reference */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6">
        <h2 className="font-semibold text-[#F7F6F1] text-sm mb-1">Alert thresholds</h2>
        <p className="text-[11px] text-[#6B6F76] mb-3">
          Warning fires at 85% · Auto-pause fires at 100%.
          Change these via <code className="text-lime">ALERT_THRESHOLD_*</code> env vars.
        </p>
        <div className="space-y-1.5">
          {report.metrics.map((m) => (
            <div key={m.type} className="flex items-center justify-between text-xs">
              <span className="text-[#6B6F76]">{m.label}</span>
              <span className="font-mono text-[#a3a3a3]">
                {m.threshold.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
