import Phaser from 'phaser';
import { COLORS, DEPTH, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { Player } from '../entities/Player';
import { MapGenerator, MapNode } from '../systems/MapGenerator';
import { MapUI } from '../ui/MapUI';
import { SaveManager } from '../utils/SaveManager';

export class MapScene extends Phaser.Scene {
  private player!: Player;
  private map!: MapNode[][];
  private mapUI!: MapUI;
  private currentNodeId: string | null = null;
  private floorsCleared: number = 0;
  private enemiesDefeated: number = 0;
  private coresEarned: number = 0;

  constructor() {
    super({ key: 'MapScene' });
  }

  create(data: { player: Player; map?: MapNode[][]; currentNodeId?: string; floorsCleared?: number; enemiesDefeated?: number; coresEarned?: number }): void {
    this.player = data.player;
    this.floorsCleared = data.floorsCleared ?? 0;
    this.enemiesDefeated = data.enemiesDefeated ?? 0;
    this.coresEarned = data.coresEarned ?? 0;

    // Generate or restore map
    if (data.map) {
      this.map = data.map;
      this.currentNodeId = data.currentNodeId ?? null;
    } else {
      const generator = new MapGenerator();
      this.map = generator.generate();
    }

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // Title (above scroll cover)
    this.add.text(GAME_WIDTH / 2, 15, 'THE OUTER JUNKYARD', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#e94560',
    }).setOrigin(0.5).setDepth(DEPTH.overlay + 1);

    // Player stats (above scroll cover)
    this.add.text(20, 10, `HP: ${this.player.health}/${this.player.maxHealth}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff6666',
    }).setDepth(DEPTH.overlay + 1);
    this.add.text(20, 28, `CIRCUITS: ${this.player.circuits}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#cccccc',
    }).setDepth(DEPTH.overlay + 1);
    this.add.text(20, 46, `COREs: ${this.player.cores}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#f5a623',
    }).setDepth(DEPTH.overlay + 1);

    // Render map
    this.mapUI = new MapUI(this);
    this.mapUI.render(this.map, this.currentNodeId);
    this.mapUI.onNodeSelect = (node: MapNode) => this.handleNodeSelect(node);
  }

  private handleNodeSelect(node: MapNode): void {
    node.visited = true;
    this.currentNodeId = node.id;
    this.floorsCleared++;

    const sceneData = {
      player: this.player,
      map: this.map,
      currentNodeId: this.currentNodeId,
      floorsCleared: this.floorsCleared,
      enemiesDefeated: this.enemiesDefeated,
      coresEarned: this.coresEarned,
      encounter: node.encounter,
      nodeType: node.type,
    };

    switch (node.type) {
      case 'start':
        // Just advance to next selectable nodes
        this.mapUI.destroy();
        this.scene.restart(sceneData);
        break;
      case 'enemy':
      case 'miniboss':
        this.scene.start('CombatScene', sceneData);
        break;
      case 'boss':
        this.scene.start('CombatScene', { ...sceneData, isBoss: true });
        break;
      case 'rest':
        this.scene.start('RestScene', sceneData);
        break;
      case 'event':
        this.scene.start('EventScene', sceneData);
        break;
      case 'treasure':
        this.scene.start('TreasureScene', sceneData);
        break;
    }
  }

  shutdown(): void {
    if (this.mapUI) this.mapUI.destroy();
  }
}
