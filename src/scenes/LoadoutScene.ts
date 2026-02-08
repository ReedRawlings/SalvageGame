import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, EQUIPMENT_SLOTS, EquipmentSlot, EQUIPMENT_BATTERY_MAX } from '../utils/Constants';
import { Player } from '../entities/Player';
import { Equipment, EquipmentData } from '../entities/Equipment';
import { EquipmentManager } from '../systems/EquipmentManager';
import { ProgressionManager } from '../systems/ProgressionManager';
import { SaveManager } from '../utils/SaveManager';
import equipmentData from '../data/equipment.json';

export class LoadoutScene extends Phaser.Scene {
  private player!: Player;
  private equipMgr!: EquipmentManager;
  private progMgr!: ProgressionManager;
  private slotContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private infoPanel!: Phaser.GameObjects.Container;
  private selectedPiece: Equipment | null = null;

  constructor() {
    super({ key: 'LoadoutScene' });
  }

  create(data: { newGame?: boolean }): void {
    this.player = new Player();
    this.equipMgr = new EquipmentManager(this.player);
    this.progMgr = new ProgressionManager(this.player);

    if (data?.newGame) {
      this.progMgr.initializeNewPlayer();
    } else {
      SaveManager.load(this.player);
    }

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'LOADOUT', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#e94560',
    }).setOrigin(0.5);

    // Resources display
    this.add.text(20, 15, `COREs: ${this.player.cores}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f5a623',
    });
    this.add.text(20, 35, `TOKENS: ${this.player.energyTokens}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#cccccc',
    });

    // Equipment slots (robot schematic layout)
    this.renderEquipmentSlots();

    // Owned equipment list
    this.renderOwnedEquipment();

    // Info panel
    this.createInfoPanel();

    // Buttons
    this.createButton(GAME_WIDTH / 2 - 140, GAME_HEIGHT - 50, 'SHOP', () => {
      SaveManager.save(this.player);
      this.scene.start('ShopScene', { player: this.player });
    });

    this.createButton(GAME_WIDTH / 2 + 140, GAME_HEIGHT - 50, 'LAUNCH RUN', () => {
      SaveManager.save(this.player);
      this.scene.start('MapScene', { player: this.player });
    });

    // Set bonuses display
    this.renderSetBonuses();
  }

  private renderEquipmentSlots(): void {
    const positions: Record<string, { x: number; y: number }> = {
      charger: { x: GAME_WIDTH / 2, y: 120 },
      head: { x: GAME_WIDTH / 2, y: 190 },
      chassis: { x: GAME_WIDTH / 2, y: 270 },
      arms: { x: GAME_WIDTH / 2 - 120, y: 270 },
      legs: { x: GAME_WIDTH / 2, y: 350 },
    };

    for (const slot of EQUIPMENT_SLOTS) {
      const pos = positions[slot];
      const piece = this.player.equipment.get(slot);
      const container = this.createSlotUI(pos.x, pos.y, slot, piece ?? undefined);
      this.slotContainers.set(slot, container);
    }

    // Slot labels
    this.add.text(GAME_WIDTH / 2, 85, '── ROBOT SCHEMATIC ──', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444444',
    }).setOrigin(0.5);

    // Connection lines between slots
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x333333);
    gfx.lineBetween(positions.charger.x, positions.charger.y + 20, positions.head.x, positions.head.y - 20);
    gfx.lineBetween(positions.head.x, positions.head.y + 20, positions.chassis.x, positions.chassis.y - 20);
    gfx.lineBetween(positions.chassis.x - 40, positions.chassis.y, positions.arms.x + 40, positions.arms.y);
    gfx.lineBetween(positions.chassis.x, positions.chassis.y + 20, positions.legs.x, positions.legs.y - 20);
  }

  private createSlotUI(x: number, y: number, slot: string, piece?: Equipment): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 100, 40, piece ? 0x1a2a3e : 0x1a1a1a)
      .setStrokeStyle(2, piece ? COLORS.accent : 0x444444);
    container.add(bg);

    const slotLabel = this.add.text(0, -25, slot.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#666666',
    }).setOrigin(0.5);
    container.add(slotLabel);

    if (piece) {
      const nameText = this.add.text(0, -5, piece.name, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
      }).setOrigin(0.5);
      container.add(nameText);

      const batteryText = this.add.text(0, 10, `BAT: ${'█'.repeat(piece.battery)}${'░'.repeat(EQUIPMENT_BATTERY_MAX - piece.battery)}`, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: piece.battery > 1 ? '#44ff44' : '#ff4444',
      }).setOrigin(0.5);
      container.add(batteryText);
    } else {
      const emptyText = this.add.text(0, 0, 'EMPTY', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#444444',
      }).setOrigin(0.5);
      container.add(emptyText);
    }

    container.setSize(100, 40);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      if (piece) {
        this.showEquipmentInfo(piece);
      }
    });

    return container;
  }

  private renderOwnedEquipment(): void {
    this.add.text(50, 420, 'INVENTORY', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    });

    const startY = 445;
    for (let i = 0; i < this.player.ownedEquipment.length; i++) {
      const piece = this.player.ownedEquipment[i];
      const y = startY + i * 30;

      const bg = this.add.rectangle(200, y, 360, 25, 0x1a1a2e)
        .setStrokeStyle(1, piece.isAvailable() ? 0x444444 : 0x880000);

      const text = this.add.text(30, y, `${piece.name} [${piece.slot.toUpperCase()}] - ${piece.family}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: piece.isAvailable() ? '#cccccc' : '#666666',
      }).setOrigin(0, 0.5);

      const batText = this.add.text(350, y, `${piece.battery}/${EQUIPMENT_BATTERY_MAX}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: piece.battery > 1 ? '#44ff44' : '#ff4444',
      }).setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        if (piece.isAvailable()) {
          this.player.equipPiece(piece);
          this.scene.restart({ newGame: false });
        }
      });
      bg.on('pointerover', () => bg.setStrokeStyle(1, COLORS.accent));
      bg.on('pointerout', () => bg.setStrokeStyle(1, piece.isAvailable() ? 0x444444 : 0x880000));
    }
  }

  private createInfoPanel(): void {
    this.infoPanel = this.add.container(GAME_WIDTH - 200, 120);

    const bg = this.add.rectangle(0, 100, 280, 280, COLORS.panel, 0.8)
      .setStrokeStyle(1, 0x333333);
    this.infoPanel.add(bg);

    const title = this.add.text(0, -20, 'SELECT EQUIPMENT', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);
    this.infoPanel.add(title);
  }

  private showEquipmentInfo(piece: Equipment): void {
    // Clear and rebuild info panel
    this.infoPanel.removeAll(true);

    const bg = this.add.rectangle(0, 100, 280, 280, COLORS.panel, 0.8)
      .setStrokeStyle(1, 0x333333);
    this.infoPanel.add(bg);

    const title = this.add.text(0, -10, piece.name, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.infoPanel.add(title);

    const family = this.add.text(0, 10, piece.family.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#e94560',
    }).setOrigin(0.5);
    this.infoPanel.add(family);

    const desc = this.add.text(0, 40, piece.description, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#aaaaaa',
      wordWrap: { width: 240 },
      align: 'center',
    }).setOrigin(0.5, 0);
    this.infoPanel.add(desc);

    const battery = this.add.text(0, 100, `BATTERY: ${piece.battery}/${EQUIPMENT_BATTERY_MAX}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: piece.battery > 1 ? '#44ff44' : '#ff4444',
    }).setOrigin(0.5);
    this.infoPanel.add(battery);

    if (Object.keys(piece.statMods).length > 0) {
      let statStr = 'STATS: ';
      for (const [stat, val] of Object.entries(piece.statMods)) {
        statStr += `${stat} +${val} `;
      }
      const stats = this.add.text(0, 120, statStr, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#66ff66',
      }).setOrigin(0.5);
      this.infoPanel.add(stats);
    }
  }

  private renderSetBonuses(): void {
    const bonuses = this.equipMgr.getSetBonuses();
    if (bonuses.length > 0) {
      let y = 400;
      for (const bonus of bonuses) {
        this.add.text(GAME_WIDTH - 200, y, `SET BONUS: ${bonus.family} (${bonus.count} pieces)`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#f5a623',
        }).setOrigin(0.5);
        y += 20;
      }
    }
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 45, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(200, 45);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setFillStyle(COLORS.accentAlt);
    });
    container.on('pointerout', () => {
      bg.setFillStyle(COLORS.panel);
    });
    container.on('pointerdown', callback);
  }
}
