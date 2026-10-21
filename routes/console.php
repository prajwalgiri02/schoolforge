<?php

use Illuminate\Support\Facades\Schedule;

/*
 * Nightly backup of schools, accounts, uploads and the registry (keeps 14 days).
 * `composer run dev` does not run the scheduler; use `php artisan schedule:work`
 * locally or a cron entry running `php artisan schedule:run` on a server.
 */
Schedule::command('studio:backup')->dailyAt('02:15')->withoutOverlapping();
