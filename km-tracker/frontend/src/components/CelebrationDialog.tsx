import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fmtKm } from "@/lib/queries";
import type { RouteState } from "@/lib/types";

const COLORS = ["#059669", "#f59e0b", "#0891b2", "#10b981", "#fbbf24", "#0f172a"];

export default function CelebrationDialog({ state, onClose }: { state: RouteState | null; onClose: () => void }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 2.4 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 200,
        color: COLORS[i % COLORS.length],
      })),
    [state], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const route = state?.route;
  return (
    <>
      {state &&
        pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{ left: `${p.left}vw`, background: p.color, ["--delay" as string]: `${p.delay}s`, ["--dur" as string]: `${p.dur}s`, ["--drift" as string]: `${p.drift}px` }}
          />
        ))}
      <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="text-center sm:max-w-md" data-testid="celebration-modal">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Trophy className="size-8" />
          </div>
          <DialogTitle className="font-heading text-3xl font-extrabold tracking-tight">Ziel erreicht!</DialogTitle>
          <DialogDescription className="text-base">
            Du bist virtuell von <strong>{route?.start.name.split(",")[0]}</strong> nach{" "}
            <strong>{route?.end.name.split(",")[0]}</strong> geradelt –{" "}
            <span className="font-mono font-bold text-emerald-700">{fmtKm(state?.progress?.ridden_km ?? 0)} km</span> in{" "}
            {state?.entries.length} Fahrten.
          </DialogDescription>
          <Button data-testid="plan-next-route-btn" onClick={onClose} className="mt-2 h-11 font-semibold">
            Nächste Tour planen
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
