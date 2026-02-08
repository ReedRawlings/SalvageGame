import { CardType, DroneType, EquipmentFamily } from '../utils/Constants';

export interface CardData {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  damage: number;
  block: number;
  description: string;
  family: EquipmentFamily | null;
  isBasic?: boolean;
  slot?: string;
  effect?: string;
  superchargedEffect?: string;
  droneType?: DroneType;
  healAmount?: number;
  hits?: number;
  isInjected?: boolean;
}

export class Card {
  public id: string;
  public name: string;
  public type: CardType;
  public cost: number;
  public baseCost: number;
  public damage: number;
  public block: number;
  public description: string;
  public family: EquipmentFamily | null;
  public isBasic: boolean;
  public slot?: string;
  public effect?: string;
  public superchargedEffect?: string;
  public droneType?: DroneType;
  public healAmount?: number;
  public hits: number;
  public isInjected: boolean;
  public isTemporary: boolean;
  public isSupercharged: boolean;
  public costModifier: number;
  public sourceSlot: string | null;
  public sourceDroneType: string | null;

  constructor(data: CardData) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.cost = data.cost;
    this.baseCost = data.cost;
    this.damage = data.damage;
    this.block = data.block;
    this.description = data.description;
    this.family = data.family;
    this.isBasic = data.isBasic ?? false;
    this.slot = data.slot;
    this.effect = data.effect;
    this.superchargedEffect = data.superchargedEffect;
    this.droneType = data.droneType;
    this.healAmount = data.healAmount;
    this.hits = data.hits ?? 1;
    this.isInjected = data.isInjected ?? false;
    this.isTemporary = false;
    this.isSupercharged = false;
    this.costModifier = 0;
    this.sourceSlot = null;
    this.sourceDroneType = null;
  }

  getEffectiveCost(): number {
    return Math.max(0, this.cost + this.costModifier);
  }

  clone(): Card {
    const card = new Card({
      id: this.id,
      name: this.name,
      type: this.type,
      cost: this.baseCost,
      damage: this.damage,
      block: this.block,
      description: this.description,
      family: this.family,
      isBasic: this.isBasic,
      slot: this.slot,
      effect: this.effect,
      superchargedEffect: this.superchargedEffect,
      droneType: this.droneType,
      healAmount: this.healAmount,
      hits: this.hits,
    });
    card.isTemporary = this.isTemporary;
    card.isSupercharged = this.isSupercharged;
    card.sourceSlot = this.sourceSlot;
    card.sourceDroneType = this.sourceDroneType;
    return card;
  }

  getColorTint(): number {
    switch (this.type) {
      case 'attack': return 0xcc3333;
      case 'defend': return 0x3366cc;
      case 'drone': return 0x33cc66;
      case 'utility': return 0xcccc33;
      case 'passive': return 0x9933cc;
      default: return 0x666666;
    }
  }
}
