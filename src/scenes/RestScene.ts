import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { Player } from '../entities/Player';

export class RestScene extends Phaser.Scene {
  private player!: Player;
  private mapData: any;

  constructor() {
    super({ key: 'RestScene' });
  }

  create(data: any): void {
    this.player = data.player;
    this.mapData = data;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Campfire effect
    this.add.text(GAME_WIDTH / 2, 140, '🔥', {
      fontSize: '64px',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, 'REST STOP', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#f5a623',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, 'A brief moment of reprieve in the junkyard.', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    // HP display
    this.add.text(GAME_WIDTH / 2, 250, `HP: ${this.player.health}/${this.player.maxHealth}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff6666',
    }).setOrigin(0.5);

    // Options
    const healAmount = Math.floor(this.player.maxHealth * 0.3);

    this.createOption(GAME_WIDTH / 2, 330, `REST — Heal ${healAmount} HP`, () => {
      this.player.heal(healAmount);
      this.returnToMap();
    });

    this.createOption(GAME_WIDTH / 2, 400, 'TINKER — Remove a card from your deck', () => {
      // For now, just return to map (card removal UI would go here)
      this.returnToMap();
    });

    this.createOption(GAME_WIDTH / 2, 470, 'MOVE ON — Skip rest', () => {
      this.returnToMap();
    });
  }

  private createOption(x: number, y: number, label: string, callback: () => void): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 500, 50, COLORS.panel)
      .setStrokeStyle(2, 0x444444);
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(500, 50);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setStrokeStyle(2, COLORS.accent);
      text.setColor('#e94560');
    });
    container.on('pointerout', () => {
      bg.setStrokeStyle(2, 0x444444);
      text.setColor('#ffffff');
    });
    container.on('pointerdown', callback);
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
