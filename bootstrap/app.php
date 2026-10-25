<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RestrictSchoolStaff;
use App\Http\Middleware\ServeHostedSites;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Behind a reverse proxy (compose.yaml sets TRUSTED_PROXIES=* for Caddy),
        // use the visitor's address and scheme it forwards.
        if ($proxies = env('TRUSTED_PROXIES')) {
            $middleware->trustProxies(at: $proxies === '*' ? '*' : explode(',', $proxies));
        }

        $middleware->append(ServeHostedSites::class);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            RestrictSchoolStaff::class,
        ]);

        $middleware->redirectGuestsTo(fn (): string => route('login'));
        $middleware->redirectUsersTo(fn (): string => route('projects.index'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // A throttled form shows a message on its first field instead of a bare 429 page.
        $exceptions->render(function (ThrottleRequestsException $exception, Request $request) {
            if (! $request->header('X-Inertia') || $request->isMethod('GET')) {
                return null;
            }

            $minutes = max(1, (int) ceil(((int) ($exception->getHeaders()['Retry-After'] ?? 60)) / 60));
            $field = array_key_first($request->except(['_token', 'password', 'password_confirmation', 'remember', 'website'])) ?? 'email';

            return back()->withErrors([$field => "Too many attempts. Please wait {$minutes} ".Str::plural('minute', $minutes).' and try again.']);
        });
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
