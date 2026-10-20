<?php

namespace App\Models;

use Database\Factories\CardFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function places(): HasMany
    {
        return $this->hasMany(CardPlace::class)->latest('last_used_at');
    }

    /** Zapamätá si miesto otvorenia; blízke otvorenia zlúči do jedného miesta. */
    public function rememberPlace(float $lat, float $lng): void
    {
        $place = $this->places()->get()
            ->sortBy(fn (CardPlace $p) => $p->distanceTo($lat, $lng))
            ->first(fn (CardPlace $p) => $p->distanceTo($lat, $lng) <= CardPlace::MERGE_RADIUS);

        if ($place) {
            $place->update(['uses' => $place->uses + 1, 'last_used_at' => now()]);
        } else {
            $this->places()->create(['lat' => $lat, 'lng' => $lng, 'uses' => 1, 'last_used_at' => now()]);
            $this->places()->skip(CardPlace::MAX_PER_CARD)->take(PHP_INT_MAX)->get()->each->delete();
        }
    }
}
