# SchoolForge Studio

A Laravel 13 + Inertia v3 + React app for building school websites. Create a school, fill in its content through the CMS, pick and tune a theme, arrange its pages, preview the real site live, then generate a ready-to-run **Next.js** or **Laravel + Inertia + React** codebase. Themes and components are managed in the same panel.

![Design tab with live preview](docs/screenshots/studio-design.jpg)

## Run it

Requirements: PHP 8.3+, Composer, Node.js 20.11+.

```bash
git clone https://github.com/prajwalgiri02/schoolforge && cd schoolforge
composer install
npm install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed          # demo login + the example school
php artisan storage:link            # serves uploaded images
composer run dev                    # web server, queue worker and Vite together
```

Open http://localhost:8000 and sign in as **admin@schoolforge.test** / **password** (from the seeder). Create your own login with `php artisan studio:user you@example.com`.

`composer run dev` starts a queue worker, which runs the code generation. If you start the pieces yourself, also run `php artisan queue:work`.

## What you can do

| Area | What it does |
| --- | --- |
| **Schools** | Create a school from sample content or blank, import an existing `school.config.json`, or download one. |
| **Content** | Edit everything the site says: profile, about, principal, contact, hero banner, announcements, programs, faculty, facilities, gallery, news, events, notices, testimonials, achievements, admissions and FAQs. Lists can be reordered, and images uploaded. |
| **Design** | Choose a theme, override brand colours and Google Fonts, and choose the layout of every section (e.g. hero: overlay, split or centered). |
| **Pages** | Use the automatic site map, or build your own: add pages, and add, remove, reorder and configure sections (components) on each. |
| **Live preview** | Every editor has a live preview of the real website beside it, rendered with the same React components the generated site uses. |
| **Generate** | Write a Next.js or Laravel codebase to any folder, optionally installing dependencies. Generating into the same folder again updates it and keeps any code you edited there by hand. |
| **Themes** | Create themes that extend existing ones; edit colours, fonts, corner radius, heading weight, section layouts and custom CSS. |
| **Components** | Create new section components and edit their layouts and React source code in the browser (local development only). |

Generated Laravel sites include their own admin panel at `/admin`, so a school's staff can keep the content up to date after launch.

## How it fits together

```
app/, resources/js/        Studio (Laravel + Inertia + React)
generator/                 The SchoolForge generator: Node CLI, zero dependencies
  registry/components/     Section components shared by Studio previews and generated sites
  registry/themes/         Themes (theme.json + optional extra.css + component overrides)
  registry/runtime/        Shared UI primitives, types and page renderer
  targets/                 Next.js template and Laravel overlay
```

* Studio stores each school's config in the `projects` table. The config uses the same JSON shape as `school.config.json`.
* Studio never duplicates generator logic. It calls the CLI (`App\Services\Generator`) for validation, previews (`schoolforge preview`), registry data (`schoolforge inspect`) and code generation.
* Previews import the registry components directly. A small Vite plugin (`vite.config.js`) points their framework adapter at `resources/js/preview/adapter.tsx`, and theme tokens are applied as CSS variables, so any theme or colour change shows without rebuilding.
* The content editor uses the same schema (`generator/targets/laravel-inertia-react/files/app/Support/ContentSchema.php`) and React field components as the admin panel inside generated Laravel sites.
* Generation runs as a queued job (`App\Jobs\GenerateSchoolProject`) that streams the CLI output into the run log. Images uploaded in Studio are copied into the generated project.

The generator also works on its own from the command line. See [generator/README.md](generator/README.md).

## Configuration

| `.env` key | Default | Purpose |
| --- | --- | --- |
| `SCHOOLFORGE_OUTPUT_PATH` | `storage/app/generated` | Default folder for generated projects |
| `SCHOOLFORGE_NODE_BINARY` | `node` | Node.js executable used to run the generator |
| `SCHOOLFORGE_TIMEOUT` | `1800` | Seconds a generation (including installs) may take |
| `SCHOOLFORGE_CODE_EDITING` | on when `APP_ENV=local` | Allow editing component source code in the browser |

Studio is meant to run on your own machine or a private server. It writes to folders you choose and, with code editing on, to the component registry, so do not expose it publicly.

## Backups

`php artisan studio:backup` writes a zip of every school, login, uploaded image and the
theme/component registry to `storage/app/private/backups`, and runs nightly when the
scheduler is running (`php artisan schedule:work`, or a cron entry for
`php artisan schedule:run`). Restore with `php artisan studio:backup --restore=path/to/backup.zip`.

Generated Laravel sites have the same feature as `php artisan school:backup`.

## Deploying generated sites

On the Generate tab, tick **Commit to git** and enter a repository URL. Studio then commits
the codebase and pushes it, ready for Vercel or Netlify (Next.js) or Laravel Cloud or Forge
(Laravel). Each project also has a `DEPLOY.md` with step-by-step guides and a Docker setup.

Existing generated projects can be brought up to date with `schoolforge upgrade`, or by
generating again into the same folder. Files edited by hand are kept.

## Tests

```bash
php artisan test            # Studio (PHPUnit)
npm run test:generator      # generator (node:test)
npm run typecheck           # TypeScript for Studio and the registry
```
