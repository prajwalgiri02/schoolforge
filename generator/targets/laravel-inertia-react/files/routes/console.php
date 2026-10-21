<?php

use App\Support\SiteHealth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

/*
 * Nightly backup of content, enquiries, accounts and uploads (keeps 14 days).
 * Needs the scheduler: `php artisan schedule:work` locally, or a cron entry
 * running `php artisan schedule:run` every minute in production.
 */
Schedule::command('school:backup')->dailyAt('02:30')->withoutOverlapping();

/*
 * Lets /health and `php artisan school:health` tell whether the scheduler runs.
 */
Schedule::call(fn () => Cache::forever(SiteHealth::HEARTBEAT_KEY, now()->timestamp))->everyMinute()->name('school:heartbeat');
