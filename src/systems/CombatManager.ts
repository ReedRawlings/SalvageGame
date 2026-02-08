import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Card } from '../entities/Card';
import { Drone } from '../entities/Drone';
import { DeckManager } from './DeckManager';
import { DroneManager } from './DroneManager';
import { EnemyAI, EnemyTurnResult } from './EnemyAI';
import { EquipmentManager } from './EquipmentManager';
import { EquipmentSlot } from '../utils/Constants';

export type CombatPhase = 'player_turn' | 'drone_phase' | 'enemy_turn' | 'victory' | 'defeat';

export interface CombatState {
  phase: CombatPhase;
  turn: number;
  enemies: Enemy[];
  player: Player;
}

export interface CardPlayResult {
  success: boolean;
  damageDealt: number;
  blockGained: number;
  healed: number;
  dronesAffected: number;
  cardsDrawn: number;
  message: string;
}

export class CombatManager {
  public phase: CombatPhase;
  public turn: number;
  public enemies: Enemy[];
  public player: Player;
  public deck: DeckManager;
  public drones: DroneManager;
  public enemyAI: EnemyAI;
  public equipment: EquipmentManager;
  public attacksPlayedThisTurn: number;

  constructor(player: Player, enemies: Enemy[], deck: DeckManager, drones: DroneManager, equipment: EquipmentManager) {
    this.player = player;
    this.enemies = enemies;
    this.deck = deck;
    this.drones = drones;
    this.enemyAI = new EnemyAI();
    this.equipment = equipment;
    this.phase = 'player_turn';
    this.turn = 1;
    this.attacksPlayedThisTurn = 0;
  }

  startCombat(): void {
    this.phase = 'player_turn';
    this.turn = 1;
    this.attacksPlayedThisTurn = 0;
    this.player.startTurn();
    this.deck.draw(this.player.drawAmount);

    // Process passive: scout_draw
    const passives = this.equipment.getPassiveEffects();
    if (passives.includes('scout_draw')) {
      // Auto-discard/draw handled by scene
    }
  }

  canPlayCard(card: Card): boolean {
    if (this.phase !== 'player_turn') return false;
    return this.player.energy >= card.getEffectiveCost();
  }

  playCard(card: Card, targetEnemy?: Enemy): CardPlayResult {
    const result: CardPlayResult = {
      success: false,
      damageDealt: 0,
      blockGained: 0,
      healed: 0,
      dronesAffected: 0,
      cardsDrawn: 0,
      message: '',
    };

    if (!this.canPlayCard(card)) {
      result.message = 'Not enough energy';
      return result;
    }

    this.player.spendEnergy(card.getEffectiveCost());
    this.deck.playCard(card);
    result.success = true;

    // Base card effects (apply auxiliary equipment bonuses)
    if (card.damage > 0 && targetEnemy) {
      const bonusDamage = card.type === 'attack' ? this.player.strikeDamageBonus : 0;
      const effectiveDamage = Math.max(0, card.damage + bonusDamage);
      const hits = card.hits || 1;
      for (let i = 0; i < hits; i++) {
        result.damageDealt += targetEnemy.takeDamage(effectiveDamage);
      }
    }
    if (card.block > 0) {
      const bonusBlock = card.type === 'defend' ? this.player.blockDamageBonus : 0;
      const effectiveBlock = Math.max(0, card.block + bonusBlock);
      this.player.addBlock(effectiveBlock);
      result.blockGained = effectiveBlock;
    }

    // Track attacks for combo
    if (card.type === 'attack') {
      this.attacksPlayedThisTurn++;
    }

    // Special effects
    if (card.effect) {
      this.resolveCardEffect(card, targetEnemy, result);
    }

    // Check for dead enemies
    this.checkDeadEnemies();

    if (this.enemies.every(e => e.isDead())) {
      this.phase = 'victory';
    }

    return result;
  }

  private resolveCardEffect(card: Card, target: Enemy | undefined, result: CardPlayResult): void {
    const effect = card.isSupercharged && card.superchargedEffect
      ? card.superchargedEffect
      : card.effect;

    switch (effect) {
      case 'increase_drone_capacity':
        this.drones.increaseCapacity(1);
        result.dronesAffected = 1;
        result.message = 'Drone capacity +1';
        break;

      case 'increase_capacity_and_summon':
        this.drones.increaseCapacity(1);
        this.drones.summonRandom();
        result.dronesAffected = 1;
        result.message = 'Drone capacity +1, random drone summoned';
        break;

      case 'reduce_drone_cost':
        result.message = 'Drone costs reduced by 1 this turn';
        break;

      case 'drone_focus_fire':
        if (target) {
          const fieldDrones = this.drones.getFieldDrones();
          for (const drone of fieldDrones) {
            if (drone.attack > 0) {
              result.damageDealt += target.takeDamage(drone.attack * 2);
            }
          }
          result.message = `Drones focused fire for ${result.damageDealt} damage`;
        }
        break;

      case 'drone_focus_fire_debuff':
        if (target) {
          const drones = this.drones.getFieldDrones();
          for (const drone of drones) {
            if (drone.attack > 0) {
              result.damageDealt += target.takeDamage(drone.attack * 2);
            }
          }
          target.applyStatus('weakened', 1);
          result.message = `Drones focused fire with debuff`;
        }
        break;

      case 'add_drone_battery': {
        const fieldDrones = this.drones.getFieldDrones();
        if (fieldDrones.length > 0) {
          fieldDrones[0].addBattery(1);
          result.dronesAffected = 1;
        }
        break;
      }

      case 'add_all_drone_battery':
        this.drones.restoreAllBatteries(1);
        result.dronesAffected = this.drones.getFieldDroneCount();
        break;

      case 'throw_drone': {
        const fieldDrones = this.drones.getFieldDrones();
        if (fieldDrones.length > 0 && target) {
          const damage = this.drones.throwDrone(fieldDrones[0]);
          result.damageDealt += target.takeDamage(damage);
          result.message = `Threw drone for ${damage} damage`;
        }
        break;
      }

      case 'throw_drone_aoe': {
        const fieldDrones = this.drones.getFieldDrones();
        if (fieldDrones.length > 0) {
          const damage = this.drones.throwDrone(fieldDrones[0]);
          for (const enemy of this.enemies) {
            if (!enemy.isDead()) {
              result.damageDealt += enemy.takeDamage(damage);
            }
          }
          result.message = `Threw drone for ${damage} AoE damage`;
        }
        break;
      }

      case 'sacrifice_drone_block': {
        const fieldDrones = this.drones.getFieldDrones();
        if (fieldDrones.length > 0) {
          const block = this.drones.sacrificeDrone(fieldDrones[0]);
          this.player.addBlock(block);
          result.blockGained += block;
        }
        break;
      }

      case 'recall_drones': {
        const recalled = this.drones.recallAll();
        const drawn = this.deck.draw(recalled.length);
        result.cardsDrawn = drawn.length;
        result.dronesAffected = recalled.length;
        break;
      }

      case 'detonate_drone': {
        const fieldDrones = this.drones.getFieldDrones();
        if (fieldDrones.length > 0 && target) {
          const drone = fieldDrones[0];
          const damage = drone.duration * 5;
          this.drones.removeDrone(drone);
          result.damageDealt += target.takeDamage(damage);
        }
        break;
      }

      case 'link_drones': {
        const fieldDrones = this.drones.getFieldDrones();
        if (fieldDrones.length >= 2) {
          this.drones.linkDrones(fieldDrones[0], fieldDrones[1]);
          result.dronesAffected = 2;
        }
        break;
      }

      case 'expend_all_charges':
        if (target) {
          const totalDamage = this.drones.expendAllCharges();
          result.damageDealt += target.takeDamage(totalDamage);
          result.message = `Expended charges for ${totalDamage} damage`;
        }
        break;

      case 'boost_all_drones':
        this.drones.boostAllAttack(1);
        result.dronesAffected = this.drones.activeDrones.length;
        break;

      case 'drone_double_strike': {
        const fieldDrones = this.drones.getFieldDrones();
        if (fieldDrones.length > 0 && target && fieldDrones[0].attack > 0) {
          result.damageDealt += target.takeDamage(fieldDrones[0].attack * 2);
        }
        break;
      }

      case 'restore_all_batteries':
        this.drones.restoreAllBatteries(1);
        result.dronesAffected = this.drones.getFieldDroneCount();
        break;

      case 'emergency_shield': {
        const droneBonus = this.drones.getFieldDroneCount() * 3;
        this.player.addBlock(droneBonus);
        result.blockGained += droneBonus;
        break;
      }

      case 'overclock': {
        this.player.energy++;
        const fieldDrones = this.drones.getFieldDrones();
        if (fieldDrones.length > 0) {
          fieldDrones[0].duration = Math.max(0, fieldDrones[0].duration - 1);
        }
        break;
      }

      case 'scrap_harvest': {
        const randomCard = this.deck.getRandomDroneCard();
        if (randomCard) {
          this.deck.addTemporaryCard(randomCard);
          result.cardsDrawn = 1;
        }
        break;
      }

      case 'slam':
        if (target) {
          result.damageDealt += target.takeDamage(card.damage);
        }
        this.player.addBlock(5);
        result.blockGained += 5;
        break;

      case 'chain_strike':
        if (target && this.attacksPlayedThisTurn > 1) {
          result.damageDealt += target.takeDamage(4);
        }
        break;

      case 'scan_deck': {
        // Preview 3 cards - handled by UI
        result.message = 'Scanning deck...';
        break;
      }

      case 'summon_random_drones':
        this.drones.summonRandom();
        this.drones.summonRandom();
        result.dronesAffected = 2;
        break;

      // Injected card effects (from drone equip)
      case 'charged_strike':
        if (target) {
          const droneBonus = this.drones.getFieldDroneCount() * 2;
          result.damageDealt += target.takeDamage(droneBonus);
          result.message = `Charged Strike +${droneBonus} drone bonus`;
        }
        break;

      case 'drone_barrier':
        // Block is handled by base card.block. Battery restore happens if no damage taken.
        result.message = 'Drone Barrier deployed';
        break;

      case 'field_repair':
        this.player.heal(card.healAmount ?? 5);
        result.healed += card.healAmount ?? 5;
        this.drones.restoreAllBatteries(1);
        result.dronesAffected = this.drones.getFieldDroneCount();
        result.message = `Healed ${card.healAmount ?? 5} HP, restored drone batteries`;
        break;

      case 'siphon_draw': {
        // Discard 1, draw 2
        if (this.deck.hand.length > 0) {
          const toDiscard = this.deck.hand[this.deck.hand.length - 1];
          this.deck.discardCard(toDiscard);
        }
        const drawn = this.deck.draw(2);
        result.cardsDrawn = drawn.length;
        result.message = 'Discarded 1, drew 2';
        break;
      }

      case 'overload_bomb':
        if (target) {
          result.damageDealt += target.takeDamage(card.damage);
          result.message = `Ticking Bomb dealt ${card.damage} damage`;
        }
        break;
    }
  }

  private checkDeadEnemies(): void {
    for (const enemy of this.enemies) {
      if (enemy.isDead()) {
        this.enemyAI.handleAllyDeath(enemy, this.enemies);
      }
    }
  }

  endPlayerTurn(): void {
    this.deck.discardHand();
    this.phase = 'drone_phase';
  }

  processDronePhase(): { totalDamage: number; totalHeal: number; cardsDrawn: number } {
    const effects = this.drones.processTurnEffects();

    // Apply damage to first alive enemy (or spread for AoE)
    const aliveEnemies = this.enemies.filter(e => !e.isDead());
    if (aliveEnemies.length > 0 && effects.totalDamage > 0) {
      aliveEnemies[0].takeDamage(effects.totalDamage);
    }

    // Apply heal
    if (effects.totalHeal > 0) {
      this.player.heal(effects.totalHeal);
    }

    // Draw cards from siphon
    if (effects.cardsDrawn > 0) {
      this.deck.draw(effects.cardsDrawn);
    }

    // Process explosions
    for (const explosion of effects.explosions) {
      if (aliveEnemies.length > 0) {
        aliveEnemies[0].takeDamage(explosion.damage);
      }
      this.drones.removeDrone(explosion.drone);
    }

    // Tick drone durations
    this.drones.tickAll();

    // Passive: drone_shield
    const passives = this.equipment.getPassiveEffects();
    if (passives.includes('drone_shield')) {
      const shieldPerPair = Math.floor(this.drones.getFieldDroneCount() / 2);
      if (shieldPerPair > 0) {
        this.player.addBlock(shieldPerPair);
      }
    }

    this.checkDeadEnemies();
    if (this.enemies.every(e => e.isDead())) {
      this.phase = 'victory';
    } else {
      this.phase = 'enemy_turn';
    }

    return {
      totalDamage: effects.totalDamage,
      totalHeal: effects.totalHeal,
      cardsDrawn: effects.cardsDrawn,
    };
  }

  processEnemyTurn(): EnemyTurnResult[] {
    const results = this.enemyAI.processAllEnemyTurns(this.enemies, this.player, this.deck);

    // Handle healer enemies
    for (const result of results) {
      if (result.healAmount > 0) {
        this.enemyAI.healAllies(result.enemy, this.enemies, result.healAmount);
      }
      if (result.summonId) {
        const newEnemy = this.enemyAI.createEnemy(result.summonId);
        if (newEnemy) {
          this.enemies.push(newEnemy);
        }
      }
    }

    if (this.player.isDead()) {
      this.phase = 'defeat';
    } else {
      this.startNewTurn();
    }

    return results;
  }

  private startNewTurn(): void {
    this.turn++;
    this.attacksPlayedThisTurn = 0;
    this.phase = 'player_turn';
    this.player.startTurn();
    this.deck.draw(this.player.drawAmount);
  }

  getState(): CombatState {
    return {
      phase: this.phase,
      turn: this.turn,
      enemies: this.enemies,
      player: this.player,
    };
  }

  isOver(): boolean {
    return this.phase === 'victory' || this.phase === 'defeat';
  }

  /**
   * Equip a field drone to an equipment slot.
   * This supercharges the equipment and injects temporary cards.
   */
  equipDroneToSlot(drone: Drone, slot: EquipmentSlot): boolean {
    if (this.phase !== 'player_turn') return false;

    // Must be a field drone (not already equipped)
    if (drone.isEquipped) return false;

    // Must have equipment in the target slot
    if (!this.equipment.equipDroneToSlot(drone, slot)) return false;

    // Move drone from field to equipped state
    this.drones.equipDroneToSlot(drone, slot);

    // Inject cards for this drone type
    this.deck.injectCardsForSlot(slot, drone.type);

    return true;
  }

  /**
   * Unequip a drone from an equipment slot.
   * Removes supercharge and injected cards.
   */
  unequipDroneFromSlot(slot: EquipmentSlot): boolean {
    // Remove supercharge from equipment
    this.equipment.unequipDroneFromSlot(slot);

    // Remove injected cards
    this.deck.removeInjectedCardsForSlot(slot);

    // Unequip from drone manager (returns to field or is destroyed)
    this.drones.unequipDroneFromSlot(slot);

    return true;
  }
}
