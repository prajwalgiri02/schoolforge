<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SiteSubmission;
use App\Services\Generator;
use App\Support\HostedSites;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Publishing a school to Studio's own hosting: its web address, publishing
 * and unpublishing, and the messages and forms its visitors send.
 */
class ProjectPublishController extends Controller
{
    public function show(Project $project, ProjectPresenter $presenter): Response
    {
        $submissions = $project->siteSubmissions()->latest('id')->paginate(25);

        return Inertia::render('Projects/Publish', [
            'project' => $presenter->summary($project),
            'hosting' => [
                'publishedAt' => $project->published_at?->toIso8601String(),
                'changedSincePublished' => HostedSites::hasUnpublishedChanges($project),
                'url' => HostedSites::url($project),
                'domain' => $project->domain,
                'subdomain' => config('studio.hosting_domain') ? $project->slug.'.'.HostedSites::normalizeHost(config('studio.hosting_domain')) : null,
                'serverHost' => HostedSites::studioHost(),
            ],
            'submissions' => $submissions->through(fn (SiteSubmission $submission): array => [
                'id' => $submission->id,
                'form' => $submission->form,
                'reference' => $submission->reference,
                'data' => $submission->data,
                'files' => array_keys($submission->files ?? []),
                'read' => $submission->read_at !== null,
                'createdAt' => $submission->created_at->toIso8601String(),
            ]),
            'unread' => $project->siteSubmissions()->whereNull('read_at')->count(),
        ]);
    }

    /**
     * Publishes the school as it is now (or updates the published version).
     */
    public function store(Project $project, Generator $generator): RedirectResponse
    {
        if (HostedSites::hostsFor($project) === []) {
            return back()->with('error', 'Set a domain for the school first.');
        }

        try {
            HostedSites::publish($project, $generator);
        } catch (RuntimeException $exception) {
            return back()->with('error', 'The school has problems to fix before it can be published: '.$exception->getMessage());
        }

        return back()->with('success', "{$project->name} is live at ".HostedSites::url($project).'.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        HostedSites::unpublish($project);

        return back()->with('success', "{$project->name} is no longer published.");
    }

    public function updateDomain(Request $request, Project $project): RedirectResponse
    {
        $domain = trim((string) $request->input('domain'));
        $request->merge(['domain' => $domain === '' ? null : (HostedSites::normalizeHost($domain) ?: $domain)]);
        $hostingDomain = config('studio.hosting_domain') ? HostedSites::normalizeHost(config('studio.hosting_domain')) : null;

        $validated = $request->validate([
            'domain' => [
                'nullable',
                'string',
                'max:190',
                'regex:/^(?=.{1,190}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/',
                Rule::unique('projects', 'domain')->ignore($project->id),
                function (string $attribute, mixed $value, \Closure $fail) use ($hostingDomain): void {
                    if ($value === HostedSites::studioHost() || ($hostingDomain && ($value === $hostingDomain || str_ends_with($value, ".{$hostingDomain}")))) {
                        $fail('That address is reserved for Studio.');
                    }
                },
            ],
        ], ['domain.regex' => 'Enter a domain name such as www.yourschool.edu.np.']);

        $project->forceFill(['domain' => $validated['domain']])->save();

        return back()->with('success', $validated['domain'] ? "Domain set to {$validated['domain']}." : 'Domain removed.');
    }

    public function markRead(Project $project, SiteSubmission $submission): RedirectResponse
    {
        abort_unless($submission->project_id === $project->id, 404);

        $submission->update(['read_at' => $submission->read_at ? null : now()]);

        return back();
    }

    public function destroySubmission(Project $project, SiteSubmission $submission): RedirectResponse
    {
        abort_unless($submission->project_id === $project->id, 404);

        Storage::disk('local')->delete(array_column($submission->files ?? [], 'path'));
        $submission->delete();

        return back()->with('success', "{$submission->reference} deleted.");
    }

    public function download(Project $project, SiteSubmission $submission, string $field): StreamedResponse
    {
        abort_unless($submission->project_id === $project->id && isset($submission->files[$field]), 404);

        return Storage::disk('local')->download($submission->files[$field]['path'], $submission->files[$field]['name']);
    }
}
