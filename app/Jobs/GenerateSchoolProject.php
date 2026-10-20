<?php

namespace App\Jobs;

use App\Models\GenerationRun;
use App\Services\Generator;
use App\Support\ProjectAssets;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Writes a project's codebase (or syncs an existing one) using the generator CLI,
 * streaming its output into the run log so Studio can show progress.
 */
class GenerateSchoolProject implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 1;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout;

    public function __construct(public GenerationRun $run)
    {
        $this->timeout = config('studio.timeout') + 60;
    }

    /**
     * Execute the job.
     */
    public function handle(Generator $generator): void
    {
        $run = $this->run;
        $project = $run->project;
        $run->update(['status' => GenerationRun::STATUS_RUNNING, 'started_at' => now(), 'log' => '']);

        $lastSave = microtime(true);
        $config = [...$project->config, 'target' => $run->target];

        try {
            $result = $generator->generate($config, $run->output_path, $run->install, function (string $output) use ($run, &$lastSave): void {
                $run->appendLog($output);

                if (microtime(true) - $lastSave > 1) {
                    $run->save();
                    $lastSave = microtime(true);
                }
            });

            $run->status = $result->successful() ? GenerationRun::STATUS_SUCCEEDED : GenerationRun::STATUS_FAILED;
            $run->appendLog($result->errorOutput());

            if ($result->successful()) {
                $copied = ProjectAssets::copyInto($config, $run->output_path, $run->target);
                $run->appendLog($copied > 0 ? "\nCopied {$copied} uploaded image(s) into the project.\n" : '');
            }
        } catch (Throwable $exception) {
            $run->status = GenerationRun::STATUS_FAILED;
            $run->appendLog("\n".$exception->getMessage());
        }

        $run->finished_at = now();
        $run->save();

        if ($run->status === GenerationRun::STATUS_SUCCEEDED) {
            $project->update(['output_path' => $run->output_path]);
        }
    }

    /**
     * Handle a job failure (e.g. a timeout) so the run never stays "running".
     */
    public function failed(?Throwable $exception): void
    {
        $this->run->appendLog("\n".($exception?->getMessage() ?? 'Generation failed.'));
        $this->run->update(['status' => GenerationRun::STATUS_FAILED, 'finished_at' => now(), 'log' => $this->run->log]);
    }
}
