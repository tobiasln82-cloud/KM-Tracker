import { useState } from "react";
import { ArrowRight, Bike, Loader2, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PlaceSearch from "@/components/PlaceSearch";
import { errorDetail, useCreateRoute } from "@/lib/queries";
import type { Place } from "@/lib/types";

const PRESETS: { label: string; km: number; start: Place; end: Place }[] = [
  { label: "Alpenüberquerung", km: 560, start: { name: "München, Deutschland", lat: 48.1374, lon: 11.5755 }, end: { name: "Venedig, Italien", lat: 45.4408, lon: 12.3155 } },
  { label: "Donauradweg", km: 320, start: { name: "Passau, Deutschland", lat: 48.5748, lon: 13.461 }, end: { name: "Wien, Österreich", lat: 48.2082, lon: 16.3738 } },
  { label: "Rheinradweg", km: 820, start: { name: "Basel, Schweiz", lat: 47.5596, lon: 7.5886 }, end: { name: "Rotterdam, Niederlande", lat: 51.9244, lon: 4.4777 } },
  { label: "Ostseeküste", km: 285, start: { name: "Lübeck, Deutschland", lat: 53.8655, lon: 10.6866 }, end: { name: "Stralsund, Deutschland", lat: 54.3091, lon: 13.0818 } },
];

export default function RoutePlanner({ onCreated }: { onCreated?: () => void }) {
  const [start, setStart] = useState<Place | null>(null);
  const [end, setEnd] = useState<Place | null>(null);
  const create = useCreateRoute();

  const submit = () => {
    if (!start || !end) return;
    create.mutate(
      { start, end },
      {
        onSuccess: (s) => {
          toast.success(`Route erstellt: ${s.route?.distance_km.toLocaleString("de-DE", { maximumFractionDigits: 0 })} km`);
          setStart(null);
          setEnd(null);
          onCreated?.();
        },
        onError: (e) => toast.error(errorDetail(e, "Route konnte nicht erstellt werden")),
      },
    );
  };

  return (
    <div className="space-y-6" data-testid="route-planner">
      <div className="grid gap-4">
        <PlaceSearch id="start" label="Startort" placeholder="z.B. München" value={start} onChange={setStart} testId="route-start-search-input" />
        <PlaceSearch id="end" label="Zielort" placeholder="z.B. Venedig" value={end} onChange={setEnd} testId="route-destination-search-input" />
      </div>

      <Button
        data-testid="create-route-submit-btn"
        disabled={!start || !end || create.isPending}
        onClick={submit}
        className="h-12 w-full gap-2 text-base font-semibold shadow-[0_8px_24px_-8px_rgba(5,150,105,0.6)] transition-[transform,box-shadow] active:scale-[0.98]"
      >
        {create.isPending ? <Loader2 className="size-5 animate-spin" /> : <Bike className="size-5" />}
        {create.isPending ? "Fahrradroute wird berechnet…" : "Route erstellen"}
      </Button>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Beliebte Touren</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              data-testid={`route-preset-${i}`}
              onClick={() => {
                setStart(p.start);
                setEnd(p.end);
              }}
              className="group flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-emerald-400"
            >
              <RouteIcon className="size-4 shrink-0 text-emerald-600" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  {p.start.name.split(",")[0]} <ArrowRight className="size-3" /> {p.end.name.split(",")[0]} · ~{p.km} km
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
