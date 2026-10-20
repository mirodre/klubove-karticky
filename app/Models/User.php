<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function cards(): HasMany
    {
        return $this->hasMany(Card::class);
    }

    /** Hosť používa appku bez registrácie – karty má len na tomto zariadení. */
    public function isGuest(): bool
    {
        return $this->email === null;
    }

    /**
     * Údaje pre frontend (window.APP_USER).
     *
     * @return array{id: int, name: ?string, email: ?string, guest: bool}
     */
    public function toAppUser(): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'email' => $this->email, 'guest' => $this->isGuest()];
    }

    /**
     * Prevezme karty iného účtu (hosťa z tohto zariadenia) a ten zmaže.
     * Karty s rovnakým číslom, aké už účet má, sa nezdvojujú.
     */
    public function absorb(User $other): void
    {
        $numbers = $this->cards()->pluck('number')->all();

        foreach ($other->cards as $card) {
            if (in_array($card->number, $numbers, true)) {
                $card->delete();
            } else {
                $card->user()->associate($this)->save();
                $numbers[] = $card->number;
            }
        }

        $other->delete();
    }
}
