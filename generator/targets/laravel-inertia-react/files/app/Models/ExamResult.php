<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One student's marksheet for an exam.
 */
class ExamResult extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'exam_id',
        'symbol_number',
        'student_name',
        'date_of_birth',
        'class',
        'gpa',
        'result',
        'subjects',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subjects' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Exam, $this>
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * Dates of birth as typed by students and schools differ in separators,
     * leading zeros and digits (२०७५/५/१२ = 2075-05-12), so compare a normal form.
     */
    public static function normalizeDate(?string $value): string
    {
        $ascii = strtr(trim((string) $value), ['०' => '0', '१' => '1', '२' => '2', '३' => '3', '४' => '4', '५' => '5', '६' => '6', '७' => '7', '८' => '8', '९' => '9']);
        $parts = preg_split('/[^0-9]+/', $ascii, -1, PREG_SPLIT_NO_EMPTY);

        return implode('-', array_map(fn (string $part): string => (string) (int) $part, $parts));
    }
}
