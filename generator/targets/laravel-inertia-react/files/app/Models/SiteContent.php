<?php

namespace App\Models;

use Database\Factories\SiteContentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A block of school content edited in the admin panel. It overrides the matching
 * part of the generated site data until it is reset.
 *
 * @property string $key
 * @property array<mixed> $value
 */
class SiteContent extends Model
{
    /** @use HasFactory<SiteContentFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
        'updated_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }
}
