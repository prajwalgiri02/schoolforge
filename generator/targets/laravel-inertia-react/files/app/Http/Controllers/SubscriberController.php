<?php

namespace App\Http\Controllers;

use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

/**
 * Newsletter and SMS alert sign-ups from the website.
 */
class SubscriberController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['nullable', 'required_without:phone', 'email', 'max:190'],
            'phone' => ['nullable', 'required_without:email', 'string', 'max:20'],
            'locale' => ['nullable', 'string', 'max:10'],
        ], [
            'email.required_without' => 'Enter an email address or a mobile number.',
            'phone.required_without' => 'Enter an email address or a mobile number.',
        ]);

        $phone = filled($validated['phone'] ?? null) ? Subscriber::normalizePhone($validated['phone']) : null;

        if (filled($validated['phone'] ?? null) && $phone === null) {
            return response()->json(['errors' => ['phone' => ['Enter a 10-digit mobile number, e.g. 98XXXXXXXX.']]], 422);
        }

        $email = filled($validated['email'] ?? null) ? Str::lower($validated['email']) : null;

        $subscriber = Subscriber::query()
            ->when($email, fn ($query) => $query->orWhere('email', $email))
            ->when($phone, fn ($query) => $query->orWhere('phone', $phone))
            ->first() ?? new Subscriber(['token' => Str::random(40)]);

        $subscriber->fill([
            'email' => $email ?? $subscriber->email,
            'phone' => $phone ?? $subscriber->phone,
            'locale' => $validated['locale'] ?? $subscriber->locale,
            'unsubscribed_at' => null,
        ])->save();

        return response()->json(['subscribed' => true], 201);
    }

    public function destroy(string $token): View
    {
        Subscriber::query()->where('token', $token)->update(['unsubscribed_at' => now()]);

        return view('unsubscribed');
    }
}
