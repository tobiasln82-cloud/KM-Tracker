// Hand-written mirrors of backend/models/tour.py — keep in sync.
export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export interface Route {
  id: string;
  start: Place;
  end: Place;
  distance_km: number;
  geometry: [number, number][];
  status: "active" | "completed";
  created_at: string;
  completed_at: string | null;
}

export interface EntryCreate {
  date: string;
  km: number;
  note?: string | null;
}

export interface Entry {
  id: string;
  route_id: string;
  date: string;
  km: number;
  note: string | null;
  created_at: string;
}

export interface Progress {
  ridden_km: number;
  remaining_km: number;
  percent: number;
  position: [number, number];
  segment_index: number;
  heading: number;
}

export interface RouteState {
  route: Route | null;
  progress: Progress | null;
  entries: Entry[];
  today: string;
}

export interface RouteSummary {
  id: string;
  start: Place;
  end: Place;
  distance_km: number;
  ridden_km: number;
  entry_count: number;
  first_date: string | null;
  last_date: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface WeekStat {
  week: string;
  km: number;
}

export interface Stats {
  total_km: number;
  entry_count: number;
  ride_days: number;
  completed_routes: number;
  avg_km_per_ride: number;
  longest_ride_km: number;
  weekly: WeekStat[];
}

export interface GeoResult {
  name: string;
  detail: string;
  lat: number;
  lon: number;
}

export interface NearbyPlace {
  name: string | null;
}
