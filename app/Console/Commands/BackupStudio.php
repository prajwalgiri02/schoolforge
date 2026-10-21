<?php

namespace App\Console\Commands;

use App\Support\Backup;
use App\Support\ProjectAssets;
use Illuminate\Console\Command;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;
use Throwable;

class BackupStudio extends Command
{
    /** Folder on the off-site disk that holds the copies. */
    public const OFF_SITE_DIRECTORY = 'studio-backups';

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'studio:backup
                            {--keep=14 : Number of backups to keep}
                            {--restore= : Path of a backup zip to restore instead}
                            {--force : Restore without asking for confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Back up (or restore) Studio: schools, accounts, uploads and the theme/component registry';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $backup = new Backup(directories: [
            'uploads' => storage_path('app/public/'.ProjectAssets::DIRECTORY),
            'registry' => config('studio.generator_path').'/registry',
            'hosted-submissions' => storage_path('app/private/hosted-submissions'),
        ]);

        if ($file = $this->option('restore')) {
            if (! is_file($file)) {
                $this->components->error("Backup [{$file}] not found.");

                return self::FAILURE;
            }

            if (! $this->option('force') && ! $this->confirm('This replaces all schools, accounts, uploads and registry files. Continue?')) {
                return self::FAILURE;
            }

            $restored = $backup->restore($file);
            $this->components->info('Restored '.array_sum($restored).' rows from '.count($restored).' tables, uploads and the registry.');

            return self::SUCCESS;
        }

        $directory = storage_path('app/private/backups');
        $path = $backup->create($directory, 'studio-backup');
        $pruned = Backup::prune($directory, 'studio-backup', max(1, (int) $this->option('keep')));

        $this->components->info("Backup written to {$path}".(count($pruned) > 0 ? ' ('.count($pruned).' old backup(s) removed)' : ''));

        return $this->copyOffSite($path, max(1, (int) $this->option('keep')));
    }

    /**
     * Copies the backup to the disk named by SCHOOLFORGE_BACKUP_DISK (another
     * server, a network drive, object storage) and keeps the newest copies there.
     */
    private function copyOffSite(string $path, int $keep): int
    {
        if (! $diskName = config('studio.backup_disk')) {
            return self::SUCCESS;
        }

        try {
            $disk = Storage::disk($diskName);
            $disk->putFileAs(self::OFF_SITE_DIRECTORY, new File($path), basename($path));

            $old = collect($disk->files(self::OFF_SITE_DIRECTORY))
                ->filter(fn (string $file): bool => str_starts_with(basename($file), 'studio-backup-') && str_ends_with($file, '.zip'))
                ->sortDesc()
                ->slice($keep)
                ->values();
            $disk->delete($old->all());
        } catch (Throwable $exception) {
            $this->components->error("The backup could not be copied to the [{$diskName}] disk: {$exception->getMessage()}");

            return self::FAILURE;
        }

        $this->components->info("Copied to the [{$diskName}] disk".($old->isNotEmpty() ? " ({$old->count()} old copies removed)" : '').'.');

        return self::SUCCESS;
    }
}
