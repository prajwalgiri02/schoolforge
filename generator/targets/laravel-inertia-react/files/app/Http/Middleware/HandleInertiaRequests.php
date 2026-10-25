<?php

namespace App\Http\Middleware;

use App\Models\ContactMessage;
use App\Models\FormSubmission;
use App\Support\SchoolSite;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'schoolName' => fn () => app(SchoolSite::class)->schoolName(),
            'schoolLogo' => fn () => app(SchoolSite::class)->data()['school']['logo'] ?? null,
            'auth' => [
                'user' => fn () => $request->user() ? [
                    ...$request->user()->only('id', 'name', 'email'),
                    'role' => $request->user()->role->value,
                    'isAdmin' => $request->user()->isAdmin(),
                ] : null,
            ],
            'inbox' => fn () => $request->user() ? [
                'messages' => ContactMessage::query()->whereNull('read_at')->count(),
                'submissions' => FormSubmission::query()->whereNull('reviewed_at')->count(),
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
        ];
    }
}
