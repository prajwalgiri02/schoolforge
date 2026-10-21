<?php

namespace App\Http\Controllers;

use App\Enums\StudioRole;
use App\Models\User;
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
            'users' => User::query()->orderBy('name')->get(['id', 'name', 'email', 'role', 'created_at']),
            'roles' => collect(StudioRole::cases())->map(fn (StudioRole $role): array => ['value' => $role->value, 'label' => $role->label(), 'description' => $role->description()]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique(User::class)],
            'role' => ['required', new Enum(StudioRole::class)],
            'password' => ['required', 'string', 'min:8'],
        ]);

        User::create($validated);

        return back()->with('success', "{$validated['name']} can now sign in.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate(['role' => ['required', new Enum(StudioRole::class)]]);

        if ($validated['role'] !== StudioRole::Owner->value) {
            $this->keepAnOwner($user);
        }

        $user->update($validated);

        return back()->with('success', "{$user->name} is now ".StudioRole::from($validated['role'])->label().'.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => 'You cannot remove your own login.']);
        }

        $this->keepAnOwner($user);
        $user->delete();

        return back()->with('success', "{$user->name} can no longer sign in.");
    }

    private function keepAnOwner(User $user): void
    {
        if ($user->role === StudioRole::Owner && User::query()->where('role', StudioRole::Owner)->count() === 1) {
            throw ValidationException::withMessages(['user' => 'Studio needs at least one owner.']);
        }
    }
}
