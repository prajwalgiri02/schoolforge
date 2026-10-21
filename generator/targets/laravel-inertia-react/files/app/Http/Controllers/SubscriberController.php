<?php

namespace App\Http\Controllers;

use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

/**
 * Newsletter sign-ups from the website.
 */
class SubscriberController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:190'],
            'locale' => ['nullable', 'string', 'max:10'],
        ]);

        $email = Str::lower($validated['email']);
        $subscriber = Subscriber::query()->where('email', $email)->first() ?? new Subscriber(['token' => Str::random(40), 'email' => $email]);

        $subscriber->fill([
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
