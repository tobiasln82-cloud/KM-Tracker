from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException, Query

from lib.dates import today_iso
from lib.db import db
from lib.geo import point_along, polyline_length_km
from models.tour import (
    Entry,
    EntryCreate,
    GeoResult,
    NearbyPlace,
    Progress,
    Route,
    RouteCreate,
    RouteState,
    RouteSummary,
    Stats,
    WeekStat,
)

router = APIRouter()

OSRM_BIKE = "https://routing.openstreetmap.de/routed-bike/route/v1/driving"
PHOTON = "https://photon.komoot.io"
UA = {"User-Agent": "VeloTrack-virtual-km-tracker/1.0"}


def _utc(dt):
    return dt.replace(tzinfo=timezone.utc) if dt and dt.tzinfo is None else dt


def _route(doc: dict) -> Route:
    doc["created_at"] = _utc(doc.get("created_at"))
    doc["completed_at"] = _utc(doc.get("completed_at"))
    return Route(**doc)


async def _entries(route_id: str) -> list[Entry]:
    docs = await db.entries.find({"route_id": route_id}, {"_id": 0}).sort([("date", -1), ("created_at", -1)]).to_list(5000)
    for d in docs:
        d["created_at"] = _utc(d["created_at"])
    return [Entry(**d) for d in docs]


def _progress(route: Route, entries: list[Entry]) -> Progress:
    ridden = sum(e.km for e in entries)
    capped = min(ridden, route.distance_km)
    pos, idx, heading = point_along(route.geometry, capped)
    return Progress(
        ridden_km=round(ridden, 2),
        remaining_km=round(max(route.distance_km - ridden, 0), 2),
        percent=round(capped / route.distance_km * 100, 2) if route.distance_km else 0,
        position=pos,
        segment_index=idx,
        heading=round(heading, 1),
    )


async def _state(route: Route | None) -> RouteState:
    if not route:
        return RouteState(today=today_iso())
    entries = await _entries(route.id)
    return RouteState(route=route, progress=_progress(route, entries), entries=entries, today=today_iso())


async def _active() -> Route | None:
    doc = await db.routes.find_one({"status": "active"}, {"_id": 0})
    return _route(doc) if doc else None


def _label(p: dict) -> tuple[str, str]:
    name = p.get("name") or p.get("city") or p.get("street") or "Unbenannter Ort"
    parts = [p.get("city") if p.get("city") != name else None, p.get("state"), p.get("country")]
    return name, ", ".join(x for x in parts if x)


@router.get("/geocode", response_model=list[GeoResult])
async def geocode(q: str = Query(min_length=2)):
    try:
        async with httpx.AsyncClient(timeout=10, headers=UA) as c:
            r = await c.get(f"{PHOTON}/api/", params={"q": q, "limit": 6, "lang": "de"})
            r.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(502, "Ortssuche momentan nicht erreichbar")
    out = []
    for f in r.json().get("features", []):
        lon, lat = f["geometry"]["coordinates"]
        name, detail = _label(f.get("properties", {}))
        out.append(GeoResult(name=name, detail=detail, lat=lat, lon=lon))
    return out


@router.get("/nearby", response_model=NearbyPlace)
async def nearby(lat: float, lon: float):
    try:
        async with httpx.AsyncClient(timeout=8, headers=UA) as c:
            r = await c.get(f"{PHOTON}/reverse", params={"lat": lat, "lon": lon, "lang": "de"})
            r.raise_for_status()
        feats = r.json().get("features", [])
    except httpx.HTTPError:
        return NearbyPlace()
    if not feats:
        return NearbyPlace()
    p = feats[0].get("properties", {})
    town = p.get("city") or p.get("locality") or p.get("district") or p.get("county") or p.get("name")
    region = p.get("state") or p.get("country")
    return NearbyPlace(name=", ".join(x for x in [town, region] if x) or None)


@router.get("/routes/active", response_model=RouteState)
async def get_active():
    return await _state(await _active())


@router.post("/routes", response_model=RouteState, status_code=201)
async def create_route(body: RouteCreate):
    if await _active():
        raise HTTPException(409, "Es gibt bereits eine aktive Route")
    url = f"{OSRM_BIKE}/{body.start.lon},{body.start.lat};{body.end.lon},{body.end.lat}"
    try:
        async with httpx.AsyncClient(timeout=60, headers=UA) as c:
            r = await c.get(url, params={"overview": "full", "geometries": "geojson"})
        data = r.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, "Routenberechnung momentan nicht erreichbar")
    if data.get("code") != "Ok" or not data.get("routes"):
        raise HTTPException(422, "Für diese Orte konnte keine Fahrradroute berechnet werden")
    coords = [[round(lat, 5), round(lon, 5)] for lon, lat in data["routes"][0]["geometry"]["coordinates"]]
    # drop consecutive duplicates
    geometry = [c for i, c in enumerate(coords) if i == 0 or c != coords[i - 1]]
    if len(geometry) < 2:
        raise HTTPException(422, "Start und Ziel liegen zu nah beieinander")
    route = Route(start=body.start, end=body.end, geometry=geometry, distance_km=round(polyline_length_km(geometry), 2))
    await db.routes.insert_one(route.model_dump())
    return await _state(route)


@router.delete("/routes/{route_id}", status_code=204)
async def delete_route(route_id: str):
    res = await db.routes.delete_one({"id": route_id})
    if not res.deleted_count:
        raise HTTPException(404, "Route nicht gefunden")
    await db.entries.delete_many({"route_id": route_id})


@router.get("/routes/archive", response_model=list[RouteSummary])
async def archive():
    docs = await db.routes.find({"status": "completed"}, {"_id": 0, "geometry": 0}).sort("completed_at", -1).to_list(500)
    out = []
    for d in docs:
        entries = await db.entries.find({"route_id": d["id"]}, {"_id": 0, "km": 1, "date": 1}).to_list(5000)
        dates = sorted(e["date"] for e in entries)
        out.append(
            RouteSummary(
                id=d["id"], start=d["start"], end=d["end"], distance_km=d["distance_km"],
                ridden_km=round(sum(e["km"] for e in entries), 2), entry_count=len(entries),
                first_date=dates[0] if dates else None, last_date=dates[-1] if dates else None,
                created_at=_utc(d["created_at"]), completed_at=_utc(d.get("completed_at")),
            )
        )
    return out


@router.post("/routes/{route_id}/entries", response_model=RouteState, status_code=201)
async def add_entry(route_id: str, body: EntryCreate):
    doc = await db.routes.find_one({"id": route_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Route nicht gefunden")
    route = _route(doc)
    if route.status != "active":
        raise HTTPException(409, "Diese Route ist bereits abgeschlossen")
    note = (body.note or "").strip() or None
    entry = Entry(route_id=route_id, date=body.date, km=round(body.km, 2), note=note)
    await db.entries.insert_one(entry.model_dump())
    state = await _state(route)
    if state.progress and state.progress.ridden_km >= route.distance_km:
        route.status = "completed"
        route.completed_at = datetime.now(timezone.utc)
        await db.routes.update_one({"id": route_id}, {"$set": {"status": "completed", "completed_at": route.completed_at}})
        state.route = route
    return state


@router.delete("/entries/{entry_id}", status_code=204)
async def delete_entry(entry_id: str):
    res = await db.entries.delete_one({"id": entry_id})
    if not res.deleted_count:
        raise HTTPException(404, "Eintrag nicht gefunden")


@router.get("/stats", response_model=Stats)
async def stats():
    entries = await db.entries.find({}, {"_id": 0, "km": 1, "date": 1}).to_list(20000)
    completed = await db.routes.count_documents({"status": "completed"})
    total = sum(e["km"] for e in entries)
    weekly: dict[str, float] = defaultdict(float)
    for e in entries:
        d = date.fromisoformat(e["date"])
        weekly[(d - timedelta(days=d.weekday())).isoformat()] += e["km"]
    # last 12 weeks, zero-filled, anchored on server "today"
    today = date.fromisoformat(today_iso())
    monday = today - timedelta(days=today.weekday())
    weeks = [(monday - timedelta(weeks=i)).isoformat() for i in range(11, -1, -1)]
    return Stats(
        total_km=round(total, 2),
        entry_count=len(entries),
        ride_days=len({e["date"] for e in entries}),
        completed_routes=completed,
        avg_km_per_ride=round(total / len(entries), 2) if entries else 0,
        longest_ride_km=max((e["km"] for e in entries), default=0),
        weekly=[WeekStat(week=w, km=round(weekly.get(w, 0), 2)) for w in weeks],
    )