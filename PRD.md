# Salvage - Product Requirements Document

## Overview

**Salvage** is a roguelite deck-building game built with **Phaser 3 + TypeScript + Vite**, deployed on **Vercel**. Players assemble robots from scrap equipment in a junkyard, each piece granting unique cards. The core differentiator: equipment defines playstyle (no fixed classes), and a battery system forces build rotation every 4 runs.

**Live at:** Vercel static deployment (`npm run build` → `dist/`)

---

## What's Built (Completed Features)

### Core Combat System
- **Deck-building combat** inspired by Slay the Spire: draw pile, hand, discard pile, energy system
- **Card play**: drag cards from hand, target enemies, resolve damage/block/effects
- **Turn phases**: Player Turn → Drone Phase → Enemy Turn → repeat
- **Victory/Defeat detection** with automatic phase transitions
- **Energy system**: 3 base energy per turn, cards cost 0-3 energy

### Card System
- **37+ unique cards** across 5 types: attack, defend, drone, utility, passive
- **Basic cards**: Basic ATK (6 dmg), Basic DEF (5 block) — fill deck to minimum 10
- **Drone Operator cards** (fully implemented): 20+ cards for summoning, commanding, sacrificing, and buffing drones
- **Brawler stubs**: Heavy Strike (12 dmg), Iron Guard (12 block), Power Slam (18 dmg + 5 block)
- **Combo Striker stubs**: Flurry (3 dmg x3), Chain Strike (4 dmg, 8 if combo)
- **Injected cards** (from drone equip): Charged Strike, Drone Barrier, Field Repair, Neural Tap, Ticking Bomb
- **Card effects**: 25+ unique effects resolved in CombatManager
- **Supercharged variants**: cards gain upgraded effects when equipment has a drone equipped

### Drone System
- **6 drone types**: Attack, Shield, Repair, Siphon, Overload, Decoy
- **Drone lifecycle**: Summon → field actions each turn → expire after duration
- **Drone leveling**: Summoning a duplicate drone levels it up (max Lv2)
- **Field actions**: Attack drones deal damage, Shield blocks hits, Repair heals, Siphon damages + draws, Overload explodes after delay, Decoy absorbs hits
- **Drone commands**: Focus Fire, Drone Toss, Sacrifice, Recall, Detonate, Link, Boost, Double Strike, Restore Batteries, Full Discharge
- **Drone equip system**: Equip field drones to equipment slots for supercharging
  - Removes drone from field, marks equipment as supercharged
  - Injects temporary cards into deck based on drone type
  - Two-step UI: select drone → select equipment slot
  - Unequipping removes injected cards and returns drone (if field capacity allows)

### Equipment & Loadout
- **5 equipment slots**: Charger, Head, Chassis, Legs, Arms
- **14 equipment pieces** across 3 families:
  - **Drone Operator** (7 pieces): Full set with cards, passives, stat mods
  - **Brawler** (3 pieces): Power Cell, Armored Plating, Piston Arms
  - **Combo Striker** (2 pieces): Spark Coil, Chain Whips
  - **Starter** (1 piece): Scrap Chassis (given at game start)
- **Battery system**: Each equipment has 4 charges, drains 1 per run, depleted = unusable until recharged (2 COREs)
- **Equipment passives**: drone_shield (block per 2 drones), scout_draw (start-of-combat draw)
- **Stat modifiers**: Equipment can boost max health
- **Set bonuses**: 3+ pieces of same family tracked (framework exists)
- **Supercharge state**: Equipment with an equipped drone activates supercharged card effects

### Enemy System
- **16 unique enemies** across 4 difficulty tiers:
  - **Easy** (4): Scrap Rat, Loose Wiring, Junk Pile, Rust Mite
  - **Hard** (6): Magnet Crawler, Welder, Shock Beetle, Rust Hulk, Salvage Drone, Junkyard Dog
  - **Elite** (3): Compactor, Voltage King, Scrap Titan
  - **Boss** (3): The Crusher, Junkyard Warden, The Smelter
- **Pattern-based AI**: Each enemy cycles through a fixed action sequence
- **Enemy actions**: Attack, Defend, Buff (power_up, crush_charge, empower_allies), Debuff (corrosion, magnetic_pull, consume_card, charge_stack), Heal (allies), Summon
- **Intent display**: Shows upcoming action with icon + description
- **Special mechanics**: Loose Wiring gains damage on ally death, Junk Pile summons Scrap Rats, Smelter consumes player cards

### Map & Progression
- **15-floor procedural map** with branching paths (2-5 nodes per row)
- **7 node types**: Start, Enemy, Rest, Treasure, Miniboss, Event, Boss
- **Floor distribution**: Miniboss at floor 7, rest/events spread throughout, boss at floor 14
- **Connection system**: Ensures all nodes are reachable, no dead ends
- **Encounter selection**: Pulls from stage-specific pools (easy, hard, elite, boss)

### Meta Loop
- **CORE economy**: Earn 1 from minibosses, 2 from bosses — spend on equipment and recharges
- **Circuit economy**: Earn from combat victories — spend at shops and events
- **Energy tokens**: Earned as run rewards — future use TBD
- **Equipment shop**: Buy new equipment pieces (3-4 COREs), recharge depleted equipment (2 COREs), refresh shop (1 CORE)
- **Loadout screen**: Visual robot schematic, drag equipment to slots, see battery status
- **Run counter**: Tracks total runs, used for battery drain pacing

### Run Features
- **Card reward selection**: After combat victory, choose 1 of 3 non-basic cards to add (or skip)
- **Card removal**: At rest stops, browse full deck and remove one card per visit
- **Run-scoped deck tracking**: Cards picked up persist across combats in a run, removed cards stay removed
- **Rest stops**: Heal 25% max HP, remove a card, or move on
- **Treasure rooms**: Choose from 3 random rewards (health, energy, drones, circuits, draw)
- **Events**: 6 unique narrative events with 2-3 choices each (risk/reward tradeoffs)

### UI & Presentation
- **CardUI**: Color-coded by type, hover zoom, drag-to-play, supercharge indicator, dynamic cost
- **HandUI**: Horizontal card layout, playability highlighting
- **EnemyUI**: Symbols, HP bars, intent display, difficulty color coding, click targeting
- **DroneUI**: Type symbols, level/duration/attack display, field layout
- **HUD**: Health bar, energy, block, drone count, circuits, cores, turn counter, deck/discard size
- **MapUI**: Node grid with connection lines, color/icon per type, hover glow, selectable nodes
- **AnimationHelper**: Floating damage/heal/block numbers, camera shake, card play/draw animations, spark effects, pulse effects

### Persistence
- **LocalStorage save/load**: Cores, energy tokens, run count, owned equipment, equipped slots, battery levels
- **Settings storage**: Music/SFX volume (framework ready)
- **Continue/New Game**: Menu supports both

### Infrastructure
- **Phaser 3.80**: Game engine
- **TypeScript 5.4**: Strict mode, ES2020 target
- **Vite 5.2**: Dev server + build, esbuild minification, Phaser chunk splitting
- **Vercel**: Static deployment config

---

## What's NOT Built (Outstanding Work)

### High Priority — Core Gameplay Gaps

#### Full Brawler Equipment Set
- Only 3 of ~7 pieces exist (charger, chassis, arms)
- Missing: Head, Legs, and variant equipment
- Cards are basic stubs — need unique mechanics (e.g., rage stacks, counter-attacks, armor penetration)
- No Brawler-specific passives designed
- No supercharged effects for Brawler cards
- **Design needed**: What makes Brawler feel distinct from Drone Operator?

#### Full Combo Striker Equipment Set
- Only 2 of ~7 pieces exist (charger, arms)
- Missing: Head, Chassis, Legs, and variant equipment
- Cards are basic stubs — need combo chain mechanics (e.g., hit counters, finishers, speed buffs)
- No Combo Striker-specific passives designed
- No supercharged effects for Combo Striker cards
- **Design needed**: How does the combo system work mechanically?

#### Stages 2+
- Only Stage 1 (The Outer Junkyard) exists with 15 floors
- stages.json supports multiple stages but only 1 is defined
- Need: New enemy pools, new encounter combinations, difficulty scaling
- **Design needed**: Stage themes, enemy concepts, boss designs

#### Auxiliary Equipment Slots
- Data structure exists (`auxiliarySlots: (Equipment | null)[]` with 2 slots)
- No UI to equip/view auxiliary equipment
- No auxiliary equipment items defined
- **Design needed**: What do auxiliary slots do differently from main slots?

### Medium Priority — Missing Features

#### Audio/Music
- No audio files, no sound effects, no music
- AnimationHelper has no audio integration
- **Needs**: Combat SFX (card play, damage, block), UI SFX (clicks, hovers), ambient music, boss themes

#### Real Sprite Assets
- All visuals are emoji/text placeholders and colored rectangles
- BootScene creates placeholder textures programmatically
- **Needs**: Character sprites, enemy art, card art, equipment icons, background tiles, particle textures

#### Card Reward Filtering by Family
- Currently offers any non-basic, non-injected card as rewards
- Should probably weight toward player's equipped family
- No rarity system for cards

#### Drone Equip Passive Buffs
- Drone equip injects cards and supercharges equipment
- Per the original design, equipped drones should also provide passive buffs:
  - Attack drone: Boost base attack of equipment cards
  - Shield drone: Boost defense values
  - Repair drone: Heal X HP each turn
  - Siphon drone: Every card drawn deals 1 damage
  - Overload drone: (Ticking Bomb card already handles this)
- Currently only card injection + supercharge are implemented

#### Scout Draw Passive
- Passive is detected (`scout_draw`) but the actual discard-to-draw mechanic is not wired up in CombatScene
- Needs UI interaction at start of combat

#### Set Bonus Effects
- Framework tracks equipped family counts and detects 3+ threshold
- No actual bonus effects are applied when a set bonus is active
- **Design needed**: What does each family's set bonus do?

### Low Priority — Polish & Enhancement

#### Overload Bomb Self-Damage Timer
- Card says "If not played by 3rd draw, take 5 self-damage"
- Timer tracking is not implemented — card is just a normal 10-damage attack currently

#### Card Removal at Rest — Multiple Removals
- Currently limited to 1 removal per rest stop
- Could allow spending circuits for additional removals

#### Deck Viewer
- No way to browse your full deck during combat
- Discard pile viewer not implemented

#### Tooltips
- No hover tooltips for status effects, keywords, or mechanics
- Enemy debuff descriptions not shown

#### Mobile/Touch Support
- Drag-to-play works with mouse
- No touch-specific adaptations

#### Tutorial / Onboarding
- No tutorial explaining mechanics
- No tooltips for first-time players

#### Balance Tuning
- No playtesting data
- Card costs, damage values, enemy HP all need balancing
- Battery drain rate (every run) may be too aggressive

#### Animated Transitions
- Scene transitions are instant (scene.start)
- No fade-in/out or transition effects between scenes

#### Status Effect Icons
- Enemy status effects exist in code but no visual indicators on enemy UI
- Player status effects tracked but not displayed

---

## Architecture Reference

```
src/
├── main.ts                    # Phaser game config + boot
├── data/
│   ├── cards.json             # 37+ card definitions
│   ├── enemies.json           # 16 enemies across 4 tiers
│   ├── equipment.json         # 14 equipment pieces
│   ├── events.json            # 6 narrative events
│   └── stages.json            # Stage 1 encounter pools
├── entities/
│   ├── Card.ts                # Card data + runtime state
│   ├── Drone.ts               # Drone type, level, duration, equip state
│   ├── Enemy.ts               # Enemy HP, pattern AI, status effects
│   ├── Equipment.ts           # Equipment slots, battery, supercharge
│   └── Player.ts              # Player stats, equipment map, run state
├── systems/
│   ├── CombatManager.ts       # Turn phases, card resolution, drone equip
│   ├── DeckManager.ts         # Draw/discard/shuffle, card injection
│   ├── DroneManager.ts        # Field/equipped drones, summon/remove
│   ├── EquipmentManager.ts    # Deck building, shop, supercharge
│   ├── EnemyAI.ts             # Enemy actions, encounter creation
│   ├── EventManager.ts        # Random events, choice resolution
│   ├── MapGenerator.ts        # Procedural branching map
│   └── ProgressionManager.ts  # Run rewards, equipment purchases
├── scenes/
│   ├── BootScene.ts           # Loading + placeholder textures
│   ├── MenuScene.ts           # Title + new/continue
│   ├── LoadoutScene.ts        # Equipment management
│   ├── ShopScene.ts           # Equipment shop
│   ├── MapScene.ts            # Branching map navigation
│   ├── CombatScene.ts         # Card combat + drone equip UI
│   ├── RestScene.ts           # Heal + card removal
│   ├── EventScene.ts          # Narrative events
│   ├── TreasureScene.ts       # Treasure rewards
│   └── PostRunScene.ts        # Run summary + rewards
├── ui/
│   ├── CardUI.ts              # Card rendering + interaction
│   ├── HandUI.ts              # Hand layout
│   ├── EnemyUI.ts             # Enemy display
│   ├── DroneUI.ts             # Drone field display
│   ├── HUD.ts                 # Combat HUD
│   └── MapUI.ts               # Map node rendering
└── utils/
    ├── Constants.ts           # Game constants, types, colors, fonts
    ├── SaveManager.ts         # LocalStorage persistence
    └── AnimationHelper.ts     # Visual effects + animations
```

## Key Technical Decisions
- **No fixed classes**: Equipment defines playstyle. Mix families freely.
- **Battery rotation**: Equipment drains 1 battery per run (4 max). Forces variety.
- **Run-scoped deck mods**: `runDeckCardIds` and `removedCardIds` on Player track changes within a run. Deck is rebuilt from equipment + mods each combat.
- **Drone dual-use**: Drones can act on the field OR be equipped to a slot (not both).
- **Data-driven**: Cards, enemies, equipment, events, stages all defined in JSON.
- **Scene-based flow**: Player object passed between scenes via `this.scene.start(key, data)`.
