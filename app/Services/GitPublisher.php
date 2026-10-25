<?php

namespace App\Services;

use App\Support\ProcessEnvironment;
use Closure;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use RuntimeException;

/**
 * Commits a generated project to git and optionally pushes it, which is how sites
 * reach hosts that deploy from a repository (Vercel, Laravel Cloud, Forge...).
 * Pushing uses this computer's own git credentials.
 */
class GitPublisher
{
    /**
     * @param  Closure(string): void  $output
     */
    public function publish(string $directory, ?string $remote, string $message, Closure $output): void
    {
        if (! File::isDirectory("{$directory}/.git")) {
            $this->git($directory, ['init', '-b', 'main'], $output);
        }

        $this->git($directory, ['add', '-A'], $output);

        if (trim($this->git($directory, ['status', '--porcelain'], $output, quiet: true)) === '') {
            $output("Nothing new to commit.\n");
        } else {
            $this->git($directory, ['-c', 'user.name=SchoolForge Studio', '-c', 'user.email=studio@schoolforge.local', 'commit', '-m', $message], $output);
        }

        if (blank($remote)) {
            return;
        }

        $hasOrigin = Process::path($directory)->env(ProcessEnvironment::variables())->run(['git', 'remote', 'get-url', 'origin'])->successful();
        $this->git($directory, $hasOrigin ? ['remote', 'set-url', 'origin', $remote] : ['remote', 'add', 'origin', $remote], $output);
        $this->git($directory, ['push', '-u', 'origin', 'HEAD:main'], $output);
    }

    /**
     * @param  list<string>  $arguments
     * @param  Closure(string): void  $output
     */
    private function git(string $directory, array $arguments, Closure $output, bool $quiet = false): string
    {
        if (! $quiet) {
            $output('$ git '.implode(' ', $arguments)."\n");
        }

        $result = Process::path($directory)
            ->env([...ProcessEnvironment::variables(), 'GIT_TERMINAL_PROMPT' => '0'])
            ->timeout(300)
            ->run(['git', ...$arguments]);

        if (! $quiet) {
            $output($result->output().$result->errorOutput());
        }

        if ($result->failed()) {
            throw new RuntimeException('git '.$arguments[0].' failed: '.trim($result->errorOutput()));
        }

        return $result->output();
    }
}
