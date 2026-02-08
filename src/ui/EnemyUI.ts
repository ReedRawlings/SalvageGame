import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { COLORS, DEPTH, GAME_WIDTH } from '../utils/Constants';

export class EnemyUI extends Phaser.GameObjects.Container {
  public enemy: Enemy;
  private bg: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private blockText: Phaser.GameObjects.Text;
  private intentIcon: Phaser.GameObjects.Text;
  private intentText: Phaser.GameObjects.Text;
  public onClick?: (enemy: Enemy) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, enemy: Enemy) {
    super(scene, x, y);
    this.enemy = enemy;

    // Enemy body
    const bodyColor = this.getBodyColor();
    this.bg = scene.add.rectangle(0, 0, 80, 80, bodyColor).setStrokeStyle(2, 0x888888);
    this.add(this.bg);

    // Enemy icon/symbol
    const symbol = scene.add.text(0, -5, this.getSymbol(), {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(symbol);

    // Name
    this.nameText = scene.add.text(0, -58, enemy.name, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.nameText);

    // HP bar background
    this.hpBarBg = scene.add.rectangle(0, 50, 70, 8, 0x333333);
    this.add(this.hpBarBg);

    // HP bar
    this.hpBar = scene.add.rectangle(0, 50, 70, 8, COLORS.health);
    this.add(this.hpBar);

    // HP text
    this.hpText = scene.add.text(0, 62, `${enemy.health}/${enemy.maxHealth}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.hpText);

    // Block display
    this.blockText = scene.add.text(45, -40, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#4488ff',
    }).setOrigin(0.5);
    this.add(this.blockText);

    // Intent display
    this.intentIcon = scene.add.text(0, -78, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff6666',
    }).setOrigin(0.5);
    this.add(this.intentIcon);

    this.intentText = scene.add.text(0, -92, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#cccccc',
    }).setOrigin(0.5);
    this.add(this.intentText);

    this.setSize(80, 80);
    this.setInteractive();
    this.setDepth(DEPTH.entities);

    this.on('pointerdown', () => {
      if (this.onClick) this.onClick(enemy);
    });

    this.on('pointerover', () => {
      this.bg.setStrokeStyle(2, COLORS.accent);
    });

    this.on('pointerout', () => {
      this.bg.setStrokeStyle(2, 0x888888);
    });

    scene.add.existing(this);
    this.updateDisplay();
  }

  private getBodyColor(): number {
    switch (this.enemy.difficulty) {
      case 'easy': return 0x2a2a3a;
      case 'hard': return 0x3a2a2a;
      case 'elite': return 0x3a2a3a;
      case 'boss': return 0x4a1a1a;
      default: return 0x2a2a2a;
    }
  }

  private getSymbol(): string {
    const symbols: Record<string, string> = {
      scrap_rat: '🐀',
      loose_wiring: '⚡',
      junk_pile: '🗑',
      rust_mite: '🪲',
      magnet_crawler: '🧲',
      welder: '🔧',
      shock_beetle: '⚡',
      rust_hulk: '🤖',
      salvage_drone: '🔋',
      junkyard_dog: '🐕',
      compactor: '🔩',
      voltage_king: '👑',
      scrap_titan: '💀',
      the_crusher: '⚙',
      junkyard_warden: '🛡',
      the_smelter: '🔥',
    };
    return symbols[this.enemy.id] ?? '?';
  }

  updateDisplay(): void {
    const hpRatio = this.enemy.health / this.enemy.maxHealth;
    this.hpBar.width = 70 * hpRatio;
    this.hpBar.x = -(70 - 70 * hpRatio) / 2;
    this.hpText.setText(`${this.enemy.health}/${this.enemy.maxHealth}`);

    if (this.enemy.block > 0) {
      this.blockText.setText(`🛡${this.enemy.block}`);
      this.blockText.setVisible(true);
    } else {
      this.blockText.setVisible(false);
    }

    // Update intent
    const intent = this.enemy.intent;
    if (intent) {
      switch (intent.type) {
        case 'attack': {
          const dmg = (intent.damage ?? 0) + this.enemy.powerStacks;
          this.intentIcon.setText('⚔');
          this.intentIcon.setColor('#ff6666');
          this.intentText.setText(`${dmg}`);
          break;
        }
        case 'defend':
          this.intentIcon.setText('🛡');
          this.intentIcon.setColor('#6688ff');
          this.intentText.setText(`${intent.block ?? 0}`);
          break;
        case 'buff':
          this.intentIcon.setText('↑');
          this.intentIcon.setColor('#ffcc44');
          this.intentText.setText('BUFF');
          break;
        case 'debuff':
          this.intentIcon.setText('↓');
          this.intentIcon.setColor('#cc44ff');
          this.intentText.setText('DEBUFF');
          break;
        case 'heal':
          this.intentIcon.setText('+');
          this.intentIcon.setColor('#44ff44');
          this.intentText.setText(`${intent.amount ?? 0}`);
          break;
        case 'summon':
          this.intentIcon.setText('◆');
          this.intentIcon.setColor('#44ffcc');
          this.intentText.setText('SUMMON');
          break;
      }
    }

    // Show dead state
    if (this.enemy.isDead()) {
      this.setAlpha(0.3);
      this.disableInteractive();
    }
  }
}

export function createEnemyGroup(scene: Phaser.Scene, enemies: Enemy[]): EnemyUI[] {
  const uis: EnemyUI[] = [];
  const spacing = 120;
  const totalWidth = (enemies.length - 1) * spacing;
  const startX = GAME_WIDTH / 2 - totalWidth / 2;
  const y = 180;

  for (let i = 0; i < enemies.length; i++) {
    const ui = new EnemyUI(scene, startX + i * spacing, y, enemies[i]);
    uis.push(ui);
  }
  return uis;
}
