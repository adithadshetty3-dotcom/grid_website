# Integrating Timeline with the GRID website

## Agreed deployment boundary

The completed GRID website remains its static HTML/CSS/JS project. Timeline is a separate Vercel project rooted at `timeline/`, with its own React frontend and Express API. No parent-site router, shared stylesheet, reverse proxy, Vercel Services, or monorepo conversion is required for this architecture.

The main site's Timeline navigation will point to the separately deployed Timeline URL after Preview acceptance and team lead review. Once that URL is known, provide it to the main-site team; this package does not edit their pages. Timeline keeps its own GRID navigation so visitors can return to the parent pages.

## Standalone navigation and URLs

The standalone navigation is visible by default. It links to Home `/index.html`, About Us `/aboutus.html`, Core Team `/team.html`, FAQ `/FAQ/FAQ.html`, and Contact `/ContactUs.html` on the origin configured by `VITE_TIMELINE_PARENT_URL`. Timeline itself links to the current app at `VITE_TIMELINE_BASE` (standalone `/`).

For local integrated previews only, leave `VITE_TIMELINE_PARENT_URL` empty when parent pages and Timeline share the preview origin; root-relative paths then resolve there. When the parent uses a separate origin, set the variable to that origin. In the independent Vercel project, configure the actual main GRID origin supplied by the team lead. It is a build-time public URL, not a credential; never guess or hardcode it. Production builds fail if it is absent.

## Standalone Vercel application behavior

- Keep `VITE_TIMELINE_BASE=/` (the Vite default) and `VITE_TIMELINE_API_BASE` empty.
- Keep `VITE_TIMELINE_SHOW_STANDALONE_NAV=true` (the default).
- API requests and managed image references use same-origin `/api/...`; no CORS or cross-site cookies are involved.
- Production admin/session cookies are HttpOnly, Secure, SameSite=Lax, and scoped to `/api`. CSRF checks remain enabled for state-changing requests.
- Vercel serves generated files in `public/**` through its CDN. The Express function handles API routes; it does not use `express.static()` or a frontend catch-all on Vercel.
- Direct loads and refreshes at `/` return `public/index.html`. The UI has no client-side URL routes requiring a rewrite.

## Legacy local integration-preview configuration

The previous nested preview can still be recreated locally; it is not the production configuration:

```sh
VITE_TIMELINE_SHOW_STANDALONE_NAV=false \
VITE_TIMELINE_BASE=/timeline/ \
VITE_TIMELINE_API_BASE=/timeline-api \
TIMELINE_COOKIE_PATH=/timeline-api/api \
npm run build
```

That preview requires its own local gateway to map frontend paths and strip `/timeline-api` before sending requests to Express. The local parent preview also redirects its legacy `/timeline.html` URL to the canonical Timeline route. Do not copy these nested path or proxy settings into the standalone Vercel project.

## Parent-site isolation

Timeline owns its HTML entry, React root, and namespaced/scoped CSS. It does not import the parent `style.css`, navigation JavaScript, or page markup. Timeline's CSS stays under `.timeline-shell` (including the body-level photo viewer portal selectors) so it cannot alter Home, About Us, Core Team, FAQ, or Contact. The parent site and its shared styles remain untouched by this package.

For project settings, environment variables, infrastructure prerequisites, and Preview acceptance, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).
