import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { SaveManager } from '../utils/SaveManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Title
    this.add.text(GAME_WIDTH / 2, 150, 'SALVAGE', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#e94560',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 210, 'JUNKYARD DECKBUILDER', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // Decorative line
    const line = this.add.rectangle(GAME_WIDTH / 2, 240, 300, 2, COLORS.accent);

    // New Game button
    const newGameBtn = this.createButton(GAME_WIDTH / 2, 320, 'NEW GAME', () => {
      SaveManager.deleteSave();
      this.scene.start('LoadoutScene', { newGame: true });
    });

    // Continue button (if save exists)
    if (SaveManager.hasSave()) {
      this.createButton(GAME_WIDTH / 2, 390, 'CONTINUE', () => {
        this.scene.start('LoadoutScene', { newGame: false });
      });
    }

    // Flavor text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'ASSEMBLE. DEPLOY. SALVAGE.', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444444',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, 'v0.1.0 — Built with Phaser 3', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#333333',
    }).setOrigin(0.5);

    // Scanline effect
    for (let i = 0; i < GAME_HEIGHT; i += 4) {
      this.add.rectangle(GAME_WIDTH / 2, i, GAME_WIDTH, 1, 0x000000, 0.05);
    }
  }

  private createButton(x: number, y: number, label: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 250, 50, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(250, 50);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(COLORS.accentAlt);
      text.setColor('#e94560');
    });

    container.on('pointerout', () => {
      bg.setFillStyle(COLORS.panel);
      text.setColor('#ffffff');
    });

    container.on('pointerdown', callback);

    return container;
  }
}
