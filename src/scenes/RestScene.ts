import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { Player } from '../entities/Player';
import { Card, CardData } from '../entities/Card';
import { EquipmentManager } from '../systems/EquipmentManager';
import cardsData from '../data/cards.json';

export class RestScene extends Phaser.Scene {
  private player!: Player;
  private mapData: any;

  constructor() {
    super({ key: 'RestScene' });
  }

  create(data: any): void {
    this.player = data.player;
    this.mapData = data;

    this.renderMainMenu();
  }

  private renderMainMenu(): void {
    this.children.removeAll();

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
      this.showCardRemoval();
    });

    this.createOption(GAME_WIDTH / 2, 470, 'MOVE ON — Skip rest', () => {
      this.returnToMap();
    });
  }

  private showCardRemoval(): void {
    this.children.removeAll();

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add.text(GAME_WIDTH / 2, 40, 'TINKER — SELECT A CARD TO SCRAP', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#f5a623',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 70, 'Choose one card to permanently remove from this run\'s deck.', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);

    // Build the full deck card list
    const equipMgr = new EquipmentManager(this.player);
    const cardIds = equipMgr.getBaseDeckCards();

    // Build unique card entries with counts
    const cardCounts = new Map<string, number>();
    for (const id of cardIds) {
      cardCounts.set(id, (cardCounts.get(id) ?? 0) + 1);
    }

    const uniqueIds = [...cardCounts.keys()];
    const cardsPerRow = 6;
    const cardW = 140;
    const cardH = 185;
    const gapX = 12;
    const gapY = 12;
    const totalRowWidth = cardsPerRow * cardW + (cardsPerRow - 1) * gapX;
    const offsetX = (GAME_WIDTH - totalRowWidth) / 2 + cardW / 2;
    const offsetY = 105;

    for (let i = 0; i < uniqueIds.length; i++) {
      const id = uniqueIds[i];
      const count = cardCounts.get(id)!;
      const cardData = (cardsData as Record<string, CardData>)[id];
      if (!cardData) continue;

      const card = new Card(cardData);
      const col = i % cardsPerRow;
      const row = Math.floor(i / cardsPerRow);
      const x = offsetX + col * (cardW + gapX);
      const y = offsetY + row * (cardH + gapY) + cardH / 2;

      this.createRemovableCard(x, y, card, count, cardW, cardH);
    }

    // Back button
    this.createOption(GAME_WIDTH / 2, GAME_HEIGHT - 45, 'CANCEL — Go back', () => {
      this.renderMainMenu();
    });
  }

  private createRemovableCard(x: number, y: number, card: Card, count: number, w: number, h: number): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x1a1a2e)
      .setStrokeStyle(2, card.getColorTint());
    container.add(bg);

    // Color stripe
    container.add(this.add.rectangle(0, -h / 2 + 8, w - 8, 12, card.getColorTint()));

    // Cost
    container.add(this.add.text(-w / 2 + 8, -h / 2 + 4, `${card.cost}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#f5a623',
    }));

    // Name
    container.add(this.add.text(0, -h / 2 + 24, card.name, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
    }).setOrigin(0.5));

    // Type
    container.add(this.add.text(0, -h / 2 + 40, card.type.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '8px', color: '#666666',
    }).setOrigin(0.5));

    // Stats
    let statY = -10;
    if (card.damage > 0) {
      container.add(this.add.text(0, statY, `DMG: ${card.damage}${card.hits > 1 ? ` x${card.hits}` : ''}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ff6666',
      }).setOrigin(0.5));
      statY += 16;
    }
    if (card.block > 0) {
      container.add(this.add.text(0, statY, `BLK: ${card.block}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#6688ff',
      }).setOrigin(0.5));
      statY += 16;
    }

    // Description
    container.add(this.add.text(0, h / 2 - 50, card.description, {
      fontFamily: 'monospace', fontSize: '8px', color: '#aaaaaa',
      wordWrap: { width: w - 16 }, align: 'center',
    }).setOrigin(0.5, 0));

    // Count badge
    if (count > 1) {
      container.add(this.add.text(w / 2 - 8, -h / 2 + 4, `x${count}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
      }).setOrigin(1, 0));
    }

    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setStrokeStyle(3, COLORS.accent);
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    container.on('pointerout', () => {
      bg.setStrokeStyle(2, card.getColorTint());
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
    });
    container.on('pointerdown', () => {
      this.confirmRemoval(card);
    });
  }

  private confirmRemoval(card: Card): void {
    // Overlay
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setDepth(90).setInteractive();

    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(91);

    const panelBg = this.add.rectangle(0, 0, 400, 200, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    panel.add(panelBg);

    panel.add(this.add.text(0, -60, 'SCRAP THIS CARD?', {
      fontFamily: 'monospace', fontSize: '18px', color: '#e94560',
    }).setOrigin(0.5));

    panel.add(this.add.text(0, -25, card.name, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5));

    panel.add(this.add.text(0, 0, card.description, {
      fontFamily: 'monospace', fontSize: '11px', color: '#aaaaaa',
      wordWrap: { width: 340 }, align: 'center',
    }).setOrigin(0.5));

    // Confirm
    const confirmBtn = this.add.container(-90, 60);
    const cbg = this.add.rectangle(0, 0, 150, 40, 0x226622).setStrokeStyle(1, 0x44ff44);
    confirmBtn.add(cbg);
    confirmBtn.add(this.add.text(0, 0, 'SCRAP', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5));
    confirmBtn.setSize(150, 40).setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerover', () => cbg.setFillStyle(0x338833));
    confirmBtn.on('pointerout', () => cbg.setFillStyle(0x226622));
    confirmBtn.on('pointerdown', () => {
      this.player.removedCardIds.push(card.id);
      overlay.destroy();
      panel.destroy();
      this.returnToMap();
    });
    panel.add(confirmBtn);

    // Cancel
    const cancelBtn = this.add.container(90, 60);
    const xbg = this.add.rectangle(0, 0, 150, 40, 0x662222).setStrokeStyle(1, 0xff4444);
    cancelBtn.add(xbg);
    cancelBtn.add(this.add.text(0, 0, 'CANCEL', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5));
    cancelBtn.setSize(150, 40).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerover', () => xbg.setFillStyle(0x883333));
    cancelBtn.on('pointerout', () => xbg.setFillStyle(0x662222));
    cancelBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
    });
    panel.add(cancelBtn);
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
