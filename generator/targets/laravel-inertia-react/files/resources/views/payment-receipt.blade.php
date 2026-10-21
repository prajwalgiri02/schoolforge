<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Receipt {{ $payment->reference }} · {{ config('app.name') }}</title>
    <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
        main { max-width: 34rem; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 1rem; box-shadow: 0 1px 3px rgb(0 0 0 / .1); }
        h1 { margin: 0; font-size: 1.4rem; text-align: center; }
        .status { margin: 1rem 0 1.5rem; padding: .6rem; border-radius: .6rem; text-align: center; font-weight: 600; }
        .paid { background: #dcfce7; color: #166534; }
        .failed { background: #fee2e2; color: #991b1b; }
        .pending { background: #fef9c3; color: #854d0e; }
        dl { display: grid; grid-template-columns: 11rem 1fr; gap: .5rem 1rem; margin: 0; }
        dt { color: #71717a; }
        dd { margin: 0; font-weight: 600; }
        .actions { display: flex; gap: .75rem; justify-content: center; margin-top: 2rem; }
        a, button { font: inherit; padding: .55rem 1.1rem; border-radius: .6rem; border: 1px solid #d4d4d8; background: #fff; color: inherit; text-decoration: none; cursor: pointer; }
        @media print { body { background: #fff; } main { box-shadow: none; margin: 0; } .actions { display: none; } }
    </style>
</head>
<body>
    <main>
        <h1>{{ config('app.name') }}</h1>
        <p style="text-align:center;margin:.25rem 0 0;color:#71717a">Fee payment receipt</p>
        @if ($payment->isPaid())
            <p class="status paid">Payment successful</p>
        @elseif ($payment->status === 'failed')
            <p class="status failed">The payment was not completed. No money was taken; please try again.</p>
        @else
            <p class="status pending">We are waiting for confirmation from {{ ucfirst($payment->gateway) }}.</p>
        @endif
        <dl>
            <dt>Receipt number</dt><dd>{{ $payment->reference }}</dd>
            <dt>Student</dt><dd>{{ $payment->student_name }}{{ $payment->class ? ' · '.$payment->class : '' }}</dd>
            <dt>Paid for</dt><dd>{{ $payment->purpose }}</dd>
            <dt>Amount</dt><dd>{{ config('school.payments.currency') }} {{ number_format((float) $payment->amount, 2) }}</dd>
            <dt>Paid by</dt><dd>{{ $payment->payer_name }}</dd>
            <dt>Method</dt><dd>{{ $payment->gateway === 'esewa' ? 'eSewa' : 'Khalti' }}</dd>
            @if ($payment->isPaid())
                <dt>Transaction</dt><dd>{{ $payment->gateway_reference }}</dd>
                <dt>Date</dt><dd>{{ $payment->paid_at->format('j M Y, g:i A') }}</dd>
            @endif
        </dl>
        <div class="actions">
            @if ($payment->isPaid())
                <button type="button" onclick="window.print()">Print receipt</button>
            @endif
            <a href="{{ url('/') }}">Back to the website</a>
        </div>
    </main>
</body>
</html>
