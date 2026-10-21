<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps school-staff logins to their own school's content, pages, history,
 * publishing and enquiries. Every other Studio page is refused.
 */
class RestrictSchoolStaff
{
    /**
     * Routes school staff may use (on their own school only).
     *
     * @var list<string>
     */
    public const ALLOWED_ROUTES = [
        'logout',
        'projects.index',
        'projects.show',
        'projects.content.index',
        'projects.content.edit',
        'projects.content.update',
        'projects.pages.edit',
        'projects.pages.update',
        'projects.pages.destroy',
        'projects.history.index',
        'projects.history.restore',
        'projects.publish.show',
        'projects.publish.store',
        'projects.submissions.update',
        'projects.submissions.destroy',
        'projects.submissions.file',
        'preview',
        'uploads.store',
        'media.library',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->isSchoolStaff()) {
            $project = $request->route('project');

            abort_unless(in_array($request->route()?->getName(), self::ALLOWED_ROUTES, true), 403);
            abort_if($project instanceof Project && ! $user->canAccessProject($project), 403);
        }

        return $next($request);
    }
}
