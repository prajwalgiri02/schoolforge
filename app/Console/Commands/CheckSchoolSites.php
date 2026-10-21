<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Support\SiteMonitor;
use Illuminate\Console\Command;

class CheckSchoolSites extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'studio:check-sites {project? : Slug of one school to check}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check the health of every live school website and email owners when one goes down or recovers';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $projects = Project::query()->where('is_template', false)
            ->when($this->argument('project'), fn ($query, string $slug) => $query->where('slug', $slug))
            ->get();

        $rows = $projects->map(fn (Project $project): ?array => ($check = SiteMonitor::check($project))
            ? [$project->name, $check->status, $check->http_status ?? '–', $check->response_ms.' ms']
            : null)->filter();

        if ($rows->isEmpty()) {
            $this->components->info('No schools have a live site URL (SEO → Site URL) to check.');

            return self::SUCCESS;
        }

        $this->table(['School', 'Status', 'HTTP', 'Time'], $rows->all());

        return self::SUCCESS;
    }
}
