<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SiteSubmission;
use App\Services\Generator;
use App\Support\Audit;
use App\Support\Billing;
use App\Support\DomainCheck;
use App\Support\HeadlessContent;
use App\Support\HostedSites;
use App\Support\ProjectPresenter;
use App\Support\SiteAnalytics;
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
    public function show(Request $request, Project $project, ProjectPresenter $presenter): Response
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
            'headless' => [
                'enabled' => HeadlessContent::isEnabled($project),
                'contentUrl' => HeadlessContent::contentUrl($project),
                'token' => $request->user()->can('edit-projects') && ! $request->user()->isSchoolStaff() ? $project->content_token : null,
                'canManage' => $request->user()->can('edit-projects') && ! $request->user()->isSchoolStaff(),
                'revalidateUrl' => HeadlessContent::revalidateUrl($project),
                'isNextjs' => $project->target() === 'nextjs',
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
            'analytics' => Inertia::defer(fn (): array => SiteAnalytics::summary($project)),
            'domainCheck' => Inertia::optional(fn (): ?array => $project->domain ? DomainCheck::run($project) : null),
        ]);
    }

    /**
     * Publishes the school as it is now (or updates the published version).
     */
    public function store(Project $project, Generator $generator): RedirectResponse
    {
        if (Billing::needsPackage($project)) {
            return redirect()->route('projects.package.show', $project)->with('error', 'Choose a monthly or yearly package to publish your website.');
        }

        $isHosted = HostedSites::hostsFor($project) !== [];

        if (! $isHosted && ! HeadlessContent::isEnabled($project)) {
            return back()->with('error', 'Set a domain for the school, or turn on the headless content API, first.');
        }

        try {
            HostedSites::publish($project, $generator);
        } catch (RuntimeException $exception) {
            return back()->with('error', 'The school has problems to fix before it can be published: '.$exception->getMessage());
        }

        Audit::record('projects.published', "Published {$project->name}", $project);

        return back()->with('success', implode(' ', array_filter([
            $isHosted ? "{$project->name} is live at ".HostedSites::url($project).'.' : "{$project->name} is published.",
            HeadlessContent::isEnabled($project) ? HeadlessContent::refreshSite($project) : null,
        ])));
    }

    /**
     * Turns on the content API for a Next.js site (or issues a new token).
     */
    public function enableHeadless(Project $project): RedirectResponse
    {
        $hadToken = HeadlessContent::isEnabled($project);
        HeadlessContent::enable($project);

        Audit::record('projects.headless', $hadToken ? "Issued a new content token for {$project->name}" : "Turned on the content API for {$project->name}", $project);

        return back()->with('success', $hadToken ? 'New token issued. Update SCHOOLFORGE_CONTENT_TOKEN on the website; the old token no longer works.' : 'Headless content API turned on.');
    }

    public function disableHeadless(Project $project): RedirectResponse
    {
        HeadlessContent::disable($project);

        Audit::record('projects.headless', "Turned off the content API for {$project->name}", $project);

        return back()->with('success', 'Headless content API turned off. The website keeps the content it was built with.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        HostedSites::unpublish($project);

        Audit::record('projects.unpublished', "Unpublished {$project->name}", $project);

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

        Audit::record('projects.domain', $validated['domain'] ? "Set {$project->name}'s domain to {$validated['domain']}" : "Removed {$project->name}'s domain", $project);

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

        Audit::record('submissions.deleted', "Deleted {$submission->reference}", $project);

        return back()->with('success', "{$submission->reference} deleted.");
    }

    public function download(Project $project, SiteSubmission $submission, string $field): StreamedResponse
    {
        abort_unless($submission->project_id === $project->id && isset($submission->files[$field]), 404);

        return Storage::disk('local')->download($submission->files[$field]['path'], $submission->files[$field]['name']);
    }
}
