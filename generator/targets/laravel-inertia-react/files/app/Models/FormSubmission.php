<?php

namespace App\Models;

use Database\Factories\FormSubmissionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * An admission application, job application, alumni registration or testimonial
 * sent through one of the website's forms (see resources/js/school/runtime/forms.json).
 */
class FormSubmission extends Model
{
    /** @use HasFactory<FormSubmissionFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'type',
        'reference',
        'status',
        'name',
        'email',
        'data',
        'files',
        'notes',
        'locale',
        'ip_address',
        'reviewed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'ip_address',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'files' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }
}
