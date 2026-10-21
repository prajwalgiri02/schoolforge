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
            // A school subdomain that is not (or no longer) published is not Studio.
            abort_if(static::isSchoolSubdomain($request->getHost()), 404);

            return $next($request);
        }

        return app(HostedSiteController::class)->handle($request, $project);
    }

    private static function isSchoolSubdomain(string $host): bool
    {
        $host = HostedSites::normalizeHost($host);
        $hostingDomain = config('studio.hosting_domain') ? HostedSites::normalizeHost(config('studio.hosting_domain')) : null;

        return $hostingDomain !== null && $host !== HostedSites::studioHost() && str_ends_with($host, ".{$hostingDomain}");
    }
}
