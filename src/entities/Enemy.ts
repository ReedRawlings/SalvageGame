export interface EnemyAction {
  type: 'attack' | 'defend' | 'buff' | 'debuff' | 'heal' | 'summon';
  damage?: number;
  block?: number;
  effect?: string;
  amount?: number;
  target?: string;
  summonId?: string;
}

export interface EnemyData {
  id: string;
  name: string;
  health: number;
  difficulty: string;
  description: string;
  pattern: EnemyAction[];
  onAllyDeath?: { effect: string; amount: number };
  parts?: string[];
}

export class Enemy {
  public id: string;
  public name: string;
  public maxHealth: number;
  public health: number;
  public block: number;
  public difficulty: string;
  public description: string;
  public pattern: EnemyAction[];
  public patternIndex: number;
  public powerStacks: number;
  public onAllyDeath?: { effect: string; amount: number };
  public statusEffects: Map<string, number>;
  public intent: EnemyAction | null;

  constructor(data: EnemyData) {
    this.id = data.id;
    this.name = data.name;
    this.maxHealth = data.health;
    this.health = data.health;
    this.block = 0;
    this.difficulty = data.difficulty;
    this.description = data.description;
    this.pattern = [...data.pattern];
    this.patternIndex = 0;
    this.powerStacks = 0;
    this.onAllyDeath = data.onAllyDeath;
    this.statusEffects = new Map();
    this.intent = this.pattern[0] ?? null;
  }

  getNextIntent(): EnemyAction {
    return this.pattern[this.patternIndex % this.pattern.length];
  }

  advancePattern(): void {
    this.patternIndex = (this.patternIndex + 1) % this.pattern.length;
    this.intent = this.getNextIntent();
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

  getAttackDamage(): number {
    const intent = this.intent;
    if (!intent || intent.type !== 'attack') return 0;
    return (intent.damage ?? 0) + this.powerStacks;
  }

  addPower(amount: number): void {
    this.powerStacks += amount;
  }

  startTurn(): void {
    this.block = 0;
  }

  applyStatus(effect: string, stacks: number): void {
    const current = this.statusEffects.get(effect) ?? 0;
    this.statusEffects.set(effect, current + stacks);
  }
}
