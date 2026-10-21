<?php

namespace App\Support;

use App\Models\Project;
use App\Services\Generator;

/**
 * Shapes projects and registry data for Studio's pages.
 */
class ProjectPresenter
{
    public function __construct(private readonly Generator $generator) {}

    /**
     * @return array{slug: string, name: string, theme: string, themeLabel: string, target: string, colors: array<string, string>, updatedAt: string|null, outputPath: string|null, isTemplate: bool}
     */
    public function summary(Project $project): array
    {
        $theme = $this->generator->theme($project->theme());

        return [
            'slug' => $project->slug,
            'name' => $project->name,
            'theme' => $project->theme(),
            'themeLabel' => $theme['label'] ?? $project->theme(),
            'target' => $project->target(),
            'colors' => $this->swatch($theme, $project->config['colors'] ?? []),
            'updatedAt' => $project->updated_at?->toIso8601String(),
            'outputPath' => $project->output_path,
            'isTemplate' => (bool) $project->is_template,
        ];
    }

    /**
     * Themes for pickers: name, label, description and a colour swatch.
     *
     * @return list<array{name: string, label: string, description: string, extends: string|null, colors: array<string, string>, fonts: array{heading: string, body: string}}>
     */
    public function themes(): array
    {
        return array_map(fn (array $theme): array => [
            'name' => $theme['name'],
            'label' => $theme['label'],
            'description' => $theme['description'],
            'extends' => $theme['extends'],
            'colors' => $this->swatch($theme),
            'fonts' => [
                'heading' => $theme['tokens']['fonts']['heading']['family'] ?? '',
                'body' => $theme['tokens']['fonts']['body']['family'] ?? '',
            ],
        ], $this->generator->registry()['themes']);
    }

    /**
     * @param  array<string, mixed>|null  $theme
     * @param  array<string, string>  $overrides
     * @return array<string, string>
     */
    private function swatch(?array $theme, array $overrides = []): array
    {
        $colors = $theme['tokens']['colors'] ?? [];

        return array_merge(
            array_intersect_key($colors, array_flip(['primary', 'secondary', 'accent', 'background'])),
            array_intersect_key($overrides, array_flip(['primary', 'secondary', 'accent', 'background'])),
        );
    }
}
