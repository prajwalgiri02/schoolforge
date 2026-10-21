<?php

namespace App\Support\Payments;

use App\Models\Payment;
use Illuminate\Support\Facades\Http;

/**
 * eSewa ePay v2: the payer is sent to eSewa with a signed form, eSewa redirects
 * back with a signed, base64-encoded result, and the transaction status API
 * confirms it. https://developer.esewa.com.np/pages/Epay
 */
class Esewa
{
    public static function configured(): bool
    {
        return filled(config('school.payments.esewa.product_code')) && filled(config('school.payments.esewa.secret_key'));
    }

    /**
     * The form the browser posts to eSewa.
     *
     * @return array{action: string, fields: array<string, string>}
     */
    public static function checkout(Payment $payment): array
    {
        $amount = self::amount($payment);
        $fields = [
            'amount' => $amount,
            'tax_amount' => '0',
            'product_service_charge' => '0',
            'product_delivery_charge' => '0',
            'total_amount' => $amount,
            'transaction_uuid' => $payment->reference,
            'product_code' => (string) config('school.payments.esewa.product_code'),
            'success_url' => route('school.payments.esewa'),
            'failure_url' => route('school.payments.esewa', ['failed' => $payment->reference]),
            'signed_field_names' => 'total_amount,transaction_uuid,product_code',
        ];
        $fields['signature'] = self::sign($fields, $fields['signed_field_names']);

        return [
            'action' => config('school.payments.esewa.live') ? 'https://epay.esewa.com.np/api/epay/main/v2/form' : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
            'fields' => $fields,
        ];
    }

    /**
     * Decodes and checks the result eSewa sends back. Returns it when the
     * signature is valid and eSewa's status API confirms the payment.
     *
     * @return array<string, mixed>|null
     */
    public static function verify(string $data, Payment $payment): ?array
    {
        $result = json_decode((string) base64_decode($data, true), true);

        if (! is_array($result) || ! isset($result['signature'], $result['signed_field_names'], $result['transaction_uuid'])) {
            return null;
        }

        if (! hash_equals(self::sign($result, $result['signed_field_names']), $result['signature']) || $result['transaction_uuid'] !== $payment->reference) {
            return null;
        }

        $status = Http::timeout(20)->get(
            config('school.payments.esewa.live') ? 'https://epay.esewa.com.np/api/epay/transaction/status/' : 'https://rc.esewa.com.np/api/epay/transaction/status/',
            ['product_code' => config('school.payments.esewa.product_code'), 'total_amount' => self::amount($payment), 'transaction_uuid' => $payment->reference],
        );

        return $status->ok() && $status->json('status') === 'COMPLETE' ? [...$result, 'ref_id' => $status->json('ref_id')] : null;
    }

    /**
     * HMAC-SHA256 over "field=value,field=value" for the signed fields, base64 encoded.
     *
     * @param  array<string, mixed>  $fields
     */
    public static function sign(array $fields, string $signedFieldNames): string
    {
        $message = collect(explode(',', $signedFieldNames))->map(fn (string $name): string => $name.'='.($fields[$name] ?? ''))->implode(',');

        return base64_encode(hash_hmac('sha256', $message, (string) config('school.payments.esewa.secret_key'), true));
    }

    private static function amount(Payment $payment): string
    {
        $amount = (float) $payment->amount;

        return $amount == floor($amount) ? (string) (int) $amount : number_format($amount, 2, '.', '');
    }
}
