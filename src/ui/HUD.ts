import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { COLORS, DEPTH, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class HUD extends Phaser.GameObjects.Container {
  private player: Player;
  private healthBar: Phaser.GameObjects.Rectangle;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthText: Phaser.GameObjects.Text;
  private energyText: Phaser.GameObjects.Text;
  private blockText: Phaser.GameObjects.Text;
  private droneSlotsText: Phaser.GameObjects.Text;
  private circuitsText: Phaser.GameObjects.Text;
  private coresText: Phaser.GameObjects.Text;
  private turnText: Phaser.GameObjects.Text;
  private deckText: Phaser.GameObjects.Text;
  private discardText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, 0, 0);
    this.player = player;

    // Left side: Player stats
    const leftPanel = scene.add.rectangle(100, 30, 200, 50, COLORS.panel, 0.8)
      .setStrokeStyle(1, 0x333333);
    this.add(leftPanel);

    // Health bar
    this.healthBarBg = scene.add.rectangle(100, 20, 180, 12, 0x333333);
    this.add(this.healthBarBg);
    this.healthBar = scene.add.rectangle(100, 20, 180, 12, COLORS.health);
    this.add(this.healthBar);
    this.healthText = scene.add.text(100, 20, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.healthText);

    // Energy
    this.energyText = scene.add.text(20, 40, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f5a623',
    });
    this.add(this.energyText);

    // Block
    this.blockText = scene.add.text(100, 40, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#4488ff',
    });
    this.add(this.blockText);

    // Drone slots
    this.droneSlotsText = scene.add.text(170, 40, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#66ffcc',
    });
    this.add(this.droneSlotsText);

    // Right side: Resources
    this.circuitsText = scene.add.text(GAME_WIDTH - 200, 15, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#cccccc',
    });
    this.add(this.circuitsText);

    this.coresText = scene.add.text(GAME_WIDTH - 200, 35, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#f5a623',
    });
    this.add(this.coresText);

    // Turn counter
    this.turnText = scene.add.text(GAME_WIDTH / 2, 15, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.turnText);

    // Deck/Discard
    this.deckText = scene.add.text(GAME_WIDTH - 100, GAME_HEIGHT - 30, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#888888',
    }).setOrigin(0.5);
    this.add(this.deckText);

    this.discardText = scene.add.text(GAME_WIDTH - 30, GAME_HEIGHT - 30, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#888888',
    }).setOrigin(0.5);
    this.add(this.discardText);

    this.setDepth(DEPTH.ui);
    scene.add.existing(this);
  }

  update(turn?: number, deckSize?: number, discardSize?: number, activeDrones?: number): void {
    const p = this.player;

    // Health bar
    const ratio = p.health / p.maxHealth;
    this.healthBar.width = 180 * ratio;
    this.healthBar.x = 10 + (180 * ratio) / 2;
    this.healthText.setText(`HP: ${p.health}/${p.maxHealth}`);

    // Energy
    this.energyText.setText(`⚡${p.energy}/${p.maxEnergy}`);

    // Block
    this.blockText.setText(p.block > 0 ? `🛡${p.block}` : '');

    // Drone slots
    this.droneSlotsText.setText(`DRONES: ${activeDrones ?? 0}/${p.maxDroneSlots}`);

    // Resources
    this.circuitsText.setText(`CIRCUITS: ${p.circuits}`);
    this.coresText.setText(`COREs: ${p.cores}`);

    // Turn
    if (turn !== undefined) {
      this.turnText.setText(`TURN ${turn}`);
    }

    // Deck/Discard
    if (deckSize !== undefined) {
      this.deckText.setText(`DECK: ${deckSize}`);
    }
    if (discardSize !== undefined) {
      this.discardText.setText(`DISC: ${discardSize}`);
    }
  }
}
