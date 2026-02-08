import Phaser from 'phaser';
import { MapNode } from '../systems/MapGenerator';
import { COLORS, DEPTH, GAME_WIDTH, GAME_HEIGHT, NodeType } from '../utils/Constants';

export class MapNodeUI extends Phaser.GameObjects.Container {
  public node: MapNode;
  private bg: Phaser.GameObjects.Ellipse;
  private icon: Phaser.GameObjects.Text;
  private label: Phaser.GameObjects.Text;
  public onSelect?: (node: MapNode) => void;
  private isSelectable: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, node: MapNode) {
    super(scene, x, y);
    this.node = node;

    const color = this.getNodeColor();
    this.bg = scene.add.ellipse(0, 0, 36, 36, color)
      .setStrokeStyle(2, 0x666666);
    this.add(this.bg);

    this.icon = scene.add.text(0, 0, this.getNodeIcon(), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.icon);

    this.label = scene.add.text(0, 24, this.getNodeLabel(), {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#888888',
    }).setOrigin(0.5);
    this.add(this.label);

    this.setSize(36, 36);
    this.setDepth(DEPTH.ui);

    if (node.visited) {
      this.setAlpha(0.4);
    }

    scene.add.existing(this);
  }

  private getNodeColor(): number {
    switch (this.node.type) {
      case 'enemy': return 0x662222;
      case 'rest': return 0x226622;
      case 'treasure': return 0x666622;
      case 'miniboss': return 0x882222;
      case 'event': return 0x226666;
      case 'boss': return 0xaa1111;
      case 'start': return 0x444444;
      default: return 0x333333;
    }
  }

  private getNodeIcon(): string {
    switch (this.node.type) {
      case 'enemy': return '⚔';
      case 'rest': return '🔥';
      case 'treasure': return '★';
      case 'miniboss': return '☠';
      case 'event': return '?';
      case 'boss': return '💀';
      case 'start': return '▶';
      default: return '·';
    }
  }

  private getNodeLabel(): string {
    switch (this.node.type) {
      case 'enemy': return 'FIGHT';
      case 'rest': return 'REST';
      case 'treasure': return 'LOOT';
      case 'miniboss': return 'ELITE';
      case 'event': return 'EVENT';
      case 'boss': return 'BOSS';
      case 'start': return 'START';
      default: return '';
    }
  }

  setSelectable(selectable: boolean): void {
    this.isSelectable = selectable;
    if (selectable) {
      this.bg.setStrokeStyle(3, COLORS.accent);
      this.setInteractive({ useHandCursor: true });

      this.on('pointerover', () => {
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 100,
        });
      });

      this.on('pointerout', () => {
        this.scene.tweens.add({
          targets: this,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
        });
      });

      this.on('pointerdown', () => {
        if (this.onSelect) this.onSelect(this.node);
      });
    } else {
      this.bg.setStrokeStyle(2, 0x666666);
      this.disableInteractive();
    }
  }
}

export class MapUI {
  private scene: Phaser.Scene;
  private nodeUIs: MapNodeUI[] = [];
  private lines: Phaser.GameObjects.Line[] = [];
  private scrollContainer: Phaser.GameObjects.Container;
  public onNodeSelect?: (node: MapNode) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scrollContainer = scene.add.container(0, 0);
  }

  render(map: MapNode[][], currentNodeId: string | null): void {
    this.clear();

    const rowHeight = 50;
    const colWidth = GAME_WIDTH / 8;
    const offsetY = 80;

    // Draw connections first
    for (const row of map) {
      for (const node of row) {
        const fromX = (node.col + 1) * colWidth;
        const fromY = node.row * rowHeight + offsetY;

        for (const connId of node.connections) {
          for (const targetRow of map) {
            const target = targetRow.find(n => n.id === connId);
            if (target) {
              const toX = (target.col + 1) * colWidth;
              const toY = target.row * rowHeight + offsetY;
              const line = this.scene.add.line(0, 0, fromX, fromY, toX, toY, 0x444444, 0.5)
                .setOrigin(0)
                .setDepth(DEPTH.background + 1);
              this.scrollContainer.add(line);
              this.lines.push(line);
            }
          }
        }
      }
    }

    // Draw nodes
    for (const row of map) {
      for (const node of row) {
        const x = (node.col + 1) * colWidth;
        const y = node.row * rowHeight + offsetY;
        const nodeUI = new MapNodeUI(this.scene, x, y, node);

        // Determine selectable nodes
        let selectable = false;
        if (currentNodeId === null && node.type === 'start') {
          selectable = true;
        } else if (currentNodeId) {
          // Find current node and check if this is a valid next node
          for (const r of map) {
            const current = r.find(n => n.id === currentNodeId);
            if (current && current.connections.includes(node.id) && !node.visited) {
              selectable = true;
              break;
            }
          }
        }

        nodeUI.setSelectable(selectable);
        nodeUI.onSelect = (n: MapNode) => {
          if (this.onNodeSelect) this.onNodeSelect(n);
        };

        this.scrollContainer.add(nodeUI);
        this.nodeUIs.push(nodeUI);
      }
    }
  }

  clear(): void {
    for (const ui of this.nodeUIs) ui.destroy();
    for (const line of this.lines) line.destroy();
    this.nodeUIs = [];
    this.lines = [];
  }

  destroy(): void {
    this.clear();
    this.scrollContainer.destroy();
  }
}
