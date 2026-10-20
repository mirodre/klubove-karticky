<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Miesto, kde bola karta otvorená – podklad pre návrh karty podľa polohy. */
#[Fillable(['lat', 'lng', 'uses', 'last_used_at'])]
#[Hidden(['id', 'card_id', 'created_at', 'updated_at'])]
class CardPlace extends Model
{
    /** Otvorenia bližšie ako tento polomer (m) sa zlúčia do jedného miesta. */
    public const MERGE_RADIUS = 150;

    /** Koľko miest si pri jednej karte pamätáme. */
    public const MAX_PER_CARD = 20;

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'uses' => 'integer',
            'last_used_at' => 'datetime',
        ];
    }

    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }

    /** Vzdialenosť v metroch (haversine). */
    public function distanceTo(float $lat, float $lng): float
    {
        $rad = M_PI / 180;
        $dLat = ($lat - $this->lat) * $rad;
        $dLng = ($lng - $this->lng) * $rad;
        $a = sin($dLat / 2) ** 2 + cos($this->lat * $rad) * cos($lat * $rad) * sin($dLng / 2) ** 2;

        return 6371000 * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
