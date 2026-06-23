// === Neon Lander VR -- Types & Constants ===

// ---- Play field ----
export const FIELD_WIDTH = 12;
export const FIELD_HEIGHT = 8;
export const FIELD_DEPTH = 0.4; // extrusion depth for terrain
export const FIELD_OFFSET_Y = 0.3; // world Y offset for the play field center

// ---- Physics ----
export const GRAVITY = 1.6; // m/s^2 (moon-like)
export const THRUST_POWER = 4.0;
export const ROTATION_SPEED = 3.0; // rad/s
export const MAX_VELOCITY = 8.0;
export const DRAG = 0.995; // angular damping

// ---- Lander ----
export const LANDER_SIZE = 0.15;
export const SAFE_LAND_VY = 1.2; // max vertical speed for safe landing
export const SAFE_LAND_VX = 0.6; // max horizontal speed for safe landing
export const SAFE_LAND_ANGLE = 0.25; // max tilt (radians) for safe landing
export const INITIAL_FUEL = 100;

// ---- Scoring ----
export const LAND_BASE_SCORE = 100;
export const FUEL_BONUS_MULT = 5;
export const PRECISION_BONUS = 200;
export const SPEED_BONUS_MULT = 50; // bonus for landing slowly

// ---- Terrain ----
export const TERRAIN_SEGMENTS = 60;
export const MIN_PAD_WIDTH = 0.6;
export const MAX_PAD_WIDTH = 1.2;
export const PAD_NARROW_WIDTH = 0.4;

// ---- Level progression ----
export const LEVELS_PER_ZONE = 5;
export const MAX_WIND = 1.5;

// ---- Enums ----
export enum GameState {
  MENU = 'menu',
  MODE_SELECT = 'modeselect',
  READY = 'ready',
  PLAYING = 'playing',
  LANDING = 'landing',
  CRASHED = 'crashed',
  GAME_OVER = 'gameover',
  LEVEL_COMPLETE = 'levelcomplete',
  PAUSED = 'paused',
  WIN = 'win',
}

export enum GameMode {
  CLASSIC = 'classic',
  TIME_ATTACK = 'time_attack',
  PRECISION = 'precision',
  ENDLESS = 'endless',
  ZEN = 'zen',
  DAILY = 'daily',
  GRAVITY_FLIP = 'gravity_flip',
  METEOR_STORM = 'meteor_storm',
}

export enum Difficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

export enum ArenaTheme {
  DEEP_SPACE = 'deep_space',
  LUNAR = 'lunar',
  MARS = 'mars',
  ICE_MOON = 'ice_moon',
  NEON_CITY = 'neon_city',
}

export enum LanderSkin {
  NEON_BLUE = 'neon_blue',
  CRIMSON = 'crimson',
  EMERALD = 'emerald',
  GOLD = 'gold',
  PHANTOM = 'phantom',
}

// ---- Interfaces ----
export interface LandingPad {
  x: number;
  width: number;
  y: number; // terrain height at pad
  multiplier: number; // score multiplier (narrower = higher)
  moving?: boolean; // whether this pad oscillates
  moveSpeed?: number; // oscillation speed
  moveRange?: number; // horizontal oscillation range
  baseX?: number; // original center X for oscillation
}

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface LevelData {
  terrain: TerrainPoint[];
  pads: LandingPad[];
  wind: number; // horizontal wind force
  gravity: number; // gravity multiplier
  fuel: number;
  startX: number;
  startY: number;
}

export interface LanderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // rotation in radians
  angularVel: number;
  fuel: number;
  thrusting: boolean;
  alive: boolean;
}

// ---- Mode configs ----
export const MODE_CONFIGS: Record<GameMode, {
  label: string;
  description: string;
  hasLevels: boolean;
  infiniteFuel: boolean;
  timedMode: boolean;
  precisionMode: boolean;
}> = {
  [GameMode.CLASSIC]: {
    label: 'Classic',
    description: 'Complete 10 levels with limited fuel',
    hasLevels: true,
    infiniteFuel: false,
    timedMode: false,
    precisionMode: false,
  },
  [GameMode.TIME_ATTACK]: {
    label: 'Time Attack',
    description: 'Land as fast as possible',
    hasLevels: true,
    infiniteFuel: false,
    timedMode: true,
    precisionMode: false,
  },
  [GameMode.PRECISION]: {
    label: 'Precision',
    description: 'Score based on landing accuracy',
    hasLevels: true,
    infiniteFuel: false,
    timedMode: false,
    precisionMode: true,
  },
  [GameMode.ENDLESS]: {
    label: 'Endless',
    description: 'Survive as long as possible',
    hasLevels: true,
    infiniteFuel: false,
    timedMode: false,
    precisionMode: false,
  },
  [GameMode.ZEN]: {
    label: 'Zen',
    description: 'Unlimited fuel, just practice',
    hasLevels: true,
    infiniteFuel: true,
    timedMode: false,
    precisionMode: false,
  },
  [GameMode.DAILY]: {
    label: 'Daily Challenge',
    description: 'Unique challenge every day',
    hasLevels: false,
    infiniteFuel: false,
    timedMode: true,
    precisionMode: true,
  },
  [GameMode.GRAVITY_FLIP]: {
    label: 'Gravity Flip',
    description: 'Gravity reverses each landing',
    hasLevels: true,
    infiniteFuel: false,
    timedMode: false,
    precisionMode: false,
  },
  [GameMode.METEOR_STORM]: {
    label: 'Meteor Storm',
    description: 'Dodge constant meteor barrages',
    hasLevels: true,
    infiniteFuel: false,
    timedMode: false,
    precisionMode: false,
  },
};

export const DIFFICULTY_MODS: Record<Difficulty, {
  gravityMult: number;
  fuelMult: number;
  windMult: number;
  safeVyMult: number;
  safeAngleMult: number;
  lives: number;
  padWidthMult: number;
}> = {
  [Difficulty.EASY]: {
    gravityMult: 0.7,
    fuelMult: 1.5,
    windMult: 0.3,
    safeVyMult: 1.5,
    safeAngleMult: 1.5,
    lives: 5,
    padWidthMult: 1.3,
  },
  [Difficulty.NORMAL]: {
    gravityMult: 1.0,
    fuelMult: 1.0,
    windMult: 1.0,
    safeVyMult: 1.0,
    safeAngleMult: 1.0,
    lives: 3,
    padWidthMult: 1.0,
  },
  [Difficulty.HARD]: {
    gravityMult: 1.4,
    fuelMult: 0.7,
    windMult: 1.8,
    safeAngleMult: 0.6,
    safeVyMult: 0.7,
    lives: 2,
    padWidthMult: 0.7,
  },
};

// ---- Theme colors ----
export const THEME_COLORS: Record<ArenaTheme, {
  bg: number;
  fog: number;
  terrain: number;
  terrainEmissive: number;
  pad: number;
  padEmissive: number;
  stars: number;
  accent: number;
}> = {
  [ArenaTheme.DEEP_SPACE]: {
    bg: 0x000811, fog: 0x000811,
    terrain: 0x1a1a3a, terrainEmissive: 0x0022aa,
    pad: 0x00ff88, padEmissive: 0x00cc66,
    stars: 0xffffff, accent: 0x0088ff,
  },
  [ArenaTheme.LUNAR]: {
    bg: 0x050508, fog: 0x050508,
    terrain: 0x2a2a2a, terrainEmissive: 0x333355,
    pad: 0x44ff44, padEmissive: 0x22cc22,
    stars: 0xeeeeff, accent: 0xaaaacc,
  },
  [ArenaTheme.MARS]: {
    bg: 0x0a0402, fog: 0x0a0402,
    terrain: 0x442211, terrainEmissive: 0x661100,
    pad: 0xff8844, padEmissive: 0xcc6622,
    stars: 0xffddcc, accent: 0xff6633,
  },
  [ArenaTheme.ICE_MOON]: {
    bg: 0x020810, fog: 0x020810,
    terrain: 0x224455, terrainEmissive: 0x114488,
    pad: 0x44ddff, padEmissive: 0x22aacc,
    stars: 0xccddff, accent: 0x66ccff,
  },
  [ArenaTheme.NEON_CITY]: {
    bg: 0x0a0012, fog: 0x0a0012,
    terrain: 0x220044, terrainEmissive: 0x440088,
    pad: 0xff44ff, padEmissive: 0xcc22cc,
    stars: 0xffccff, accent: 0xff66ff,
  },
};

export const SKIN_COLORS: Record<LanderSkin, {
  body: number;
  emissive: number;
  flame: number;
  label: string;
}> = {
  [LanderSkin.NEON_BLUE]: {
    body: 0x2266ff, emissive: 0x1144cc, flame: 0x44aaff, label: 'Neon Blue',
  },
  [LanderSkin.CRIMSON]: {
    body: 0xcc2233, emissive: 0x991122, flame: 0xff6644, label: 'Crimson',
  },
  [LanderSkin.EMERALD]: {
    body: 0x22cc44, emissive: 0x119933, flame: 0x88ff44, label: 'Emerald',
  },
  [LanderSkin.GOLD]: {
    body: 0xccaa22, emissive: 0x998811, flame: 0xffdd44, label: 'Gold',
  },
  [LanderSkin.PHANTOM]: {
    body: 0x666688, emissive: 0x334466, flame: 0xaaccff, label: 'Phantom',
  },
};
