import { Enemy, EnemyData, EnemyAction } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { DeckManager } from './DeckManager';
import enemiesData from '../data/enemies.json';

export interface EnemyTurnResult {
  enemy: Enemy;
  action: EnemyAction;
  damageDealt: number;
  blockGained: number;
  statusApplied: string | null;
  summonId: string | null;
  healAmount: number;
}

export class EnemyAI {
  createEnemy(id: string): Enemy | null {
    const data = (enemiesData as Record<string, EnemyData>)[id];
    if (!data) return null;
    return new Enemy(data);
  }

  createEncounter(enemyIds: string[]): Enemy[] {
    const enemies: Enemy[] = [];
    for (const id of enemyIds) {
      const enemy = this.createEnemy(id);
      if (enemy) enemies.push(enemy);
    }
    return enemies;
  }

  processEnemyTurn(enemy: Enemy, player: Player, deck: DeckManager): EnemyTurnResult {
    const action = enemy.getNextIntent();
    const result: EnemyTurnResult = {
      enemy,
      action,
      damageDealt: 0,
      blockGained: 0,
      statusApplied: null,
      summonId: null,
      healAmount: 0,
    };

    enemy.startTurn();

    switch (action.type) {
      case 'attack': {
        const damage = (action.damage ?? 0) + enemy.powerStacks;
        result.damageDealt = player.takeDamage(damage);
        if (action.effect === 'charge_stack') {
          const stacks = (player.statusEffects.get('charge_stacks') ?? 0) + 1;
          player.statusEffects.set('charge_stacks', stacks);
          if (stacks >= 3) {
            player.takeDamage(10);
            result.damageDealt += 10;
            player.statusEffects.set('charge_stacks', 0);
          }
          result.statusApplied = 'charge_stack';
        }
        if (action.effect === 'corrosion') {
          deck.applyCorrosion();
          result.statusApplied = 'corrosion';
        }
        break;
      }
      case 'defend': {
        enemy.addBlock(action.block ?? 0);
        result.blockGained = action.block ?? 0;
        break;
      }
      case 'buff': {
        if (action.effect === 'power_up' || action.effect === 'crush_charge') {
          enemy.addPower(action.amount ?? 0);
        }
        break;
      }
      case 'debuff': {
        if (action.effect === 'magnetic_pull') {
          deck.applyMagneticPull();
          result.statusApplied = 'magnetic_pull';
        }
        if (action.effect === 'consume_card') {
          const consumed = deck.consumeRandomDiscard();
          if (consumed) {
            if (consumed.type === 'attack') enemy.addPower(2);
            else if (consumed.type === 'defend') enemy.addBlock(5);
          }
          result.statusApplied = 'consume_card';
        }
        break;
      }
      case 'heal': {
        result.healAmount = action.amount ?? 0;
        break;
      }
      case 'summon': {
        result.summonId = action.summonId ?? null;
        break;
      }
    }

    enemy.advancePattern();
    return result;
  }

  processAllEnemyTurns(enemies: Enemy[], player: Player, deck: DeckManager): EnemyTurnResult[] {
    const results: EnemyTurnResult[] = [];
    for (const enemy of enemies) {
      if (enemy.isDead()) continue;
      results.push(this.processEnemyTurn(enemy, player, deck));
    }
    return results;
  }

  handleAllyDeath(deadEnemy: Enemy, allEnemies: Enemy[]): void {
    for (const enemy of allEnemies) {
      if (enemy === deadEnemy || enemy.isDead()) continue;
      if (deadEnemy.onAllyDeath) {
        if (deadEnemy.onAllyDeath.effect === 'damage_boost') {
          enemy.addPower(deadEnemy.onAllyDeath.amount);
        }
      }
    }
  }

  healAllies(healer: Enemy, allies: Enemy[], amount: number): void {
    for (const ally of allies) {
      if (ally === healer || ally.isDead()) continue;
      ally.heal(amount);
    }
  }
}
