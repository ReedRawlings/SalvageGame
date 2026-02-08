import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { Player } from '../entities/Player';
import { DeckManager } from '../systems/DeckManager';
import { EventManager, GameEvent, EventChoice, EventResult } from '../systems/EventManager';

export class EventScene extends Phaser.Scene {
  private player!: Player;
  private mapData: any;
  private event!: GameEvent;
  private eventMgr!: EventManager;

  constructor() {
    super({ key: 'EventScene' });
  }

  create(data: any): void {
    this.player = data.player;
    this.mapData = data;

    const deck = new DeckManager();
    this.eventMgr = new EventManager(this.player, deck);
    this.event = this.eventMgr.getRandomEvent();

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Event title
    this.add.text(GAME_WIDTH / 2, 80, this.event.title, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#e94560',
    }).setOrigin(0.5);

    // Event icon
    this.add.text(GAME_WIDTH / 2, 140, '?', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#226666',
    }).setOrigin(0.5);

    // Description
    this.add.text(GAME_WIDTH / 2, 200, this.event.description, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaaaaa',
      wordWrap: { width: 600 },
      align: 'center',
    }).setOrigin(0.5);

    // Player stats
    this.add.text(GAME_WIDTH / 2, 250, `HP: ${this.player.health}/${this.player.maxHealth} | CIRCUITS: ${this.player.circuits} | COREs: ${this.player.cores}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);

    // Choices
    for (let i = 0; i < this.event.choices.length; i++) {
      const choice = this.event.choices[i];
      const y = 310 + i * 70;
      const canAfford = this.eventMgr.canAffordChoice(choice);

      this.createChoice(GAME_WIDTH / 2, y, choice, canAfford, i);
    }
  }

  private createChoice(x: number, y: number, choice: EventChoice, canAfford: boolean, _index: number): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 600, 50, canAfford ? COLORS.panel : 0x1a1a1a)
      .setStrokeStyle(2, canAfford ? 0x444444 : 0x333333);
    container.add(bg);

    const text = this.add.text(0, 0, choice.text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: canAfford ? '#ffffff' : '#555555',
      wordWrap: { width: 560 },
      align: 'center',
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(600, 50);

    if (canAfford) {
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        bg.setStrokeStyle(2, COLORS.accent);
      });
      container.on('pointerout', () => {
        bg.setStrokeStyle(2, 0x444444);
      });
      container.on('pointerdown', () => {
        const result = this.eventMgr.resolveChoice(choice);
        this.showResult(result);
      });
    }
  }

  private showResult(result: EventResult): void {
    // Clear existing UI
    this.children.removeAll();

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    let resultText = 'Event resolved.';
    const lines: string[] = [];

    if (result.healthChange > 0) lines.push(`Healed ${result.healthChange} HP`);
    if (result.healthChange < 0) lines.push(`Lost ${Math.abs(result.healthChange)} HP`);
    if (result.circuitChange > 0) lines.push(`Gained ${result.circuitChange} circuits`);
    if (result.circuitChange < 0) lines.push(`Lost ${Math.abs(result.circuitChange)} circuits`);
    if (result.coreChange > 0) lines.push(`Gained ${result.coreChange} COREs`);
    if (result.coreChange < 0) lines.push(`Lost ${Math.abs(result.coreChange)} COREs`);
    if (result.cardsGained > 0) lines.push(`Gained ${result.cardsGained} card(s)`);
    if (result.message) lines.push(result.message);

    if (lines.length > 0) {
      resultText = lines.join('\n');
    }

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, resultText, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // Continue button
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
    const bg = this.add.rectangle(0, 0, 200, 45, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    container.add(bg);
    const text = this.add.text(0, 0, 'CONTINUE', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);
    container.setSize(200, 45);
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
