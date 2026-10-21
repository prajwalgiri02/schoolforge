<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\Generator;
use Inertia\Inertia;
use Inertia\Response;

class PreviewController extends Controller
{
    /**
     * Render a page of the project's website with its real components and theme,
     * exactly as the generator will build it.
     */
    public function __invoke(Project $project, Generator $generator, ?string $path = null): Response
    {
        $languages = $project->config['languages'] ?? ['en'];
        $segments = array_values(array_filter(explode('/', (string) $path), fn (string $segment): bool => $segment !== ''));
        $locale = isset($segments[0]) && $segments[0] !== $languages[0] && in_array($segments[0], $languages, true) ? array_shift($segments) : null;
        $slug = '/'.implode('/', $segments);
        $preview = $generator->preview($project->config, $locale);

        if (! $preview['ok']) {
            return Inertia::render('Preview', [
                'base' => route('preview', $project, absolute: false),
                'problems' => $preview['errors'],
            ]);
        }

        abort_unless(collect($preview['site']['pages'])->contains('slug', $slug), 404);

        return Inertia::render('Preview', [
            'base' => route('preview', $project, absolute: false),
            'slug' => $slug,
            'site' => $preview['site'],
            'tokens' => $preview['tokens'],
            'extraCss' => $preview['extraCss'],
        ]);
    }
}
