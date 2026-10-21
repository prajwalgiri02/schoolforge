<?php

namespace App\Http\Controllers;

use App\Enums\StudioRole;
use App\Models\Project;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Studio logins and what each may do. Only owners see this.
 */
class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::query()->with('project:id,name,slug')->orderBy('name')->get(['id', 'name', 'email', 'role', 'project_id', 'created_at']),
            'schools' => Project::query()->where('is_template', false)->orderBy('name')->get(['id', 'name']),
            'roles' => collect(StudioRole::cases())->map(fn (StudioRole $role): array => ['value' => $role->value, 'label' => $role->label(), 'description' => $role->description()]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique(User::class)],
            'role' => ['required', new Enum(StudioRole::class)],
            'project_id' => $this->schoolRules(),
            'password' => ['required', 'string', 'min:8'],
        ], ['project_id.required_if' => 'Choose the school this person looks after.']);

        User::create([...$validated, 'project_id' => $validated['role'] === StudioRole::School->value ? $validated['project_id'] : null]);

        Audit::record('users.created', "Added {$validated['name']} ({$validated['email']}) as ".StudioRole::from($validated['role'])->label());

        return back()->with('success', "{$validated['name']} can now sign in.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate(
            ['role' => ['required', new Enum(StudioRole::class)], 'project_id' => $this->schoolRules()],
            ['project_id.required_if' => 'Choose the school this person looks after.'],
        );
        $validated['project_id'] = $validated['role'] === StudioRole::School->value ? $validated['project_id'] : null;

        if ($validated['role'] !== StudioRole::Owner->value) {
            $this->keepAnOwner($user);
        }

        $user->update($validated);

        Audit::record('users.role', "Made {$user->name} ".StudioRole::from($validated['role'])->label().($user->project ? " of {$user->project->name}" : ''));

        return back()->with('success', "{$user->name} is now ".StudioRole::from($validated['role'])->label().'.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => 'You cannot remove your own login.']);
        }

        $this->keepAnOwner($user);
        $user->delete();

        Audit::record('users.removed', "Removed {$user->name} ({$user->email})");

        return back()->with('success', "{$user->name} can no longer sign in.");
    }

    /**
     * School staff look after exactly one school.
     *
     * @return list<mixed>
     */
    private function schoolRules(): array
    {
        return ['nullable', 'required_if:role,'.StudioRole::School->value, 'integer', Rule::exists('projects', 'id')];
    }

    private function keepAnOwner(User $user): void
    {
        if ($user->role === StudioRole::Owner && User::query()->where('role', StudioRole::Owner)->count() === 1) {
            throw ValidationException::withMessages(['user' => 'Studio needs at least one owner.']);
        }
    }
}
