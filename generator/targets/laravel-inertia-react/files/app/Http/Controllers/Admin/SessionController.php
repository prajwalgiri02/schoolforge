<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use App\Models\User;
use App\Support\SchoolSite;
use App\Support\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    /**
     * Show the admin sign-in form.
     */
    public function create(SchoolSite $site): Response
    {
        return Inertia::render('Admin/Login', [
            'schoolName' => $site->schoolName(),
        ]);
    }

    /**
     * Sign an administrator in.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        if (! Auth::validate($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        $user = User::query()->where('email', $request->input('email'))->firstOrFail();

        if ($user->hasTwoFactor()) {
            $request->session()->put('login.two_factor', ['id' => $user->id, 'remember' => $request->boolean('remember'), 'expires' => now()->addMinutes(10)->timestamp]);

            return redirect()->route('admin.two-factor');
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Ask for the authenticator code (or a recovery code) after the password.
     */
    public function twoFactor(Request $request, SchoolSite $site): Response|RedirectResponse
    {
        if (! $this->pendingUser($request)) {
            return redirect()->route('admin.login');
        }

        return Inertia::render('Admin/TwoFactorChallenge', ['schoolName' => $site->schoolName()]);
    }

    public function confirmTwoFactor(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string', 'max:40']]);
        $user = $this->pendingUser($request) ?? throw ValidationException::withMessages(['code' => 'Your sign-in expired. Please start again.']);
        $code = trim((string) $request->input('code'));
        $recoveryCodes = $user->two_factor_recovery_codes ?? [];

        if (Totp::verify($user->two_factor_secret, $code)) {
            // Accepted.
        } elseif (in_array(strtoupper($code), $recoveryCodes, true)) {
            $user->forceFill(['two_factor_recovery_codes' => array_values(array_diff($recoveryCodes, [strtoupper($code)]))])->save();
        } else {
            throw ValidationException::withMessages(['code' => 'That code is not right. Check the time on your phone and try again.']);
        }

        $remember = (bool) $request->session()->pull('login.two_factor')['remember'];
        Auth::login($user, $remember);
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    private function pendingUser(Request $request): ?User
    {
        $pending = $request->session()->get('login.two_factor');

        if (! is_array($pending) || $pending['expires'] < now()->timestamp) {
            return null;
        }

        return User::query()->find($pending['id']);
    }

    /**
     * Sign the administrator out.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
