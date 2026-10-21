<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ResultsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }

    private function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('results.csv', $content);
    }

    public function test_admins_import_results_from_csv(): void
    {
        $admin = User::factory()->create();
        $csv = "\u{FEFF}Symbol No.,Name,DOB,Class,English,गणित,GPA,Result\n1001,Aarav Sharma,२०६८/५/१२,10 A,A+,A,3.75,Passed\n1002,Gita Rai,2068-07-01,10 B,B+,,3.10,Passed\n\n";

        $this->actingAs($admin)->post('/admin/results', ['name' => 'Annual Exam 2082', 'file' => $this->csv($csv)])->assertSessionHasNoErrors();

        $exam = Exam::query()->sole();
        $this->assertNull($exam->published_at);
        $this->assertSame(2, $exam->results()->count());

        $result = ExamResult::query()->where('symbol_number', '1001')->sole();
        $this->assertSame('2068-5-12', $result->date_of_birth);
        $this->assertSame('10 A', $result->class);
        $this->assertSame([['subject' => 'English', 'grade' => 'A+'], ['subject' => 'गणित', 'grade' => 'A']], $result->subjects);
        $this->assertCount(1, ExamResult::query()->where('symbol_number', '1002')->sole()->subjects, 'empty subjects are skipped');

        $this->actingAs($admin)->get('/admin/results')->assertInertia(fn (Assert $page) => $page->component('Admin/Results')->where('exams.0.results_count', 2));
    }

    public function test_bad_files_are_rejected_without_saving(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->post('/admin/results', ['name' => 'Exam', 'file' => $this->csv("name,english\nAarav,A\n")])
            ->assertSessionHasErrors(['file' => 'The first row needs a “symbol_number” column.']);
        $this->actingAs($admin)->post('/admin/results', ['name' => 'Exam', 'file' => $this->csv("symbol,name\n1,A\n1,B\n")])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount(Exam::class, 0);
    }

    public function test_reimporting_replaces_an_exams_results(): void
    {
        $admin = User::factory()->create();
        $this->actingAs($admin)->post('/admin/results', ['name' => 'Exam', 'file' => $this->csv("symbol,name\n1,A\n2,B\n")]);
        $exam = Exam::query()->sole();

        $this->actingAs($admin)->post('/admin/results', ['exam_id' => $exam->id, 'file' => $this->csv("symbol,name\n3,C\n")])->assertSessionHasNoErrors();

        $this->assertSame(['3'], $exam->results()->pluck('symbol_number')->all());
    }

    public function test_students_look_up_published_results_with_their_date_of_birth(): void
    {
        $admin = User::factory()->create();
        $this->actingAs($admin)->post('/admin/results', ['name' => 'Annual Exam', 'file' => $this->csv("symbol,name,dob,gpa\n1001,Aarav,2068-05-12,3.75\n2002,Gita,,3.10\n")]);
        $exam = Exam::query()->sole();
        $lookup = fn (array $query) => $this->getJson('/results/lookup?'.http_build_query(['exam' => $exam->id, ...$query]));

        $this->getJson('/results/exams')->assertExactJson([]);
        $lookup(['symbol' => '1001', 'dob' => '2068-05-12'])->assertNotFound();

        $this->actingAs($admin)->patch("/admin/results/{$exam->id}");
        $this->assertNotNull($exam->fresh()->published_at);

        $this->getJson('/results/exams')->assertExactJson([['id' => $exam->id, 'name' => 'Annual Exam']]);
        $lookup(['symbol' => '1001', 'dob' => '२०६८-०५-१२'])->assertOk()->assertJson(['studentName' => 'Aarav', 'gpa' => '3.75', 'exam' => 'Annual Exam']);
        $lookup(['symbol' => '1001', 'dob' => '2068-05-13'])->assertNotFound();
        $lookup(['symbol' => '2002'])->assertOk()->assertJson(['studentName' => 'Gita']);
        $lookup(['symbol' => '9999'])->assertNotFound();
    }

    public function test_the_template_and_deleting_exams(): void
    {
        $admin = User::factory()->create();
        $this->assertStringContainsString('symbol_number,student_name', $this->actingAs($admin)->get('/admin/results/template.csv')->streamedContent());

        $exam = Exam::create(['name' => 'Old']);
        $exam->results()->create(['symbol_number' => '1', 'student_name' => 'A', 'subjects' => []]);

        $this->actingAs($admin)->delete("/admin/results/{$exam->id}")->assertSessionHas('success');
        $this->assertDatabaseCount(ExamResult::class, 0);
    }

    public function test_the_results_page_exists(): void
    {
        $this->get('/results')->assertOk()->assertInertia(fn (Assert $page) => $page->where('slug', '/results'));
    }
}
