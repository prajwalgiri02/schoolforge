<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateComponentRequest extends FormRequest
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
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:300'],
            'variants' => ['required', 'string', 'max:200', 'regex:/^\s*[a-z][a-z0-9-]*(\s*,\s*[a-z][a-z0-9-]*)*\s*$/'],
            'code' => ['sometimes', 'required', 'string', 'max:100000'],
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
            'variants.regex' => 'List layout names separated by commas, e.g. grid, list.',
        ];
    }

    /**
     * @return list<string>
     */
    public function variants(): array
    {
        return array_values(array_unique(array_filter(array_map('trim', explode(',', (string) $this->validated('variants'))))));
    }
}
