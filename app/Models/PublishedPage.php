<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * The HTML of one page of a published school, rendered when it was published
 * so search engines see the content without running JavaScript.
 */
#[Fillable(['locale', 'slug', 'html'])]
class PublishedPage extends Model
{
    public $timestamps = false;
}
