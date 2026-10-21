<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The signed-in account's password and two-factor sign-in.
 */
class SecurityController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $pending = $request->session()->get('two_factor.pending_secret');

        return Inertia::render('Admin/Security', [
            'twoFactorEnabled' => $user->hasTwoFactor(),
            'setup' => $pending ? ['secret' => trim(chunk_split($pending, 4, ' ')), 'uri' => Totp::uri($pending, $user->email, config('app.name'))] : null,
            'recoveryCodes' => $request->session()->get('two_factor.recovery_codes'),
            'recoveryCodesLeft' => count($user->two_factor_recovery_codes ?? []),
        ]);
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $request->user()->update(['password' => $request->input('password')]);

        return back()->with('success', 'Password changed.');
    }

    /**
     * Start setting up two-factor sign-in: a new secret to add to an authenticator app.
     */
    public function enable(Request $request): RedirectResponse
    {
        $request->session()->put('two_factor.pending_secret', Totp::newSecret());

        return back();
    }

    /**
     * Turn two-factor sign-in on once the app shows a matching code.
     */
    public function confirm(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string']]);
        $secret = $request->session()->get('two_factor.pending_secret');

        if (! $secret || ! Totp::verify($secret, (string) $request->input('code'))) {
            throw ValidationException::withMessages(['code' => 'That code does not match. Make sure you scanned the newest setup key.']);
        }

        $codes = self::recoveryCodes();
        $request->user()->forceFill(['two_factor_secret' => $secret, 'two_factor_recovery_codes' => $codes, 'two_factor_confirmed_at' => now()])->save();
        $request->session()->forget('two_factor.pending_secret');
        $request->session()->flash('two_factor.recovery_codes', $codes);

        return back()->with('success', 'Two-factor sign-in is on. Save your recovery codes somewhere safe.');
    }

    public function regenerateCodes(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasTwoFactor(), 404);

        $codes = self::recoveryCodes();
        $request->user()->forceFill(['two_factor_recovery_codes' => $codes])->save();
        $request->session()->flash('two_factor.recovery_codes', $codes);

        return back()->with('success', 'New recovery codes created. The old ones no longer work.');
    }

    public function disable(Request $request): RedirectResponse
    {
        $request->validate(['current_password' => ['required', 'current_password']]);

        $request->user()->forceFill(['two_factor_secret' => null, 'two_factor_recovery_codes' => null, 'two_factor_confirmed_at' => null])->save();

        return back()->with('success', 'Two-factor sign-in is off.');
    }

    /**
     * @return list<string>
     */
    private static function recoveryCodes(): array
    {
        return array_map(fn (): string => Str::upper(Str::random(5).'-'.Str::random(5)), range(1, 8));
    }
}
