# MeghDrishti installable web app

## What will change
- Add the requested `public/manifest.json` and 192×192 / 512×512 icons derived from the existing favicon.
- Add manifest, mobile web-app, and theme metadata to the app shell.
- Add generated offline support for the app shell and public copy of the rainfall fallback; leave live weather, Maps, and other dynamic requests uncached.
- Add a small header Install App control that uses the browser install prompt and disappears after installation.

## Technical details
- This TanStack Start project has no `index.html` or `main.tsx`, so use `src/routes/__root.tsx` for metadata and one app-shell registration wrapper.
- Use `vite-plugin-pwa` with `generateSW`; never register in development, iframe, or Lovable preview. Keep production navigation network-first, exclude `~oauth`, and support `?sw=off` cleanup.

## Validation
- Run the PWA-related checks and existing focused tests; inspect the production worker output and app build diagnostics.
- Keep Google Maps and live weather behavior unchanged; verify dynamic requests are not in the worker’s cache rules.