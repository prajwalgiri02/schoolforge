<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SiteSubmission;
use App\Support\FormSchema;
use App\Support\HostedSites;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * The public website of a school Studio hosts: its pages, sitemap and robots
 * file, and the contact form, application forms and alert sign-ups, which
 * arrive in Studio and are emailed to the school.
 */
class HostedSiteController extends Controller
{
    public function handle(Request $request, Project $project): Response
    {
        $path = trim($request->path(), '/');

        return match (true) {
            $request->isMethod('POST') && $path === '_school/contact' => $this->contact($request, $project),
            $request->isMethod('POST') && $path === '_school/subscribe' => $this->subscribe($request, $project),
            $request->isMethod('POST') && preg_match('#^_school/forms/([a-z]+)$#', $path, $match) === 1 => $this->form($request, $project, $match[1]),
            ! $request->isMethod('GET') && ! $request->isMethod('HEAD') => abort(405),
            $path === 'sitemap.xml' => $this->sitemap($project),
            $path === 'robots.txt' => response("User-agent: *\nAllow: /\n\nSitemap: ".$this->baseUrl($request)."/sitemap.xml\n", 200, ['Content-Type' => 'text/plain']),
            default => $this->page($request, $project, $path),
        };
    }

    private function page(Request $request, Project $project, string $path): Response
    {
        $languages = $project->published_site['languages'];
        $segments = array_values(array_filter(explode('/', $path), fn (string $segment): bool => $segment !== ''));
        $locale = isset($segments[0]) && $segments[0] !== $languages[0] && in_array($segments[0], $languages, true) ? array_shift($segments) : $languages[0];
        $slug = '/'.implode('/', $segments);
        $published = $project->published_site['locales'][$locale];
        $site = $published['site'];
        $page = collect($site['pages'])->firstWhere('slug', $slug);

        abort_if($page === null, 404);

        $base = $this->baseUrl($request);
        $title = $slug === '/' ? $site['school']['name'].(filled($site['school']['tagline'] ?? null) ? ' | '.$site['school']['tagline'] : '') : "{$page['title']} | {$site['school']['name']}";

        Inertia::setRootView('hosted');

        return Inertia::render('Preview', [
            'base' => '',
            'hosted' => true,
            'slug' => $slug,
            'site' => $site,
            'tokens' => $published['tokens'],
            'extraCss' => $published['extraCss'],
        ])->withViewData([
            'locale' => $locale,
            'title' => $title,
            'description' => $page['description'] ?? $site['school']['about']['summary'] ?? $site['school']['tagline'] ?? $site['school']['name'],
            'canonical' => $base.$this->localePath($languages, $locale).($slug === '/' ? '' : $slug),
            'alternates' => collect($languages)->mapWithKeys(fn (string $language): array => [$language => $base.$this->localePath($languages, $language).($slug === '/' ? '/' : $slug)])->all(),
            'image' => $site['seo']['image'] ?? $site['school']['logo'] ?? null,
            'verification' => $site['seo']['googleSiteVerification'] ?? null,
            'siteName' => $site['school']['name'],
        ])->toResponse($request);
    }

    private function sitemap(Project $project): Response
    {
        $base = rtrim((string) HostedSites::url($project), '/');
        $languages = $project->published_site['languages'];
        $lastModified = $project->published_at->toAtomString();
        $urls = collect($languages)->flatMap(fn (string $language): array => collect($project->published_site['locales'][$language]['site']['pages'])
            ->map(fn (array $page): string => '<url><loc>'.e($base.$this->localePath($languages, $language).($page['slug'] === '/' ? '/' : $page['slug']))."</loc><lastmod>{$lastModified}</lastmod></url>")
            ->all());

        return response('<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'.$urls->implode('')."</urlset>\n", 200, ['Content-Type' => 'application/xml']);
    }

    private function contact(Request $request, Project $project): Response
    {
        $this->throttle($request, $project);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:40'],
            'subject' => ['nullable', 'string', 'max:190'],
            'campus' => ['nullable', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $submission = $this->store($project, 'contact', 'MSG', array_filter($validated, fn ($value): bool => $value !== null));
        $this->emailSchool($project, $submission, 'New enquiry: '.($validated['subject'] ?? $validated['name']), $validated['email']);

        return response()->json(['ok' => true], 201);
    }

    private function subscribe(Request $request, Project $project): Response
    {
        $this->throttle($request, $project);

        $validated = $request->validate([
            'email' => ['nullable', 'required_without:phone', 'email', 'max:190'],
            'phone' => ['nullable', 'required_without:email', 'string', 'max:20'],
        ], ['email.required_without' => 'Enter an email address or a mobile number.']);

        $this->store($project, 'subscribe', 'SUB', array_filter($validated));

        return response()->json(['ok' => true], 201);
    }

    private function form(Request $request, Project $project, string $type): Response
    {
        $definition = FormSchema::find($type);

        abort_if($definition === null, 404);
        $this->throttle($request, $project);

        $validated = $request->validate(FormSchema::rules($type), [], FormSchema::attributes($type));
        $reference = $this->newReference($definition['referencePrefix']);
        $files = [];

        foreach ($validated as $name => $value) {
            if ($value instanceof UploadedFile) {
                $files[$name] = [
                    'path' => $value->storeAs("hosted-submissions/{$project->id}/{$reference}", $name.'.'.$value->extension(), 'local'),
                    'name' => $value->getClientOriginalName(),
                ];
            }
        }

        $data = Arr::except(array_filter($validated, fn ($value): bool => ! $value instanceof UploadedFile && $value !== null), ['consent']);
        $submission = $project->siteSubmissions()->create(['form' => $type, 'reference' => $reference, 'data' => $data, 'files' => $files ?: null]);
        $this->emailSchool($project, $submission, "{$definition['label']['en']}: ".($data['name'] ?? $data['studentName'] ?? $reference)." ({$reference})", $data['email'] ?? null);

        return response()->json(['reference' => $reference], 201);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function store(Project $project, string $form, string $prefix, array $data): SiteSubmission
    {
        return $project->siteSubmissions()->create(['form' => $form, 'reference' => $this->newReference($prefix), 'data' => $data]);
    }

    private function newReference(string $prefix): string
    {
        do {
            $reference = $prefix.'-'.now()->format('y').'-'.Str::upper(Str::password(6, symbols: false));
        } while (SiteSubmission::query()->where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * Emails a copy to the school's contact address, if it has one.
     */
    private function emailSchool(Project $project, SiteSubmission $submission, string $subject, ?string $replyTo): void
    {
        $recipients = array_values(array_filter(Arr::wrap($project->config['school']['contact']['email'] ?? []), fn ($email): bool => is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL) !== false));

        if ($recipients === []) {
            return;
        }

        $body = collect($submission->data)->map(fn ($value, string $name): string => Str::headline($name).': '.(is_bool($value) ? ($value ? 'Yes' : 'No') : $value))->implode("\n");

        Mail::raw("{$body}\n\nSee every message in SchoolForge Studio: ".route('projects.publish.show', $project), function ($mail) use ($recipients, $subject, $replyTo): void {
            $mail->to($recipients)->subject($subject);

            if ($replyTo) {
                $mail->replyTo($replyTo);
            }
        });
    }

    private function throttle(Request $request, Project $project): void
    {
        $key = "hosted-forms:{$project->id}:{$request->ip()}";

        abort_if(RateLimiter::tooManyAttempts($key, 10), 429, 'Too many submissions. Please try again in a minute.');

        RateLimiter::hit($key);
    }

    /**
     * @param  list<string>  $languages
     */
    private function localePath(array $languages, string $locale): string
    {
        return $locale === $languages[0] ? '' : "/{$locale}";
    }

    private function baseUrl(Request $request): string
    {
        return $request->getSchemeAndHttpHost();
    }
}
