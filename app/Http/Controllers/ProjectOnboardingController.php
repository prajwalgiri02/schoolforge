<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProjectOnboardingRequest;
use App\Models\Project;
use App\Support\Audit;
use App\Support\HostedSites;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

/**
 * First-run setup for a school that signed itself up: the basics every
 * school website needs, before editing the rest of the starter content.
 */
class ProjectOnboardingController extends Controller
{
    public function show(Project $project, ProjectPresenter $presenter): Response
    {
        $school = $project->config['school'] ?? [];

        return Inertia::render('Projects/Onboarding', [
            'project' => $presenter->summary($project),
            'themes' => $presenter->themes(),
            'websiteUrl' => HostedSites::url($project),
            'values' => [
                'name' => $school['name'] ?? $project->name,
                'tagline' => $school['tagline'] ?? '',
                'established' => (string) ($school['established'] ?? ''),
                'logo' => $school['logo'] ?? '',
                'address' => $school['contact']['address'] ?? '',
                'phone' => Arr::first((array) ($school['contact']['phone'] ?? [])) ?? '',
                'email' => Arr::first((array) ($school['contact']['email'] ?? [])) ?? '',
                'summary' => $school['about']['summary'] ?? '',
                'principal_name' => $school['principal']['name'] ?? '',
                'principal_message' => implode("\n\n", (array) ($school['principal']['message'] ?? [])),
                'theme' => $project->theme(),
                'primary_color' => $project->config['colors']['primary'] ?? '',
            ],
        ]);
    }

    public function update(UpdateProjectOnboardingRequest $request, Project $project): RedirectResponse
    {
        $config = $project->config;
        $school = $config['school'] ?? [];
        $paragraphs = array_values(array_filter(array_map('trim', preg_split('/\R\s*\R/', (string) $request->validated('principal_message')))));

        $school = [
            ...$school,
            'name' => $request->validated('name'),
            'tagline' => $request->validated('tagline'),
            'established' => $request->validated('established') ? (int) $request->validated('established') : null,
            'logo' => $request->validated('logo'),
            'contact' => [
                ...$school['contact'] ?? [],
                'address' => $request->validated('address'),
                'phone' => array_filter([$request->validated('phone')]),
                'email' => array_filter([$request->validated('email')]),
            ],
            'about' => [...$school['about'] ?? [], 'summary' => $request->validated('summary')],
            'principal' => [...$school['principal'] ?? [], 'name' => $request->validated('principal_name'), 'message' => $paragraphs],
        ];

        $config['school'] = $this->withoutEmpty($school);
        $config['theme'] = $request->validated('theme');
        $config['colors'] = array_filter([...$config['colors'] ?? [], 'primary' => $request->validated('primary_color')]);

        if ($config['colors'] === []) {
            unset($config['colors']);
        }

        $project->versionSummary = 'Finished the first-run setup';
        $project->update(['config' => $config, 'onboarded_at' => $project->onboarded_at ?? now()]);
        Audit::record('schools.onboarded', "Set up {$project->name}", $project);

        return redirect()->route('projects.content.index', $project)->with('success', 'Your website is set up. Look through the other sections, then publish it from the Publish tab.');
    }

    /**
     * Drops fields left empty, so the site does not show blank details.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function withoutEmpty(array $values): array
    {
        $kept = [];

        foreach ($values as $key => $value) {
            $value = is_array($value) && ! array_is_list($value) ? $this->withoutEmpty($value) : $value;

            if ($value !== null && $value !== '' && $value !== []) {
                $kept[$key] = $value;
            }
        }

        return $kept;
    }
}
