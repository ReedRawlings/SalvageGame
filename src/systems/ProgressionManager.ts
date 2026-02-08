import { Player } from '../entities/Player';
import { Equipment, EquipmentData } from '../entities/Equipment';
import equipmentData from '../data/equipment.json';

export interface RunResult {
  floorsCleared: number;
  enemiesDefeated: number;
  circuitsEarned: number;
  coresEarned: number;
  victory: boolean;
}

export class ProgressionManager {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  calculateRunRewards(result: RunResult): { energyTokens: number; cores: number } {
    const baseTokens = 2;
    const floorBonus = Math.floor(result.floorsCleared / 3);
    const victoryBonus = result.victory ? 5 : 0;

    return {
      energyTokens: baseTokens + floorBonus + victoryBonus,
      cores: result.coresEarned,
    };
  }

  applyRunRewards(result: RunResult): void {
    const rewards = this.calculateRunRewards(result);
    this.player.energyTokens += rewards.energyTokens;
    this.player.addCores(rewards.cores);
  }

  endRun(): void {
    this.player.endRun();
    this.player.circuits = 0;
  }

  startNewRun(): void {
    this.player.health = this.player.maxHealth;
    this.player.circuits = 0;
    this.player.block = 0;
    this.player.statusEffects.clear();
  }

  canRechargeEquipment(piece: Equipment): boolean {
    const cost = this.getRechargePrice(piece);
    return this.player.cores >= cost;
  }

  getRechargePrice(_piece: Equipment): number {
    return 2;
  }

  rechargeEquipment(piece: Equipment): boolean {
    const cost = this.getRechargePrice(piece);
    if (!this.player.spendCores(cost)) return false;
    piece.recharge();
    return true;
  }

  purchaseEquipment(equipId: string): Equipment | null {
    const data = (equipmentData as Record<string, EquipmentData>)[equipId];
    if (!data) return null;

    if (!this.player.spendCores(data.cost)) return null;

    const piece = new Equipment(data);
    this.player.ownedEquipment.push(piece);
    return piece;
  }

  getStarterEquipment(): Equipment {
    const data = (equipmentData as Record<string, EquipmentData>)['starter_chassis'];
    return new Equipment(data);
  }

  initializeNewPlayer(): void {
    const starter = this.getStarterEquipment();
    this.player.ownedEquipment.push(starter);
    this.player.equipPiece(starter);
  }
}
