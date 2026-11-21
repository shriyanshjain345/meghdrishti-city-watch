# MeghDrishti dashboard polish and reliability

## What will change
- Remove the AQI camera button and modal. Add a compact, token-styled visual guide for Haze, Smoke, and Dust with the requested note that visual cues cannot provide an exact AQI.
- Reflow the nine metrics into a readable desktop 5/4 grid with clear labels, consistent gaps, responsive columns, and a restrained hover lift.
- Improve vertical rhythm and soft-shadow continuity across metrics, the haze guide, map, and forecast without nesting cards.
- Bundle a sourced Open-Meteo ERA5 daily archive for Mumbai (2000–2025) and automatically use it if the live archive fails or exceeds a client timeout. Keep rainfall gaps as null and label fallback mode; preserve charts, summaries, and event hindcasts.
- Add a city-specific shelter finder to the flood map. Show candidate public facilities, mark the nearest reachable candidate, and draw a corridor around current red Deep Water polygons. Clearly disclose that facility status and road-level access are not verified.

## Technical details
- Keep route geometry as a deterministic, testable helper and use a local visibility-path calculation for map corridors, without extra billable map APIs.
- Store the daily archive with source, coordinates, coverage, and retrieval date; map it into the existing `RainHistory` shape.
- Keep official Google Maps rendering, live weather, event sources, and the existing bright visual theme unchanged. Google Maps rendering cannot be live-tested in this sandbox.

## Validation
- Add focused tests for fallback coverage/monsoon completeness and routes avoiding Deep Water polygons.
- Run the relevant tests and inspect the preview build diagnostics; do not claim Google Maps behavior was verified.