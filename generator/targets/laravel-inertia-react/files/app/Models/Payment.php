<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A fee payment made online through eSewa or Khalti.
 */
class Payment extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'reference',
        'gateway',
        'status',
        'amount',
        'purpose',
        'student_name',
        'class',
        'payer_name',
        'email',
        'phone',
        'gateway_reference',
        'gateway_response',
        'paid_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'gateway_response',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'gateway_response' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
