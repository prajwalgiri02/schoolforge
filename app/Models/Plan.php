<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A hosting plan schools pay for, monthly or yearly, in rupees.
 */
#[Fillable(['name', 'price', 'period', 'description'])]
class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory;

    public const PERIODS = ['month', 'year'];

    /**
     * @return HasMany<Project, $this>
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * The last day of a billing period that starts on `$start`.
     */
    public function periodEnd(Carbon $start): Carbon
    {
        return ($this->period === 'year' ? $start->copy()->addYearNoOverflow() : $start->copy()->addMonthNoOverflow())->subDay();
    }
}
