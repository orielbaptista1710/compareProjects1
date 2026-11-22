# frontend-vite/CLAUDE.md

Rules for writing frontend code. Structure and test setup are in the root `CLAUDE.md`. Current open findings are in `../PRODUCTION_READINESS_AUDIT.md`.

## Performance

- Most users are on Indian mobile networks and mid-range phones, so ship less JS and fewer bytes.
- **Images:** property/Cloudinary images go through `getOptimizedImageUrl` in `src/utils/propertyHelpers.js`, with `loading="lazy"` below the fold. Don't statically import large images (>200 KB) into public pages; compress or resize them first.
- **Code splitting:** new route pages are `React.lazy` + `<Suspense>`, following `src/App.jsx`. Lazy-load heavy components that aren't needed on first paint (lightboxes, maps, charts). Don't add `manualChunks` (see root CLAUDE.md).
- **Data fetching:** use `@tanstack/react-query` **v5** for new server data instead of `useEffect` + `fetch`. That means v5 APIs only: `placeholderData: keepPreviousData` (not the v4 `keepPreviousData: true` option), `isPending`, and object-form `queryClient.invalidateQueries({ queryKey: [...] })`.

## Design tokens

`src/styles/tokens.css` is the single source for colour, font, size, weight, spacing, radius, shadow and motion values, including brand blue `--color-primary`. Read it for the available token names instead of guessing.

- **No raw values in CSS or JSX.** Use `var(--…)` instead of hex/rgba colours, px font sizes, px padding/margin/gap, numeric weights, font-family names or `ms`/`ease` timings. `1px` borders, `2px` focus rings and fixed element sizes (icon box, avatar) may stay in px.
- **Three colours only:** brand blue (`--color-primary`), ink (`--color-ink`), white (`--color-surface`). Greys, lines, fills and overlays use the existing tints, not new hex. Red (`--color-error-*`) is only for errors/destructive actions; amber (`--color-highlight`) only for the Featured tag and ★ rating; green (`--color-success*`) only for success/RERA verified.
- **Missing a value?** Add it to `tokens.css`. Never declare one-off variables in a component's CSS or inline `style={{}}`.
- **Fonts:** `--font-heading` (Poppins) for headings, prices, buttons; `--font-body` (Inter) for everything else. Sizes `--text-*`, weights `--weight-*`, spacing `--space-1…7`, corners `--radius-sm|md|full`, controls `--control-height`.
- When you edit an older CSS file, convert the values you touch to tokens. Don't read from legacy `:root` blocks in component CSS (e.g. `NavigationBar.css`); they're being retired.
- **Stylelint** (`.stylelintrc.json`) is a warning everywhere and an error in migrated files (the `overrides` list). `npm run lint` shows errors only (what CI fails on); `npm run lint:css` shows all warnings. When you finish converting a file/folder, add it to `overrides`.

## Security

- Everything in `VITE_*` env vars ships to the browser. Never put secrets there (Firebase web config is public by design; server keys are not).
- Never render user or listing content with `dangerouslySetInnerHTML`.
- API calls go through the shared client in `src/api/api.js` so the base URL and credentials handling stay in one place. Don't hard-code backend URLs or use relative `/api/...` paths that only work through the dev proxy.

## Tests

- New components/hooks get a Vitest + RTL test next to them in `__tests__/`. `npm run lint && npm test && npm run build` must pass before committing.
