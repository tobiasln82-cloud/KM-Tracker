VeloTrack – Virtuelle Radtouren (SPEC)

Single-user app (no login). German UI.



What it does

Create ONE active bicycle route from a start to a destination (place search via Photon/Komoot geocoder, routing via OSRM bike profile at routing.openstreetmap.de). Presets: München→Venedig, Passau→Wien, Basel→Rotterdam, Lübeck→Stralsund.

Log virtually ridden km entries (date, km, optional note). Backend interpolates the current position along the route polyline.

Map (Leaflet + CARTO/OSM tiles) shows ridden part (solid green), remaining (dashed), rider marker; HUD shows nearby town (Photon reverse) + "Street View öffnen" link (Google Maps pano URL, new tab).

When ridden ≥ distance: route becomes completed, celebration modal, then the planner appears to choose the next route.

Archive dialog (completed routes), Stats dialog (totals + weekly bar chart, last 12 weeks), abort active route (deletes route + entries).

Data model (Mongo)

routes: {id, start{name,lat,lon}, end, distance\_km, geometry \[\[lat,lon]...], status active|completed, created\_at, completed\_at}

entries: {id, route\_id, date YYYY-MM-DD, km, note, created\_at}

API (all /api)

GET /geocode?q= ; GET /nearby?lat\&lon

GET /routes/active → RouteState {route, progress, entries, today}

POST /routes {start,end} → 201 RouteState (409 if active exists)

DELETE /routes/{id} → 204

GET /routes/archive

POST /routes/{id}/entries {date,km,note} → 201 RouteState (409 if completed)

DELETE /entries/{id} → 204

GET /stats

Seed

None – app starts with empty state (route planner).

