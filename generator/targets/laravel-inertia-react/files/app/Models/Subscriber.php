<?php

namespace App\Models;

use Database\Factories\SubscriberFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A parent or visitor who signed up for school news by email.
 */
class Subscriber extends Model
{
    /** @use HasFactory<SubscriberFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'locale',
        'token',
        'unsubscribed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'unsubscribed_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<Subscriber>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('unsubscribed_at');
    }
}
