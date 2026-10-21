<?php

namespace App\Console\Commands;

use App\Support\Billing;
use Illuminate\Console\Command;

class IssueInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'studio:invoices';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Issue and email hosting invoices for schools whose paid period ends soon';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $invoices = Billing::issueDueInvoices();

        foreach ($invoices as $invoice) {
            $this->components->twoColumnDetail($invoice->number, $invoice->description.' · '.Billing::formatAmount($invoice->amount));
        }

        $this->components->info(count($invoices) === 1 ? '1 invoice issued.' : count($invoices).' invoices issued.');

        return self::SUCCESS;
    }
}
