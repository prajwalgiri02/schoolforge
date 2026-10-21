<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Sections whose components were removed from the registry.
     */
    private const RETIRED = ['fee-payment', 'result-lookup'];

    /**
     * Run the migrations. Takes the online fee payment and exam result sections
     * out of custom site maps, and drops pages that held nothing else.
     */
    public function up(): void
    {
        DB::table('projects')->orderBy('id')->each(function (object $project): void {
            $config = json_decode($project->config, true);

            if (! isset($config['pages']) || ! is_array($config['pages'])) {
                return;
            }

            $pages = [];
            $changed = false;

            foreach ($config['pages'] as $page) {
                $sections = array_values(array_filter($page['sections'] ?? [], fn (array $section): bool => ! in_array($section['type'] ?? null, self::RETIRED, true)));

                if (count($sections) === count($page['sections'] ?? [])) {
                    $pages[] = $page;

                    continue;
                }

                $changed = true;

                if (($page['slug'] ?? null) === '/' || array_diff(array_column($sections, 'type'), ['page-header']) !== []) {
                    $pages[] = [...$page, 'sections' => $sections];
                }
            }

            if ($changed) {
                DB::table('projects')->where('id', $project->id)->update(['config' => json_encode([...$config, 'pages' => $pages], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
