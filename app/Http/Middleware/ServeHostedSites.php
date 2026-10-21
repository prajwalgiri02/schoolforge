<?php

namespace App\Http\Middleware;

use App\Http\Controllers\HostedSiteController;
use App\Support\HostedSites;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Answers requests for a published school's domain with that school's
 * website; every other request reaches Studio as usual.
 */
class ServeHostedSites
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $project = HostedSites::forHost($request->getHost());

        if ($project === null) {
            return $next($request);
        }

        return app(HostedSiteController::class)->handle($request, $project);
    }
}
