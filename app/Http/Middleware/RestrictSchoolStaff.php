<?php

namespace App\Http\Middleware;

use App\Models\Project;
use App\Support\Billing;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps school-staff logins to their own school's content, pages, history,
 * publishing and enquiries. Every other Studio page is refused. Once a
 * signed-up school's trial is over, only buying a package is left open.
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
        'account.show',
        'account.password',
        'account.two-factor.store',
        'account.two-factor.confirm',
        'account.two-factor.recovery-codes',
        'account.two-factor.destroy',
        'projects.index',
        'projects.show',
        'projects.onboarding.show',
        'projects.onboarding.update',
        'projects.package.show',
        'projects.package.store',
        'projects.invoices.show',
        'projects.content.index',
        'projects.content.edit',
        'projects.content.update',
        'projects.design.edit',
        'projects.design.update',
        'projects.domain.update',
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
     * Routes left open once a school's free trial is over and it has not paid.
     *
     * @var list<string>
     */
    public const TRIAL_ENDED_ROUTES = [
        'logout',
        'account.show',
        'account.password',
        'account.two-factor.store',
        'account.two-factor.confirm',
        'account.two-factor.recovery-codes',
        'account.two-factor.destroy',
        'projects.package.show',
        'projects.package.store',
        'projects.invoices.show',
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

            if ($user->project && Billing::trialEnded($user->project) && ! in_array($request->route()?->getName(), self::TRIAL_ENDED_ROUTES, true)) {
                return redirect()->route('projects.package.show', $user->project)->with('error', 'Your free trial has ended. Choose a package to keep editing and publish your website.');
            }
        }

        return $next($request);
    }
}
