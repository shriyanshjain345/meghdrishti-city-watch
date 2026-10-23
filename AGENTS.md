<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Multi-year rainfall history comes from the Open-Meteo archive (ERA5) via a server function in `src/lib/history.functions.ts`, because Google Weather only keeps 24 hours of history; live weather stays on the Google Maps connector.
- Historical flood events live in `src/lib/flood-events.ts`; every figure must be quoted from a linked source and unreported fields stay null, so the UI can show missing data instead of guessing.
- Historical statistics and hindcast rules are pure functions in `src/lib/history-stats.ts` with tests in `src/test/history-stats.test.ts`, so thresholds stay verifiable.
- The Google Maps script loader and dark map style are shared from `src/lib/maps-loader.ts`, so every map loads the API once.
- City boundary rings are stored in `src/components/city-outlines.json` (OpenStreetMap), keyed by the same city names used in the dashboard and weather server function.
