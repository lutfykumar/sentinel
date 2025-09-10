# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Laravel 12 backend with Inertia.js and a React 19 + TypeScript frontend.
- Tailwind CSS v4, shadcn/ui components, Vite for bundling and optional SSR entry.
- Pest/PHPUnit for backend tests, ESLint/Prettier/tsc for frontend quality.
- Queue workers used in dev; materialized views read and refreshed for analytics dashboards.

Common commands
Backend (Composer/Artisan)
- Install deps: composer install
- Generate app key: php artisan key:generate
- Run migrations: php artisan migrate
- Start app (Laravel + queue + Vite together): composer run dev
- Start app with SSR logging and SSR server: composer run dev:ssr
- Serve only: php artisan serve
- Queue worker (dev): php artisan queue:listen --tries=1
- Test (clears config cache first): composer test
- PHPUnit with coverage (if needed): php artisan test --coverage
- Optimize for prod (excerpt): php artisan config:cache && php artisan route:cache && php artisan view:cache

Frontend (npm)
- Install deps: npm install
- Dev server: npm run dev
- Build: npm run build
- Build (including SSR client+server bundles): npm run build:ssr
- Lint: npm run lint
- Format write/check: npm run format / npm run format:check
- Type-check: npm run types

Targeted workflows
- Create .env from example: Copy .env.example to .env, then php artisan key:generate.
- SQLite quick start: ensure database/database.sqlite exists (touch or create an empty file), then php artisan migrate.
- Run a single PHPUnit test: ./vendor/bin/phpunit --filter "TestNameOrRegex"
- Run a single Pest test: ./vendor/bin/pest --filter "TestNameOrRegex"
- Run a single frontend test (if present): use Jest via npx jest path/to/test --watch (repo includes jest-environment-jsdom but no direct npm test script; run via npx jest)

Architecture and structure
High-level flow
- HTTP requests hit routes in routes/web.php (and routes/auth.php, routes/settings.php). Auth middleware guards most app routes.
- Inertia bridges Laravel controllers to React pages. resources/js/app.tsx bootstraps the Inertia app, resolving pages from resources/js/pages/*.tsx and setting the page title and progress bar.
- Vite configuration (vite.config.ts) wires Laravel + React + Tailwind v4, and Wayfinder for form variants; defines manualChunks for heavy libs.

Backend modules
- Controllers (app/Http/Controllers)
  - DashboardController: serves analytics JSON from Postgres materialized views (bc20_jumlahdok, bc20_jumlahdok_bulan, customs.bc20_globe) and exposes refresh endpoints. It also formats monthly labels and maps ISO country codes to names for the globe view.
  - CustomsDataController: handles data browsing (index, detail, suggestions, options, exports). Routes are permission-gated under /data (see routes/web.php). Exports leverage maatwebsite/excel.
  - Auth and Settings sub-controllers support session auth and profile/password updates. TwoFactorController manages 2FA lifecycle using pragmarx/google2fa-laravel.
- Middleware (app/Http/Middleware)
  - HandleInertiaRequests, HandleAppearance: share Inertia props and appearance/theme state.
  - PermissionMiddleware, RoleMiddleware: enforce fine-grained access. Routes use middleware('permission:...') and middleware('role:...').
- Models (app/Models)
  - User, Role and domain models in app/Models/BC20/*.php for customs data domain (Header, Entitas, Dokumen, Kontainer, Pengangkut, Pungutan, etc.). These back the dashboard metrics and the data explorer.
- Console (app/Console/Commands)
  - RefreshMaterializedView, RefreshDashboardViews, TestCustomsData: artisan commands to refresh/verify data sources.

Frontend modules
- App bootstrap (resources/js/app.tsx): sets up Inertia, title template, and progress; initializes theme via initializeTheme() from hooks/use-appearance.
- UI composition (resources/js/components)
  - App shell: app-shell.tsx, app-header.tsx, app-sidebar.tsx (+ header/sidebar helpers) assemble the main layout and navigation.
  - Appearance controls: appearance-dropdown.tsx, appearance-tabs.tsx manage light/dark state.
  - Dashboard: components/dashboard/* render cards, charts (recharts), monthly series, and combined dashboards. Tests live beside components under __tests__.
  - Customs data explorer: components/customs/* provides filters, autocomplete, results table, export modal/buttons.
  - Reusable atoms: button/input wrappers, headings, breadcrumbs, icon, input-error, etc.

Routing and access control
- routes/web.php redirects / to login and gates the app under auth middleware.
- Data routes live under /data with middleware('permission:data.view') and additional middleware('permission:data.export') for exports.
- Admin-only pages for user/role management guarded by middleware('role:admin'). Inertia::render maps to pages/resources for React.

Data and analytics
- Dashboard reads from Postgres materialized views:
  - bc20_jumlahdok: per-route document counts (green=H, red=M) with total aggregation.
  - bc20_jumlahdok_bulan: monthly counts; controller formats labels (e.g., Jan 2025).
  - customs.bc20_globe: country_code/count pairs; controller maps to names and prepares top 10.
- Console commands and controller endpoints expose REFRESH MATERIALIZED VIEW for each (and combined refreshAllViews).

Testing
- Backend: phpunit.xml configures in-memory sqlite for tests. Use composer test or php artisan test. Pest is installed; you can also run ./vendor/bin/pest.
- Frontend: repo includes testing-library and jest-environment-jsdom for component tests colocated under resources/js/components/**/__tests__. Run via npx jest path --config if a config is added; otherwise use testing-library RTL patterns in the colocated tests.

Notes and repo-conventions
- Dev workflow is orchestrated via composer run dev using concurrently to run: php artisan serve, php artisan queue:listen, and Vite dev server.
- Wayfinder and Inertia SSR
  - vite.config.ts sets ssr: 'resources/js/ssr.tsx'. Use composer run dev:ssr to spin up SSR logs and php artisan inertia:start-ssr.
- Tailwind v4 is configured via @tailwindcss/vite and Prettier includes tailwind and organize-imports plugins.

References from README
- Quick start, environment, development commands, testing, and production optimize steps are mirrored here for convenience. Prefer README.md for fuller instructions.

