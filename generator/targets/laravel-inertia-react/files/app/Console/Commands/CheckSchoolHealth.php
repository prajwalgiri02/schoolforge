<?php

namespace App\Console\Commands;

use App\Support\SiteHealth;
use Illuminate\Console\Command;

class CheckSchoolHealth extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'school:health';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check the database, storage, queue, scheduler, backups and email (also at /health)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $health = SiteHealth::run();

        $this->table(['Check', 'Status', 'Details'], array_map(fn (array $check): array => [$check['name'], strtoupper($check['status']), $check['message']], $health['checks']));
        $this->line('Overall: '.strtoupper($health['status']));

        return $health['status'] === 'failing' ? self::FAILURE : self::SUCCESS;
    }
}
