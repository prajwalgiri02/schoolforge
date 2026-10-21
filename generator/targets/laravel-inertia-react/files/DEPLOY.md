# Deploying {{schoolName}}

This is a Laravel + Inertia + React site with an admin panel at `/admin`.
In production it needs PHP 8.3, a database (SQLite, MySQL or PostgreSQL), a
queue worker, the scheduler (nightly backups) and the Inertia SSR server so search
engines receive fully rendered pages.

Before deploying, set `APP_URL` (and optionally `seo.siteUrl` in the admin panel
under **Search & sharing**) to the live address.

## Option 1: Laravel Cloud (recommended)

1. Push this folder to a GitHub repository. SchoolForge Studio can do it for you:
   tick **Commit to git** on the Generate tab and enter the repository URL.
2. On https://cloud.laravel.com, create an application from the repository.
3. Add a database, then set the build command to
   `composer install --no-dev && npm ci && npm run build` and the deploy command to
   `php artisan migrate --force`.
4. Enable **Inertia SSR**, a **queue worker** and the **scheduler** for the environment.
5. Create the first admin login from the Cloud console:
   `php artisan school:admin office@school.edu`.

## Option 2: Laravel Forge or any VPS

On the server, after cloning the repository:

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
cp .env.example .env && php artisan key:generate   # then edit .env (APP_URL, DB_*, MAIL_*)
php artisan migrate --force
php artisan storage:link
php artisan school:admin office@school.edu
```

Keep these running (Forge: **Daemons**; otherwise Supervisor or systemd):

| Process | Command |
| --- | --- |
| SSR server | `php artisan inertia:start-ssr` |
| Queue worker | `php artisan queue:work --tries=3` |

And add the scheduler to cron: `* * * * * cd /path/to/site && php artisan schedule:run`.

## Option 3: Docker Compose

```bash
echo "APP_KEY=$(php artisan key:generate --show)" > .env.docker
echo "APP_URL=https://www.myschool.edu.np" >> .env.docker
docker compose --env-file .env.docker up -d --build
docker compose exec web php artisan school:admin office@school.edu
```

This starts the website (port 8080), the SSR server, the queue worker and the
scheduler, with the SQLite database and uploads in Docker volumes. Put a reverse
proxy with HTTPS in front of port 8080.

## Email, SMS and payments

Set `MAIL_*` in `.env` so the site can email the office, confirm applications and
send alerts. Optional settings:

| Variable | Purpose |
| --- | --- |
| `SCHOOL_CONTACT_RECIPIENT` | Office address that receives enquiries and applications |
| `SPARROW_SMS_TOKEN` | Sparrow SMS token, to send alerts by SMS from Admin → Alerts |
| `SPARROW_SMS_FROM` | Sparrow SMS sender identity (default `InfoAlert`) |
| `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY` | eSewa merchant code and secret key, to accept fees with eSewa |
| `KHALTI_SECRET_KEY` | Khalti live secret key, to accept fees with Khalti |
| `ESEWA_LIVE`, `KHALTI_LIVE` | Set to `true` when the keys are live (otherwise the test gateways are used) |

Alerts are sent by the queue worker, so keep it running.

## Backups

`php artisan school:backup` runs nightly and keeps 14 days of backups in
`storage/app/private/backups`. Copy them off the server regularly. Restore with
`php artisan school:backup --restore=path/to/backup.zip`.

## Updating

When SchoolForge gets new features, run `schoolforge upgrade` in this folder (or
generate again into this folder from Studio), then `composer install`,
`npm install`, `php artisan migrate` and `npm run build`, and redeploy.
