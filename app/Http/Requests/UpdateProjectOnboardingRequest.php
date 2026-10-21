<?php

namespace App\Http\Requests;

use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectOnboardingRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:150'],
            'tagline' => ['nullable', 'string', 'max:200'],
            'established' => ['nullable', 'integer', 'min:1800', 'max:'.now()->year],
            'logo' => ['nullable', 'string', 'max:500'],
            'address' => ['nullable', 'string', 'max:200'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:190'],
            'summary' => ['nullable', 'string', 'max:1000'],
            'principal_name' => ['nullable', 'string', 'max:120'],
            'principal_message' => ['nullable', 'string', 'max:5000'],
            'theme' => ['required', Rule::in(array_column(app(Generator::class)->registry()['themes'], 'name'))],
            'primary_color' => ['nullable', 'string', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
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
            'established.*' => 'Enter the year as four digits, e.g. 1998.',
            'primary_color.regex' => 'Use a hex colour such as #1b365d.',
        ];
    }
}
