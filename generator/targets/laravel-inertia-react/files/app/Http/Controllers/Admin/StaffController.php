<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff accounts for the admin panel. New staff get an email to choose their password.
 */
class StaffController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Staff', [
            'staff' => User::query()->orderBy('name')->get()->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'twoFactor' => $user->hasTwoFactor(),
            ]),
            'roles' => collect(StaffRole::cases())->map(fn (StaffRole $role): array => ['value' => $role->value, 'label' => $role->label(), 'description' => $role->description()]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique(User::class)],
            'role' => ['required', new Enum(StaffRole::class)],
        ]);

        User::create([...$validated, 'password' => Str::password(32)]);
        Password::sendResetLink(['email' => $validated['email']]);

        return back()->with('success', "Invitation sent to {$validated['email']}. They choose their password from the email.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate(['role' => ['required', new Enum(StaffRole::class)]]);

        if ($validated['role'] !== StaffRole::Admin->value) {
            $this->keepAnAdmin($user);
        }

        $user->update($validated);

        return back()->with('success', "{$user->name} is now ".StaffRole::from($validated['role'])->label().'.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => 'You cannot remove your own account.']);
        }

        $this->keepAnAdmin($user);
        $user->delete();

        return back()->with('success', "{$user->name} can no longer sign in.");
    }

    private function keepAnAdmin(User $user): void
    {
        if ($user->isAdmin() && User::query()->where('role', StaffRole::Admin)->count() === 1) {
            throw ValidationException::withMessages(['user' => 'The site needs at least one administrator.']);
        }
    }
}
