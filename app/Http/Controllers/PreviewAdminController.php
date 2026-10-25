<?php

namespace App\Http\Controllers;

use App\Enums\StaffRole;
use App\Models\Project;
use App\Services\Generator;
use App\Support\ContentSchema;
use App\Support\FormSchema;
use App\Support\TranslationMerger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Shows the admin panel of a generated Laravel site with the school's content,
 * using the panel's own pages, so the operator can check it before generating.
 * A new site has no messages, applications or subscribers yet, and nothing is saved.
 */
class PreviewAdminController extends Controller
{
    /**
     * @var array<string, mixed>|null
     */
    private ?array $preview = null;

    public function dashboard(Request $request, Project $project, Generator $generator): Response
    {
        return $this->render($request, $project, 'Admin/Dashboard', [
            'stats' => [
                ['key' => 'messages', 'label' => 'New enquiries', 'value' => 0, 'hint' => '0 in the last 30 days'],
                ['key' => 'submissions', 'label' => 'Applications to review', 'value' => 0, 'hint' => '0 received in total'],
                ['key' => 'updated', 'label' => 'Last edited', 'value' => null, 'hint' => '0 of '.count(ContentSchema::sections()).' sections changed'],
                ['key' => 'subscribers', 'label' => 'Subscribers', 'value' => 0, 'hint' => 'People who get your email alerts'],
            ],
            'checklist' => ContentSchema::checklist($project->config, configShape: true),
            'activity' => collect(range(5, 0))->map(fn (int $ago): array => ['month' => now()->startOfMonth()->subMonths($ago)->format('Y-m'), 'enquiries' => 0, 'applications' => 0])->all(),
            'summary' => ContentSchema::summary($project->config, count($this->pages($project, $generator)), configShape: true),
            'recentMessages' => [],
            'recentSubmissions' => [],
        ]);
    }

    public function contentIndex(Request $request, Project $project): Response
    {
        return $this->render($request, $project, 'Admin/Content/Index', [
            'sections' => collect(ContentSchema::sections())->map(function (array $section, string $key) use ($project): array {
                $value = ContentSchema::valueFrom($project->config, $key, configShape: true);

                return [
                    'key' => $key,
                    'label' => $section['label'],
                    'description' => $section['description'],
                    'kind' => $section['kind'],
                    'count' => $section['kind'] === 'list' ? count($value) : null,
                    'editedAt' => null,
                ];
            })->values(),
        ]);
    }

    public function content(Request $request, Project $project, string $key): Response
    {
        $section = ContentSchema::find($key);

        abort_if($section === null, 404);

        $languages = $project->config['languages'] ?? ['en'];
        $locale = $request->query('locale');
        $locale = is_string($locale) && $locale !== $languages[0] && in_array($locale, $languages, true) ? $locale : null;
        $value = ContentSchema::valueFrom($project->config, $key, configShape: true);

        if ($locale !== null) {
            $value = TranslationMerger::merge($value, ContentSchema::valueFrom($project->config['translations'][$locale] ?? [], $key, configShape: true));
        }

        return $this->render($request, $project, 'Admin/Content/Edit', [
            'sectionKey' => $key,
            'section' => $section,
            'value' => $value,
            'isEdited' => false,
            'locale' => $locale ?? $languages[0],
            'locales' => $languages,
            'defaultLocale' => $languages[0],
            'icons' => ProjectContentController::ICONS,
            'sections' => collect(ContentSchema::sections())->map(fn (array $item, string $itemKey): array => ['key' => $itemKey, 'label' => $item['label']])->values(),
        ]);
    }

    public function website(Request $request, Project $project, Generator $generator): Response
    {
        return $this->render($request, $project, 'Admin/Website', [
            'pages' => collect($this->pages($project, $generator))
                ->reject(fn (array $page): bool => str_starts_with($page['slug'], '/news/') || str_starts_with($page['slug'], '/gallery/'))
                ->map(fn (array $page): array => [
                    'slug' => $page['slug'],
                    'title' => $page['title'],
                    'navLabel' => $page['navLabel'] ?? '',
                    'description' => $page['description'] ?? '',
                    'showInNav' => (bool) ($page['showInNav'] ?? false),
                    'edited' => false,
                ])
                ->values(),
            'colors' => (object) [],
        ]);
    }

    public function messages(Request $request, Project $project): Response
    {
        return $this->render($request, $project, 'Admin/Messages', [
            'messages' => new LengthAwarePaginator([], 0, 20),
        ]);
    }

    public function submissions(Request $request, Project $project): Response
    {
        $types = collect(FormSchema::all())->map(fn (array $form, string $type): array => [
            'type' => $type,
            'label' => $form['label']['en'],
            'statuses' => $form['statuses'],
            'open' => 0,
        ])->values();
        $type = $request->query('type', $types->first()['type']);

        abort_unless(is_string($type) && FormSchema::find($type), 404);

        return $this->render($request, $project, 'Admin/Submissions/Index', [
            'types' => $types,
            'type' => $type,
            'status' => $request->query('status'),
            'search' => $request->query('search'),
            'submissions' => new LengthAwarePaginator([], 0, 25),
        ]);
    }

    public function alerts(Request $request, Project $project): Response
    {
        return $this->render($request, $project, 'Admin/Alerts', [
            'subscriberCount' => 0,
            'alerts' => [],
        ]);
    }

    public function staff(Request $request, Project $project): Response
    {
        return $this->render($request, $project, 'Admin/Staff', [
            'staff' => [[...$this->user($request), 'twoFactor' => false]],
            'roles' => collect(StaffRole::cases())->map(fn (StaffRole $role): array => ['value' => $role->value, 'label' => $role->label(), 'description' => $role->description()]),
        ]);
    }

    public function account(Request $request, Project $project): Response
    {
        return $this->render($request, $project, 'Admin/Security', [
            'twoFactorEnabled' => false,
            'setup' => null,
            'recoveryCodes' => null,
            'recoveryCodesLeft' => 0,
        ]);
    }

    public function login(Request $request, Project $project): Response
    {
        return $this->render($request, $project, 'Admin/Login');
    }

    public function forgotPassword(Request $request, Project $project): Response
    {
        return $this->render($request, $project, 'Admin/ForgotPassword');
    }

    public function twoFactor(Request $request, Project $project): Response
    {
        return $this->render($request, $project, 'Admin/TwoFactorChallenge');
    }

    public function signIn(Project $project): RedirectResponse
    {
        return redirect()->route('preview.admin.dashboard', $project);
    }

    public function signOut(Project $project): RedirectResponse
    {
        return redirect()->route('preview.admin.login', $project);
    }

    /**
     * The media library picker: a new site has no uploads.
     */
    public function media(): JsonResponse
    {
        return response()->json([]);
    }

    public function upload(): JsonResponse
    {
        return response()->json([
            'message' => 'Uploads are turned off in the preview.',
            'errors' => ['file' => ['Uploads are turned off in the preview.']],
        ], 422);
    }

    /**
     * Saving, deleting and downloading do nothing in the preview.
     */
    public function unavailable(Request $request, Project $project): RedirectResponse
    {
        return redirect()->back(fallback: route('preview.admin.dashboard', $project))->with('success', $request->isMethod('GET')
            ? 'Downloads are not available in the preview.'
            : 'This is a preview, so nothing was saved.');
    }

    /**
     * @param  array<string, mixed>  $props
     */
    private function render(Request $request, Project $project, string $component, array $props = []): Response
    {
        return Inertia::render($component, [
            ...$props,
            'schoolName' => (string) ($project->config['school']['name'] ?? $project->name),
            'schoolLogo' => $project->config['school']['logo'] ?? null,
            'themeVariables' => (object) ($this->preview($project, app(Generator::class))['tokens']['cssVariables'] ?? []),
            'auth' => ['user' => $this->user($request)],
            'inbox' => ['messages' => 0, 'submissions' => 0],
            'adminUrl' => route('preview.admin.dashboard', $project, absolute: false),
            'siteUrl' => route('preview', $project, absolute: false),
            'studioUrl' => route('projects.show', $project, absolute: false),
        ]);
    }

    /**
     * The signed-in Studio user, shown as the panel's administrator.
     *
     * @return array{id: int, name: string, email: string, role: string, isAdmin: bool}
     */
    private function user(Request $request): array
    {
        return [
            'id' => $request->user()->id,
            'name' => $request->user()->name,
            'email' => $request->user()->email,
            'role' => StaffRole::Admin->value,
            'isAdmin' => true,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function pages(Project $project, Generator $generator): array
    {
        $preview = $this->preview($project, $generator);

        return $preview['ok'] ? $preview['site']['pages'] : [];
    }

    /**
     * The school's site data and design tokens, worked out once per request.
     *
     * @return array<string, mixed>
     */
    private function preview(Project $project, Generator $generator): array
    {
        return $this->preview ??= $generator->preview($project->config);
    }
}
