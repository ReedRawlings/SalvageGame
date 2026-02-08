import { Equipment, EquipmentData } from '../entities/Equipment';
import { Player } from '../entities/Player';
import { Card, CardData } from '../entities/Card';
import { Drone } from '../entities/Drone';
import { EquipmentSlot, EquipmentFamily } from '../utils/Constants';
import equipmentData from '../data/equipment.json';
import cardsData from '../data/cards.json';

export class EquipmentManager {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  getEquipmentById(id: string): Equipment | null {
    const data = (equipmentData as Record<string, EquipmentData>)[id];
    if (!data) return null;
    return new Equipment(data);
  }

  equipToSlot(equipmentId: string): boolean {
    const piece = this.getEquipmentById(equipmentId);
    if (!piece) return false;
    if (!piece.isAvailable()) return false;
    return this.player.equipPiece(piece);
  }

  unequipSlot(slot: EquipmentSlot): Equipment | null {
    return this.player.unequipPiece(slot);
  }

  getEquippedCards(): Card[] {
    const cards: Card[] = [];
    for (const piece of this.player.equipment.values()) {
      if (!piece) continue;
      for (const cardId of piece.cardIds) {
        const data = (cardsData as Record<string, CardData>)[cardId];
        if (data) {
          const card = new Card(data);
          if (piece.isSupercharged() && card.superchargedEffect) {
            card.isSupercharged = true;
          }
          cards.push(card);
        }
      }
    }
    return cards;
  }

  getBaseDeckCards(): string[] {
    const cards: string[] = [];
    const equippedCardCount = this.getEquippedCards().length;

    // Fill with basic cards to ensure minimum deck size
    const minDeck = 10;
    const basicsNeeded = Math.max(0, minDeck - equippedCardCount);
    const atkCount = Math.ceil(basicsNeeded / 2);
    const defCount = basicsNeeded - atkCount;

    for (let i = 0; i < atkCount; i++) cards.push('basic_atk');
    for (let i = 0; i < defCount; i++) cards.push('basic_def');

    // Add equipment card IDs
    for (const piece of this.player.equipment.values()) {
      if (piece) {
        cards.push(...piece.cardIds);
      }
    }

    // Add cards picked up during this run
    cards.push(...this.player.runDeckCardIds);

    // Remove cards that were removed during this run
    for (const removedId of this.player.removedCardIds) {
      const idx = cards.indexOf(removedId);
      if (idx >= 0) {
        cards.splice(idx, 1);
      }
    }

    return cards;
  }

  getSetBonuses(): { family: EquipmentFamily; count: number }[] {
    const counts = this.player.getEquippedFamilyCounts();
    const bonuses: { family: EquipmentFamily; count: number }[] = [];
    for (const [family, count] of counts) {
      if (count >= 3) {
        bonuses.push({ family: family as EquipmentFamily, count });
      }
    }
    return bonuses;
  }

  getPassiveEffects(): string[] {
    const passives: string[] = [];
    for (const piece of this.player.equipment.values()) {
      if (piece?.passive) {
        passives.push(piece.passive);
      }
    }
    return passives;
  }

  drainAllBatteries(): void {
    for (const piece of this.player.equipment.values()) {
      if (piece) {
        piece.drainBattery();
      }
    }
  }

  rechargeEquipment(piece: Equipment, coreCost: number): boolean {
    if (!this.player.spendCores(coreCost)) return false;
    piece.recharge();
    return true;
  }

  getAllAvailableEquipment(): EquipmentData[] {
    return Object.values(equipmentData as Record<string, EquipmentData>);
  }

  getShopEquipment(count: number = 4): EquipmentData[] {
    const all = this.getAllAvailableEquipment().filter(e => e.cost > 0);
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Equip a drone to an equipment slot, marking the equipment as supercharged.
   * Returns true if the slot has equipment to supercharge.
   */
  equipDroneToSlot(drone: Drone, slot: EquipmentSlot): boolean {
    const piece = this.player.equipment.get(slot);
    if (!piece) return false;
    piece.equipDrone(drone.type);
    return true;
  }

  /**
   * Unequip a drone from an equipment slot, removing supercharge.
   */
  unequipDroneFromSlot(slot: EquipmentSlot): void {
    const piece = this.player.equipment.get(slot);
    if (piece) {
      piece.unequipDrone();
    }
  }

  /**
   * Get all slots that have equipment (valid targets for drone equip).
   */
  getEquippedSlots(): EquipmentSlot[] {
    const slots: EquipmentSlot[] = [];
    for (const [slot, piece] of this.player.equipment) {
      if (piece) {
        slots.push(slot);
      }
    }
    return slots;
  }
}
