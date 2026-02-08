import { Drone } from '../entities/Drone';
import { DroneType } from '../utils/Constants';

export class DroneManager {
  public activeDrones: Drone[];
  public maxSlots: number;

  constructor(maxSlots: number) {
    this.activeDrones = [];
    this.maxSlots = maxSlots;
  }

  summon(type: DroneType): Drone | null {
    const existing = this.activeDrones.find(d => d.type === type && !d.isEquipped);
    if (existing) {
      existing.levelUp();
      return existing;
    }

    if (this.getFieldDroneCount() >= this.maxSlots) return null;

    const drone = new Drone(type);
    this.activeDrones.push(drone);
    return drone;
  }

  summonRandom(): Drone | null {
    const types: DroneType[] = ['attack', 'shield', 'repair', 'siphon', 'overload', 'decoy'];
    const type = types[Math.floor(Math.random() * types.length)];
    return this.summon(type);
  }

  removeDrone(drone: Drone): boolean {
    const index = this.activeDrones.indexOf(drone);
    if (index < 0) return false;
    this.activeDrones.splice(index, 1);
    return true;
  }

  getFieldDrones(): Drone[] {
    return this.activeDrones.filter(d => !d.isEquipped);
  }

  getEquippedDrones(): Drone[] {
    return this.activeDrones.filter(d => d.isEquipped);
  }

  getFieldDroneCount(): number {
    return this.getFieldDrones().length;
  }

  increaseCapacity(amount: number = 1): void {
    this.maxSlots += amount;
  }

  tickAll(): Drone[] {
    const expired: Drone[] = [];
    for (const drone of this.getFieldDrones()) {
      if (!drone.tick()) {
        expired.push(drone);
      }
    }
    for (const drone of expired) {
      this.removeDrone(drone);
    }
    return expired;
  }

  processTurnEffects(): {
    totalDamage: number;
    totalHeal: number;
    cardsDrawn: number;
    explosions: { drone: Drone; damage: number }[];
    shieldBlocks: number;
  } {
    let totalDamage = 0;
    let totalHeal = 0;
    let cardsDrawn = 0;
    let shieldBlocks = 0;
    const explosions: { drone: Drone; damage: number }[] = [];

    for (const drone of this.getFieldDrones()) {
      if (drone.waitTurns > 0) continue;

      switch (drone.type) {
        case 'attack':
          totalDamage += drone.attack;
          break;
        case 'repair':
          totalHeal += drone.healAmount();
          break;
        case 'siphon':
          totalDamage += drone.attack;
          cardsDrawn++;
          break;
        case 'overload':
          if (drone.shouldExplode()) {
            explosions.push({ drone, damage: drone.attack });
          }
          break;
        case 'shield':
        case 'decoy':
          shieldBlocks += drone.getShieldBlocks();
          break;
      }
    }

    return { totalDamage, totalHeal, cardsDrawn, explosions, shieldBlocks };
  }

  boostAllAttack(amount: number): void {
    for (const drone of this.activeDrones) {
      drone.boostAttack(amount);
    }
  }

  restoreAllBatteries(amount: number = 1): void {
    for (const drone of this.getFieldDrones()) {
      drone.addBattery(amount);
    }
  }

  recallAll(): Drone[] {
    const recalled = [...this.getFieldDrones()];
    this.activeDrones = this.getEquippedDrones();
    return recalled;
  }

  sacrificeDrone(drone: Drone): number {
    const blockGain = drone.attack * 2;
    this.removeDrone(drone);
    return blockGain;
  }

  throwDrone(drone: Drone): number {
    const damage = drone.attack * 3;
    this.removeDrone(drone);
    return damage;
  }

  clearAll(): void {
    this.activeDrones = [];
  }

  linkDrones(drone1: Drone, drone2: Drone): void {
    const higherLevel = Math.max(drone1.level, drone2.level);
    drone1.level = higherLevel;
    drone2.level = higherLevel;
  }

  expendAllCharges(): number {
    let totalDamage = 0;
    for (const drone of [...this.getFieldDrones()]) {
      totalDamage += drone.duration * drone.attack;
      this.removeDrone(drone);
    }
    return totalDamage * 3;
  }
}
