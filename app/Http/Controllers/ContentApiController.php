<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Support\HeadlessContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The published content of a school, for its Next.js site in headless mode.
 */
class ContentApiController extends Controller
{
    public function __invoke(Request $request, Project $project): JsonResponse
    {
        abort_unless(
            HeadlessContent::isEnabled($project) && is_string($request->bearerToken()) && hash_equals($project->content_token, $request->bearerToken()),
            401,
            'A valid content token is required.',
        );
        abort_unless($project->isPublished(), 404, 'The school has not been published yet.');

        $site = $project->published_site;

        return response()->json([
            'publishedAt' => $project->published_at->toIso8601String(),
            'defaultLocale' => $site['languages'][0],
            'locales' => collect($site['locales'])->map(fn (array $locale): array => $locale['site'])->all(),
        ]);
    }
}
