<?php

namespace App\Http\Controllers;

use App\Support\Audit;
use App\Support\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The signed-in user's own password and two-factor sign-in.
 */
class AccountController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $pending = $request->session()->get('two_factor.pending_secret');

        return Inertia::render('Account/Index', [
            'twoFactorEnabled' => $user->hasTwoFactor(),
            'setup' => $pending ? ['secret' => trim(chunk_split($pending, 4, ' ')), 'uri' => Totp::uri($pending, $user->email, 'SchoolForge Studio')] : null,
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

        Audit::record('account.password', 'Changed their password');

        return back()->with('success', 'Password changed.');
    }

    public function enableTwoFactor(Request $request): RedirectResponse
    {
        $request->session()->put('two_factor.pending_secret', Totp::newSecret());

        return back();
    }

    public function confirmTwoFactor(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string']]);
        $secret = $request->session()->get('two_factor.pending_secret');

        if (! $secret || ! Totp::verify($secret, (string) $request->input('code'))) {
            throw ValidationException::withMessages(['code' => 'That code does not match. Make sure you scanned the newest setup key.']);
        }

        $codes = $this->newRecoveryCodes();
        $request->user()->forceFill(['two_factor_secret' => $secret, 'two_factor_recovery_codes' => $codes, 'two_factor_confirmed_at' => now()])->save();
        $request->session()->forget('two_factor.pending_secret');
        $request->session()->flash('two_factor.recovery_codes', $codes);

        Audit::record('account.two-factor', 'Turned on two-factor sign-in');

        return back()->with('success', 'Two-factor sign-in is on. Save your recovery codes somewhere safe.');
    }

    public function regenerateRecoveryCodes(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasTwoFactor(), 404);

        $codes = $this->newRecoveryCodes();
        $request->user()->forceFill(['two_factor_recovery_codes' => $codes])->save();
        $request->session()->flash('two_factor.recovery_codes', $codes);

        Audit::record('account.two-factor', 'Created new recovery codes');

        return back()->with('success', 'New recovery codes created. The old ones no longer work.');
    }

    public function disableTwoFactor(Request $request): RedirectResponse
    {
        $request->validate(['current_password' => ['required', 'current_password']]);

        $request->user()->forceFill(['two_factor_secret' => null, 'two_factor_recovery_codes' => null, 'two_factor_confirmed_at' => null])->save();

        Audit::record('account.two-factor', 'Turned off two-factor sign-in');

        return back()->with('success', 'Two-factor sign-in is off.');
    }

    /**
     * @return list<string>
     */
    private function newRecoveryCodes(): array
    {
        return array_map(fn (): string => Str::upper(Str::random(5).'-'.Str::random(5)), range(1, 8));
    }
}
