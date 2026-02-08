import { NodeType, MAP_ROWS } from '../utils/Constants';

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  connections: string[];
  visited: boolean;
  encounter?: string[];
}

export class MapGenerator {
  private floors: number;

  constructor(floors: number = MAP_ROWS) {
    this.floors = floors;
  }

  generate(): MapNode[][] {
    const map: MapNode[][] = [];

    // Row 0: Start
    map.push([this.createNode(0, 3, 'start')]);

    // Rows 1 through floors-2: encounters
    for (let row = 1; row < this.floors - 1; row++) {
      const nodesInRow = this.getNodesForRow(row);
      const rowNodes: MapNode[] = [];
      const cols = this.getColumnPositions(nodesInRow);

      for (const col of cols) {
        const type = this.getNodeType(row);
        rowNodes.push(this.createNode(row, col, type));
      }
      map.push(rowNodes);
    }

    // Last row: Boss
    map.push([this.createNode(this.floors - 1, 3, 'boss')]);

    // Generate connections
    this.connectNodes(map);

    // Assign encounters
    this.assignEncounters(map);

    return map;
  }

  private createNode(row: number, col: number, type: NodeType): MapNode {
    return {
      id: `${row}-${col}`,
      row,
      col,
      type,
      connections: [],
      visited: false,
    };
  }

  private getNodesForRow(row: number): number {
    if (row <= 2) return 2 + Math.floor(Math.random() * 2);
    if (row === 7) return 1; // Mini-boss row
    return 2 + Math.floor(Math.random() * 3);
  }

  private getColumnPositions(count: number): number[] {
    const positions = [1, 2, 3, 4, 5];
    const shuffled = positions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).sort((a, b) => a - b);
  }

  private getNodeType(row: number): NodeType {
    // Mini-boss at row 7
    if (row === 7) return 'miniboss';

    // Rest sites at rows 4 and 10
    if (row === 4 || row === 10) {
      return Math.random() < 0.5 ? 'rest' : 'enemy';
    }

    // Treasure at row 5 or 11
    if (row === 5 || row === 11) {
      return Math.random() < 0.3 ? 'treasure' : 'enemy';
    }

    // Events scattered
    if (row > 2 && Math.random() < 0.2) return 'event';

    // Rest stops occasionally
    if (Math.random() < 0.1) return 'rest';

    return 'enemy';
  }

  private connectNodes(map: MapNode[][]): void {
    for (let row = 0; row < map.length - 1; row++) {
      const currentRow = map[row];
      const nextRow = map[row + 1];

      for (const node of currentRow) {
        // Each node connects to 1-2 nodes in next row
        const connectionCount = Math.min(nextRow.length, 1 + Math.floor(Math.random() * 2));
        const closest = this.getClosestNodes(node, nextRow, connectionCount);

        for (const target of closest) {
          if (!node.connections.includes(target.id)) {
            node.connections.push(target.id);
          }
        }
      }

      // Ensure every node in next row has at least one incoming connection
      for (const nextNode of nextRow) {
        const hasIncoming = currentRow.some(n => n.connections.includes(nextNode.id));
        if (!hasIncoming) {
          const closest = this.getClosestNodes(nextNode, currentRow, 1);
          if (closest.length > 0) {
            closest[0].connections.push(nextNode.id);
          }
        }
      }
    }
  }

  private getClosestNodes(source: MapNode, targets: MapNode[], count: number): MapNode[] {
    return [...targets]
      .sort((a, b) => Math.abs(a.col - source.col) - Math.abs(b.col - source.col))
      .slice(0, count);
  }

  private assignEncounters(map: MapNode[][]): void {
    for (const row of map) {
      for (const node of row) {
        if (node.type === 'enemy') {
          if (node.row <= 3) {
            node.encounter = this.getEasyEncounter();
          } else {
            node.encounter = this.getHardEncounter();
          }
        } else if (node.type === 'miniboss') {
          node.encounter = this.getEliteEncounter();
        } else if (node.type === 'boss') {
          node.encounter = this.getBossEncounter();
        }
      }
    }
  }

  private getEasyEncounter(): string[] {
    const pool = [
      ['scrap_rat'],
      ['loose_wiring', 'loose_wiring'],
      ['loose_wiring', 'loose_wiring', 'loose_wiring'],
      ['junk_pile'],
      ['rust_mite', 'rust_mite', 'rust_mite'],
      ['rust_mite', 'rust_mite', 'rust_mite', 'rust_mite'],
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private getHardEncounter(): string[] {
    const pool = [
      ['magnet_crawler'],
      ['welder', 'scrap_rat'],
      ['shock_beetle', 'shock_beetle'],
      ['rust_hulk'],
      ['salvage_drone', 'loose_wiring', 'loose_wiring'],
      ['junkyard_dog'],
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private getEliteEncounter(): string[] {
    const pool = [
      ['compactor'],
      ['voltage_king'],
      ['scrap_titan'],
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private getBossEncounter(): string[] {
    const pool = [
      ['the_crusher'],
      ['junkyard_warden'],
      ['the_smelter'],
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
