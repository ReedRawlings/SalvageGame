import { EquipmentSlot, EquipmentFamily, EQUIPMENT_BATTERY_MAX } from '../utils/Constants';

export interface EquipmentData {
  id: string;
  name: string;
  family: EquipmentFamily;
  slot: EquipmentSlot;
  cardIds: string[];
  description: string;
  cost: number;
  statMods: Record<string, number>;
  passive?: string;
}

export class Equipment {
  public id: string;
  public name: string;
  public family: EquipmentFamily;
  public slot: EquipmentSlot;
  public cardIds: string[];
  public description: string;
  public cost: number;
  public statMods: Record<string, number>;
  public passive?: string;
  public battery: number;
  public equippedDroneType: string | null;

  constructor(data: EquipmentData) {
    this.id = data.id;
    this.name = data.name;
    this.family = data.family;
    this.slot = data.slot;
    this.cardIds = [...data.cardIds];
    this.description = data.description;
    this.cost = data.cost;
    this.statMods = { ...data.statMods };
    this.passive = data.passive;
    this.battery = EQUIPMENT_BATTERY_MAX;
    this.equippedDroneType = null;
  }

  isAvailable(): boolean {
    return this.battery > 0;
  }

  drainBattery(): void {
    if (this.battery > 0) {
      this.battery--;
    }
  }

  recharge(): void {
    this.battery = EQUIPMENT_BATTERY_MAX;
  }

  isSupercharged(): boolean {
    return this.equippedDroneType !== null;
  }

  equipDrone(droneType: string): void {
    this.equippedDroneType = droneType;
  }

  unequipDrone(): string | null {
    const type = this.equippedDroneType;
    this.equippedDroneType = null;
    return type;
  }
}
