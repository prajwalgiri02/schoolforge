<?php

use Illuminate\Support\Facades\Schedule;

/*
 * Nightly backup of content, enquiries, accounts and uploads (keeps 14 days).
 * Needs the scheduler: `php artisan schedule:work` locally, or a cron entry
 * running `php artisan schedule:run` every minute in production.
 */
Schedule::command('school:backup')->dailyAt('02:30')->withoutOverlapping();
