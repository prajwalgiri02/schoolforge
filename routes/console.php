<?php

use Illuminate\Support\Facades\Schedule;

/*
 * Nightly backup of schools, accounts, uploads and the registry (keeps 14 days).
 * `composer run dev` does not run the scheduler; use `php artisan schedule:work`
 * locally or a cron entry running `php artisan schedule:run` on a server.
 */
Schedule::command('studio:backup')->dailyAt('02:15')->withoutOverlapping();

/*
 * Checks every live school website's health endpoint and emails owners when
 * one goes down or comes back.
 */
Schedule::command('studio:check-sites')->everyFiveMinutes()->withoutOverlapping();

/*
 * Issues hosting invoices before each school's paid period ends.
 */
Schedule::command('studio:invoices')->dailyAt('06:10')->withoutOverlapping();
