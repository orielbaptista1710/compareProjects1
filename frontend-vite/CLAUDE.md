# frontend-vite/CLAUDE.md

Rules for writing frontend code. Structure and test setup are in the root `CLAUDE.md`. Current open findings are in `../PRODUCTION_READINESS_AUDIT.md`.

## Performance

- Most users are on Indian mobile networks and mid-range phones, so ship less JS and fewer bytes.
- **Images:** property/Cloudinary images go through `getOptimizedImageUrl` in `src/utils/propertyHelpers.js`, with `loading="lazy"` below the fold. Don't statically import large images (>200 KB) into public pages; compress or resize them first.
- **Code splitting:** new route pages are `React.lazy` + `<Suspense>`, following `src/App.jsx`. Lazy-load heavy components that aren't needed on first paint (lightboxes, maps, charts). Don't add `manualChunks` (see root CLAUDE.md).
- **Data fetching:** use `@tanstack/react-query` **v5** for new server data instead of `useEffect` + `fetch`. That means v5 APIs only: `placeholderData: keepPreviousData` (not the v4 `keepPreviousData: true` option), `isPending`, and object-form `queryClient.invalidateQueries({ queryKey: [...] })`.

## Security

- Everything in `VITE_*` env vars ships to the browser. Never put secrets there (Firebase web config is public by design; server keys are not).
- Never render user or listing content with `dangerouslySetInnerHTML`.
- API calls go through the shared client in `src/api/api.js` so the base URL and credentials handling stay in one place. Don't hard-code backend URLs or use relative `/api/...` paths that only work through the dev proxy.

## Tests

- New components/hooks get a Vitest + RTL test next to them in `__tests__/`. `npm run lint && npm test && npm run build` must pass before committing.
