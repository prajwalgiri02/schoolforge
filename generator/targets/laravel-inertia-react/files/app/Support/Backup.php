<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use ZipArchive;

/**
 * Database-agnostic backups: every application table is exported as JSON lines
 * and zipped together with chosen folders and files, so a backup taken on SQLite
 * restores on MySQL or PostgreSQL and the other way round.
 */
class Backup
{
    /**
     * Framework tables that hold transient data and are never backed up.
     *
     * @var list<string>
     */
    public const SKIPPED_TABLES = ['migrations', 'cache', 'cache_locks', 'sessions', 'jobs', 'job_batches', 'failed_jobs', 'password_reset_tokens'];

    /**
     * @param  array<string, string>  $directories  Name inside the zip => absolute folder path.
     * @param  array<string, string>  $files  Name inside the zip => absolute file path.
     */
    public function __construct(
        private readonly array $directories = [],
        private readonly array $files = [],
    ) {}

    /**
     * Write a backup zip into `$destination` and return its path.
     */
    public function create(string $destination, string $prefix): string
    {
        File::ensureDirectoryExists($destination);
        $path = rtrim($destination, '/')."/{$prefix}-".now()->format('Ymd-His').'.zip';
        $zip = new ZipArchive;

        if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException("Could not create backup at [{$path}].");
        }

        $tables = [];

        foreach ($this->tables() as $table) {
            $lines = DB::table($table)->get()->map(fn (object $row): string => json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR))->implode("\n");
            $zip->addFromString("database/{$table}.jsonl", $lines);
            $tables[$table] = DB::table($table)->count();
        }

        foreach ($this->directories as $name => $directory) {
            foreach (File::isDirectory($directory) ? File::allFiles($directory, true) : [] as $file) {
                $zip->addFile($file->getPathname(), "{$name}/".str_replace('\\', '/', $file->getRelativePathname()));
            }
        }

        foreach ($this->files as $name => $file) {
            if (File::exists($file)) {
                $zip->addFile($file, $name);
            }
        }

        $zip->addFromString('backup.json', json_encode([
            'created_at' => now()->toIso8601String(),
            'app' => config('app.name'),
            'tables' => $tables,
        ], JSON_PRETTY_PRINT));
        $zip->close();

        return $path;
    }

    /**
     * Replace the current data with a backup. Returns rows restored per table.
     *
     * @return array<string, int>
     */
    public function restore(string $path): array
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            throw new RuntimeException("Could not open backup [{$path}].");
        }

        $restored = [];
        $current = $this->tables();

        Schema::disableForeignKeyConstraints();

        try {
            DB::transaction(function () use ($zip, $current, &$restored): void {
                for ($index = 0; $index < $zip->numFiles; $index++) {
                    $name = $zip->getNameIndex($index);

                    if (! preg_match('#^database/([A-Za-z0-9_]+)\.jsonl$#', $name, $match) || ! in_array($match[1], $current, true)) {
                        continue;
                    }

                    $columns = Schema::getColumnListing($match[1]);
                    $rows = collect(explode("\n", (string) $zip->getFromIndex($index)))
                        ->filter()
                        ->map(fn (string $line): array => array_intersect_key(json_decode($line, true, flags: JSON_THROW_ON_ERROR), array_flip($columns)));

                    DB::table($match[1])->delete();

                    foreach ($rows->chunk(200) as $chunk) {
                        DB::table($match[1])->insert($chunk->values()->all());
                    }

                    $restored[$match[1]] = $rows->count();
                }
            });
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $this->restoreFiles($zip);
        $zip->close();

        return $restored;
    }

    /**
     * Delete all but the newest `$keep` backups with this prefix.
     *
     * @return list<string> Deleted paths.
     */
    public static function prune(string $destination, string $prefix, int $keep): array
    {
        $backups = collect(File::glob(rtrim($destination, '/')."/{$prefix}-*.zip"))->sort()->values();
        $deleted = $backups->slice(0, max(0, $backups->count() - $keep))->values()->all();

        File::delete($deleted);

        return $deleted;
    }

    /**
     * @return list<string>
     */
    private function tables(): array
    {
        return collect(Schema::getTableListing(schemaQualified: false))
            ->reject(fn (string $table): bool => in_array($table, self::SKIPPED_TABLES, true))
            ->values()
            ->all();
    }

    private function restoreFiles(ZipArchive $zip): void
    {
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = (string) $zip->getNameIndex($index);

            if (str_contains($name, '..') || str_ends_with($name, '/')) {
                continue;
            }

            $target = null;

            foreach ($this->directories as $prefix => $directory) {
                if (str_starts_with($name, "{$prefix}/")) {
                    $target = rtrim($directory, '/').'/'.substr($name, strlen($prefix) + 1);
                }
            }

            $target ??= isset($this->files[$name]) ? $this->files[$name] : null;

            if ($target !== null) {
                File::ensureDirectoryExists(dirname($target));
                File::put($target, (string) $zip->getFromIndex($index));
            }
        }
    }
}
