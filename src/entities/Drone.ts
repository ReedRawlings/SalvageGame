import { DroneType, DRONE_DEFAULT_DURATION, DRONE_MAX_LEVEL } from '../utils/Constants';

export class Drone {
  public type: DroneType;
  public level: number;
  public duration: number;
  public maxDuration: number;
  public attack: number;
  public baseAttack: number;
  public isEquipped: boolean;
  public equippedSlot: string | null;
  public waitTurns: number;

  constructor(type: DroneType) {
    this.type = type;
    this.level = 1;
    this.duration = DRONE_DEFAULT_DURATION;
    this.maxDuration = DRONE_DEFAULT_DURATION;
    this.isEquipped = false;
    this.equippedSlot = null;
    this.waitTurns = 0;

    switch (type) {
      case 'attack':
        this.attack = 4;
        break;
      case 'siphon':
        this.attack = 2;
        break;
      case 'overload':
        this.attack = 15;
        this.waitTurns = 1;
        break;
      default:
        this.attack = 0;
        break;
    }
    this.baseAttack = this.attack;
  }

  levelUp(): boolean {
    if (this.level >= DRONE_MAX_LEVEL) return false;
    this.level = DRONE_MAX_LEVEL;
    this.duration = this.maxDuration;

    switch (this.type) {
      case 'attack':
        this.attack = this.baseAttack * 2;
        break;
      case 'siphon':
        this.attack = this.baseAttack;
        break;
      case 'overload':
        this.attack = Math.floor(this.attack * 1.5);
        break;
    }
    return true;
  }

  tick(): boolean {
    if (this.waitTurns > 0) {
      this.waitTurns--;
      return true;
    }
    this.duration--;
    return this.duration > 0;
  }

  addBattery(amount: number = 1): void {
    this.duration = Math.min(this.duration + amount, this.maxDuration + 2);
  }

  boostAttack(amount: number): void {
    this.attack += amount;
    this.baseAttack += amount;
  }

  getShieldBlocks(): number {
    return this.level >= 2 ? 2 : 1;
  }

  shouldExplode(): boolean {
    return this.type === 'overload' && this.waitTurns === 0;
  }

  healAmount(): number {
    return this.level >= 2 ? 5 : 3;
  }
}
