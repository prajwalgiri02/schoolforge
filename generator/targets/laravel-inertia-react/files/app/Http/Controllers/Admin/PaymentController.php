<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\PaymentController as PublicPaymentController;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Online fee payments received through the website.
 */
class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'paid');

        return Inertia::render('Admin/Payments', [
            'status' => $status,
            'gateways' => PublicPaymentController::gateways(),
            'totals' => [
                'month' => (float) Payment::query()->where('status', 'paid')->where('paid_at', '>=', now()->startOfMonth())->sum('amount'),
                'all' => (float) Payment::query()->where('status', 'paid')->sum('amount'),
            ],
            'payments' => Payment::query()
                ->when($status !== 'all', fn ($query) => $query->where('status', $status))
                ->latest()
                ->paginate(30)
                ->withQueryString(),
        ]);
    }

    public function export(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['receipt', 'paid_at', 'amount', 'purpose', 'student', 'class', 'payer', 'email', 'phone', 'gateway', 'transaction'], escape: '\\');

            Payment::query()->where('status', 'paid')->orderBy('paid_at')->each(function (Payment $payment) use ($output): void {
                fputcsv($output, [$payment->reference, $payment->paid_at?->toDateTimeString(), $payment->amount, $payment->purpose, $payment->student_name, $payment->class, $payment->payer_name, $payment->email, $payment->phone, $payment->gateway, $payment->gateway_reference], escape: '\\');
            });

            fclose($output);
        }, 'payments.csv', ['Content-Type' => 'text/csv']);
    }
}
