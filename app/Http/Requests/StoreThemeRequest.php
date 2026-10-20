<?php

namespace App\Http\Requests;

use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreThemeRequest extends FormRequest
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
        $themes = array_column(app(Generator::class)->registry()['themes'], 'name');

        return [
            'name' => ['required', 'string', 'max:40', 'regex:/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/', Rule::notIn($themes)],
            'from' => ['required', Rule::in($themes)],
            'label' => ['nullable', 'string', 'max:60'],
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
            'name.regex' => 'Use lowercase letters, numbers and dashes, e.g. royal-blue.',
            'name.not_in' => 'A theme with this name already exists.',
        ];
    }
}
