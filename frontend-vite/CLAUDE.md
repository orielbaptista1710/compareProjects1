# frontend-vite/CLAUDE.md

Rules for writing frontend code. Structure and test setup are in the root `CLAUDE.md`. Current open findings are in `../PRODUCTION_READINESS_AUDIT.md`.

## Performance

- Most users are on Indian mobile networks and mid-range phones, so ship less JS and fewer bytes.
- **Images:** property/Cloudinary images go through `getOptimizedImageUrl` in `src/utils/propertyHelpers.js`, with `loading="lazy"` below the fold. Don't statically import large images (>200 KB) into public pages; compress or resize them first.
- **Code splitting:** new route pages are `React.lazy` + `<Suspense>`, following `src/App.jsx`. Lazy-load heavy components that aren't needed on first paint (lightboxes, maps, charts). Don't add `manualChunks` (see root CLAUDE.md).
- **Data fetching:** use `@tanstack/react-query` **v5** for new server data instead of `useEffect` + `fetch`. That means v5 APIs only: `placeholderData: keepPreviousData` (not the v4 `keepPreviousData: true` option), `isPending`, and object-form `queryClient.invalidateQueries({ queryKey: [...] })`.

## Design tokens

`src/styles/tokens.css` is the single source for every colour, font, font size, weight, spacing value, radius, shadow and motion value on the site (brand purple `--color-primary` still lives in `src/styles/colors.css`). Every page should look consistent because it all comes from one place.

- **No raw values in CSS or JSX.** Use `var(--…)` instead of hex/rgba colours, px font sizes, px padding/margin/gap, numeric font weights, font-family names, or `ms`/`ease` timings. Borders (`1px`), focus rings (`2px`) and fixed element sizes (an icon box, an avatar) may stay in px.
- **Three colours only:** brand purple (`--color-primary`), ink (`--color-ink`) and white (`--color-surface`). Greys, lines, fills and overlays are the existing tints (`--color-ink-muted`, `--color-line`, `--color-on-dark-*`, `--color-ink-fill`, `--color-overlay`…), not new hex values. Red (`--color-error-*`) is only for errors and destructive actions; amber (`--color-highlight`) only for the Featured tag and ★ rating; green (`--color-success*`) only for success/RERA verified.
- **Need a value that isn't there?** Add it to `tokens.css` (as a tint of the three colours, or a step on the existing scale) — never declare one-off variables in a component's CSS or inline `style={{}}`.
- **Fonts:** `--font-heading` (Poppins) for headings, prices and buttons; `--font-body` (Inter) for body, labels, forms and tables. Sizes come from `--text-*`, weights from `--weight-*`.
- **Spacing:** `--space-1`…`--space-7` (4px base). Controls are `--control-height`; corners are `--radius-sm` (inputs/buttons), `--radius-md` (cards), `--radius-full` (pills).
- When you edit an older CSS file, convert the values you touch to tokens. Legacy `:root` blocks in component CSS (e.g. `NavigationBar.css`) are being retired — don't read from them in new code.
- **Enforced by Stylelint** (`.stylelintrc.json`): no hex, no `rgb()/rgba()/hsl()`, no px `font-size`. It's a *warning* everywhere and an *error* in fully migrated files (the `overrides` list). `npm run lint` shows errors only (what CI fails on); `npm run lint:css` shows the full warning list. When you finish converting a file/folder to tokens, add it to the `overrides` list so it can't regress.

## Security

- Everything in `VITE_*` env vars ships to the browser. Never put secrets there (Firebase web config is public by design; server keys are not).
- Never render user or listing content with `dangerouslySetInnerHTML`.
- API calls go through the shared client in `src/api/api.js` so the base URL and credentials handling stay in one place. Don't hard-code backend URLs or use relative `/api/...` paths that only work through the dev proxy.

## Tests

- New components/hooks get a Vitest + RTL test next to them in `__tests__/`. `npm run lint && npm test && npm run build` must pass before committing.
