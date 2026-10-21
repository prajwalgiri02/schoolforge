<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\SchoolSite;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Forgot your password?" for admin panel accounts, using Laravel's password broker.
 */
class PasswordResetController extends Controller
{
    public function create(SchoolSite $site): Response
    {
        return Inertia::render('Admin/ForgotPassword', ['schoolName' => $site->schoolName()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        // Same answer whether or not the account exists, so emails cannot be probed.
        return back()->with('success', 'If that email has an account, a link to choose a new password is on its way.');
    }

    public function edit(Request $request, string $token, SchoolSite $site): Response
    {
        return Inertia::render('Admin/ResetPassword', ['schoolName' => $site->schoolName(), 'token' => $token, 'email' => (string) $request->query('email')]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset($request->only('email', 'password', 'password_confirmation', 'token'), function (User $user, string $password): void {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        return redirect()->route('admin.login')->with('success', 'Password changed. You can sign in now.');
    }
}
