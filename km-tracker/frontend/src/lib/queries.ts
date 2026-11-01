import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { EntryCreate, NearbyPlace, Place, RouteState, RouteSummary, Stats } from "@/lib/types";

export const KEYS = {
  active: ["route", "active"] as const,
  archive: ["route", "archive"] as const,
  stats: ["stats"] as const,
};

export function useActiveRoute() {
  return useQuery({ queryKey: KEYS.active, queryFn: () => apiGet<RouteState>("/routes/active") });
}

export function useArchive(enabled: boolean) {
  return useQuery({ queryKey: KEYS.archive, queryFn: () => apiGet<RouteSummary[]>("/routes/archive"), enabled });
}

export function useStats(enabled: boolean) {
  return useQuery({ queryKey: KEYS.stats, queryFn: () => apiGet<Stats>("/stats"), enabled });
}

export function useNearby(pos: [number, number] | undefined) {
  const lat = pos ? pos[0].toFixed(3) : "";
  const lon = pos ? pos[1].toFixed(3) : "";
  return useQuery({
    queryKey: ["nearby", lat, lon],
    queryFn: () => apiGet<NearbyPlace>(`/nearby?lat=${lat}&lon=${lon}`),
    enabled: !!pos,
    staleTime: Infinity,
  });
}

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["route"] });
    qc.invalidateQueries({ queryKey: KEYS.stats });
  };
}

export function useCreateRoute() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (body: { start: Place; end: Place }) => apiPost<RouteState>("/routes", body),
    onSuccess: invalidate,
  });
}

export function useDeleteRoute() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: string) => apiDelete<void>(`/routes/${id}`), onSuccess: invalidate });
}

export function useAddEntry(routeId: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (body: EntryCreate) => apiPost<RouteState>(`/routes/${routeId}/entries`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteEntry() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id: string) => apiDelete<void>(`/entries/${id}`), onSuccess: invalidate });
}

export function errorDetail(err: unknown, fallback: string): string {
  const body = (err as { body?: { detail?: unknown } } | null)?.body;
  return typeof body?.detail === "string" ? body.detail : fallback;
}

export const fmtKm = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export const fmtDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });

export const streetViewUrl = (lat: number, lon: number, heading: number) =>
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat.toFixed(6)},${lon.toFixed(6)}&heading=${Math.round(heading)}`;
