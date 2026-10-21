<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SiteSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
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

    public function test_backups_are_copied_off_site(): void
    {
        Storage::fake('offsite');
        config(['studio.backup_disk' => 'offsite']);
        Storage::disk('offsite')->put('studio-backups/studio-backup-2020-01-01-000000.zip', 'old');
        Storage::disk('offsite')->put('studio-backups/notes.txt', 'keep me');

        $this->artisan('studio:backup', ['--keep' => 1])->expectsOutputToContain('Copied to the [offsite] disk (1 old copies removed)')->assertSuccessful();

        $copies = Storage::disk('offsite')->files('studio-backups');
        $this->assertCount(2, $copies);
        $this->assertContains('studio-backups/notes.txt', $copies);
        $this->assertSame(basename(File::glob("{$this->backups}/studio-backup-*.zip")[0]), basename(collect($copies)->first(fn (string $file): bool => str_ends_with($file, '.zip'))));
    }

    public function test_a_failing_off_site_copy_fails_the_command(): void
    {
        config(['studio.backup_disk' => 'no-such-disk']);

        $this->artisan('studio:backup')->expectsOutputToContain('could not be copied to the [no-such-disk] disk')->assertFailed();
        $this->assertCount(1, File::glob("{$this->backups}/studio-backup-*.zip"), 'the local backup is still written');
    }

    public function test_backup_is_scheduled_nightly(): void
    {
        $this->artisan('schedule:list')->expectsOutputToContain('studio:backup')->assertSuccessful();
    }
}
