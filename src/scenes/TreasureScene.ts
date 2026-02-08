import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { Player } from '../entities/Player';

interface TreasureReward {
  name: string;
  description: string;
  apply: (player: Player) => void;
}

const TREASURES: TreasureReward[] = [
  {
    name: 'Reinforced Plating',
    description: '+10 Max HP',
    apply: (p) => { p.maxHealth += 10; p.health += 10; },
  },
  {
    name: 'Overcharged Cell',
    description: '+1 Max Energy',
    apply: (p) => { p.maxEnergy += 1; },
  },
  {
    name: 'Extra Drone Bay',
    description: '+1 Drone Slot',
    apply: (p) => { p.maxDroneSlots += 1; },
  },
  {
    name: 'Scrap Cache',
    description: '+30 Circuits',
    apply: (p) => { p.addCircuits(30); },
  },
  {
    name: 'Emergency Repair Kit',
    description: 'Heal to full HP',
    apply: (p) => { p.health = p.maxHealth; },
  },
  {
    name: 'Card Draw Module',
    description: '+1 Card Draw per turn',
    apply: (p) => { p.drawAmount += 1; },
  },
];

export class TreasureScene extends Phaser.Scene {
  private player!: Player;
  private mapData: any;

  constructor() {
    super({ key: 'TreasureScene' });
  }

  create(data: any): void {
    this.player = data.player;
    this.mapData = data;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Title
    this.add.text(GAME_WIDTH / 2, 80, 'TREASURE FOUND', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#f5a623',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 120, '★', {
      fontSize: '48px',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 170, 'Choose one upgrade for this run:', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    // Offer 3 random treasures
    const shuffled = [...TREASURES].sort(() => Math.random() - 0.5);
    const offered = shuffled.slice(0, 3);

    for (let i = 0; i < offered.length; i++) {
      const treasure = offered[i];
      this.createTreasureOption(GAME_WIDTH / 2, 250 + i * 90, treasure);
    }

    // Skip option
    this.createSkipButton();
  }

  private createTreasureOption(x: number, y: number, treasure: TreasureReward): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 500, 70, COLORS.panel)
      .setStrokeStyle(2, COLORS.gold);
    container.add(bg);

    const nameText = this.add.text(0, -15, treasure.name, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f5a623',
    }).setOrigin(0.5);
    container.add(nameText);

    const descText = this.add.text(0, 10, treasure.description, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    container.add(descText);

    container.setSize(500, 70);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(COLORS.accentAlt);
    });
    container.on('pointerout', () => {
      bg.setFillStyle(COLORS.panel);
    });
    container.on('pointerdown', () => {
      treasure.apply(this.player);
      this.returnToMap();
    });
  }

  private createSkipButton(): void {
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60);
    const bg = this.add.rectangle(0, 0, 200, 40, COLORS.panel)
      .setStrokeStyle(1, 0x444444);
    container.add(bg);
    const text = this.add.text(0, 0, 'SKIP', {
      fontFamily: 'monospace', fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);
    container.add(text);
    container.setSize(200, 40);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => this.returnToMap());
  }

  private returnToMap(): void {
    this.scene.start('MapScene', {
      player: this.player,
      map: this.mapData.map,
      currentNodeId: this.mapData.currentNodeId,
      floorsCleared: this.mapData.floorsCleared,
      enemiesDefeated: this.mapData.enemiesDefeated,
      coresEarned: this.mapData.coresEarned,
    });
  }
}
