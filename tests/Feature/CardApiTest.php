<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CardApiTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Zelený Košík',
            'kind' => 'Potraviny',
            'number' => '8590123456781',
            'format' => 'EAN13',
            'color' => '#1F4D3A',
            'holder' => null,
            'note' => 'Zľava 5 %',
        ], $overrides);
    }

    public function test_guest_cannot_access_cards(): void
    {
        $this->getJson('/api/cards')->assertUnauthorized();
    }

    public function test_user_sees_only_own_cards(): void
    {
        $user = User::factory()->create();
        Card::factory()->for($user)->create(['name' => 'Moja']);
        Card::factory()->create(['name' => 'Cudzia']);

        $this->actingAs($user)->getJson('/api/cards')
            ->assertOk()
            ->assertJsonCount(1, 'cards')
            ->assertJsonPath('cards.0.name', 'Moja')
            ->assertJsonMissingPath('cards.0.user_id');
    }

    public function test_user_can_create_card(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/cards', $this->payload())
            ->assertCreated()
            ->assertJsonPath('card.name', 'Zelený Košík');

        $this->assertDatabaseHas('cards', ['user_id' => $user->id, 'number' => '8590123456781']);
    }

    public function test_create_validates_input(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/cards', $this->payload([
            'name' => '',
            'format' => 'PDF',
            'color' => 'red',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['name', 'format', 'color']);
    }

    public function test_user_can_update_and_delete_own_card(): void
    {
        $user = User::factory()->create();
        $card = Card::factory()->for($user)->create();

        $this->actingAs($user)->putJson("/api/cards/{$card->id}", $this->payload(['name' => 'Nový názov']))
            ->assertOk()
            ->assertJsonPath('card.name', 'Nový názov');

        $this->actingAs($user)->deleteJson("/api/cards/{$card->id}")->assertNoContent();
        $this->assertModelMissing($card);
    }

    public function test_user_cannot_touch_foreign_card(): void
    {
        $user = User::factory()->create();
        $foreign = Card::factory()->create();

        $this->actingAs($user)->putJson("/api/cards/{$foreign->id}", $this->payload())->assertNotFound();
        $this->actingAs($user)->deleteJson("/api/cards/{$foreign->id}")->assertNotFound();
        $this->actingAs($user)->postJson("/api/cards/{$foreign->id}/use")->assertNotFound();
        $this->assertModelExists($foreign);
    }

    public function test_use_increments_counter(): void
    {
        $user = User::factory()->create();
        $card = Card::factory()->for($user)->create();

        $this->actingAs($user)->postJson("/api/cards/{$card->id}/use")
            ->assertOk()
            ->assertJsonPath('card.uses', 1);

        $this->assertNotNull($card->fresh()->last_used_at);
    }

    public function test_use_remembers_place_and_merges_nearby_opens(): void
    {
        $user = User::factory()->create();
        $card = Card::factory()->for($user)->create();

        // 1. otvorenie v obchode
        $this->actingAs($user)->postJson("/api/cards/{$card->id}/use", ['lat' => 48.148600, 'lng' => 17.107700])
            ->assertOk()
            ->assertJsonCount(1, 'card.places')
            ->assertJsonPath('card.places.0.uses', 1);

        // 2. o ~50 m ďalej – to isté miesto
        $this->actingAs($user)->postJson("/api/cards/{$card->id}/use", ['lat' => 48.149000, 'lng' => 17.107900])
            ->assertJsonCount(1, 'card.places')
            ->assertJsonPath('card.places.0.uses', 2);

        // 3. iné mesto – nové miesto
        $this->actingAs($user)->postJson("/api/cards/{$card->id}/use", ['lat' => 49.223000, 'lng' => 18.739000])
            ->assertJsonCount(2, 'card.places');

        $this->actingAs($user)->getJson('/api/cards')
            ->assertJsonCount(2, 'cards.0.places')
            ->assertJsonMissingPath('cards.0.places.0.card_id');
    }

    public function test_use_without_position_stores_no_place(): void
    {
        $user = User::factory()->create();
        $card = Card::factory()->for($user)->create();

        $this->actingAs($user)->postJson("/api/cards/{$card->id}/use")
            ->assertOk()
            ->assertJsonCount(0, 'card.places');
    }

    public function test_use_validates_position(): void
    {
        $user = User::factory()->create();
        $card = Card::factory()->for($user)->create();

        $this->actingAs($user)->postJson("/api/cards/{$card->id}/use", ['lat' => 120])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['lat', 'lng']);
    }

    public function test_import_skips_duplicates(): void
    {
        $user = User::factory()->create();
        Card::factory()->for($user)->create(['name' => 'Zelený Košík', 'number' => '8590123456781']);

        $this->actingAs($user)->postJson('/api/cards/import', ['cards' => [
            $this->payload(),
            $this->payload(['name' => 'Fit Zóna', 'number' => 'FZ-001', 'format' => 'CODE128']),
        ]])
            ->assertOk()
            ->assertJsonPath('imported', 1)
            ->assertJsonCount(2, 'cards');
    }
}
