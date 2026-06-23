// === Neon Lander VR -- Upgrade System ===

export enum UpgradeType {
  THRUST = 'thrust',
  FUEL_EFFICIENCY = 'fuel_efficiency',
  ROTATION = 'rotation',
  ARMOR = 'armor',
  LANDING_GEAR = 'landing_gear',
}

export interface UpgradeDef {
  type: UpgradeType;
  label: string;
  description: string;
  maxLevel: number;
  costPerLevel: number; // score cost per level
}

export const UPGRADE_DEFS: Record<UpgradeType, UpgradeDef> = {
  [UpgradeType.THRUST]: {
    type: UpgradeType.THRUST,
    label: 'Thrust Power',
    description: '+10% thrust per level',
    maxLevel: 5,
    costPerLevel: 500,
  },
  [UpgradeType.FUEL_EFFICIENCY]: {
    type: UpgradeType.FUEL_EFFICIENCY,
    label: 'Fuel Efficiency',
    description: '-8% fuel usage per level',
    maxLevel: 5,
    costPerLevel: 400,
  },
  [UpgradeType.ROTATION]: {
    type: UpgradeType.ROTATION,
    label: 'Rotation Speed',
    description: '+12% rotation per level',
    maxLevel: 5,
    costPerLevel: 350,
  },
  [UpgradeType.ARMOR]: {
    type: UpgradeType.ARMOR,
    label: 'Hull Armor',
    description: '+15% crash tolerance per level',
    maxLevel: 3,
    costPerLevel: 800,
  },
  [UpgradeType.LANDING_GEAR]: {
    type: UpgradeType.LANDING_GEAR,
    label: 'Landing Gear',
    description: '+10% safe landing angle per level',
    maxLevel: 3,
    costPerLevel: 600,
  },
};

const STORAGE_KEY = 'neon-lander-upgrades';

export class UpgradeManager {
  levels: Map<UpgradeType, number> = new Map();
  totalSpent = 0;

  constructor() {
    for (const type of Object.values(UpgradeType)) {
      this.levels.set(type, 0);
    }
    this.load();
  }

  getLevel(type: UpgradeType): number {
    return this.levels.get(type) ?? 0;
  }

  canUpgrade(type: UpgradeType, availableScore: number): boolean {
    const def = UPGRADE_DEFS[type];
    const current = this.getLevel(type);
    if (current >= def.maxLevel) return false;
    return availableScore >= def.costPerLevel * (current + 1);
  }

  getCost(type: UpgradeType): number {
    const def = UPGRADE_DEFS[type];
    const current = this.getLevel(type);
    return def.costPerLevel * (current + 1);
  }

  purchase(type: UpgradeType): boolean {
    const cost = this.getCost(type);
    const current = this.getLevel(type);
    const def = UPGRADE_DEFS[type];
    if (current >= def.maxLevel) return false;
    this.levels.set(type, current + 1);
    this.totalSpent += cost;
    this.save();
    return true;
  }

  // Get multipliers
  get thrustMult(): number {
    return 1 + this.getLevel(UpgradeType.THRUST) * 0.10;
  }

  get fuelEfficiency(): number {
    return 1 - this.getLevel(UpgradeType.FUEL_EFFICIENCY) * 0.08;
  }

  get rotationMult(): number {
    return 1 + this.getLevel(UpgradeType.ROTATION) * 0.12;
  }

  get crashTolerance(): number {
    return 1 + this.getLevel(UpgradeType.ARMOR) * 0.15;
  }

  get landingAngleMult(): number {
    return 1 + this.getLevel(UpgradeType.LANDING_GEAR) * 0.10;
  }

  get totalUpgradeLevel(): number {
    let total = 0;
    for (const lvl of this.levels.values()) total += lvl;
    return total;
  }

  reset(): void {
    for (const type of Object.values(UpgradeType)) {
      this.levels.set(type, 0);
    }
    this.totalSpent = 0;
    this.save();
  }

  private save(): void {
    const data: Record<string, number> = {};
    for (const [type, level] of this.levels) {
      data[type] = level;
    }
    data._totalSpent = this.totalSpent;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        for (const type of Object.values(UpgradeType)) {
          if (data[type] !== undefined) {
            this.levels.set(type, data[type]);
          }
        }
        if (data._totalSpent) this.totalSpent = data._totalSpent;
      }
    } catch { /* ignore */ }
  }
}
