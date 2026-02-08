// Game dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Player base stats
export const BASE_HEALTH = 80;
export const BASE_HAND_SIZE = 5;
export const BASE_DRAW = 5;
export const BASE_DRONE_SLOTS = 2;
export const BASE_ENERGY = 3;

// Equipment
export const EQUIPMENT_BATTERY_MAX = 4;
export const EQUIPMENT_SLOTS = ['charger', 'head', 'chassis', 'legs', 'arms'] as const;
export const AUXILIARY_SLOTS = 2;

// Drone
export const DRONE_DEFAULT_DURATION = 3;
export const DRONE_MAX_LEVEL = 2;

// Progression
export const CORE_FROM_MINIBOSS = 1;
export const CORE_FROM_BOSS = 2;
export const SHOP_REFRESH_COST = 1;

// Combat
export const CARD_PLAY_ENERGY_DEFAULT = 1;

// Map
export const MAP_ROWS = 15;
export const MAP_COLS = 7;

// Colors
export const COLORS = {
  background: 0x0a0a0a,
  panel: 0x1a1a2e,
  panelLight: 0x16213e,
  accent: 0xe94560,
  accentAlt: 0x0f3460,
  gold: 0xf5a623,
  health: 0xe74c3c,
  healthBar: 0xc0392b,
  shield: 0x3498db,
  energy: 0xf39c12,
  text: 0xffffff,
  textDim: 0x888888,
  cardAttack: 0xcc3333,
  cardDefend: 0x3366cc,
  cardDrone: 0x33cc66,
  cardUtility: 0xcccc33,
  enemyIntent: 0xff6666,
  drone: 0x66ffcc,
  rust: 0x8b4513,
  metal: 0x708090,
  spark: 0xffdd44,
} as const;

// Font styles
export const FONTS = {
  title: { fontFamily: 'monospace', fontSize: '48px', color: '#e94560' },
  heading: { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' },
  body: { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' },
  small: { fontFamily: 'monospace', fontSize: '14px', color: '#888888' },
  button: { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' },
  cardTitle: { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' },
  cardCost: { fontFamily: 'monospace', fontSize: '16px', color: '#f5a623' },
  cardDesc: { fontFamily: 'monospace', fontSize: '10px', color: '#cccccc', wordWrap: { width: 100 } },
  damage: { fontFamily: 'monospace', fontSize: '24px', color: '#ff4444' },
  heal: { fontFamily: 'monospace', fontSize: '24px', color: '#44ff44' },
  stat: { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' },
} as const;

// Z-depth layers
export const DEPTH = {
  background: 0,
  entities: 10,
  ui: 20,
  cards: 30,
  hand: 40,
  dragCard: 50,
  overlay: 60,
  tooltip: 70,
  modal: 80,
} as const;

export type EquipmentSlot = typeof EQUIPMENT_SLOTS[number];
export type AnyEquipmentSlot = EquipmentSlot | 'auxiliary';
export type EquipmentFamily = 'drone_operator' | 'brawler' | 'combo_striker';
export type CardType = 'attack' | 'defend' | 'drone' | 'utility' | 'passive';
export type DroneType = 'attack' | 'shield' | 'repair' | 'siphon' | 'overload' | 'decoy';
export type NodeType = 'enemy' | 'rest' | 'treasure' | 'miniboss' | 'event' | 'boss' | 'start';
export type EnemyDifficulty = 'easy' | 'hard' | 'elite' | 'boss';
