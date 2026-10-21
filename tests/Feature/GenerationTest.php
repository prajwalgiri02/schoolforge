<?php

namespace Tests\Feature;

use App\Jobs\GenerateSchoolProject;
use App\Models\GenerationRun;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GenerationTest extends TestCase
{
    use RefreshDatabase;

    private string $outputRoot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
        $this->outputRoot = sys_get_temp_dir().'/schoolforge-studio-test-'.Str::random(8);
        config(['studio.output_path' => $this->outputRoot]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->outputRoot);

        parent::tearDown();
    }

    public function test_generate_page_shows_validation_and_defaults(): void
    {
        $project = Project::factory()->example()->create();

        $this->get("/projects/{$project->slug}/generate")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Generate')
                ->where('validation.ok', true)
                ->where('validation.pageCount', 13)
                ->where('defaults.outputPath', "{$this->outputRoot}/{$project->slug}")
                ->where('defaults.isExisting', false)
                ->has('runs', 0));
    }

    public function test_generation_is_queued(): void
    {
        Queue::fake();
        $project = Project::factory()->create();

        $this->post("/projects/{$project->slug}/generate", ['target' => 'laravel-inertia-react', 'output_path' => "{$this->outputRoot}/site", 'install' => true])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $run = GenerationRun::query()->sole();
        $this->assertSame('laravel-inertia-react', $run->target);
        $this->assertTrue($run->install);
        $this->assertSame(GenerationRun::STATUS_QUEUED, $run->status);
        $this->assertSame('laravel-inertia-react', $project->fresh()->config['target']);
        Queue::assertPushed(GenerateSchoolProject::class, fn (GenerateSchoolProject $job): bool => $job->run->is($run));
    }

    public function test_output_folder_is_validated(): void
    {
        Queue::fake();
        $project = Project::factory()->create();
        File::ensureDirectoryExists("{$this->outputRoot}/busy");
        File::put("{$this->outputRoot}/busy/.gitignore", 'x');

        foreach (['relative/path', "{$this->outputRoot}/../escape", base_path(), base_path('app'), "{$this->outputRoot}/busy"] as $path) {
            $this->post("/projects/{$project->slug}/generate", ['target' => 'nextjs', 'output_path' => $path])->assertSessionHasErrors('output_path');
        }

        Queue::assertNothingPushed();
    }

    public function test_invalid_configs_cannot_be_generated(): void
    {
        Queue::fake();
        $project = Project::factory()->create();
        $project->update(['config' => [...$project->config, 'events' => [['title' => 'x', 'date' => 'soon']]]]);

        $this->post("/projects/{$project->slug}/generate", ['target' => 'nextjs', 'output_path' => "{$this->outputRoot}/site"])->assertSessionHasErrors('config');

        Queue::assertNothingPushed();
    }

    public function test_only_one_generation_runs_at_a_time(): void
    {
        Queue::fake();
        $project = Project::factory()->create();
        GenerationRun::factory()->for($project)->create(['status' => GenerationRun::STATUS_RUNNING]);

        $this->post("/projects/{$project->slug}/generate", ['target' => 'nextjs', 'output_path' => "{$this->outputRoot}/site"])->assertSessionHasErrors('output_path');
    }

    public function test_job_generates_a_project_and_copies_uploads(): void
    {
        Storage::fake('public');
        $upload = substr($this->post('/uploads', ['file' => UploadedFile::fake()->image('campus.jpg', 2400, 1600)])->json('url'), strlen('/storage/'));

        $project = Project::factory()->example()->create();
        $project->update(['config' => [...$project->config, 'hero' => [...$project->config['hero'], 'image' => '/storage/'.$upload]]]);
        $output = "{$this->outputRoot}/riverside";

        $run = GenerationRun::factory()->for($project)->create(['target' => 'nextjs', 'output_path' => $output]);
        GenerateSchoolProject::dispatchSync($run);

        $run->refresh();
        $this->assertSame(GenerationRun::STATUS_SUCCEEDED, $run->status, $run->log);
        $this->assertStringContainsString('Copied 4 uploaded image', $run->log, 'the image and its three responsive copies');
        $this->assertFileExists("{$output}/.schoolforge.json");
        $this->assertFileExists("{$output}/src/school/components/hero/index.tsx");
        $this->assertFileExists("{$output}/public/storage/{$upload}");
        $this->assertFileExists("{$output}/public/storage/".str_replace('.r.webp', '.960.webp', $upload));
        $this->assertSame($output, $project->fresh()->output_path);

        $project->update(['config' => [...$project->fresh()->config, 'school' => [...$project->config['school'], 'name' => 'Renamed School']]]);
        $sync = GenerationRun::factory()->for($project)->create(['target' => 'nextjs', 'output_path' => $output]);
        GenerateSchoolProject::dispatchSync($sync);

        $this->assertSame(GenerationRun::STATUS_SUCCEEDED, $sync->fresh()->status, $sync->fresh()->log);
        $this->assertSame('Renamed School', json_decode(File::get("{$output}/src/school/site.json"), true)['school']['name']);
    }

    public function test_generated_project_is_committed_and_pushed(): void
    {
        $project = Project::factory()->create();
        $remote = "{$this->outputRoot}/remote.git";
        File::ensureDirectoryExists($remote);
        exec('git init --bare -q '.escapeshellarg($remote));
        $output = "{$this->outputRoot}/published";

        $this->post("/projects/{$project->slug}/generate", ['target' => 'nextjs', 'output_path' => $output, 'git_commit' => true, 'git_remote' => $remote])->assertSessionHasNoErrors();

        $run = GenerationRun::query()->sole();
        $this->assertSame(GenerationRun::STATUS_SUCCEEDED, $run->status, $run->log);
        $this->assertSame($remote, $project->fresh()->git_remote);
        $this->assertStringContainsString('git push', $run->log);

        $files = shell_exec('git --git-dir='.escapeshellarg($remote).' ls-tree -r --name-only main');
        $this->assertStringContainsString('src/school/site.json', $files);
        $this->assertStringContainsString('Update '.$project->name, shell_exec('git --git-dir='.escapeshellarg($remote).' log -1 --format=%s main'));

        $again = GenerationRun::factory()->for($project)->create(['output_path' => $output, 'git_commit' => true, 'git_remote' => $remote]);
        GenerateSchoolProject::dispatchSync($again);
        $this->assertSame(GenerationRun::STATUS_SUCCEEDED, $again->fresh()->status, $again->fresh()->log);
        $this->assertStringContainsString('Nothing new to commit', $again->fresh()->log);
    }

    public function test_repository_urls_are_validated(): void
    {
        Queue::fake();
        $project = Project::factory()->create();

        $this->post("/projects/{$project->slug}/generate", ['target' => 'nextjs', 'output_path' => "{$this->outputRoot}/x", 'git_commit' => true, 'git_remote' => 'not a url; rm -rf /'])
            ->assertSessionHasErrors('git_remote');
    }

    public function test_failed_generation_is_recorded(): void
    {
        $project = Project::factory()->create();
        $output = "{$this->outputRoot}/occupied";
        File::ensureDirectoryExists($output);
        File::put("{$output}/README.md", 'someone else');

        $run = GenerationRun::factory()->for($project)->create(['output_path' => $output]);
        GenerateSchoolProject::dispatchSync($run);

        $this->assertSame(GenerationRun::STATUS_FAILED, $run->fresh()->status);
        $this->assertStringContainsString('is not empty', $run->fresh()->log);
        $this->assertNotNull($run->fresh()->finished_at);
    }
}
