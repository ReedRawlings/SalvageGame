import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './utils/Constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { LoadoutScene } from './scenes/LoadoutScene';
import { ShopScene } from './scenes/ShopScene';
import { MapScene } from './scenes/MapScene';
import { CombatScene } from './scenes/CombatScene';
import { RestScene } from './scenes/RestScene';
import { EventScene } from './scenes/EventScene';
import { TreasureScene } from './scenes/TreasureScene';
import { PostRunScene } from './scenes/PostRunScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 640,
      height: 360,
    },
    max: {
      width: 1920,
      height: 1080,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    LoadoutScene,
    ShopScene,
    MapScene,
    CombatScene,
    RestScene,
    EventScene,
    TreasureScene,
    PostRunScene,
  ],
  input: {
    mouse: {
      preventDefaultDown: false,
      preventDefaultUp: false,
      preventDefaultMove: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};

const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});
