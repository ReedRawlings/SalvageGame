import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { COLORS, DEPTH } from '../utils/Constants';

export const CARD_WIDTH = 120;
export const CARD_HEIGHT = 170;

export class CardUI extends Phaser.GameObjects.Container {
  public card: Card;
  private bg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private costText: Phaser.GameObjects.Text;
  private descText: Phaser.GameObjects.Text;
  private typeIndicator: Phaser.GameObjects.Rectangle;
  private isDragging: boolean = false;
  private originalX: number = 0;
  private originalY: number = 0;
  public onPlay?: (card: Card) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card) {
    super(scene, x, y);
    this.card = card;

    // Background
    this.bg = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x1a1a2e);
    this.add(this.bg);

    // Border
    this.border = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT)
      .setStrokeStyle(2, card.getColorTint());
    this.add(this.border);

    // Type indicator stripe
    this.typeIndicator = scene.add.rectangle(0, -CARD_HEIGHT / 2 + 8, CARD_WIDTH - 8, 12, card.getColorTint());
    this.add(this.typeIndicator);

    // Cost
    this.costText = scene.add.text(-CARD_WIDTH / 2 + 8, -CARD_HEIGHT / 2 + 4, `${card.getEffectiveCost()}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f5a623',
    });
    this.add(this.costText);

    // Name
    this.nameText = scene.add.text(0, -CARD_HEIGHT / 2 + 24, card.name, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);
    this.add(this.nameText);

    // Damage/Block display
    let statY = 8;
    if (card.damage > 0) {
      const dmgText = scene.add.text(0, statY, `DMG: ${card.damage}${card.hits > 1 ? ` x${card.hits}` : ''}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ff6666',
      }).setOrigin(0.5);
      this.add(dmgText);
      statY += 16;
    }
    if (card.block > 0) {
      const blkText = scene.add.text(0, statY, `BLK: ${card.block}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6688ff',
      }).setOrigin(0.5);
      this.add(blkText);
      statY += 16;
    }

    // Description
    this.descText = scene.add.text(0, CARD_HEIGHT / 2 - 50, card.description, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#aaaaaa',
      wordWrap: { width: CARD_WIDTH - 16 },
      align: 'center',
    }).setOrigin(0.5, 0);
    this.add(this.descText);

    // Supercharged indicator
    if (card.isSupercharged) {
      const scBorder = scene.add.rectangle(0, 0, CARD_WIDTH + 4, CARD_HEIGHT + 4)
        .setStrokeStyle(3, COLORS.spark);
      this.add(scBorder);
    }

    this.setSize(CARD_WIDTH, CARD_HEIGHT);
    this.setInteractive({ draggable: true });
    this.setDepth(DEPTH.cards);

    this.setupInteraction();
    scene.add.existing(this);
  }

  private setupInteraction(): void {
    this.on('pointerover', () => {
      if (!this.isDragging) {
        this.scene.tweens.add({
          targets: this,
          y: this.y - 20,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          ease: 'Back.easeOut',
        });
        this.setDepth(DEPTH.hand + 1);
      }
    });

    this.on('pointerout', () => {
      if (!this.isDragging) {
        this.scene.tweens.add({
          targets: this,
          y: this.originalY,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
        });
        this.setDepth(DEPTH.cards);
      }
    });

    this.on('dragstart', () => {
      this.isDragging = true;
      this.setDepth(DEPTH.dragCard);
      this.setScale(1.1);
    });

    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.x = dragX;
      this.y = dragY;
    });

    this.on('dragend', () => {
      this.isDragging = false;
      // If dragged above the play line (upper half of screen), play the card
      if (this.y < 400) {
        if (this.onPlay) {
          this.onPlay(this.card);
        }
      } else {
        // Return to hand position
        this.scene.tweens.add({
          targets: this,
          x: this.originalX,
          y: this.originalY,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
        });
      }
      this.setDepth(DEPTH.cards);
    });
  }

  setHandPosition(x: number, y: number): void {
    this.originalX = x;
    this.originalY = y;
    this.x = x;
    this.y = y;
  }

  updateDisplay(): void {
    this.costText.setText(`${this.card.getEffectiveCost()}`);
  }

  setPlayable(canPlay: boolean): void {
    this.setAlpha(canPlay ? 1 : 0.5);
    if (canPlay) {
      this.setInteractive({ draggable: true });
    } else {
      this.disableInteractive();
    }
  }
}
