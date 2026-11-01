"""Geometry helpers: distances and interpolating a position along a polyline."""

import math

R_KM = 6371.0088


def haversine_km(a: list[float], b: list[float]) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * R_KM * math.asin(math.sqrt(h))


def bearing(a: list[float], b: list[float]) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    y = math.sin(lon2 - lon1) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(lon2 - lon1)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def polyline_length_km(coords: list[list[float]]) -> float:
    return sum(haversine_km(coords[i], coords[i + 1]) for i in range(len(coords) - 1))


def point_along(coords: list[list[float]], km: float) -> tuple[list[float], int, float]:
    """Return (position, segment_index, heading) after travelling `km` along coords."""
    if len(coords) < 2:
        return coords[0], 0, 0.0
    travelled = 0.0
    for i in range(len(coords) - 1):
        a, b = coords[i], coords[i + 1]
        seg = haversine_km(a, b)
        if seg > 0 and travelled + seg >= km:
            t = max(0.0, (km - travelled) / seg)
            pos = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
            return pos, i, bearing(a, b)
        travelled += seg
    return coords[-1], len(coords) - 2, bearing(coords[-2], coords[-1])