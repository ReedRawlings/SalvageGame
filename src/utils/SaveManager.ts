import { Player } from '../entities/Player';
import { Equipment, EquipmentData } from '../entities/Equipment';
import { EquipmentSlot } from './Constants';
import equipmentData from '../data/equipment.json';

const SAVE_KEY = 'salvage_save';
const SETTINGS_KEY = 'salvage_settings';

interface SaveData {
  cores: number;
  energyTokens: number;
  runCount: number;
  ownedEquipmentIds: string[];
  equippedSlots: Record<string, string | null>;
  equipmentBatteries: Record<string, number>;
}

interface SettingsData {
  musicVolume: number;
  sfxVolume: number;
}

export class SaveManager {
  static save(player: Player): void {
    const equippedSlots: Record<string, string | null> = {};
    for (const [slot, piece] of player.equipment) {
      equippedSlots[slot] = piece?.id ?? null;
    }

    const equipmentBatteries: Record<string, number> = {};
    for (const piece of player.ownedEquipment) {
      equipmentBatteries[piece.id] = piece.battery;
    }

    const data: SaveData = {
      cores: player.cores,
      energyTokens: player.energyTokens,
      runCount: player.runCount,
      ownedEquipmentIds: player.ownedEquipment.map(e => e.id),
      equippedSlots,
      equipmentBatteries,
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable
    }
  }

  static load(player: Player): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;

      const data: SaveData = JSON.parse(raw);

      player.cores = data.cores;
      player.energyTokens = data.energyTokens;
      player.runCount = data.runCount;

      // Restore owned equipment
      player.ownedEquipment = [];
      for (const id of data.ownedEquipmentIds) {
        const eqData = (equipmentData as Record<string, EquipmentData>)[id];
        if (eqData) {
          const piece = new Equipment(eqData);
          piece.battery = data.equipmentBatteries[id] ?? piece.battery;
          player.ownedEquipment.push(piece);
        }
      }

      // Restore equipped slots
      for (const [slot, eqId] of Object.entries(data.equippedSlots)) {
        if (eqId) {
          const piece = player.ownedEquipment.find(e => e.id === eqId);
          if (piece && piece.isAvailable()) {
            player.equipPiece(piece);
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  static saveSettings(settings: SettingsData): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Storage full or unavailable
    }
  }

  static loadSettings(): SettingsData {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { musicVolume: 0.5, sfxVolume: 0.7 };
      return JSON.parse(raw);
    } catch {
      return { musicVolume: 0.5, sfxVolume: 0.7 };
    }
  }
}
