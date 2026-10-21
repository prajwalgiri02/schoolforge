<?php

namespace App\Console\Commands;

use App\Support\Backup;
use App\Support\ProjectAssets;
use Illuminate\Console\Command;

class BackupStudio extends Command
{
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

        return self::SUCCESS;
    }
}
