<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Support\Payments\Esewa;
use App\Support\Payments\Khalti;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use RuntimeException;

/**
 * Online fee payments: start a payment, handle the gateway's return and show
 * the receipt.
 */
class PaymentController extends Controller
{
    /**
     * @return list<array{id: string, label: string}>
     */
    public static function gateways(): array
    {
        return array_values(array_filter([
            Esewa::configured() ? ['id' => 'esewa', 'label' => 'eSewa'] : null,
            Khalti::configured() ? ['id' => 'khalti', 'label' => 'Khalti'] : null,
        ]));
    }

    public function options(): JsonResponse
    {
        return response()->json(['gateways' => self::gateways(), 'currency' => config('school.payments.currency')]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gateway' => ['required', Rule::in(array_column(self::gateways(), 'id'))],
            'purpose' => ['required', 'string', 'max:160'],
            'amount' => ['required', 'numeric', 'min:10', 'max:1000000'],
            'student_name' => ['required', 'string', 'max:160'],
            'class' => ['nullable', 'string', 'max:60'],
            'payer_name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:40'],
        ]);

        $payment = Payment::create([...$validated, 'amount' => round((float) $validated['amount'], 2), 'reference' => $this->newReference(), 'status' => 'pending']);

        try {
            return $payment->gateway === 'esewa'
                ? response()->json(['form' => Esewa::checkout($payment)])
                : response()->json(['redirect' => Khalti::checkout($payment)]);
        } catch (RuntimeException $exception) {
            $payment->update(['status' => 'failed', 'gateway_response' => ['error' => $exception->getMessage()]]);
            report($exception);

            return response()->json(['message' => 'The payment could not be started. Please try again or use another method.'], 502);
        }
    }

    /**
     * eSewa sends the payer back here, with ?data=… on success or ?failed=REF.
     */
    public function esewa(Request $request): RedirectResponse
    {
        if ($request->filled('failed')) {
            $payment = Payment::query()->where('reference', $request->query('failed'))->where('status', 'pending')->first();
            $payment?->update(['status' => 'failed']);

            return $payment ? redirect($this->receiptUrl($payment)) : redirect('/');
        }

        $data = (string) $request->query('data');
        $uuid = json_decode((string) base64_decode($data, true), true)['transaction_uuid'] ?? null;
        $payment = Payment::query()->where('reference', $uuid)->where('gateway', 'esewa')->firstOrFail();

        if (! $payment->isPaid()) {
            $result = Esewa::verify($data, $payment);
            $this->complete($payment, $result, $result['transaction_code'] ?? null);
        }

        return redirect($this->receiptUrl($payment));
    }

    /**
     * Khalti sends the payer back here with ?pidx=…&status=…
     */
    public function khalti(Request $request): RedirectResponse
    {
        $payment = Payment::query()->where('gateway', 'khalti')->where('gateway_reference', (string) $request->query('pidx'))->firstOrFail();

        if (! $payment->isPaid()) {
            $result = $request->query('status') === 'User canceled' ? null : Khalti::verify($payment->gateway_reference, $payment);
            $this->complete($payment, $result, $result['transaction_id'] ?? null);
        }

        return redirect($this->receiptUrl($payment));
    }

    public function receipt(string $reference): View
    {
        return view('payment-receipt', ['payment' => Payment::query()->where('reference', $reference)->firstOrFail()]);
    }

    /**
     * @param  array<string, mixed>|null  $result
     */
    private function complete(Payment $payment, ?array $result, ?string $transaction): void
    {
        if ($result === null) {
            $payment->update(['status' => 'failed']);

            return;
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'gateway_reference' => $transaction ?? $payment->gateway_reference,
            'gateway_response' => $result,
        ]);

        $school = config('app.name');
        $url = $this->receiptUrl($payment);
        Mail::raw(
            "Dear {$payment->payer_name},\n\n{$school} has received your payment of NPR ".number_format((float) $payment->amount, 2)." for {$payment->purpose} ({$payment->student_name}).\n\nReceipt number: {$payment->reference}\nTransaction: {$payment->gateway_reference}\n\nView or print your receipt: {$url}",
            fn ($mail) => $mail->to($payment->email, $payment->payer_name)->subject("Payment receipt {$payment->reference}"),
        );

        if ($office = config('school.contact_recipient')) {
            Mail::raw(
                'Online payment received: NPR '.number_format((float) $payment->amount, 2)." for {$payment->purpose}\nStudent: {$payment->student_name} {$payment->class}\nPaid by: {$payment->payer_name} via {$payment->gateway}\nReceipt: {$payment->reference}",
                fn ($mail) => $mail->to($office)->subject("Payment received: {$payment->student_name} ({$payment->reference})"),
            );
        }
    }

    /**
     * Receipts are signed links so they cannot be found by guessing references.
     */
    private function receiptUrl(Payment $payment): string
    {
        return URL::signedRoute('school.payments.receipt', $payment->reference);
    }

    private function newReference(): string
    {
        do {
            $reference = 'PAY-'.now()->format('y').'-'.Str::upper(Str::password(8, symbols: false));
        } while (Payment::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
