<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SiteSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\Concerns\UsesTemporaryGenerator;
use Tests\TestCase;

class BackupTest extends TestCase
{
    use RefreshDatabase, UsesTemporaryGenerator;

    private string $backups;

    protected function setUp(): void
    {
        parent::setUp();

        $this->backups = storage_path('app/private/backups');
        File::deleteDirectory($this->backups);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->backups);

        parent::tearDown();
    }

    public function test_backup_and_restore_round_trip(): void
    {
        $project = Project::factory()->example()->create();
        User::factory()->create(['email' => 'owner@example.com']);
        File::put("{$this->generatorPath}/registry/themes/classic/extra.css", '/* custom */');
        $submission = $project->siteSubmissions()->create(['form' => 'job', 'reference' => 'JOB-26-BACKUP', 'data' => ['name' => 'Hari'], 'files' => ['cv' => ['path' => 'hosted-submissions/1/JOB-26-BACKUP/cv.pdf', 'name' => 'cv.pdf']]]);
        $cv = storage_path('app/private/hosted-submissions/1/JOB-26-BACKUP/cv.pdf');
        File::ensureDirectoryExists(dirname($cv));
        File::put($cv, 'cv');

        $this->artisan('studio:backup')->assertSuccessful();
        $backup = File::glob("{$this->backups}/studio-backup-*.zip")[0];

        Project::query()->delete();
        User::query()->delete();
        File::delete($cv);
        File::put("{$this->generatorPath}/registry/themes/classic/extra.css", '/* changed */');

        $this->artisan('studio:backup', ['--restore' => $backup, '--force' => true])->assertSuccessful();

        $this->assertSame($project->config, Project::query()->sole()->config);
        $this->assertTrue(User::query()->where('email', 'owner@example.com')->exists());
        $this->assertSame('/* custom */', File::get("{$this->generatorPath}/registry/themes/classic/extra.css"));
        $this->assertSame($submission->reference, SiteSubmission::query()->sole()->reference);
        $this->assertSame('cv', File::get($cv));
        File::deleteDirectory(storage_path('app/private/hosted-submissions/1'));
    }

    public function test_backup_is_scheduled_nightly(): void
    {
        $this->artisan('schedule:list')->expectsOutputToContain('studio:backup')->assertSuccessful();
    }
}
