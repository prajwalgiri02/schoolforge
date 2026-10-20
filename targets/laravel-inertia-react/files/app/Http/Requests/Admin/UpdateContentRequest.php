<?php

namespace App\Http\Requests\Admin;

use App\Support\ContentSchema;
use Illuminate\Foundation\Http\FormRequest;

class UpdateContentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        abort_if(ContentSchema::find($this->contentKey()) === null, 404);

        return ContentSchema::rules($this->contentKey());
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ContentSchema::find($this->contentKey()) === null ? [] : ContentSchema::attributes($this->contentKey());
    }

    private function contentKey(): string
    {
        return (string) $this->route('key');
    }
}
