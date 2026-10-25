# SchoolForge: guide for agents

Read this before changing anything. It explains what the project is, how the parts fit,
how to run and test it, and the rules this repository follows.

## What it is

SchoolForge builds and runs **school websites**: a school's profile and its content
(about, principal's message, programs, faculty, facilities, gallery, news, events,
notices, admissions, downloads, careers, alumni, FAQs, contact). It is a website
builder and content manager for schools, run by one operator (the repository owner)
who hosts many schools.

It is deliberately **not** school-management software. Fee collection, exam results,
SMS, attendance, student records and links to a school-management system are out of
scope and were removed on purpose. Do not add them back, and do not add an AI writing
assistant (also declined).

There are two parts in one repository:

| Part | Where | What it is |
| --- | --- | --- |
| **Studio** | repository root (`app/`, `resources/js/`, `routes/`, …) | Laravel 13 + Inertia v3 + React 19 + Tailwind v4 app. The operator (and schools themselves) create schools, edit content, design and pages with a live preview, publish, and bill. |
| **Generator** | `generator/` | Node ESM CLI with zero runtime dependencies. Turns a school config into a website: a Next.js app or a Laravel + Inertia + React app. Holds the shared registry of section components and themes. |

A school's website reaches visitors in one of three ways:

1. **Hosted by Studio** (the main way). Publishing renders every page to HTML and stores it.
   Studio serves the school on `<slug>.<SCHOOLFORGE_HOSTING_DOMAIN>` and on its own
   domain, with forms, a sitemap and visitor counts.
2. **Headless Next.js.** A generated Next.js site reads its content from Studio's API, and
   Studio tells it to refresh after each publish.
3. **Generated codebase.** Studio (or the CLI) writes a standalone Next.js or Laravel
   project. A Laravel site has its own `/admin` panel for the school's staff.

## Repository map

```
app/                        Studio backend
  Enums/StudioRole.php      owner | editor | viewer | school (school = staff of one school)
  Http/Controllers/         one controller per Studio area (Project*, Billing, Signup, HostedSite, …)
  Http/Middleware/          ServeHostedSites (serves schools by Host), RestrictSchoolStaff (allowlist)
  Jobs/GenerateSchoolProject.php   queued code generation, streams CLI output to the run log
  Models/                   Project (config JSON + hosting/billing/sign-up fields), User, Plan, Invoice,
                            ProjectVersion (history), PublishedPage, SiteSubmission, SiteCheck, AuditEvent, GenerationRun
  Services/Generator.php    calls the generator CLI (inspect, preview, create); never re-implement its logic in PHP
  Support/                  HostedSites, PagePrerenderer, Billing, StarterContent, ProjectChecks, DomainCheck,
                            HeadlessContent, SiteAnalytics, SiteMonitor, Audit, ProjectPresenter
resources/js/
  pages/                    Inertia pages (Projects/*, Auth/*, Billing, Users, Themes, Components, Media, Status, Activity, Account)
  studio/                   StudioLayout, ProjectLayout (tabs, banners), shared types
  preview/adapter.tsx       the registry "adapter" used by Studio previews and hosted sites
  app.tsx, ssr.tsx          client entry (hydrates prerendered pages) and the SSR renderer used at publish
generator/
  bin/schoolforge.js        CLI entry (`node generator/bin/schoolforge.js --help`)
  src/commands, src/lib     create, sync/upgrade/add/remove/use-theme, inspect/preview, config validation, buildSite
  registry/components/      section components (React + component.json) shared by previews AND generated sites
  registry/themes/          classic, elegant, modern, playful (theme.json, extra.css, overrides)
  registry/runtime/         shared UI, i18n strings (en + ne), page renderer, types
  registry/presets/default-site.json   the automatic site map (pages and their sections)
  registry/adapter.d.ts     the adapter contract every target must implement
  targets/nextjs/           Next.js template + adapter
  targets/laravel-inertia-react/  Laravel overlay (admin panel, models, migrations, tests) + adapter
  examples/school.config.json     the example school "Riverside Heights School" (used for samples and tests)
  schema/school.schema.json       JSON schema of the school config
tests/Feature/              Studio PHPUnit tests (one file per area)
compose.yaml, Dockerfile, Caddyfile   one-command production deployment of Studio
.github/workflows/ci.yml    CI (see Tests and CI)
```

## Core ideas

- **School config.** Everything about a school is one JSON document, the same shape as
  `school.config.json`. Studio stores it in `projects.config`. Validation and site building
  live in `generator/src/lib/config.js` (`validateConfig`, `buildSite`). Content keys are
  `CONTENT_KEYS` there.
- **Registry components are shared.** The same React components render Studio's live
  preview, hosted pages and generated sites. Each component calls its framework through
  `../../adapter` (contact form, subscribe, applications…). There are three adapters, all
  matching `registry/adapter.d.ts`: Next.js, Laravel and Studio preview. Change all three
  together.
- **Content editor schema is shared.** `generator/targets/laravel-inertia-react/files/app/Support/ContentSchema.php`
  (and FormSchema, SchoolCalendar, MediaUpload, MediaLibrary, Backup, TranslationMerger, Totp, ImageOptimizer, `Enums/StaffRole`)
  is classmap-autoloaded into Studio (`composer.json`). Editing it changes both Studio and
  generated Laravel admin panels. The React field components live in
  `targets/laravel-inertia-react/files/resources/js/admin` and are imported by Studio via the `@admin` alias.
- **Default site map vs custom pages.** Without `config.pages`, the preset site map is used,
  and pages with no content are hidden. Saving the Pages tab writes a custom site map.
- **Reserved page addresses.** Custom pages cannot start with `admin`, `api`, `build`, `storage`,
  `up`, `health`, `forms`, `unsubscribe` or a non-default language code; the sites use them.
  The list is `RESERVED_PAGE_SEGMENTS` in `generator/src/lib/config.js` and
  `UpdateProjectPagesRequest::RESERVED_SEGMENTS`; change both together.
- **Retired components.** `RETIRED_COMPONENTS` in `generator/src/lib/config.js`
  (`fee-payment`, `result-lookup`) are skipped silently in old configs and dropped from old
  projects on `sync`. A Studio migration removed them from saved site maps. If you retire
  another component, follow the same pattern.
- **Languages.** Sites can be bilingual (English + Nepali). UI strings are in
  `registry/runtime/i18n.ts`, and content translations are under `config.translations.<locale>`.

## Studio features (where to look)

| Area | What it does | Code |
| --- | --- | --- |
| Schools | Create from sample, template or blank; import/export config; templates (`is_template`) | `ProjectController`, `StarterContent` |
| Content | Edit every section, reorder lists, upload images, media library, two languages | `ProjectContentController`, `ContentSchema` |
| Design / Pages | Theme, colours, fonts, section variants; custom site map | `ProjectDesignController`, `ProjectPagesController` |
| History | Every save is a version; restore, duplicate, save as template | `ProjectHistoryController`, `ProjectVersion` |
| Generate | Write a Next.js/Laravel codebase to a folder (optional git push) | `ProjectGenerateController`, `GenerateSchoolProject` |
| Admin panel preview | The generated Laravel site's `/admin` panel at `/preview/{slug}/admin`, filled from the school's config; nothing is saved. Admin pages build links with `useAdminUrl()` (`admin/urls.ts`), never a hard-coded `/admin` | `PreviewAdminController`, `resources/js/preview/AdminPreviewFrame.tsx` |
| Publish | Prerender and host; domain; DNS/HTTPS check; enquiries; visitor counts; headless API | `ProjectPublishController`, `HostedSites`, `PagePrerenderer`, `DomainCheck`, `SiteAnalytics`, `HeadlessContent` |
| Hosting | Serve published schools by Host; forms post to `/_school/...`; robots/sitemap/events.ics | `ServeHostedSites`, `HostedSiteController` |
| Self sign-up | `/signup` (when `SCHOOLFORGE_SIGNUP=true`) creates a school from a template + a school login; 4-step setup at `/projects/{slug}/welcome` | `SignupController`, `ProjectOnboardingController` |
| Trial and packages | Sign-ups get a 7-day trial (edit + preview only). Publish requires a paid monthly/yearly plan chosen on the Package tab. After the trial, unpaid schools only reach Package and Account | `ProjectPackageController`, `Billing::needsPackage/trialEnded`, `RestrictSchoolStaff` |
| Billing | Plans, per-school plan and paid-until, invoices (emailed), mark paid (manual), suspension after grace days | `BillingController`, `Billing`, `studio:invoices` |
| Users | Roles, school-staff logins tied to one school, 2FA, account page | `UserController`, `AccountController`, `Auth/SessionController` |
| Activity / Status | Audit log of important actions; uptime checks of live sites | `ActivityController`, `Audit`, `SiteStatusController`, `SiteMonitor` |
| Themes / Components | Create themes that extend others; scaffold components; edit code in browser (local only) | `ThemeController`, `ComponentController` |

**Roles.** `owner` can do everything (`manage-studio` gate). `editor` edits schools
(`edit-projects`). `viewer` is read-only. `school` is staff of one school (`users.project_id`).
School staff are limited by the allowlist in `RestrictSchoolStaff::ALLOWED_ROUTES`. They
get content, design, pages, publish, history, package, domain and account. Add new routes
there if school staff need them.

**Payments are manual.** A school chooses a plan, an invoice is issued and emailed with
`SCHOOLFORGE_PAYMENT_INSTRUCTIONS`, the school pays the operator directly, and the operator
clicks **Mark paid** on the Billing page. That sets `paid_until` and unlocks publishing.
There is no online payment gateway in Studio.

## Running it

Requirements: PHP 8.3+, Composer, Node.js 20.11+ (22 used in CI).

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed      # admin@schoolforge.test / password + the example school
php artisan storage:link
npm run build                   # Studio assets AND bootstrap/ssr/ssr.js (needed to publish)
composer run dev                # server, queue worker (runs generation) and Vite
```

Production: `docker compose up -d` (web, queue, scheduler, Caddy with on-demand HTTPS).
See README "Running Studio on a server" and "Hosting schools".

Artisan commands: `studio:user <email> [--role=owner|editor|viewer|school --school=slug]`,
`studio:backup`, `studio:check-sites`, `studio:invoices`. Scheduled (needs `schedule:work` or
cron): backup 02:15, site checks every 5 min, invoices 06:10, daily pruning of the audit
log and analytics.

Generator CLI (from `generator/`): `node bin/schoolforge.js create <dir> -c examples/school.config.json --target nextjs|laravel-inertia-react --theme classic`;
inside a generated project: `sync`, `upgrade`, `add`, `remove`, `use-theme`. Generated
Laravel sites have `school:admin`, `school:backup`, `school:health`, `school:export-content`.

### Environment variables (Studio)

| Variable | Default | Purpose |
| --- | --- | --- |
| `SCHOOLFORGE_GENERATOR_PATH` | `generator/` | Generator location |
| `SCHOOLFORGE_NODE_BINARY` | `node` | Node used for the CLI and the SSR renderer |
| `SCHOOLFORGE_SSR_BUNDLE` | `bootstrap/ssr/ssr.js` | Renderer used to prerender pages at publish |
| `SCHOOLFORGE_OUTPUT_PATH` | `storage/app/generated` | Default folder for generated projects |
| `SCHOOLFORGE_TIMEOUT` | `1800` | Max seconds per generation |
| `SCHOOLFORGE_CODE_EDITING` | on when local | Edit component code in the browser (keep off in production) |
| `SCHOOLFORGE_HOSTING_DOMAIN` / `_SCHEME` | none / `https` | Schools served at `<slug>.<domain>` |
| `SCHOOLFORGE_SERVER_IPS` | resolved from `APP_URL` | For DNS checks of school domains |
| `SCHOOLFORGE_SIGNUP` | `false` | Enable `/signup` |
| `SCHOOLFORGE_SIGNUP_TEMPLATE` | newest template | Slug of the template new schools start from |
| `SCHOOLFORGE_SIGNUP_TRIAL_DAYS` | `7` | Free trial length |
| `SCHOOLFORGE_PAYMENT_INSTRUCTIONS` | none | Bank/eSewa details shown on invoices and the Package tab |
| `SCHOOLFORGE_INVOICE_DAYS_BEFORE` / `_GRACE_DAYS` | `14` / `14` | Invoice timing; days late before a hosted site is suspended |
| `SCHOOLFORGE_BILLING_FROM` | `APP_NAME` | Name on invoices |
| `SCHOOLFORGE_BACKUP_DISK` | none | Disk that nightly backups are copied to (e.g. `offsite`, root `OFFSITE_BACKUP_PATH`). Filesystem only; S3 is not installed |
| `TRUSTED_PROXIES` | none | Trust Caddy's forwarded headers |

## Tests and CI

| Suite | Command | Notes |
| --- | --- | --- |
| Studio | `php artisan test --compact` (or `--filter=…`, or a file) | PHPUnit 12, SQLite in memory |
| Studio types | `npx tsc --noEmit` | no `@types/node`; declare what you need locally |
| Generator | `cd generator && npm test` | node:test |
| Generated Laravel site | generate one, then `php artisan test` inside it | CI job `generated-laravel` |
| Generated Next.js site | generate, `npm install`, `npm run build` | CI job `generated-nextjs` (every theme) |

CI jobs (`.github/workflows/ci.yml`): Studio, Studio Docker stack, Generator CLI,
Generated site (Next.js), Generated site (Laravel + Inertia, including SSR smoke test),
Docker images of generated sites. All must be green before merging.

## Rules for agents working here

- **Workflow.** Work on a branch, push it, wait for CI to pass, then fast-forward `main`
  yourself (the owner asked for this):
  `git fetch origin main && git merge-base --is-ancestor origin/main <sha> && git push origin <sha>:main`.
  Do not open pull requests unless asked.
- **Do not touch** the separate repository `khuha_tenant`.
- **No new dependencies** (Composer or npm) without the owner's approval.
- **Every change is tested.** Add or update a PHPUnit feature test (`php artisan make:test --phpunit`),
  a generator test, or both, and run them. For UI changes, also check the page in a
  browser (Playwright is available) at desktop and phone widths.
- **Laravel conventions.** Use `php artisan make:*` to create files. Follow sibling files.
  Use explicit return types and PHPDoc array shapes. Run `vendor/bin/pint --dirty --format agent`
  after PHP changes. Never run Prettier.
- **Do not leave data behind.** Don't leave test data in the development database (use
  factories in tests; if you add temporary data for a manual check, delete it).
- **Documentation.** Only create docs when asked. Keeping README.md, DEPLOY.md and this file
  accurate is expected.
- **Keep the scope.** Profile and content management only. Payments to the operator are
  manual invoices.
- **Write for school staff.** UI text should be plain, short and in British spelling
  ("colour"), matching existing pages.

## Gotchas

- Inertia SSR for Studio's own pages is **off** (`config/inertia.php`). The SSR bundle is
  only used to prerender hosted school pages at publish (`PagePrerenderer`). Run
  `npm run build` after changing registry components, or published pages use old HTML.
- Studio tests that do partial Inertia reloads need the `X-Inertia-Version` header.
- `HostedSites::forHost` is cached (`studio:hosted-sites`); it is cleared when slug, domain
  or publish state changes.
- Starter content for sign-ups renames the starter school's name throughout the text and
  drops its logo, contact and social links (`StarterContent`, `SignupController`).
- `Project::RESERVED_SLUGS` (www, studio, admin, api, app, mail) never become subdomains.
- Generated-site migrations must stay safe for sites created earlier (guard with
  `Schema::hasTable/hasColumn`); never drop tables that hold a school's records.
- Start Node and git child processes with `->env(ProcessEnvironment::variables())`. On Windows
  under `php artisan serve` they otherwise lose `SystemRoot`, and Node crashes with
  `Assertion failed: ncrypto::CSPRNG`.
- In sandboxed environments external images (Unsplash, YouTube thumbnails) fail to load.
  That is the network, not a bug.
