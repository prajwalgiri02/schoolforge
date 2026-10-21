<?php

namespace App\Support\Payments;

use App\Models\Payment;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Khalti ePayment v2: the server starts a payment and gets a payment URL, Khalti
 * redirects back with a pidx, and the lookup API confirms it.
 * https://docs.khalti.com/khalti-epayment/
 */
class Khalti
{
    public static function configured(): bool
    {
        return filled(config('school.payments.khalti.secret_key'));
    }

    /**
     * Starts the payment and returns Khalti's payment page URL.
     */
    public static function checkout(Payment $payment): string
    {
        $response = self::client()->post('epayment/initiate/', [
            'return_url' => route('school.payments.khalti'),
            'website_url' => url('/'),
            'amount' => (int) round((float) $payment->amount * 100),
            'purchase_order_id' => $payment->reference,
            'purchase_order_name' => mb_substr("{$payment->purpose} – {$payment->student_name}", 0, 100),
            'customer_info' => array_filter(['name' => $payment->payer_name, 'email' => $payment->email, 'phone' => $payment->phone]),
        ]);

        if ($response->failed() || ! $response->json('payment_url')) {
            throw new RuntimeException('Khalti could not start the payment: '.($response->json('detail') ?? $response->body()));
        }

        $payment->update(['gateway_reference' => $response->json('pidx')]);

        return $response->json('payment_url');
    }

    /**
     * Returns Khalti's lookup result when the payment is completed for the full amount.
     *
     * @return array<string, mixed>|null
     */
    public static function verify(string $pidx, Payment $payment): ?array
    {
        $response = self::client()->post('epayment/lookup/', ['pidx' => $pidx]);

        if ($response->failed() || $response->json('status') !== 'Completed' || (int) $response->json('total_amount') !== (int) round((float) $payment->amount * 100)) {
            return null;
        }

        return $response->json();
    }

    private static function client(): PendingRequest
    {
        return Http::baseUrl(config('school.payments.khalti.live') ? 'https://khalti.com/api/v2/' : 'https://dev.khalti.com/api/v2/')
            ->withHeaders(['Authorization' => 'Key '.config('school.payments.khalti.secret_key')])
            ->asJson()
            ->timeout(20);
    }
}
