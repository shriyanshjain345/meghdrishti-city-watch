# MeghDrishti reliability and interaction upgrades

## What will change
- Turn the AQI camera screen into a working, clearly labeled **Optical Haze Estimation (Demo)**: sample a camera frame, calculate brightness, contrast, and saturation, then show a demo AQI band, visibility badge, and simulated confidence. Keep permission-denied handling honest.
- Bundle a sourced Open-Meteo ERA5 daily archive for Mumbai (2000–2025) and automatically use it if the live archive fails or exceeds a client timeout. Keep rainfall gaps as null and label fallback mode; preserve charts, summaries, and event hindcasts.
- Add a city-specific shelter finder to the flood map. Show candidate public facilities, mark the nearest reachable candidate, and draw a corridor around current red Deep Water polygons. Clearly disclose that facility status and road-level access are not verified.
- Reflow the nine top readings into two responsive overlapping rows (five then four), with labels and values remaining readable and hover lift retained.

## Technical details
- Keep image scoring and route geometry as deterministic, testable helpers; use canvas pixel statistics for the optical demo and a local visibility-path calculation for map corridors, without extra billable map APIs.
- Store the daily archive with source, coordinates, coverage, and retrieval date; map it into the existing `RainHistory` shape.
- Keep official Google Maps rendering, live weather, event sources, and the existing bright visual theme unchanged. Google Maps rendering cannot be live-tested in this sandbox.

## Validation
- Add focused tests for optical score bands, fallback coverage/monsoon completeness, and routes avoiding Deep Water polygons.
- Run the relevant tests and inspect the preview build diagnostics; do not claim Google Maps behavior was verified.