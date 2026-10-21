<?php

namespace App\Support;

use App\Models\Project;
use Illuminate\Support\Arr;

/**
 * The content a new school starts with: a template school's content and
 * design, or the generator's example school, renamed for the new school.
 */
class StarterContent
{
    /**
     * A template project's content and design, with the new school's name.
     *
     * @param  array<string, mixed>  $school
     * @return array<string, mixed>
     */
    public static function fromTemplate(Project $template, array $school): array
    {
        $config = $template->config;
        unset($config['seo']['siteUrl']);
        $config['school'] = [...Arr::only($config['school'] ?? [], ['contact', 'social', 'established', 'motto']), ...$school];

        return $config;
    }

    /**
     * The generator's example school, renamed, as editable starting content.
     *
     * @param  array<string, mixed>  $school
     * @return array<string, mixed>
     */
    public static function sample(array $school): array
    {
        $example = static::example();
        unset($example['$schema'], $example['target'], $example['theme']);

        $example['school'] = [...$example['school'], ...$school];

        if (! isset($school['shortName'])) {
            unset($example['school']['shortName']);
        }

        return $example;
    }

    /**
     * The generator's example school config.
     *
     * @return array<string, mixed>
     */
    private static function example(): array
    {
        return json_decode(file_get_contents(config('studio.generator_path').'/examples/school.config.json'), true, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * What a self-signed-up school starts with: the template chosen for
     * sign-ups, else the newest template, else the example school.
     *
     * @param  array<string, mixed>  $school
     * @return array<string, mixed>
     */
    public static function forSignup(array $school): array
    {
        $templates = Project::query()->where('is_template', true);
        $template = filled(config('studio.signup_template'))
            ? (clone $templates)->where('slug', config('studio.signup_template'))->first()
            : null;
        $template ??= $templates->latest('updated_at')->first();
        $starter = $template?->config ?? static::example();
        $config = $template ? static::fromTemplate($template, $school) : static::sample($school);
        unset($config['seo']['siteUrl']);

        return static::renamed($config, array_filter([$starter['school']['name'] ?? null, $starter['school']['shortName'] ?? null]), $school['name']);
    }

    /**
     * Swaps the starter school's name for the new school's wherever it appears
     * in the text, longest name first so a short name inside it is not split.
     *
     * @param  array<string, mixed>  $config
     * @param  list<string>  $oldNames
     * @return array<string, mixed>
     */
    private static function renamed(array $config, array $oldNames, string $newName): array
    {
        usort($oldNames, fn (string $a, string $b): int => strlen($b) <=> strlen($a));

        array_walk_recursive($config, function (mixed &$value) use ($oldNames, $newName): void {
            if (is_string($value) && ! str_starts_with($value, '/') && ! str_contains($value, '://')) {
                $value = str_replace($oldNames, $newName, $value);
            }
        });

        return $config;
    }
}
