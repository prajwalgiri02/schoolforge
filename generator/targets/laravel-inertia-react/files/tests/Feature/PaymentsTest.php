<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\User;
use App\Support\Payments\Esewa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config([
            'inertia.ssr.enabled' => false,
            'mail.default' => 'array',
            // eSewa's published test credentials.
            'school.payments.esewa' => ['product_code' => 'EPAYTEST', 'secret_key' => '8gBm/:&EnhH.1/q', 'live' => false],
            'school.payments.khalti' => ['secret_key' => 'test-khalti-key', 'live' => false],
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function payment(string $gateway): array
    {
        return ['gateway' => $gateway, 'purpose' => 'Admission fee', 'amount' => '15000', 'student_name' => 'Aarav Sharma', 'class' => '1', 'payer_name' => 'Sita Sharma', 'email' => 'sita@example.com'];
    }

    public function test_only_configured_gateways_are_offered(): void
    {
        $this->getJson('/payments/options')->assertJson(['gateways' => [['id' => 'esewa'], ['id' => 'khalti']]]);

        config(['school.payments.khalti.secret_key' => null]);
        $this->getJson('/payments/options')->assertExactJson(['gateways' => [['id' => 'esewa', 'label' => 'eSewa']], 'currency' => 'NPR']);
        $this->postJson('/payments', $this->payment('khalti'))->assertJsonValidationErrors('gateway');
    }

    public function test_esewa_payments_are_signed_and_verified(): void
    {
        $response = $this->postJson('/payments', $this->payment('esewa'))->assertOk();
        $payment = Payment::query()->sole();
        $fields = $response->json('form.fields');

        $this->assertSame('https://rc-epay.esewa.com.np/api/epay/main/v2/form', $response->json('form.action'));
        $this->assertSame($payment->reference, $fields['transaction_uuid']);
        $this->assertSame('15000', $fields['total_amount']);
        $this->assertSame(
            base64_encode(hash_hmac('sha256', "total_amount=15000,transaction_uuid={$payment->reference},product_code=EPAYTEST", '8gBm/:&EnhH.1/q', true)),
            $fields['signature'],
        );

        Http::fake(['rc.esewa.com.np/*' => Http::response(['status' => 'COMPLETE', 'ref_id' => '000AE01'])]);

        $result = ['transaction_code' => '000AE01', 'status' => 'COMPLETE', 'total_amount' => '15,000.0', 'transaction_uuid' => $payment->reference, 'product_code' => 'EPAYTEST', 'signed_field_names' => 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names'];
        $result['signature'] = Esewa::sign($result, $result['signed_field_names']);

        $this->get('/payments/esewa?data='.base64_encode(json_encode($result)))->assertRedirectContains('/payments/receipt/'.$payment->reference);

        $payment->refresh();
        $this->assertTrue($payment->isPaid());
        $this->assertSame('000AE01', $payment->gateway_reference);
        Http::assertSent(fn (Request $request): bool => str_contains($request->url(), 'transaction_uuid='.$payment->reference) && str_contains($request->url(), 'total_amount=15000'));
        $this->assertCount(1, Mail::mailer('array')->getSymfonyTransport()->messages());
    }

    public function test_tampered_esewa_results_are_rejected(): void
    {
        $this->postJson('/payments', $this->payment('esewa'));
        $payment = Payment::query()->sole();
        Http::fake();

        $forged = ['status' => 'COMPLETE', 'transaction_uuid' => $payment->reference, 'total_amount' => '15000', 'product_code' => 'EPAYTEST', 'signed_field_names' => 'status,transaction_uuid', 'signature' => 'not-the-signature'];
        $this->get('/payments/esewa?data='.base64_encode(json_encode($forged)))->assertRedirect();

        $this->assertSame('failed', $payment->fresh()->status);
        Http::assertNothingSent();
    }

    public function test_khalti_payments_are_initiated_and_looked_up(): void
    {
        Http::fake([
            'dev.khalti.com/api/v2/epayment/initiate/' => Http::response(['pidx' => 'PIDX123', 'payment_url' => 'https://test-pay.khalti.com/?pidx=PIDX123']),
            'dev.khalti.com/api/v2/epayment/lookup/' => Http::response(['pidx' => 'PIDX123', 'status' => 'Completed', 'total_amount' => 1500000, 'transaction_id' => 'KTX9']),
        ]);

        $this->postJson('/payments', $this->payment('khalti'))->assertOk()->assertJson(['redirect' => 'https://test-pay.khalti.com/?pidx=PIDX123']);

        Http::assertSent(fn (Request $request): bool => $request->hasHeader('Authorization', 'Key test-khalti-key')
            && $request['amount'] === 1500000
            && $request['purchase_order_id'] === Payment::query()->sole()->reference);

        $this->get('/payments/khalti?pidx=PIDX123&status=Completed')->assertRedirect();

        $payment = Payment::query()->sole();
        $this->assertTrue($payment->isPaid());
        $this->assertSame('KTX9', $payment->gateway_reference);
    }

    public function test_khalti_short_payments_and_cancellations_fail(): void
    {
        Http::fake([
            '*/epayment/initiate/' => Http::response(['pidx' => 'P1', 'payment_url' => 'https://test-pay.khalti.com/?pidx=P1']),
            '*/epayment/lookup/' => Http::response(['status' => 'Completed', 'total_amount' => 100]),
        ]);

        $this->postJson('/payments', $this->payment('khalti'));
        $this->get('/payments/khalti?pidx=P1&status=Completed');
        $this->assertSame('failed', Payment::query()->sole()->status, 'a lookup for a different amount does not count');
    }

    public function test_gateway_errors_are_reported_to_the_payer(): void
    {
        Http::fake(['*/epayment/initiate/' => Http::response(['detail' => 'Invalid token.'], 401)]);

        $this->postJson('/payments', $this->payment('khalti'))->assertStatus(502)->assertJsonStructure(['message']);
        $this->assertSame('failed', Payment::query()->sole()->status);
    }

    public function test_receipts_need_a_signed_link(): void
    {
        $payment = Payment::create([...$this->payment('esewa'), 'reference' => 'PAY-26-TEST0001', 'status' => 'paid', 'paid_at' => now(), 'gateway_reference' => 'X1']);

        $this->get('/payments/receipt/PAY-26-TEST0001')->assertForbidden();
        $this->get(URL::signedRoute('school.payments.receipt', $payment->reference))->assertOk()->assertSee('Payment successful')->assertSee('15,000.00');
    }

    public function test_admins_see_payments_and_totals(): void
    {
        Payment::create([...$this->payment('esewa'), 'reference' => 'PAY-26-A', 'status' => 'paid', 'paid_at' => now()]);
        Payment::create([...$this->payment('khalti'), 'reference' => 'PAY-26-B', 'status' => 'failed']);
        $admin = User::factory()->create();

        $this->actingAs($admin)->get('/admin/payments')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Payments')
            ->where('totals.all', 15000)
            ->where('payments.total', 1));

        $this->assertStringContainsString('PAY-26-A', $this->actingAs($admin)->get('/admin/payments/export.csv')->streamedContent());
    }
}
