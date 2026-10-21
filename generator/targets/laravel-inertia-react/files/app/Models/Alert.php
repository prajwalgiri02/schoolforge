<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A notice sent to subscribers by email from the admin panel.
 */
class Alert extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'subject',
        'message',
        'email_count',
        'error',
        'sent_by',
        'sent_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
