<?php

namespace App\Console\Commands;

use App\Models\SiteContent;
use App\Support\ContentSchema;
use App\Support\SchoolSite;
use App\Support\TranslationMerger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ExportSchoolContent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'school:export-content
                            {--path= : Config file to update (defaults to school.config.json in the project root)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Write content edited in the admin panel back into school.config.json';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $path = $this->option('path') ?? config('school.config_file');

        if (! File::exists($path)) {
            $this->components->error("Config file not found at [{$path}].");

            return self::FAILURE;
        }

        $config = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);
        $overrides = SiteContent::query()->orderBy('key')->get();

        if ($overrides->isEmpty()) {
            $this->components->info('Nothing to export: no content has been edited in the admin panel.');

            return self::SUCCESS;
        }

        foreach ($overrides as $override) {
            [$locale, $key] = str_contains($override->key, ':') ? explode(':', $override->key, 2) : [null, $override->key];

            if ($key === SchoolSite::DESIGN) {
                $config['colors'] = [...($config['colors'] ?? []), ...($override->value['colors'] ?? [])];

                continue;
            }

            if ($key === SchoolSite::PAGE_SETTINGS) {
                $config = $this->exportPageSettings($config, $override->value);

                continue;
            }

            if (ContentSchema::find($key) === null) {
                continue;
            }

            if ($locale === null) {
                $config = ContentSchema::apply($config, $key, $override->value, configShape: true);

                continue;
            }

            $translation = $config['translations'][$locale] ?? [];
            $merged = TranslationMerger::merge(ContentSchema::valueFrom($translation, $key, configShape: true), $override->value);
            $config['translations'][$locale] = ContentSchema::apply($translation, $key, $merged, configShape: true);
        }

        File::put($path, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");

        $this->components->info("Exported {$overrides->count()} edited section(s) to {$path}.");
        $this->components->bulletList($overrides->pluck('key')->all());

        return self::SUCCESS;
    }

    /**
     * Page wording, menu visibility and order go into the config's custom pages.
     * Sites on the default site map have none, so those edits stay in the admin panel.
     *
     * @param  array<string, mixed>  $config
     * @param  array<string, array<string, mixed>>  $settings
     * @return array<string, mixed>
     */
    private function exportPageSettings(array $config, array $settings): array
    {
        if (! isset($config['pages'])) {
            $this->components->warn('Page and menu edits were not exported: this site uses the default site map. Customise its pages in Studio first.');

            return $config;
        }

        $pages = array_map(fn (array $page): array => [...$page, ...array_intersect_key($settings[$page['slug']] ?? [], array_flip(['title', 'navLabel', 'description', 'showInNav']))], $config['pages']);
        usort($pages, fn (array $a, array $b): int => ($settings[$a['slug']]['order'] ?? PHP_INT_MAX) <=> ($settings[$b['slug']]['order'] ?? PHP_INT_MAX));
        $config['pages'] = $pages;

        return $config;
    }
}
