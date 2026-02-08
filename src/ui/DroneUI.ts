import Phaser from 'phaser';
import { Drone } from '../entities/Drone';
import { COLORS, DEPTH, GAME_WIDTH } from '../utils/Constants';

export class DroneFieldUI extends Phaser.GameObjects.Container {
  public drone: Drone;
  private bg: Phaser.GameObjects.Rectangle;
  private typeText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private durationText: Phaser.GameObjects.Text;
  private attackText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, drone: Drone) {
    super(scene, x, y);
    this.drone = drone;

    this.bg = scene.add.rectangle(0, 0, 50, 50, this.getDroneColor())
      .setStrokeStyle(1, COLORS.drone);
    this.add(this.bg);

    this.typeText = scene.add.text(0, -12, this.getTypeSymbol(), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.typeText);

    this.levelText = scene.add.text(20, -22, drone.level > 1 ? 'Lv2' : '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffcc44',
    }).setOrigin(0.5);
    this.add(this.levelText);

    this.durationText = scene.add.text(0, 12, `${drone.duration}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    this.add(this.durationText);

    this.attackText = scene.add.text(0, 30, drone.attack > 0 ? `ATK:${drone.attack}` : '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ff6666',
    }).setOrigin(0.5);
    this.add(this.attackText);

    this.setDepth(DEPTH.entities);
    scene.add.existing(this);
  }

  private getDroneColor(): number {
    switch (this.drone.type) {
      case 'attack': return 0x660000;
      case 'shield': return 0x000066;
      case 'repair': return 0x006600;
      case 'siphon': return 0x660066;
      case 'overload': return 0x664400;
      case 'decoy': return 0x444444;
      default: return 0x333333;
    }
  }

  private getTypeSymbol(): string {
    switch (this.drone.type) {
      case 'attack': return '⚔';
      case 'shield': return '🛡';
      case 'repair': return '+';
      case 'siphon': return '◈';
      case 'overload': return '💣';
      case 'decoy': return '◎';
      default: return '?';
    }
  }

  updateDisplay(): void {
    this.durationText.setText(`${this.drone.duration}`);
    this.attackText.setText(this.drone.attack > 0 ? `ATK:${this.drone.attack}` : '');
    this.levelText.setText(this.drone.level > 1 ? 'Lv2' : '');

    if (this.drone.waitTurns > 0) {
      this.setAlpha(0.5);
    } else {
      this.setAlpha(1);
    }
  }
}

export function renderDroneField(scene: Phaser.Scene, drones: Drone[]): DroneFieldUI[] {
  const uis: DroneFieldUI[] = [];
  const y = 330;
  const spacing = 60;
  const startX = GAME_WIDTH / 2 - ((drones.length - 1) * spacing) / 2;

  for (let i = 0; i < drones.length; i++) {
    const ui = new DroneFieldUI(scene, startX + i * spacing, y, drones[i]);
    uis.push(ui);
  }
  return uis;
}
