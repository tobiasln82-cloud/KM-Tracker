import { motion } from "motion/react";
import { fmtKm } from "@/lib/queries";
import type { Progress, Route } from "@/lib/types";

export default function ProgressCard({ route, progress }: { route: Route; progress: Progress }) {
  const metrics = [
    { label: "Gefahren", value: fmtKm(progress.ridden_km), unit: "km", id: "completed-km-metric", strong: true },
    { label: "Verbleibend", value: fmtKm(progress.remaining_km), unit: "km", id: "remaining-km-metric" },
    { label: "Gesamt", value: fmtKm(route.distance_km), unit: "km", id: "total-km-metric" },
  ];
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-live="polite">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Fortschritt</p>
          <p data-testid="progress-percent" className="font-mono text-5xl font-bold tracking-tight text-slate-900">
            {progress.percent.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
            <span className="text-2xl text-slate-400">%</span>
          </p>
        </div>
      </div>

      <div
        data-testid="route-progress-bar"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progress.percent, 0.5)}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.id} className={m.strong ? "rounded-xl bg-emerald-50 p-3" : "rounded-xl bg-slate-50 p-3"}>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{m.label}</dt>
            <dd data-testid={m.id} className={`font-mono text-lg font-bold tracking-tight ${m.strong ? "text-emerald-700" : "text-slate-900"}`}>
              {m.value} <span className="text-xs font-medium text-slate-400">{m.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
