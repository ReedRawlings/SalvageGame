# Salvage Game - Claude Development Guide

## Project Overview
Roguelite deck-building game (Slay the Spire-inspired) built with Phaser 3, TypeScript, and Vite. Players assemble robots from scrap equipment, where each equipment piece grants unique cards. Deployed on Vercel as a static site.

## Quick Start
```bash
npm install
npm run dev      # Dev server at localhost:5173
npm run build    # TypeScript check + Vite build → dist/
npm run preview  # Preview production build
```

## Architecture

### Stack
- **Phaser 3.80** (game engine) + **TypeScript 5.4** (strict mode) + **Vite 5.2** (esbuild minifier)
- No test framework currently — validate via `npm run build` (tsc + vite)
- Vercel deployment (vercel.json in root)

### Code Structure
```
src/
├── main.ts           # Phaser config, scene registration
├── data/*.json       # Cards, enemies, equipment, events, stages
├── entities/         # Plain classes: Card, Drone, Enemy, Equipment, Player
├── systems/          # Managers: Combat, Deck, Drone, Equipment, EnemyAI, Event, Map, Progression
├── scenes/           # Phaser scenes: Boot, Menu, Loadout, Shop, Map, Combat, Rest, Event, Treasure, PostRun
├── ui/               # Phaser GameObjects.Container subclasses: Card, Hand, Enemy, Drone, HUD, Map
└── utils/            # Constants, SaveManager (LocalStorage), AnimationHelper
```

### Key Patterns
- **Entities** are plain TypeScript classes (no Phaser dependency)
- **Systems** are manager classes that operate on entities
- **UI components** extend `Phaser.GameObjects.Container`
- **Data** is JSON, imported directly via TypeScript (`import data from './data/file.json'`)
- **Scene transitions**: `this.scene.start(key, data)` — Player object is the shared state passed between scenes
- **Run-scoped deck**: Equipment defines base deck. `player.runDeckCardIds` adds cards picked up during a run, `player.removedCardIds` tracks removed cards. Deck rebuilds each combat from these.

### Important Types (in Constants.ts)
```typescript
type EquipmentSlot = 'charger' | 'head' | 'chassis' | 'legs' | 'arms';
type EquipmentFamily = 'drone_operator' | 'brawler' | 'combo_striker';
type CardType = 'attack' | 'defend' | 'drone' | 'utility' | 'passive';
type DroneType = 'attack' | 'shield' | 'repair' | 'siphon' | 'overload' | 'decoy';
type NodeType = 'enemy' | 'rest' | 'treasure' | 'miniboss' | 'event' | 'boss' | 'start';
```

## Known Gotchas

### Build Issues
- **Vite 5 + terser**: Terser is NOT bundled with Vite 5. Use `minify: 'esbuild'` in vite.config.ts. Do NOT switch to terser without installing it.
- **Phaser chunk**: Phaser is ~1.5MB. It's split into a separate chunk via `manualChunks` in vite.config.ts. The "chunk too large" warning is expected.

### TypeScript Issues
- **Phase narrowing**: After calling methods like `combat.endPlayerTurn()` which mutate `this.phase`, TypeScript narrows the type and won't allow checking `=== 'victory'` afterwards. Fix: cast with `(this.combat.phase as string) === 'victory'`.
- **JSON imports**: Card/equipment data is typed via `as Record<string, CardData>` casts when accessed.

### Phaser Issues
- **Drag**: Requires `setInteractive({ draggable: true })` — not just `setInteractive()`
- **Container interaction**: Must call `container.setSize(w, h)` before `setInteractive()` for containers to receive pointer events
- **Depth sorting**: Use the `DEPTH` constants (0-80) for proper z-ordering. Modal overlays use 80-82.

## Drone Equip System (Most Recent Feature)
The two-action combat mechanic:
1. **Summon** a drone (play a drone card) → drone appears on field
2. **Equip** the drone to an equipment slot → removes from field, supercharges equipment, injects temporary cards

**Flow**: `CombatManager.equipDroneToSlot()` → `EquipmentManager.equipDroneToSlot()` (marks supercharged) → `DroneManager.equipDroneToSlot()` (moves to equipped state) → `DeckManager.injectCardsForSlot()` (adds tagged temp cards)

**Unequip** reverses all three steps. Injected cards are tagged with `sourceSlot` for clean removal.

**Drone type → injected card mapping** is in `DeckManager.ts` (`DRONE_INJECT_MAP`).

## What's Implemented vs Not

### Fully Working
- Complete combat loop with card play, drone summoning, enemy AI
- Drone Operator family: full equipment set (7 pieces), 20+ cards, all effects
- Drone equip/supercharge system with card injection
- Procedural 15-floor map with branching paths
- Meta loop: equipment battery drain, CORE economy, shop, loadout screen
- Card rewards after combat (pick 1 of 3)
- Card removal at rest stops
- 16 enemies across 4 difficulty tiers
- 6 narrative events with choices
- LocalStorage persistence

### Stub / Incomplete
- **Brawler family**: 3 equipment pieces with basic stub cards — needs full design
- **Combo Striker family**: 2 equipment pieces with basic stub cards — needs full design
- **Drone equip passive buffs**: Cards inject but per-drone passive buffs (attack boost, heal/turn, etc.) not yet applied
- **Set bonuses**: Framework detects 3+ pieces but no effects applied
- **Scout draw passive**: Detected but not wired to UI
- **Overload bomb timer**: Card exists but self-damage timer not tracked
- **Stages 2+**: Data structure supports it, only Stage 1 defined

### Not Started
- Audio/music (no assets, no integration)
- Real sprite assets (all emoji/text/colored rectangles)
- Auxiliary equipment slots (data structure exists, no UI)
- In-combat deck browser
- Status effect icons/tooltips
- Tutorial
- Mobile touch support

## Adding New Content

### New Card
1. Add entry to `src/data/cards.json` with id, name, type, cost, damage, block, description, family, effect
2. If it has a special effect, add the effect handler in `CombatManager.resolveCardEffect()` switch statement
3. If it's an injected card (from drone equip), set `"isInjected": true` and add to `DRONE_INJECT_MAP` in DeckManager.ts

### New Enemy
1. Add entry to `src/data/enemies.json` with id, name, health, difficulty, pattern array
2. Add to encounter pools in `src/data/stages.json`
3. Special effects may need handling in `EnemyAI.ts`

### New Equipment
1. Add entry to `src/data/equipment.json` with id, name, family, slot, cardIds, cost, statMods
2. Cards referenced in `cardIds` must exist in cards.json
3. If it has a passive, add handling in CombatManager (drone_phase or startCombat)

### New Event
1. Add entry to `src/data/events.json` with choices array
2. EventManager handles cost/reward resolution automatically for standard types

## Git Workflow
- Main development happens on feature branches (`claude/...`)
- Always `npm run build` before committing to catch TypeScript errors
- No test suite — build success = validation
