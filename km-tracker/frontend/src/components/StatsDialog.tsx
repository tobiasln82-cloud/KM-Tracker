import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fmtKm, useStats } from "@/lib/queries";

const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

export default function StatsDialog() {
  const [open, setOpen] = useState(false);
  const { data, isError } = useStats(open);
  const tiles = data
    ? [
        { label: "Gesamt", value: `${fmtKm(data.total_km)} km`, id: "stat-total-km" },
        { label: "Fahrten", value: String(data.entry_count), id: "stat-entry-count" },
        { label: "Ø pro Fahrt", value: `${fmtKm(data.avg_km_per_ride)} km`, id: "stat-avg-km" },
        { label: "Längste Fahrt", value: `${fmtKm(data.longest_ride_km)} km`, id: "stat-longest" },
        { label: "Fahrtage", value: String(data.ride_days), id: "stat-ride-days" },
        { label: "Touren beendet", value: String(data.completed_routes), id: "stat-completed-routes" },
      ]
    : [];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" data-testid="stats-modal-trigger" className="gap-1.5" />}>
        <BarChart3 className="size-4" /> <span className="hidden sm:inline">Statistik</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-extrabold">Statistik</DialogTitle>
          <DialogDescription>Über alle Touren hinweg · letzte 12 Wochen</DialogDescription>
        </DialogHeader>
        {isError && <p className="text-sm text-destructive">Statistik konnte nicht geladen werden.</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tiles.map((t) => (
            <div key={t.id} className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.label}</p>
              <p data-testid={t.id} className="font-mono text-lg font-bold">{t.value}</p>
            </div>
          ))}
        </div>
        <div className="h-56 w-full" data-testid="weekly-chart">
          {data && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly} margin={{ left: -16, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" tickFormatter={shortDate} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => [`${fmtKm(value)} km`, "Strecke"]}
                  labelFormatter={(label: string) => `Woche ab ${shortDate(label)}`}
                  cursor={{ fill: "#ecfdf5" }}
                />
                <Bar dataKey="km" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
