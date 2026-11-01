import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Eye, Navigation } from "lucide-react";
import { streetViewUrl, useNearby } from "@/lib/queries";
import type { Progress, Route } from "@/lib/types";

const flagIcon = (color: string, label: string) =>
  L.divIcon({
    className: "leaflet-div-icon-clean",
    html: `<div style="display:flex;align-items:center;gap:6px;transform:translate(-6px,-30px)">
      <div style="width:14px;height:14px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>
      <span style="background:white;color:#0f172a;font:600 11px 'DM Sans Variable',sans-serif;padding:2px 8px;border-radius:9999px;box-shadow:0 2px 8px rgba(0,0,0,.2);white-space:nowrap">${label}</span>
    </div>`,
    iconSize: [0, 0],
  });

const riderIcon = (heading: number) =>
  L.divIcon({
    className: "leaflet-div-icon-clean",
    html: `<div style="position:relative;width:44px;height:44px;transform:translate(-22px,-22px)">
      <span class="rider-pulse" style="position:absolute;inset:0;border-radius:9999px;background:rgba(5,150,105,.45)"></span>
      <span style="position:absolute;inset:6px;border-radius:9999px;background:#059669;border:3px solid white;box-shadow:0 4px 14px rgba(5,150,105,.6);display:flex;align-items:center;justify-content:center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform:rotate(${heading}deg)"><path d="M12 2 L19 21 L12 17 L5 21 Z"/></svg>
      </span>
    </div>`,
    iconSize: [0, 0],
  });

function FitRoute({ route }: { route: Route }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLngBounds(route.geometry), { padding: [40, 40] });
  }, [map, route.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function FollowRider({ pos, ridden }: { pos: [number, number]; ridden: number }) {
  const map = useMap();
  useEffect(() => {
    if (ridden > 0) map.flyTo(pos, Math.max(map.getZoom(), 11), { duration: 1.2 });
  }, [ridden]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function RouteMap({ route, progress }: { route: Route; progress: Progress }) {
  const { done, rest } = useMemo(() => {
    const i = progress.segment_index;
    const p = progress.position;
    return {
      done: [...route.geometry.slice(0, i + 1), p] as [number, number][],
      rest: [p, ...route.geometry.slice(i + 1)] as [number, number][],
    };
  }, [route.geometry, progress.segment_index, progress.position]);
  const nearby = useNearby(progress.position);
  const [lat, lon] = progress.position;

  return (
    <div className="relative isolate h-full w-full overflow-hidden" data-testid="route-map">
      <MapContainer center={route.geometry[0]} zoom={7} className="h-full w-full" zoomControl={false} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Polyline positions={rest} pathOptions={{ color: "#64748b", weight: 4, dashArray: "6 8", opacity: 0.9 }} />
        <Polyline positions={done} pathOptions={{ color: "#10b981", weight: 12, opacity: 0.25 }} />
        <Polyline positions={done} pathOptions={{ color: "#059669", weight: 6 }} />
        <Marker position={route.geometry[0]} icon={flagIcon("#059669", route.start.name.split(",")[0])} />
        <Marker position={route.geometry[route.geometry.length - 1]} icon={flagIcon("#0f172a", route.end.name.split(",")[0])} />
        <Marker position={progress.position} icon={riderIcon(progress.heading)} zIndexOffset={1000} />
        <FitRoute route={route} />
        <FollowRider pos={progress.position} ridden={progress.ridden_km} />
      </MapContainer>

      {/* Street View HUD */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex justify-start sm:inset-x-5 sm:bottom-5">
        <div
          data-testid="streetview-hud"
          className="pointer-events-auto flex w-full max-w-md flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              <Navigation className="size-3" /> Deine Position
            </p>
            <p data-testid="current-location-name" className="truncate font-heading text-base font-bold text-slate-900">
              {nearby.data?.name ? `Nahe ${nearby.data.name}` : nearby.isFetching ? "Ort wird ermittelt…" : "Unterwegs"}
            </p>
            <p data-testid="current-coordinates" className="font-mono text-xs text-slate-500">
              {lat.toFixed(5)}, {lon.toFixed(5)}
            </p>
          </div>
          <a
            data-testid="open-google-streetview-btn"
            href={streetViewUrl(lat, lon, progress.heading)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-amber-500 px-5 text-sm font-bold text-stone-900 shadow-lg transition-[background-color,transform] hover:bg-amber-600 active:scale-95"
          >
            <Eye className="size-4" /> Street View öffnen
          </a>
        </div>
      </div>
    </div>
  );
}
