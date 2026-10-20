<?php

namespace App\Http\Requests;

use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreComponentRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:40', 'regex:/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/', Rule::notIn(array_column(app(Generator::class)->registry()['components'], 'name'))],
            'label' => ['nullable', 'string', 'max:60'],
            'variants' => ['nullable', 'string', 'max:200', 'regex:/^\s*[a-z][a-z0-9-]*(\s*,\s*[a-z][a-z0-9-]*)*\s*$/'],
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
            'name.regex' => 'Use lowercase letters, numbers and dashes, e.g. sports-highlights.',
            'name.not_in' => 'A component with this name already exists.',
            'variants.regex' => 'List layout names separated by commas, e.g. grid, list.',
        ];
    }

    /**
     * @return list<string>
     */
    public function variants(): array
    {
        $variants = array_values(array_unique(array_filter(array_map('trim', explode(',', (string) $this->validated('variants'))))));

        return $variants === [] ? ['default'] : $variants;
    }
}
