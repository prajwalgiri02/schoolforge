<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->redirectGuestsTo(fn (): string => route('admin.login'));
        $middleware->redirectUsersTo(fn (): string => route('admin.dashboard'));
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
    })->create();
