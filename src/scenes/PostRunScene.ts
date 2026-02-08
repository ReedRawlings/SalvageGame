import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { Player } from '../entities/Player';
import { ProgressionManager, RunResult } from '../systems/ProgressionManager';
import { SaveManager } from '../utils/SaveManager';

export class PostRunScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super({ key: 'PostRunScene' });
  }

  create(data: { player: Player; victory: boolean; floorsCleared: number; enemiesDefeated: number; coresEarned: number }): void {
    this.player = data.player;
    const progMgr = new ProgressionManager(this.player);

    const result: RunResult = {
      floorsCleared: data.floorsCleared,
      enemiesDefeated: data.enemiesDefeated,
      circuitsEarned: this.player.circuits,
      coresEarned: data.coresEarned,
      victory: data.victory,
    };

    const rewards = progMgr.calculateRunRewards(result);
    progMgr.applyRunRewards(result);
    progMgr.endRun();

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Title
    const titleColor = data.victory ? '#44ff44' : '#ff4444';
    const titleText = data.victory ? 'RUN COMPLETE' : 'RUN FAILED';
    this.add.text(GAME_WIDTH / 2, 60, titleText, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: titleColor,
    }).setOrigin(0.5);

    // Stats
    const stats = [
      `Floors Cleared: ${data.floorsCleared}`,
      `Enemies Defeated: ${data.enemiesDefeated}`,
      `Circuits Earned: ${result.circuitsEarned}`,
      `COREs Earned: ${data.coresEarned}`,
      ``,
      `── REWARDS ──`,
      `Energy Tokens: +${rewards.energyTokens}`,
      `COREs Collected: +${rewards.cores}`,
    ];

    for (let i = 0; i < stats.length; i++) {
      this.add.text(GAME_WIDTH / 2, 140 + i * 30, stats[i], {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#cccccc',
      }).setOrigin(0.5);
    }

    // Equipment battery status
    this.add.text(GAME_WIDTH / 2, 420, '── EQUIPMENT BATTERY STATUS ──', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666666',
    }).setOrigin(0.5);

    let y = 450;
    for (const piece of this.player.ownedEquipment) {
      const batColor = piece.battery > 0 ? '#44ff44' : '#ff4444';
      const batText = piece.battery > 0 ? `${'█'.repeat(piece.battery)}${'░'.repeat(4 - piece.battery)}` : 'DEPLETED';
      this.add.text(GAME_WIDTH / 2, y, `${piece.name}: ${batText}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: batColor,
      }).setOrigin(0.5);
      y += 22;
    }

    // Save and continue
    SaveManager.save(this.player);

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'RETURN TO JUNKYARD', () => {
      this.scene.start('LoadoutScene', { newGame: false });
    });
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 300, 50, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    container.add(bg);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);
    container.setSize(300, 50);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(COLORS.accentAlt));
    container.on('pointerout', () => bg.setFillStyle(COLORS.panel));
    container.on('pointerdown', callback);
  }
}
