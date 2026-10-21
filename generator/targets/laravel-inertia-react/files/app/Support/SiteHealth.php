<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Checks the things a school website needs to keep working: database, storage,
 * site data, queue, scheduler, backups and email. Messages never include paths
 * or secrets, because /health is public so uptime monitors can read it.
 */
class SiteHealth
{
    public const HEARTBEAT_KEY = 'school:scheduler-heartbeat';

    /**
     * @return array{status: 'ok'|'warning'|'failing', checkedAt: string, checks: list<array{name: string, status: 'ok'|'warning'|'failing', message: string}>}
     */
    public static function run(): array
    {
        $checks = [
            self::check('database', function (): array {
                DB::select('select 1');

                return ['ok', 'Connected.'];
            }),
            self::check('storage', function (): array {
                $probe = '.health-'.Str::random(8);
                Storage::disk('public')->put($probe, 'ok');
                Storage::disk('public')->delete($probe);

                return ['ok', 'Uploads can be saved.'];
            }),
            self::check('site_data', function (): array {
                app(SchoolSite::class)->fileData();

                return ['ok', 'Generated site data is readable.'];
            }),
            self::check('queue', function (): array {
                if (config('queue.default') !== 'database' || ! Schema::hasTable('jobs')) {
                    return ['ok', 'Not using the database queue.'];
                }

                $stuck = DB::table('jobs')->where('available_at', '<', now()->subMinutes(10)->timestamp)->count();
                $failed = Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->where('failed_at', '>=', now()->subDay())->count() : 0;

                return match (true) {
                    $stuck > 0 => ['warning', "{$stuck} job(s) waiting over 10 minutes. Is the queue worker running?"],
                    $failed > 0 => ['warning', "{$failed} job(s) failed in the last day."],
                    default => ['ok', 'No waiting or failed jobs.'],
                };
            }),
            self::check('scheduler', function (): array {
                $beat = Cache::get(self::HEARTBEAT_KEY);

                return $beat !== null && $beat >= now()->subMinutes(5)->timestamp
                    ? ['ok', 'Ran in the last 5 minutes.']
                    : ['warning', 'Has not run recently, so nightly backups will not happen. Add the schedule:run cron entry.'];
            }),
            self::check('backups', function (): array {
                $newest = collect(File::glob(storage_path('app/private/backups/school-*.zip')))->map(fn (string $file): int => File::lastModified($file))->max();

                return match (true) {
                    $newest === null => ['warning', 'No backup yet.'],
                    $newest < now()->subDays(2)->timestamp => ['warning', 'The newest backup is more than two days old.'],
                    default => ['ok', 'Backed up in the last two days.'],
                };
            }),
            self::check('mail', function (): array {
                return in_array(config('mail.default'), ['log', 'array'], true)
                    ? ['warning', 'Email is not set up, so enquiries, applications and receipts are not emailed.']
                    : ['ok', 'Email is configured.'];
            }),
        ];

        $statuses = array_column($checks, 'status');

        return [
            'status' => in_array('failing', $statuses, true) ? 'failing' : (in_array('warning', $statuses, true) ? 'warning' : 'ok'),
            'checkedAt' => now()->toIso8601String(),
            'checks' => $checks,
        ];
    }

    /**
     * @param  callable(): array{0: 'ok'|'warning', 1: string}  $callback
     * @return array{name: string, status: 'ok'|'warning'|'failing', message: string}
     */
    private static function check(string $name, callable $callback): array
    {
        try {
            [$status, $message] = $callback();
        } catch (Throwable) {
            [$status, $message] = ['failing', 'Not working. See the application log for details.'];
        }

        return compact('name', 'status', 'message');
    }
}
