<?php

namespace App\Console\Commands;

use App\Support\Backup;
use Illuminate\Console\Command;

class BackupSchool extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'school:backup
                            {--keep=14 : Number of backups to keep}
                            {--restore= : Path of a backup zip to restore instead}
                            {--force : Restore without asking for confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Back up (or restore) the website content, enquiries, accounts and uploaded files';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $backup = new Backup(
            directories: ['uploads' => storage_path('app/public')],
            files: [
                'school.config.json' => config('school.config_file'),
                'site.json' => config('school.site_data'),
            ],
        );

        if ($file = $this->option('restore')) {
            if (! is_file($file)) {
                $this->components->error("Backup [{$file}] not found.");

                return self::FAILURE;
            }

            if (! $this->option('force') && ! $this->confirm('This replaces all current content, enquiries, accounts and uploads. Continue?')) {
                return self::FAILURE;
            }

            $restored = $backup->restore($file);
            $this->components->info('Restored '.array_sum($restored).' rows from '.count($restored).' tables and the uploaded files.');

            return self::SUCCESS;
        }

        $directory = storage_path('app/private/backups');
        $path = $backup->create($directory, 'school-backup');
        $pruned = Backup::prune($directory, 'school-backup', max(1, (int) $this->option('keep')));

        $this->components->info("Backup written to {$path}".(count($pruned) > 0 ? ' ('.count($pruned).' old backup(s) removed)' : ''));

        return self::SUCCESS;
    }
}
