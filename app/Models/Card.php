<?php

namespace App\Models;

use Database\Factories\CardFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'kind', 'number', 'format', 'color', 'holder', 'note', 'uses', 'last_used_at'])]
#[Hidden(['user_id'])]
class Card extends Model
{
    /** @use HasFactory<CardFactory> */
    use HasFactory;

    /** Formáty, ktoré vie frontend vykresliť. */
    public const FORMATS = ['EAN13', 'EAN8', 'UPC', 'CODE128', 'CODE39', 'ITF', 'QR'];

    protected function casts(): array
    {
        return [
            'uses' => 'integer',
            'last_used_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
