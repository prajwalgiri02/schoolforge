<?php

namespace Tests\Feature;

use App\Models\FormSubmission;
use App\Models\User;
use App\Support\SchoolSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FormSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
        Storage::fake('local');
        Storage::fake('public');
        config(['mail.default' => 'array']);
    }

    /**
     * @return array<string, mixed>
     */
    private function admission(array $overrides = []): array
    {
        return [
            'studentName' => 'Aarav Sharma',
            'dateOfBirth' => '2019-04-12',
            'gender' => 'male',
            'grade' => 'Grade 1',
            'name' => 'Sita Sharma',
            'relationship' => 'mother',
            'phone' => '9800000000',
            'email' => 'sita@example.com',
            'birthCertificate' => UploadedFile::fake()->create('birth.pdf', 300, 'application/pdf'),
            'consent' => '1',
            ...$overrides,
        ];
    }

    public function test_admission_applications_are_stored_with_their_documents(): void
    {
        $response = $this->postJson('/forms/admission', $this->admission())->assertCreated();

        $submission = FormSubmission::query()->sole();
        $this->assertSame($response->json('reference'), $submission->reference);
        $this->assertMatchesRegularExpression('/^ADM-\d{2}-[A-Z0-9]{6}$/', $submission->reference);
        $this->assertSame('received', $submission->status);
        $this->assertSame('Sita Sharma', $submission->name);
        $this->assertSame('Grade 1', $submission->data['grade']);
        $this->assertArrayNotHasKey('consent', $submission->data);
        Storage::disk('local')->assertExists($submission->files['birthCertificate']['path']);
        $this->assertSame('birth.pdf', $submission->files['birthCertificate']['name']);
    }

    public function test_applications_are_validated_against_the_form_definition(): void
    {
        $this->postJson('/forms/admission', $this->admission([
            'studentName' => '',
            'email' => 'not-an-email',
            'gender' => 'unknown',
            'consent' => '',
            'birthCertificate' => UploadedFile::fake()->create('virus.exe', 10),
        ]))->assertUnprocessable()->assertJsonValidationErrors(['studentName', 'email', 'gender', 'consent', 'birthCertificate']);

        $this->postJson('/forms/admission', $this->admission(['photo' => UploadedFile::fake()->image('photo.jpg')->size(3000)]))
            ->assertJsonValidationErrors('photo');

        $this->postJson('/forms/unknown', [])->assertNotFound();
        $this->assertDatabaseCount(FormSubmission::class, 0);
    }

    public function test_the_school_and_applicant_are_emailed(): void
    {
        config(['school.contact_recipient' => 'office@example.com']);

        $this->postJson('/forms/admission', $this->admission())->assertCreated();

        $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(2, $messages);
        $this->assertSame('office@example.com', $messages[0]->getEnvelope()->getRecipients()[0]->getAddress());
        $this->assertSame('sita@example.com', $messages[1]->getEnvelope()->getRecipients()[0]->getAddress());
        $this->assertStringContainsString(FormSubmission::query()->sole()->reference, $messages[1]->getOriginalMessage()->getSubject());
    }

    public function test_applicants_can_track_their_application(): void
    {
        $submission = FormSubmission::factory()->create(['email' => 'Sita@Example.com', 'status' => 'interview']);

        $this->getJson('/forms/status?'.http_build_query(['reference' => strtolower($submission->reference), 'email' => 'sita@example.com']))
            ->assertOk()
            ->assertJson(['reference' => $submission->reference, 'status' => 'interview']);

        $this->getJson('/forms/status?'.http_build_query(['reference' => $submission->reference, 'email' => 'someone@example.com']))->assertNotFound();

        $testimonial = FormSubmission::factory()->testimonial()->create();
        $this->getJson('/forms/status?'.http_build_query(['reference' => $testimonial->reference, 'email' => $testimonial->email]))->assertNotFound();
    }

    public function test_job_applications_require_a_cv(): void
    {
        $base = ['position' => 'Science Teacher', 'name' => 'Ram', 'email' => 'ram@example.com', 'phone' => '98000'];

        $this->postJson('/forms/job', $base)->assertJsonValidationErrors('cv');
        $this->postJson('/forms/job', [...$base, 'cv' => UploadedFile::fake()->create('cv.docx', 100)])->assertCreated();

        $this->assertSame('Science Teacher', FormSubmission::query()->sole()->data['position']);
    }

    public function test_admins_review_applications_and_download_documents(): void
    {
        $this->postJson('/forms/admission', $this->admission())->assertCreated();
        $submission = FormSubmission::query()->sole();
        $admin = User::factory()->create();

        $this->get('/admin/submissions')->assertRedirect('/admin/login');

        $this->actingAs($admin)->get('/admin/submissions?type=admission')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Submissions/Index')
                ->where('submissions.total', 1)
                ->where('types.0.open', 1));

        $this->actingAs($admin)->get("/admin/submissions/{$submission->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Submissions/Show')
                ->where('fields', fn ($fields): bool => collect($fields)->firstWhere('name', 'gender')['value'] === 'Male'));

        $this->actingAs($admin)->get("/admin/submissions/{$submission->id}/files/birthCertificate")->assertOk()->assertDownload('birth.pdf');
        $this->actingAs($admin)->get("/admin/submissions/{$submission->id}/files/photo")->assertNotFound();

        $this->actingAs($admin)->patch("/admin/submissions/{$submission->id}", ['status' => 'accepted', 'notes' => 'Strong interview.'])->assertSessionHasNoErrors();
        $this->assertSame('accepted', $submission->fresh()->status);
        $this->assertNotNull($submission->fresh()->reviewed_at);

        $this->actingAs($admin)->patch("/admin/submissions/{$submission->id}", ['status' => 'approved'])->assertSessionHasErrors('status');

        $this->actingAs($admin)->delete("/admin/submissions/{$submission->id}")->assertRedirect();
        $this->assertDatabaseCount(FormSubmission::class, 0);
        Storage::disk('local')->assertMissing("submissions/{$submission->reference}/birthCertificate.pdf");
    }

    public function test_approving_a_testimonial_publishes_it(): void
    {
        $this->postJson('/forms/testimonial', [
            'name' => 'Gita Rai',
            'email' => 'gita@example.com',
            'role' => 'Parent of a Grade 4 student',
            'quote' => 'The teachers know every child by name.',
            'photo' => UploadedFile::fake()->image('gita.jpg'),
        ])->assertCreated();

        $submission = FormSubmission::query()->sole();
        $this->assertSame('pending', $submission->status);
        $before = count(app(SchoolSite::class)->data()['content']['testimonials'] ?? []);

        $this->actingAs(User::factory()->create())->patch("/admin/submissions/{$submission->id}", ['status' => 'approved'])->assertSessionHas('success');

        $testimonials = app(SchoolSite::class)->data()['content']['testimonials'];
        $this->assertCount($before + 1, $testimonials);
        $this->assertSame('The teachers know every child by name.', end($testimonials)['quote']);
        Storage::disk('public')->assertExists(ltrim(str_replace('/storage/', '', end($testimonials)['photo']), '/'));
    }
}
