import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, EQUIPMENT_BATTERY_MAX } from '../utils/Constants';
import { Player } from '../entities/Player';
import { Equipment, EquipmentData } from '../entities/Equipment';
import { EquipmentManager } from '../systems/EquipmentManager';
import { ProgressionManager } from '../systems/ProgressionManager';
import { SaveManager } from '../utils/SaveManager';

export class ShopScene extends Phaser.Scene {
  private player!: Player;
  private equipMgr!: EquipmentManager;
  private progMgr!: ProgressionManager;
  private shopItems: EquipmentData[] = [];
  private coreText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(data: { player: Player }): void {
    this.player = data.player;
    this.equipMgr = new EquipmentManager(this.player);
    this.progMgr = new ProgressionManager(this.player);

    this.shopItems = this.equipMgr.getShopEquipment(4);

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'JUNKYARD SHOP', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#f5a623',
    }).setOrigin(0.5);

    // Core display
    this.coreText = this.add.text(GAME_WIDTH / 2, 60, `COREs: ${this.player.cores}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f5a623',
    }).setOrigin(0.5);

    // Shop items
    this.renderShopItems();

    // Recharge section
    this.renderRechargeSection();

    // Refresh button
    this.createButton(GAME_WIDTH / 2 + 250, 60, 'REFRESH (1 CORE)', () => {
      if (this.player.spendCores(1)) {
        this.shopItems = this.equipMgr.getShopEquipment(4);
        this.scene.restart({ player: this.player });
      }
    });

    // Back button
    this.createButton(100, GAME_HEIGHT - 40, 'BACK', () => {
      SaveManager.save(this.player);
      this.scene.start('LoadoutScene', { newGame: false });
    });
  }

  private renderShopItems(): void {
    this.add.text(GAME_WIDTH / 2, 100, '── EQUIPMENT FOR SALE ──', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666666',
    }).setOrigin(0.5);

    for (let i = 0; i < this.shopItems.length; i++) {
      const item = this.shopItems[i];
      const x = 160 + (i % 2) * 500;
      const y = 160 + Math.floor(i / 2) * 150;

      this.renderShopItem(x, y, item);
    }
  }

  private renderShopItem(x: number, y: number, item: EquipmentData): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 440, 120, COLORS.panel)
      .setStrokeStyle(2, 0x444444);
    container.add(bg);

    const nameText = this.add.text(-200, -40, item.name, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    container.add(nameText);

    const familyText = this.add.text(-200, -20, `${item.family.toUpperCase()} — ${item.slot.toUpperCase()}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#e94560',
    });
    container.add(familyText);

    const descText = this.add.text(-200, 0, item.description, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
      wordWrap: { width: 300 },
    });
    container.add(descText);

    const costText = this.add.text(150, -30, `${item.cost} COREs`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f5a623',
    }).setOrigin(0.5);
    container.add(costText);

    const canAfford = this.player.cores >= item.cost;
    const buyBtn = this.add.rectangle(150, 15, 100, 35, canAfford ? 0x226622 : 0x662222)
      .setStrokeStyle(1, canAfford ? 0x44ff44 : 0x888888);
    container.add(buyBtn);

    const buyText = this.add.text(150, 15, 'BUY', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: canAfford ? '#ffffff' : '#666666',
    }).setOrigin(0.5);
    container.add(buyText);

    if (canAfford) {
      buyBtn.setInteractive({ useHandCursor: true });
      buyBtn.on('pointerdown', () => {
        const piece = this.progMgr.purchaseEquipment(item.id);
        if (piece) {
          this.coreText.setText(`COREs: ${this.player.cores}`);
          this.scene.restart({ player: this.player });
        }
      });
    }
  }

  private renderRechargeSection(): void {
    this.add.text(GAME_WIDTH / 2, 420, '── RECHARGE DEPLETED EQUIPMENT ──', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666666',
    }).setOrigin(0.5);

    const depleted = this.player.ownedEquipment.filter(e => !e.isAvailable());
    if (depleted.length === 0) {
      this.add.text(GAME_WIDTH / 2, 460, 'No depleted equipment', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#444444',
      }).setOrigin(0.5);
      return;
    }

    for (let i = 0; i < depleted.length; i++) {
      const piece = depleted[i];
      const y = 460 + i * 40;

      const text = this.add.text(200, y, `${piece.name} — 2 COREs to recharge`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#cccccc',
      }).setOrigin(0, 0.5);

      if (this.player.cores >= 2) {
        const btn = this.add.rectangle(600, y, 100, 30, 0x226622)
          .setStrokeStyle(1, 0x44ff44)
          .setInteractive({ useHandCursor: true });

        const btnText = this.add.text(600, y, 'RECHARGE', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
        }).setOrigin(0.5);

        btn.on('pointerdown', () => {
          if (this.progMgr.rechargeEquipment(piece)) {
            this.coreText.setText(`COREs: ${this.player.cores}`);
            this.scene.restart({ player: this.player });
          }
        });
      }
    }
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 200, 35, COLORS.panel)
      .setStrokeStyle(1, COLORS.accent);
    container.add(bg);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);
    container.setSize(200, 35);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(COLORS.accentAlt));
    container.on('pointerout', () => bg.setFillStyle(COLORS.panel));
    container.on('pointerdown', callback);
  }
}
