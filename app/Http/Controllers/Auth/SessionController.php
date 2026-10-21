<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Support\Audit;
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
     * Show the sign-in form.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', ['signupEnabled' => (bool) config('studio.signup')]);
    }

    /**
     * Sign a Studio user in.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        if (! Auth::validate($request->only('email', 'password'))) {
            Audit::record('auth.failed', 'Failed sign-in as '.$request->string('email'));

            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        $user = User::query()->where('email', $request->input('email'))->firstOrFail();

        if ($user->hasTwoFactor()) {
            $request->session()->put('login.two_factor', ['id' => $user->id, 'remember' => $request->boolean('remember'), 'expires' => now()->addMinutes(10)->timestamp]);

            return redirect()->route('login.two-factor');
        }

        return $this->signIn($request, $user, $request->boolean('remember'));
    }

    /**
     * Ask for the code from the authenticator app after the password.
     */
    public function twoFactor(Request $request): Response|RedirectResponse
    {
        return $this->pendingUser($request) ? Inertia::render('Auth/TwoFactor') : redirect()->route('login');
    }

    public function confirmTwoFactor(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string', 'max:40']]);
        $user = $this->pendingUser($request) ?? throw ValidationException::withMessages(['code' => 'Your sign-in expired. Please start again.']);
        $code = strtoupper(trim((string) $request->input('code')));
        $recoveryCodes = $user->two_factor_recovery_codes ?? [];

        if (in_array($code, $recoveryCodes, true)) {
            $user->forceFill(['two_factor_recovery_codes' => array_values(array_diff($recoveryCodes, [$code]))])->save();
        } elseif (! Totp::verify($user->two_factor_secret, $code)) {
            throw ValidationException::withMessages(['code' => 'That code is not right. Check the time on your phone and try again.']);
        }

        return $this->signIn($request, $user, (bool) $request->session()->pull('login.two_factor')['remember']);
    }

    private function signIn(Request $request, User $user, bool $remember): RedirectResponse
    {
        Auth::login($user, $remember);
        $request->session()->regenerate();
        Audit::record('auth.signed-in', $user->hasTwoFactor() ? 'Signed in with two-factor' : 'Signed in', user: $user);

        return redirect()->intended(route('projects.index'));
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
     * Sign the user out.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Audit::record('auth.signed-out', 'Signed out');
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
