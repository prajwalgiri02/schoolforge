<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Invoice {{ $invoice->number }}</title>
    <style>
        body { margin: 0; padding: 2rem 1rem; background: #f4f4f5; color: #18181b; font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
        .sheet { max-width: 46rem; margin: 0 auto; background: #fff; padding: 2.5rem; border-radius: .75rem; box-shadow: 0 1px 3px rgb(0 0 0 / .08); }
        header { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid #e4e4e7; padding-bottom: 1.5rem; }
        h1 { margin: 0; font-size: 1.5rem; }
        .muted { color: #71717a; }
        .status { display: inline-block; padding: .15rem .6rem; border-radius: 999px; font-size: .8rem; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }
        .status-paid { background: #ecfdf5; color: #047857; } .status-unpaid { background: #fffbeb; color: #b45309; } .status-void { background: #f4f4f5; color: #52525b; }
        table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
        th, td { text-align: left; padding: .6rem 0; border-bottom: 1px solid #f4f4f5; } th:last-child, td:last-child { text-align: right; }
        .total td { font-weight: 700; border-bottom: 0; font-size: 1.1rem; }
        button { margin-top: 1rem; padding: .5rem 1rem; border: 1px solid #d4d4d8; background: #fff; border-radius: .5rem; font: inherit; cursor: pointer; }
        @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; padding: 0; } button { display: none; } }
    </style>
</head>
<body>
    <div class="sheet">
        <header>
            <div>
                <h1>Invoice {{ $invoice->number }}</h1>
                <p class="muted">From {{ config('studio.billing_from') }}</p>
            </div>
            <div style="text-align: right">
                <span class="status status-{{ $invoice->status }}">{{ $invoice->status }}</span>
                <p class="muted">Issued {{ $invoice->created_at->format('j M Y') }}<br>Due {{ $invoice->due_on->format('j M Y') }}</p>
            </div>
        </header>
        <p><strong>Bill to</strong><br>{{ $invoice->project->name }}@if ($billingEmail)<br><span class="muted">{{ $billingEmail }}</span>@endif</p>
        <table>
            <thead><tr><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
                <tr><td>{{ $invoice->description }}<br><span class="muted">{{ $invoice->period_start->format('j M Y') }} – {{ $invoice->period_end->format('j M Y') }}</span></td><td>{{ \App\Support\Billing::formatAmount($invoice->amount) }}</td></tr>
                <tr class="total"><td>Total</td><td>{{ \App\Support\Billing::formatAmount($invoice->amount) }}</td></tr>
            </tbody>
        </table>
        @if ($invoice->paid_at)
            <p class="muted">Paid {{ $invoice->paid_at->format('j M Y') }}@if ($invoice->payment_reference) · Reference {{ $invoice->payment_reference }}@endif</p>
        @endif
        <button type="button" onclick="window.print()">Print or save as PDF</button>
    </div>
</body>
</html>
