<?php

namespace App\Http\Requests;

use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
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
        $registry = app(Generator::class)->registry();

        return [
            'name' => ['required', 'string', 'max:150'],
            'short_name' => ['nullable', 'string', 'max:60'],
            'tagline' => ['nullable', 'string', 'max:200'],
            'target' => ['required', Rule::in(array_column($registry['targets'], 'name'))],
            'theme' => ['required', Rule::in(array_column($registry['themes'], 'name'))],
            'start_with' => ['required', Rule::in(['sample', 'blank'])],
        ];
    }
}
