import { Player } from '../entities/Player';
import { DeckManager } from './DeckManager';
import eventsData from '../data/events.json';

export interface EventChoice {
  text: string;
  cost: Record<string, number>;
  reward: Record<string, unknown>;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface EventResult {
  success: boolean;
  message: string;
  healthChange: number;
  circuitChange: number;
  coreChange: number;
  cardsGained: number;
  cardsRemoved: number;
}

export class EventManager {
  private player: Player;
  private deck: DeckManager;

  constructor(player: Player, deck: DeckManager) {
    this.player = player;
    this.deck = deck;
  }

  getRandomEvent(): GameEvent {
    const events = eventsData as GameEvent[];
    return events[Math.floor(Math.random() * events.length)];
  }

  canAffordChoice(choice: EventChoice): boolean {
    if (choice.cost.circuits && this.player.circuits < choice.cost.circuits) return false;
    if (choice.cost.cores && this.player.cores < choice.cost.cores) return false;
    return true;
  }

  resolveChoice(choice: EventChoice): EventResult {
    const result: EventResult = {
      success: true,
      message: '',
      healthChange: 0,
      circuitChange: 0,
      coreChange: 0,
      cardsGained: 0,
      cardsRemoved: 0,
    };

    // Pay costs
    if (choice.cost.circuits) {
      if (!this.player.spendCircuits(choice.cost.circuits)) {
        result.success = false;
        result.message = 'Not enough circuits';
        return result;
      }
      result.circuitChange -= choice.cost.circuits;
    }
    if (choice.cost.cores) {
      if (!this.player.spendCores(choice.cost.cores)) {
        result.success = false;
        result.message = 'Not enough COREs';
        return result;
      }
      result.coreChange -= choice.cost.cores;
    }
    if (choice.cost.damage) {
      this.player.takeDamage(choice.cost.damage as number);
      result.healthChange -= choice.cost.damage as number;
    }

    // Apply rewards
    const reward = choice.reward;
    if (reward.heal) {
      this.player.heal(reward.heal as number);
      result.healthChange += reward.heal as number;
    }
    if (reward.circuits) {
      this.player.addCircuits(reward.circuits as number);
      result.circuitChange += reward.circuits as number;
    }
    if (reward.cores) {
      this.player.addCores(reward.cores as number);
      result.coreChange += reward.cores as number;
    }
    if (reward.randomCard) {
      const count = reward.randomCard as number;
      result.cardsGained = count;
      // Cards are added by the scene
    }
    if (reward.randomDroneCard) {
      const count = reward.randomDroneCard as number;
      for (let i = 0; i < count; i++) {
        const card = this.deck.getRandomDroneCard();
        if (card) {
          this.deck.addCard(card);
          result.cardsGained++;
        }
      }
    }
    if (reward.maxEnergy) {
      this.player.maxEnergy += reward.maxEnergy as number;
      result.message = `Max energy +${reward.maxEnergy}`;
    }
    if (reward.gamble) {
      const gamble = reward.gamble as { success: Record<string, number>; fail: Record<string, number>; chance: number };
      if (Math.random() < gamble.chance) {
        if (gamble.success.cores) {
          this.player.addCores(gamble.success.cores);
          result.coreChange += gamble.success.cores;
          result.message = 'Gamble won! Gained CORE';
        }
      } else {
        if (gamble.fail.damage) {
          this.player.takeDamage(gamble.fail.damage);
          result.healthChange -= gamble.fail.damage;
          result.message = 'Gamble lost! Took damage';
        }
      }
    }

    return result;
  }
}
