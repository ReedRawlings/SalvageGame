import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const progressBar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 0, 30, COLORS.accent);
    const progressBox = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 320, 30)
      .setStrokeStyle(2, 0x444444);

    const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'INITIALIZING SYSTEMS...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.width = 300 * value;
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate placeholder textures
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private createPlaceholderTextures(): void {
    // Card back
    const cardBack = this.make.graphics({ x: 0, y: 0 });
    cardBack.fillStyle(0x1a1a2e);
    cardBack.fillRect(0, 0, 120, 170);
    cardBack.lineStyle(2, 0xe94560);
    cardBack.strokeRect(0, 0, 120, 170);
    cardBack.fillStyle(0xe94560);
    cardBack.fillRect(20, 40, 80, 90);
    cardBack.generateTexture('card_back', 120, 170);
    cardBack.destroy();

    // Particle
    const particle = this.make.graphics({ x: 0, y: 0 });
    particle.fillStyle(0xffdd44);
    particle.fillCircle(4, 4, 4);
    particle.generateTexture('spark_particle', 8, 8);
    particle.destroy();
  }
}
