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
