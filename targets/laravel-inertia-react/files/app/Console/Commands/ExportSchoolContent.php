<?php

namespace App\Console\Commands;

use App\Models\SiteContent;
use App\Support\ContentSchema;
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
            if (ContentSchema::find($override->key) !== null) {
                $config = ContentSchema::apply($config, $override->key, $override->value, configShape: true);
            }
        }

        File::put($path, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");

        $this->components->info("Exported {$overrides->count()} edited section(s) to {$path}.");
        $this->components->bulletList($overrides->pluck('key')->all());

        return self::SUCCESS;
    }
}
