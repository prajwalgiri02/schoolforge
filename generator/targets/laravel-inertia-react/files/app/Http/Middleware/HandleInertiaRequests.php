<?php

namespace App\Http\Middleware;

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
            'auth' => [
                'user' => fn () => $request->user() ? [
                    ...$request->user()->only('id', 'name', 'email'),
                    'role' => $request->user()->role->value,
                    'isAdmin' => $request->user()->isAdmin(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
        ];
    }
}
