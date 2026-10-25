<?php

namespace App\Http\Controllers;

use App\Enums\StudioRole;
use App\Http\Requests\SignupRequest;
use App\Models\Project;
use App\Models\User;
use App\Support\Audit;
use App\Support\StarterContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lets a school create its own website and a login to manage it.
 */
class SignupController extends Controller
{
    public function create(): Response
    {
        abort_unless(config('studio.signup'), 404);

        return Inertia::render('Auth/Signup');
    }

    public function store(SignupRequest $request): RedirectResponse
    {
        [$project, $user] = DB::transaction(function () use ($request): array {
            $starter = StarterContent::forSignup(['name' => $request->validated('school_name')]);
            // The starter school's own details would be wrong for this school.
            $details = ['shortName', 'tagline', 'motto', 'logo', 'favicon', 'established', 'affiliation', 'social', 'contact'];
            $starter['school'] = Arr::except($starter['school'], $details);
            unset($starter['campuses']);

            foreach ($starter['translations'] ?? [] as $locale => $translation) {
                unset($translation['campuses']);

                if (isset($translation['school'])) {
                    $translation['school'] = Arr::except($translation['school'], ['name', ...$details]);
                }

                $starter['translations'][$locale] = $translation;
            }

            $starter['school']['contact'] = array_filter([
                'address' => $request->validated('address'),
                'phone' => filled($request->validated('phone')) ? [$request->validated('phone')] : null,
                'email' => [$request->validated('email')],
            ]);

            $project = Project::create([
                'name' => $request->validated('school_name'),
                'config' => ['target' => 'nextjs', 'theme' => 'classic', ...$starter],
                'billing_email' => $request->validated('email'),
                'signed_up_at' => now(),
                'trial_ends_at' => now()->addDays(config('studio.signup_trial_days')),
            ]);

            $user = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'password' => $request->validated('password'),
                'role' => StudioRole::School,
                'project_id' => $project->id,
            ]);

            return [$project, $user];
        });

        Audit::record('schools.signed-up', "{$user->name} ({$user->email}) signed up {$project->name}", $project, $user);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('projects.onboarding.show', $project);
    }
}
