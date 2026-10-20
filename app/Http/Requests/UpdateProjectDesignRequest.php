<?php

namespace App\Http\Requests;

use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProjectDesignRequest extends FormRequest
{
    /**
     * Colour tokens a school can override.
     *
     * @var list<string>
     */
    public const COLOR_TOKENS = ['primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground', 'background', 'foreground', 'muted', 'mutedForeground', 'surface', 'border'];

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
            'theme' => ['required', Rule::in(array_column($registry['themes'], 'name'))],
            'colors' => ['nullable', 'array:'.implode(',', self::COLOR_TOKENS)],
            'colors.*' => ['nullable', 'string', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
            'fonts' => ['nullable', 'array:heading,body'],
            'fonts.*' => ['nullable', 'string', 'max:80', 'regex:/^[A-Za-z0-9 ]+$/'],
            'variants' => ['nullable', 'array'],
            'variants.*' => ['nullable', 'string', 'max:40'],
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
            'colors.*.regex' => 'Use a hex colour such as #1b365d.',
            'fonts.*.regex' => 'Use a Google Fonts family name, such as Merriweather.',
        ];
    }

    /**
     * Check every variant is offered by its component.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $components = collect(app(Generator::class)->registry()['components'])->keyBy('name');

                foreach ($this->input('variants') ?? [] as $component => $variant) {
                    if (blank($variant)) {
                        continue;
                    }

                    if (! $components->has($component) || ! in_array($variant, $components[$component]['variants'], true)) {
                        $validator->errors()->add("variants.{$component}", "“{$variant}” is not a layout of {$component}.");
                    }
                }
            },
        ];
    }
}
