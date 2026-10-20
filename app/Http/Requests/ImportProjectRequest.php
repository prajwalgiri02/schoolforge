<?php

namespace App\Http\Requests;

use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use JsonException;

class ImportProjectRequest extends FormRequest
{
    /**
     * @var array<string, mixed>|null
     */
    private ?array $config = null;

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
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:2048'],
        ];
    }

    /**
     * Parse the uploaded file and check it with the generator.
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

                try {
                    $config = json_decode($this->file('file')->get(), true, flags: JSON_THROW_ON_ERROR);
                } catch (JsonException) {
                    $validator->errors()->add('file', 'This file is not valid JSON.');

                    return;
                }

                if (! is_array($config)) {
                    $validator->errors()->add('file', 'This file is not a school config.');

                    return;
                }

                unset($config['$schema']);
                $result = app(Generator::class)->preview($config);

                if (! $result['ok']) {
                    $validator->errors()->add('file', 'The config has problems: '.implode(' ', array_slice($result['errors'], 0, 3)));

                    return;
                }

                $this->config = [...$config, 'target' => $config['target'] ?? 'nextjs', 'theme' => $config['theme'] ?? 'classic'];
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function config(): array
    {
        return $this->config;
    }
}
