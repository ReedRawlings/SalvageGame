import {
  BASE_HEALTH, BASE_HAND_SIZE, BASE_DRAW, BASE_DRONE_SLOTS, BASE_ENERGY,
  EquipmentSlot, EQUIPMENT_SLOTS
} from '../utils/Constants';
import { Equipment } from './Equipment';

export interface PlayerState {
  maxHealth: number;
  health: number;
  block: number;
  energy: number;
  maxEnergy: number;
  handSize: number;
  drawAmount: number;
  maxDroneSlots: number;
  cores: number;
  energyTokens: number;
  circuits: number;
  equipment: Map<EquipmentSlot, Equipment | null>;
  auxiliarySlots: (Equipment | null)[];
  ownedEquipment: Equipment[];
}

export class Player {
  public maxHealth: number;
  public health: number;
  public block: number;
  public energy: number;
  public maxEnergy: number;
  public handSize: number;
  public drawAmount: number;
  public maxDroneSlots: number;
  public cores: number;
  public energyTokens: number;
  public circuits: number;
  public equipment: Map<EquipmentSlot, Equipment | null>;
  public auxiliarySlots: (Equipment | null)[];
  public ownedEquipment: Equipment[];
  public statusEffects: Map<string, number>;
  public runCount: number;

  constructor() {
    this.maxHealth = BASE_HEALTH;
    this.health = BASE_HEALTH;
    this.block = 0;
    this.energy = BASE_ENERGY;
    this.maxEnergy = BASE_ENERGY;
    this.handSize = BASE_HAND_SIZE;
    this.drawAmount = BASE_DRAW;
    this.maxDroneSlots = BASE_DRONE_SLOTS;
    this.cores = 0;
    this.energyTokens = 0;
    this.circuits = 0;
    this.equipment = new Map();
    this.auxiliarySlots = [null, null];
    this.ownedEquipment = [];
    this.statusEffects = new Map();
    this.runCount = 0;

    for (const slot of EQUIPMENT_SLOTS) {
      this.equipment.set(slot, null);
    }
  }

  equipPiece(piece: Equipment): boolean {
    const currentInSlot = this.equipment.get(piece.slot);
    if (currentInSlot) {
      this.unequipPiece(piece.slot);
    }
    this.equipment.set(piece.slot, piece);
    this.applyStatMods(piece, 1);
    return true;
  }

  unequipPiece(slot: EquipmentSlot): Equipment | null {
    const piece = this.equipment.get(slot) ?? null;
    if (piece) {
      this.applyStatMods(piece, -1);
      this.equipment.set(slot, null);
    }
    return piece;
  }

  private applyStatMods(piece: Equipment, multiplier: number): void {
    for (const [stat, value] of Object.entries(piece.statMods)) {
      switch (stat) {
        case 'health':
          this.maxHealth += value * multiplier;
          this.health = Math.min(this.health, this.maxHealth);
          break;
      }
    }
  }

  getEquippedFamilyCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const piece of this.equipment.values()) {
      if (piece) {
        counts.set(piece.family, (counts.get(piece.family) ?? 0) + 1);
      }
    }
    return counts;
  }

  hasSetBonus(family: string): boolean {
    return (this.getEquippedFamilyCounts().get(family) ?? 0) >= 3;
  }

  takeDamage(amount: number): number {
    const blocked = Math.min(this.block, amount);
    this.block -= blocked;
    const remaining = amount - blocked;
    this.health = Math.max(0, this.health - remaining);
    return remaining;
  }

  addBlock(amount: number): void {
    this.block += amount;
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  startTurn(): void {
    this.block = 0;
    this.energy = this.maxEnergy;
  }

  spendEnergy(amount: number): boolean {
    if (this.energy < amount) return false;
    this.energy -= amount;
    return true;
  }

  addCircuits(amount: number): void {
    this.circuits += amount;
  }

  spendCircuits(amount: number): boolean {
    if (this.circuits < amount) return false;
    this.circuits -= amount;
    return true;
  }

  addCores(amount: number): void {
    this.cores += amount;
  }

  spendCores(amount: number): boolean {
    if (this.cores < amount) return false;
    this.cores -= amount;
    return true;
  }

  endRun(): void {
    this.runCount++;
    for (const piece of this.equipment.values()) {
      if (piece) {
        piece.drainBattery();
      }
    }
  }

  getState(): PlayerState {
    return {
      maxHealth: this.maxHealth,
      health: this.health,
      block: this.block,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      handSize: this.handSize,
      drawAmount: this.drawAmount,
      maxDroneSlots: this.maxDroneSlots,
      cores: this.cores,
      energyTokens: this.energyTokens,
      circuits: this.circuits,
      equipment: this.equipment,
      auxiliarySlots: this.auxiliarySlots,
      ownedEquipment: this.ownedEquipment,
    };
  }
}
