<?php

namespace App\Http\Requests;

use App\Models\GenerationRun;
use App\Models\Project;
use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreGenerationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'target' => ['required', Rule::in(array_column(app(Generator::class)->registry()['targets'], 'name'))],
            'output_path' => ['required', 'string', 'max:500'],
            'install' => ['nullable', 'boolean'],
            'git_commit' => ['nullable', 'boolean'],
            'git_remote' => ['nullable', 'string', 'max:500', 'regex:/^(https:\/\/[^\s]+|git@[^\s:]+:[^\s]+|ssh:\/\/[^\s]+|\/[^\s]+)$/'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['output_path' => 'folder', 'git_remote' => 'repository URL'];
    }

    /**
     * Check the folder is safe to write to and the config is valid.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                /** @var Project $project */
                $project = $this->route('project');
                $path = $this->outputPath();
                $studio = rtrim(base_path(), '/');
                $generatedRoot = rtrim(config('studio.output_path'), '/');

                if (! Str::startsWith($path, '/') && ! preg_match('/^[A-Za-z]:[\\\\\/]/', $path)) {
                    $validator->errors()->add('output_path', 'Use a full folder path, such as /home/me/sites/my-school.');
                } elseif (preg_match('#(^|[/\\\\])\.\.([/\\\\]|$)#', $path)) {
                    $validator->errors()->add('output_path', 'The folder path cannot contain “..”.');
                } elseif (Str::startsWith($studio.'/', $path.'/') || (Str::startsWith($path, $studio.'/') && ! Str::startsWith($path, $generatedRoot.'/'))) {
                    $validator->errors()->add('output_path', 'Choose a folder outside the Studio app (or inside '.$generatedRoot.').');
                } elseif (File::exists($path) && ! File::isDirectory($path)) {
                    $validator->errors()->add('output_path', 'This path is a file, not a folder.');
                } elseif (File::isDirectory($path) && ! File::exists($path.'/.schoolforge.json') && array_diff(scandir($path), ['.', '..']) !== []) {
                    $validator->errors()->add('output_path', 'This folder is not empty. Choose an empty folder, or one that already holds this SchoolForge project.');
                } elseif (File::exists($path.'/.schoolforge.json') && (json_decode(File::get($path.'/.schoolforge.json'), true)['target'] ?? null) !== $this->input('target')) {
                    $validator->errors()->add('output_path', 'This folder holds a project for a different framework.');
                }

                if ($project->generationRuns()->whereIn('status', [GenerationRun::STATUS_QUEUED, GenerationRun::STATUS_RUNNING])->exists()) {
                    $validator->errors()->add('output_path', 'A generation is already in progress for this project.');
                }

                $preview = app(Generator::class)->preview([...$project->config, 'target' => $this->input('target')]);

                if (! $preview['ok']) {
                    $validator->errors()->add('config', 'Fix these problems first: '.implode(' ', $preview['errors']));
                }
            },
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'git_remote.regex' => 'Use a repository URL such as https://github.com/you/school-site.git or git@github.com:you/school-site.git.',
        ];
    }

    public function outputPath(): string
    {
        return rtrim(trim((string) $this->input('output_path')), '/\\');
    }
}
