import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, EquipmentSlot } from '../utils/Constants';
import { Player } from '../entities/Player';
import { Card } from '../entities/Card';
import { Drone } from '../entities/Drone';
import { DeckManager } from '../systems/DeckManager';
import { DroneManager } from '../systems/DroneManager';
import { CombatManager, CombatPhase } from '../systems/CombatManager';
import { EnemyAI } from '../systems/EnemyAI';
import { EquipmentManager } from '../systems/EquipmentManager';
import { Enemy } from '../entities/Enemy';
import { HandUI } from '../ui/HandUI';
import { EnemyUI, createEnemyGroup } from '../ui/EnemyUI';
import { DroneFieldUI, renderDroneField } from '../ui/DroneUI';
import { HUD } from '../ui/HUD';
import { AnimationHelper } from '../utils/AnimationHelper';
import { MapNode } from '../systems/MapGenerator';

export class CombatScene extends Phaser.Scene {
  private player!: Player;
  private deck!: DeckManager;
  private drones!: DroneManager;
  private combat!: CombatManager;
  private equipMgr!: EquipmentManager;
  private enemyAI!: EnemyAI;

  private handUI!: HandUI;
  private enemyUIs: EnemyUI[] = [];
  private droneUIs: DroneFieldUI[] = [];
  private hud!: HUD;
  private anim!: AnimationHelper;

  private endTurnBtn!: Phaser.GameObjects.Container;
  private equipBtn!: Phaser.GameObjects.Container;
  private equipOverlay: Phaser.GameObjects.GameObject[] = [];
  private selectedTarget: Enemy | null = null;
  private isProcessing: boolean = false;

  // Scene data for returning to map
  private mapData: any;

  constructor() {
    super({ key: 'CombatScene' });
  }

  create(data: any): void {
    this.player = data.player;
    this.mapData = data;

    // Initialize systems
    this.deck = new DeckManager();
    this.equipMgr = new EquipmentManager(this.player);
    this.drones = new DroneManager(this.player.maxDroneSlots);
    this.enemyAI = new EnemyAI();

    // Build deck from equipment
    const deckCards = this.equipMgr.getBaseDeckCards();
    this.deck.buildDeck(deckCards);

    // Create enemies
    const encounterIds = data.encounter ?? ['scrap_rat'];
    const enemies = this.enemyAI.createEncounter(encounterIds);

    // Create combat manager
    this.combat = new CombatManager(this.player, enemies, this.deck, this.drones, this.equipMgr);

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Play area divider
    this.add.rectangle(GAME_WIDTH / 2, 400, GAME_WIDTH, 2, 0x333333);

    // Anim helper
    this.anim = new AnimationHelper(this);

    // Create UI
    this.hud = new HUD(this, this.player);
    this.handUI = new HandUI(this);
    this.handUI.onCardPlay = (card: Card) => this.handleCardPlay(card);

    // Buttons
    this.endTurnBtn = this.createEndTurnButton();
    this.equipBtn = this.createEquipButton();

    // Start combat
    this.combat.startCombat();
    this.renderState();
  }

  private renderState(): void {
    // Clear previous enemy UIs
    this.enemyUIs.forEach(ui => ui.destroy());
    this.droneUIs.forEach(ui => ui.destroy());

    // Render enemies
    const aliveEnemies = this.combat.enemies.filter(e => !e.isDead());
    this.enemyUIs = createEnemyGroup(this, this.combat.enemies);
    for (const ui of this.enemyUIs) {
      ui.onClick = (enemy: Enemy) => {
        this.selectedTarget = enemy;
        // Highlight selected
        this.enemyUIs.forEach(u => u.setAlpha(u.enemy === enemy ? 1 : 0.7));
      };
    }

    // Select first alive enemy by default
    this.selectedTarget = aliveEnemies[0] ?? null;

    // Render hand
    this.handUI.renderHand(this.deck.hand, (card: Card) => this.combat.canPlayCard(card));

    // Render drones
    this.droneUIs = renderDroneField(this, this.drones.getFieldDrones());

    // Update HUD
    this.hud.update(
      this.combat.turn,
      this.deck.drawPile.length,
      this.deck.discardPile.length,
      this.drones.getFieldDroneCount()
    );

    // Update button visibility
    this.endTurnBtn.setVisible(this.combat.phase === 'player_turn');
    const canEquip = this.combat.phase === 'player_turn'
      && this.drones.getFieldDroneCount() > 0
      && this.equipMgr.getEquippedSlots().length > 0;
    this.equipBtn.setVisible(canEquip);
  }

  private handleCardPlay(card: Card): void {
    if (this.isProcessing) return;
    if (!this.combat.canPlayCard(card)) return;

    // For drone cards, summon the drone
    if (card.type === 'drone' && card.droneType) {
      const drone = this.drones.summon(card.droneType);
      if (!drone) {
        this.anim.floatText(GAME_WIDTH / 2, 350, 'DRONE SLOTS FULL', '#ff4444');
        return;
      }
    }

    const result = this.combat.playCard(card, this.selectedTarget ?? undefined);

    if (!result.success) {
      this.anim.floatText(GAME_WIDTH / 2, 350, result.message || 'CANNOT PLAY', '#ff4444');
      return;
    }

    // Animations
    if (result.damageDealt > 0 && this.selectedTarget) {
      const targetUI = this.enemyUIs.find(ui => ui.enemy === this.selectedTarget);
      if (targetUI) {
        this.anim.damageNumber(targetUI.x, targetUI.y - 40, result.damageDealt);
        this.anim.shake(targetUI);
      }
    }

    if (result.blockGained > 0) {
      this.anim.blockNumber(100, GAME_HEIGHT / 2, result.blockGained);
    }

    if (result.healed > 0) {
      this.anim.healNumber(100, GAME_HEIGHT / 2 - 30, result.healed);
    }

    if (result.message) {
      this.anim.floatText(GAME_WIDTH / 2, 350, result.message, '#ffffff');
    }

    // Check combat state
    if (this.combat.phase === 'victory') {
      this.time.delayedCall(500, () => this.handleVictory());
      return;
    }

    this.renderState();
  }

  private createEndTurnButton(): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH - 100, 400);

    const bg = this.add.rectangle(0, 0, 140, 40, 0x662222)
      .setStrokeStyle(2, COLORS.accent);
    container.add(bg);

    const text = this.add.text(0, 0, 'END TURN', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(140, 40);
    container.setInteractive({ useHandCursor: true });
    container.setDepth(50);

    container.on('pointerover', () => bg.setFillStyle(0x882222));
    container.on('pointerout', () => bg.setFillStyle(0x662222));
    container.on('pointerdown', () => this.handleEndTurn());

    return container;
  }

  private async handleEndTurn(): Promise<void> {
    if (this.isProcessing) return;
    if (this.combat.phase !== 'player_turn') return;

    this.isProcessing = true;
    this.endTurnBtn.setVisible(false);

    // End player turn (discard hand)
    this.combat.endPlayerTurn();
    this.handUI.clear();

    // Drone phase
    await this.delay(300);
    const droneResults = this.combat.processDronePhase();

    if (droneResults.totalDamage > 0) {
      const aliveEnemies = this.combat.enemies.filter(e => !e.isDead());
      if (aliveEnemies.length > 0) {
        const targetUI = this.enemyUIs.find(ui => ui.enemy === aliveEnemies[0]);
        if (targetUI) {
          this.anim.damageNumber(targetUI.x, targetUI.y - 40, droneResults.totalDamage);
          this.anim.sparkEffect(targetUI.x, targetUI.y);
        }
      }
    }

    if (droneResults.totalHeal > 0) {
      this.anim.healNumber(100, GAME_HEIGHT / 2, droneResults.totalHeal);
    }

    this.updateEnemyDisplays();

    if ((this.combat.phase as string) === 'victory') {
      await this.delay(500);
      this.handleVictory();
      return;
    }

    // Enemy turn
    await this.delay(500);
    const enemyResults = this.combat.processEnemyTurn();

    for (const result of enemyResults) {
      if (result.damageDealt > 0) {
        this.anim.damageNumber(100, GAME_HEIGHT / 2, result.damageDealt);
        this.cameras.main.shake(100, 0.01);
      }
      if (result.statusApplied) {
        this.anim.floatText(GAME_WIDTH / 2, 300, result.statusApplied.toUpperCase(), '#cc44ff');
      }
      await this.delay(200);
    }

    if ((this.combat.phase as string) === 'defeat') {
      await this.delay(500);
      this.handleDefeat();
      return;
    }

    this.isProcessing = false;
    this.renderState();
  }

  private updateEnemyDisplays(): void {
    for (const ui of this.enemyUIs) {
      ui.updateDisplay();
    }
  }

  private handleVictory(): void {
    // Rewards
    const isMiniBoss = this.mapData.nodeType === 'miniboss';
    const isBoss = this.mapData.isBoss;

    let circuitReward = 10 + Math.floor(Math.random() * 10);
    let coreReward = 0;

    if (isMiniBoss) {
      circuitReward += 15;
      coreReward = 1;
    }
    if (isBoss) {
      circuitReward += 25;
      coreReward = 2;
    }

    this.player.addCircuits(circuitReward);
    if (coreReward > 0) this.player.addCores(coreReward);

    // Victory overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setDepth(80);

    this.add.text(GAME_WIDTH / 2, 100, 'VICTORY', {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#44ff44',
    }).setOrigin(0.5).setDepth(81);

    this.add.text(GAME_WIDTH / 2, 150, `+${circuitReward} CIRCUITS${coreReward > 0 ? `  +${coreReward} COREs` : ''}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#cccccc',
    }).setOrigin(0.5).setDepth(81);

    // Card reward selection
    this.add.text(GAME_WIDTH / 2, 195, 'CHOOSE A CARD TO ADD TO YOUR DECK', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(81);

    const rewardCards = this.deck.getRewardCardPool(3);
    const cardSpacing = 160;
    const startX = GAME_WIDTH / 2 - (rewardCards.length - 1) * cardSpacing / 2;

    for (let i = 0; i < rewardCards.length; i++) {
      const card = rewardCards[i];
      this.createRewardCard(startX + i * cardSpacing, 370, card, coreReward);
    }

    // Skip button
    this.createVictoryButton(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'SKIP — No card', () => {
      this.proceedFromVictory(coreReward);
    });
  }

  private createRewardCard(x: number, y: number, card: Card, coreReward: number): void {
    const container = this.add.container(x, y).setDepth(82);

    const bg = this.add.rectangle(0, 0, 140, 200, 0x1a1a2e)
      .setStrokeStyle(2, card.getColorTint());
    container.add(bg);

    // Color stripe
    container.add(this.add.rectangle(0, -92, 132, 12, card.getColorTint()));

    // Cost
    container.add(this.add.text(-58, -88, `${card.cost}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#f5a623',
    }));

    // Name
    container.add(this.add.text(0, -72, card.name, {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
    }).setOrigin(0.5));

    // Type label
    container.add(this.add.text(0, -55, card.type.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '9px', color: '#888888',
    }).setOrigin(0.5));

    // Stats
    let statY = -25;
    if (card.damage > 0) {
      container.add(this.add.text(0, statY, `DMG: ${card.damage}${card.hits > 1 ? ` x${card.hits}` : ''}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ff6666',
      }).setOrigin(0.5));
      statY += 20;
    }
    if (card.block > 0) {
      container.add(this.add.text(0, statY, `BLK: ${card.block}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#6688ff',
      }).setOrigin(0.5));
      statY += 20;
    }

    // Description
    container.add(this.add.text(0, 30, card.description, {
      fontFamily: 'monospace', fontSize: '9px', color: '#aaaaaa',
      wordWrap: { width: 120 }, align: 'center',
    }).setOrigin(0.5, 0));

    container.setSize(140, 200);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setStrokeStyle(3, COLORS.accent);
      this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 100 });
    });
    container.on('pointerout', () => {
      bg.setStrokeStyle(2, card.getColorTint());
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    container.on('pointerdown', () => {
      this.player.runDeckCardIds.push(card.id);
      this.anim.sparkEffect(x, y, COLORS.gold);
      this.proceedFromVictory(coreReward);
    });
  }

  private proceedFromVictory(coreReward: number): void {
    const isBoss = this.mapData.isBoss;
    if (isBoss) {
      this.scene.start('PostRunScene', {
        player: this.player,
        victory: true,
        floorsCleared: this.mapData.floorsCleared,
        enemiesDefeated: (this.mapData.enemiesDefeated ?? 0) + this.combat.enemies.length,
        coresEarned: (this.mapData.coresEarned ?? 0) + coreReward,
      });
    } else {
      this.scene.start('MapScene', {
        player: this.player,
        map: this.mapData.map,
        currentNodeId: this.mapData.currentNodeId,
        floorsCleared: this.mapData.floorsCleared,
        enemiesDefeated: (this.mapData.enemiesDefeated ?? 0) + this.combat.enemies.length,
        coresEarned: (this.mapData.coresEarned ?? 0) + coreReward,
      });
    }
  }

  private handleDefeat(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
      .setDepth(80);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'SYSTEM FAILURE', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ff4444',
    }).setOrigin(0.5).setDepth(81);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'Robot destroyed. Salvage recovered.', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(81);

    this.createVictoryButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'RETURN TO JUNKYARD', () => {
      this.scene.start('PostRunScene', {
        player: this.player,
        victory: false,
        floorsCleared: this.mapData.floorsCleared ?? 0,
        enemiesDefeated: this.mapData.enemiesDefeated ?? 0,
        coresEarned: this.mapData.coresEarned ?? 0,
      });
    });
  }

  private createVictoryButton(x: number, y: number, label: string, callback: () => void): void {
    const container = this.add.container(x, y).setDepth(82);
    const bg = this.add.rectangle(0, 0, 220, 45, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    container.add(bg);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);
    container.setSize(220, 45);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(COLORS.accentAlt));
    container.on('pointerout', () => bg.setFillStyle(COLORS.panel));
    container.on('pointerdown', callback);
  }

  private createEquipButton(): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH - 100, 445);

    const bg = this.add.rectangle(0, 0, 140, 36, 0x225522)
      .setStrokeStyle(2, COLORS.drone);
    container.add(bg);

    const text = this.add.text(0, 0, 'EQUIP DRONE', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#66ffcc',
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(140, 36);
    container.setInteractive({ useHandCursor: true });
    container.setDepth(50);

    container.on('pointerover', () => bg.setFillStyle(0x337733));
    container.on('pointerout', () => bg.setFillStyle(0x225522));
    container.on('pointerdown', () => this.showDroneEquipSelection());

    return container;
  }

  private clearEquipOverlay(): void {
    for (const obj of this.equipOverlay) {
      obj.destroy();
    }
    this.equipOverlay = [];
  }

  private showDroneEquipSelection(): void {
    if (this.isProcessing) return;
    this.clearEquipOverlay();

    const fieldDrones = this.drones.getFieldDrones();
    if (fieldDrones.length === 0) return;

    // Dim background
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setDepth(80).setInteractive();
    this.equipOverlay.push(bg);

    const title = this.add.text(GAME_WIDTH / 2, 80, 'SELECT A DRONE TO EQUIP', {
      fontFamily: 'monospace', fontSize: '20px', color: '#66ffcc',
    }).setOrigin(0.5).setDepth(81);
    this.equipOverlay.push(title);

    const spacing = 80;
    const startX = GAME_WIDTH / 2 - ((fieldDrones.length - 1) * spacing) / 2;

    for (let i = 0; i < fieldDrones.length; i++) {
      const drone = fieldDrones[i];
      const dx = startX + i * spacing;
      const dy = 180;

      const card = this.add.container(dx, dy).setDepth(82);
      const cardBg = this.add.rectangle(0, 0, 65, 75, 0x1a1a2e)
        .setStrokeStyle(2, COLORS.drone);
      card.add(cardBg);

      const symbol = this.getDroneSymbol(drone.type);
      card.add(this.add.text(0, -18, symbol, {
        fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
      }).setOrigin(0.5));

      card.add(this.add.text(0, 8, drone.type.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '8px', color: '#aaaaaa',
      }).setOrigin(0.5));

      card.add(this.add.text(0, 22, drone.level > 1 ? 'Lv2' : 'Lv1', {
        fontFamily: 'monospace', fontSize: '8px', color: '#ffcc44',
      }).setOrigin(0.5));

      card.setSize(65, 75);
      card.setInteractive({ useHandCursor: true });

      card.on('pointerover', () => cardBg.setStrokeStyle(3, COLORS.accent));
      card.on('pointerout', () => cardBg.setStrokeStyle(2, COLORS.drone));
      card.on('pointerdown', () => {
        this.clearEquipOverlay();
        this.showSlotSelection(drone);
      });

      this.equipOverlay.push(card);
    }

    // Cancel button
    const cancel = this.createOverlayButton(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'CANCEL', () => {
      this.clearEquipOverlay();
    });
    this.equipOverlay.push(cancel);
  }

  private showSlotSelection(drone: Drone): void {
    const slots = this.equipMgr.getEquippedSlots();
    if (slots.length === 0) return;

    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setDepth(80).setInteractive();
    this.equipOverlay.push(bg);

    const title = this.add.text(GAME_WIDTH / 2, 80, `EQUIP ${drone.type.toUpperCase()} DRONE TO SLOT`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#66ffcc',
    }).setOrigin(0.5).setDepth(81);
    this.equipOverlay.push(title);

    const spacing = 140;
    const startX = GAME_WIDTH / 2 - ((slots.length - 1) * spacing) / 2;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const piece = this.player.equipment.get(slot);
      if (!piece) continue;

      const sx = startX + i * spacing;
      const sy = 200;

      const card = this.add.container(sx, sy).setDepth(82);
      const alreadyEquipped = piece.isSupercharged();

      const cardBg = this.add.rectangle(0, 0, 120, 100,
        alreadyEquipped ? 0x332200 : 0x1a1a2e
      ).setStrokeStyle(2, alreadyEquipped ? 0xffaa00 : COLORS.accentAlt);
      card.add(cardBg);

      card.add(this.add.text(0, -30, slot.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      }).setOrigin(0.5));

      card.add(this.add.text(0, -10, piece.name, {
        fontFamily: 'monospace', fontSize: '10px', color: '#aaaaaa',
      }).setOrigin(0.5));

      if (alreadyEquipped) {
        card.add(this.add.text(0, 10, `[${piece.equippedDroneType}]`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#ffaa00',
        }).setOrigin(0.5));

        card.add(this.add.text(0, 28, 'SUPERCHARGED', {
          fontFamily: 'monospace', fontSize: '8px', color: '#ffaa00',
        }).setOrigin(0.5));
      }

      card.setSize(120, 100);
      card.setInteractive({ useHandCursor: true });

      card.on('pointerover', () => cardBg.setStrokeStyle(3, COLORS.accent));
      card.on('pointerout', () => cardBg.setStrokeStyle(2, alreadyEquipped ? 0xffaa00 : COLORS.accentAlt));
      card.on('pointerdown', () => {
        // If already has a drone, unequip it first
        if (alreadyEquipped) {
          this.combat.unequipDroneFromSlot(slot);
        }
        const success = this.combat.equipDroneToSlot(drone, slot);
        this.clearEquipOverlay();
        if (success) {
          this.anim.floatText(GAME_WIDTH / 2, 350,
            `${drone.type.toUpperCase()} DRONE → ${slot.toUpperCase()}`, '#66ffcc');
        } else {
          this.anim.floatText(GAME_WIDTH / 2, 350, 'EQUIP FAILED', '#ff4444');
        }
        this.renderState();
      });

      this.equipOverlay.push(card);
    }

    // Cancel
    const cancel = this.createOverlayButton(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'CANCEL', () => {
      this.clearEquipOverlay();
    });
    this.equipOverlay.push(cancel);
  }

  private createOverlayButton(x: number, y: number, label: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(82);
    const bg = this.add.rectangle(0, 0, 160, 40, COLORS.panel)
      .setStrokeStyle(2, COLORS.accent);
    container.add(bg);
    container.add(this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5));
    container.setSize(160, 40);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(COLORS.accentAlt));
    container.on('pointerout', () => bg.setFillStyle(COLORS.panel));
    container.on('pointerdown', callback);
    return container;
  }

  private getDroneSymbol(type: string): string {
    switch (type) {
      case 'attack': return '⚔';
      case 'shield': return '🛡';
      case 'repair': return '+';
      case 'siphon': return '◈';
      case 'overload': return '💣';
      case 'decoy': return '◎';
      default: return '?';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }
}
