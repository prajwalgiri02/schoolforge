<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Support\MediaLibrary;
use App\Support\ProjectAssets;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Images and documents uploaded in Studio, with the schools that use each one.
 */
class MediaController extends Controller
{
    public function index(): Response
    {
        $usage = Project::query()->get(['name', 'slug', 'config'])->map(fn (Project $project): array => [
            'name' => $project->name,
            'files' => ProjectAssets::referencedFiles($project->config),
        ]);

        return Inertia::render('Media/Index', [
            'items' => collect(MediaLibrary::list(ProjectAssets::DIRECTORY))->map(fn (array $item): array => [
                ...$item,
                'usedBy' => $usage->filter(fn (array $project): bool => in_array($item['path'], $project['files'], true))->pluck('name')->values(),
            ]),
        ]);
    }

    /**
     * The library as JSON, for the "Choose from library" picker in editors.
     */
    public function library(Request $request): JsonResponse
    {
        $items = MediaLibrary::list(ProjectAssets::DIRECTORY);

        if ($request->user()->isSchoolStaff()) {
            $own = ProjectAssets::referencedFiles($request->user()->project?->config ?? []);
            $items = array_values(array_filter($items, fn (array $item): bool => in_array($item['path'], $own, true)));
        }

        return response()->json($items);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $path = (string) $request->input('path');
        $inUse = Project::query()->get(['config'])->contains(fn (Project $project): bool => in_array($path, ProjectAssets::referencedFiles($project->config), true));

        if ($inUse) {
            return back()->with('error', 'This file is still used by a school. Remove it there first.');
        }

        abort_unless(MediaLibrary::delete(ProjectAssets::DIRECTORY, $path), 404);

        return back()->with('success', 'File deleted.');
    }
}
