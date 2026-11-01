import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Place(BaseModel):
    name: str = Field(min_length=1)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class RouteCreate(BaseModel):
    start: Place
    end: Place


class Route(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    start: Place
    end: Place
    distance_km: float
    geometry: list[list[float]]  # [[lat, lon], ...]
    status: Literal["active", "completed"] = "active"
    created_at: datetime = Field(default_factory=_now)
    completed_at: Optional[datetime] = None


class EntryCreate(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    km: float = Field(gt=0, le=2000)
    note: Optional[str] = Field(default=None, max_length=500)


class Entry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    route_id: str
    date: str
    km: float
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=_now)


class Progress(BaseModel):
    ridden_km: float
    remaining_km: float
    percent: float
    position: list[float]  # [lat, lon]
    segment_index: int  # geometry[0..segment_index] is ridden, then position
    heading: float


class RouteState(BaseModel):
    route: Optional[Route] = None
    progress: Optional[Progress] = None
    entries: list[Entry] = []
    today: str


class RouteSummary(BaseModel):
    id: str
    start: Place
    end: Place
    distance_km: float
    ridden_km: float
    entry_count: int
    first_date: Optional[str] = None
    last_date: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class WeekStat(BaseModel):
    week: str  # ISO week start date YYYY-MM-DD (Monday)
    km: float


class Stats(BaseModel):
    total_km: float
    entry_count: int
    ride_days: int
    completed_routes: int
    avg_km_per_ride: float
    longest_ride_km: float
    weekly: list[WeekStat]


class GeoResult(BaseModel):
    name: str
    detail: str
    lat: float
    lon: float


class NearbyPlace(BaseModel):
    name: Optional[str] = None
