<?php

namespace App\Http\Requests;

use App\Services\Generator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateThemeRequest extends FormRequest
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
        $isBase = ($this->theme()['extends'] ?? null) === null;
        $colorPresence = $isBase ? 'required' : 'nullable';

        return [
            'label' => ['required', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:300'],
            'colors' => ['nullable', 'array:'.implode(',', UpdateProjectDesignRequest::COLOR_TOKENS)],
            ...collect(UpdateProjectDesignRequest::COLOR_TOKENS)->mapWithKeys(fn (string $token): array => [
                "colors.{$token}" => [$colorPresence, 'string', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
            ])->all(),
            'fonts.heading' => [$isBase ? 'required' : 'nullable', 'string', 'max:80', 'regex:/^[A-Za-z0-9 ]+$/'],
            'fonts.body' => [$isBase ? 'required' : 'nullable', 'string', 'max:80', 'regex:/^[A-Za-z0-9 ]+$/'],
            'radius' => ['nullable', 'array:card,button'],
            'radius.*' => ['nullable', 'string', 'max:20', 'regex:/^(0|\d+(\.\d+)?(rem|px|em|%))$/'],
            'heading_weight' => ['nullable', 'integer', 'between:100,900', 'multiple_of:100'],
            'variants' => ['nullable', 'array'],
            'variants.*' => ['nullable', 'string', 'max:40'],
            'extra_css' => ['nullable', 'string', 'max:20000'],
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
            'colors.*.required' => 'Base themes must define every colour.',
            'fonts.*.regex' => 'Use a Google Fonts family name, such as Merriweather.',
            'radius.*.regex' => 'Use a CSS length such as 0.5rem, 8px or 0.',
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $components = collect(app(Generator::class)->registry()['components'])->pluck('variants', 'name');

                foreach ($this->input('variants') ?? [] as $component => $variant) {
                    if (filled($variant) && ! in_array($variant, $components[$component] ?? [], true)) {
                        $validator->errors()->add("variants.{$component}", "“{$variant}” is not a layout of {$component}.");
                    }
                }
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function theme(): array
    {
        return app(Generator::class)->theme((string) $this->route('theme')) ?? abort(404);
    }
}
