// === Neon Lander VR -- Game Manager ===

import {
  Group,
  Mesh,
  PointLight,
} from '@iwsdk/core';
import {
  GameState,
  GameMode,
  Difficulty,
  ArenaTheme,
  LanderSkin,
  LanderState,
  LevelData,
  GRAVITY,
  THRUST_POWER,
  ROTATION_SPEED,
  MAX_VELOCITY,
  DRAG,
  SAFE_LAND_VY,
  SAFE_LAND_VX,
  SAFE_LAND_ANGLE,
  LAND_BASE_SCORE,
  FUEL_BONUS_MULT,
  PRECISION_BONUS,
  SPEED_BONUS_MULT,
  MODE_CONFIGS,
  DIFFICULTY_MODS,
  SKIN_COLORS,
} from './types';
import { generateLevel } from './terrain';
import { AudioManager } from './audio-manager';
import { AchievementManager } from './achievements';
import { StatsManager } from './stats-manager';
import { LeaderboardManager } from './leaderboard';
import { ParticleManager } from './particles';
import { PowerUpManager, PowerUpType, POWERUP_DEFS } from './powerups';
import { MeteorManager } from './meteors';
import { UpgradeManager } from './upgrades';
import { TutorialManager } from './tutorial';
import { saveGame, clearSave, type SaveState } from './savestate';

export class GameManager {
  // State
  state: GameState = GameState.MENU;
  mode: GameMode = GameMode.CLASSIC;
  difficulty: Difficulty = Difficulty.NORMAL;
  theme: ArenaTheme = ArenaTheme.DEEP_SPACE;
  skin: LanderSkin = LanderSkin.NEON_BLUE;

  // Game progress
  level = 1;
  score = 0;
  lives = 3;
  levelStartTime = 0;
  levelElapsedTime = 0;
  totalGameTime = 0;

  // Level data
  currentLevel: LevelData | null = null;

  // Lander physics
  lander: LanderState = {
    x: 0, y: 6, vx: 0, vy: 0,
    angle: 0, angularVel: 0,
    fuel: 100, thrusting: false, alive: true,
  };

  // Input state
  thrustInput = false;
  rotateLeftInput = false;
  rotateRightInput = false;

  // Visual references
  landerGroup: Group | null = null;
  flameMesh: Mesh | null = null;
  thrustLight: PointLight | null = null;
  bodyMesh: Mesh | null = null;

  // Subsystems
  audio = new AudioManager();
  achievements = new AchievementManager();
  statsManager = new StatsManager();
  leaderboard = new LeaderboardManager();
  particles: ParticleManager | null = null;
  powerUps: PowerUpManager | null = null;
  meteors: MeteorManager | null = null;
  upgrades = new UpgradeManager();
  tutorial = new TutorialManager();

  // Power-up tracking
  totalPowerUpsCollected = 0;
  fuelPickups = 0;
  shieldsUsed = 0;
  slowMosUsed = 0;
  scoreBoostsUsed = 0;
  magnetsUsed = 0;
  extraLivesCollected = 0;
  shieldSavedThisGame = false;

  // Meteor tracking
  meteorsDodged = 0;
  meteorHits = 0;
  levelsWithMeteors = 0;

  // Timers
  readyTimer = 0;
  crashTimer = 0;
  levelCompleteTimer = 0;
  retryCountThisLevel = 0;
  lastThrustTime = 0;
  invertedTimer = 0;
  perfectCombo = 0;
  noCrashStreak = 0;
  totalRotation = 0;
  zenLandings = 0;
  gravityFlipped = false;
  padsLandedThisLevel: Set<number> = new Set();
  hoverTimer = 0;
  shieldSavesThisGame = 0;

  // Callbacks
  onStateChange: ((state: GameState) => void) | null = null;
  onLevelChange: (() => void) | null = null;
  onScoreChange: ((score: number) => void) | null = null;

  get isPerfectLanding(): boolean {
    if (!this.currentLevel) return false;
    const l = this.lander;
    const vy = Math.abs(l.vy);
    const vx = Math.abs(l.vx);
    const angle = Math.abs(l.angle);
    const mods = DIFFICULTY_MODS[this.difficulty];
    return vy < SAFE_LAND_VY * mods.safeVyMult * 0.5 &&
           vx < SAFE_LAND_VX * 0.5 &&
           angle < SAFE_LAND_ANGLE * mods.safeAngleMult * 0.5;
  }

  setState(newState: GameState): void {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  startGame(mode: GameMode, difficulty: Difficulty): void {
    this.mode = mode;
    this.difficulty = difficulty;
    this.level = 1;
    this.score = 0;
    this.lives = DIFFICULTY_MODS[difficulty].lives;
    this.perfectCombo = 0;
    this.totalGameTime = 0;
    this.retryCountThisLevel = 0;
    this.totalPowerUpsCollected = 0;
    this.fuelPickups = 0;
    this.shieldsUsed = 0;
    this.slowMosUsed = 0;
    this.scoreBoostsUsed = 0;
    this.magnetsUsed = 0;
    this.extraLivesCollected = 0;
    this.shieldSavedThisGame = false;
    this.shieldSavesThisGame = 0;
    this.gravityFlipped = false;
    this.padsLandedThisLevel = new Set();
    this.powerUps?.resetActive();
    this.meteors?.clearAll();
    this.meteorsDodged = 0;
    this.meteorHits = 0;
    this.levelsWithMeteors = 0;

    this.statsManager.recordGameStart(mode);
    this.statsManager.recordTheme(this.theme);
    this.statsManager.recordSkin(this.skin);

    // Mode-specific achievement tracking
    if (mode === GameMode.TIME_ATTACK) this.achievements.unlock('play_time_attack');
    if (mode === GameMode.PRECISION) this.achievements.unlock('play_precision');
    if (mode === GameMode.ENDLESS) this.achievements.unlock('play_endless');
    if (mode === GameMode.ZEN) this.achievements.unlock('play_zen');

    if (mode === GameMode.GRAVITY_FLIP) this.achievements.unlock('play_gravity_flip');
    if (mode === GameMode.METEOR_STORM) this.achievements.unlock('play_meteor_storm');

    // Check if all modes played
    if (this.statsManager.stats.modesPlayed.length >= 8) {
      this.achievements.unlock('all_modes');
    }

    this.loadLevel();

    // Start tutorial if first time
    if (this.tutorial.shouldShow() && mode === GameMode.CLASSIC) {
      this.tutorial.start();
      this.tutorial.onComplete = () => {
        this.achievements.unlock('tutorial_complete');
      };
    }
  }

  loadLevel(): void {
    const seed = this.mode === GameMode.DAILY
      ? this.getDailySeed()
      : undefined;

    this.currentLevel = generateLevel(this.level, this.difficulty, seed);

    // Reset lander
    this.lander = {
      x: this.currentLevel.startX,
      y: this.currentLevel.startY,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVel: 0,
      fuel: this.currentLevel.fuel,
      thrusting: false,
      alive: true,
    };

    this.levelStartTime = performance.now();
    this.levelElapsedTime = 0;
    this.readyTimer = 2.0;
    this.lastThrustTime = 0;
    this.invertedTimer = 0;
    this.totalRotation = 0;
    this.padsLandedThisLevel = new Set();

    this.setState(GameState.READY);
    this.onLevelChange?.();

    // Spawn power-ups for this level
    if (this.powerUps && this.currentLevel) {
      const level = this.currentLevel;
      this.powerUps.spawnForLevel(
        level.pads,
        (x: number) => this.getTerrainHeight(x),
      );
    }

    // Configure meteors: enabled from level 4+ (except Zen mode), always in Meteor Storm mode
    if (this.meteors) {
      const enableMeteors = this.mode === GameMode.METEOR_STORM ||
        (this.level >= 4 && this.mode !== GameMode.ZEN);
      this.meteors.configure(this.level, enableMeteors);
      this.meteors.setTheme(this.theme);
      // In Meteor Storm mode, make meteors more aggressive
      if (this.mode === GameMode.METEOR_STORM && enableMeteors) {
        this.meteors.spawnInterval = Math.max(0.6, 2.0 - this.level * 0.12);
        this.meteors.maxMeteors = Math.min(12, 5 + Math.floor(this.level / 2));
      }
      if (enableMeteors) this.levelsWithMeteors++;
    }
  }

  private getDailySeed(): number {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  updatePhysics(dt: number): void {
    if (this.state !== GameState.PLAYING) return;
    const l = this.lander;
    if (!l.alive || !this.currentLevel) return;

    const mods = DIFFICULTY_MODS[this.difficulty];
    const modeConfig = MODE_CONFIGS[this.mode];

    // Track elapsed time
    this.levelElapsedTime += dt;
    this.totalGameTime += dt;

    // Rotation (with upgrade multiplier)
    const rotSpeed = ROTATION_SPEED * this.upgrades.rotationMult;
    if (this.rotateLeftInput) l.angularVel -= rotSpeed * dt;
    if (this.rotateRightInput) l.angularVel += rotSpeed * dt;
    l.angularVel *= DRAG;
    l.angle += l.angularVel * dt;

    // Track total rotation for 360 achievement
    this.totalRotation += Math.abs(l.angularVel * dt);
    if (this.totalRotation >= Math.PI * 2) {
      this.achievements.unlock('full_360');
    }

    // Normalize angle
    while (l.angle > Math.PI) l.angle -= Math.PI * 2;
    while (l.angle < -Math.PI) l.angle += Math.PI * 2;

    // Track inverted time
    if (Math.abs(l.angle) > Math.PI * 0.6) {
      this.invertedTimer += dt;
      if (this.invertedTimer >= 3) {
        this.achievements.unlock('upside_hover');
      }
    } else {
      this.invertedTimer = 0;
    }

    // Thrust
    const canThrust = modeConfig.infiniteFuel || l.fuel > 0;
    l.thrusting = this.thrustInput && canThrust;

    if (l.thrusting) {
      const thrustPower = THRUST_POWER * this.upgrades.thrustMult;
      const thrustX = Math.sin(l.angle) * thrustPower * dt;
      const thrustY = Math.cos(l.angle) * thrustPower * dt;
      l.vx -= thrustX;
      l.vy += thrustY;

      if (!modeConfig.infiniteFuel) {
        l.fuel -= 20 * this.upgrades.fuelEfficiency * dt;
        if (l.fuel < 0) l.fuel = 0;
      }

      this.lastThrustTime = this.levelElapsedTime;
      this.audio.updateThrustPitch(l.fuel, this.currentLevel.fuel);
    }

    // Gravity (modified by slow-mo power-up and gravity flip mode)
    const gravityMult = this.powerUps?.gravityMultiplier ?? 1;
    const gravityDir = this.gravityFlipped ? -1 : 1;
    l.vy -= GRAVITY * this.currentLevel.gravity * gravityMult * gravityDir * dt;

    // Wind
    l.vx += this.currentLevel.wind * dt;

    // Update power-up timers
    this.powerUps?.updateTimers(dt);

    // Check power-up collection
    if (this.powerUps) {
      const collected = this.powerUps.checkCollection(l.x, l.y);
      if (collected) {
        this.handlePowerUpCollect(collected);
      }

      // Magnet force: gently pull toward nearest pad
      if (this.powerUps.magnetActive) {
        const dx = this.powerUps.magnetPadX - l.x;
        const dy = this.powerUps.magnetPadY - l.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1) {
          const force = 0.8 / Math.max(dist, 0.5);
          l.vx += (dx / dist) * force * dt;
          l.vy += (dy / dist) * force * dt;
        }
      }
    }

    // Hover tracking
    if (l.y > 3 && Math.abs(l.vy) < 0.3) {
      this.hoverTimer += dt;
      if (this.hoverTimer >= 10) this.achievements.unlock('hover_10s');
    } else {
      this.hoverTimer = 0;
    }

    // Clamp velocity
    const speed = Math.sqrt(l.vx * l.vx + l.vy * l.vy);
    if (speed > MAX_VELOCITY) {
      const scale = MAX_VELOCITY / speed;
      l.vx *= scale;
      l.vy *= scale;
    }

    // Move
    l.x += l.vx * dt;
    l.y += l.vy * dt;

    // Meteor collision check
    if (this.meteors && this.meteors.enabled) {
      this.meteors.update(dt);
      if (this.meteors.checkCollision(l.x, l.y, 0.18)) {
        this.meteorHits++;
        this.handleMeteorHit();
        return;
      }
      // Track near-misses as dodged meteors
      for (const m of this.meteors.meteors) {
        if (!m.alive) continue;
        const mdx = l.x - m.x;
        const mdy = l.y - m.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 0.6 && mdist > 0.2) {
          this.meteorsDodged++;
          if (this.meteorsDodged >= 10) this.achievements.unlock('meteor_dodger_10');
          if (this.meteorsDodged >= 50) this.achievements.unlock('meteor_dodger_50');
        }
      }
    }

    // Boundary checks (wrap horizontal)
    const halfW = 6;
    if (l.x < -halfW) l.x = halfW;
    if (l.x > halfW) l.x = -halfW;

    // Ceiling
    if (l.y > 8) { l.y = 8; l.vy = 0; }

    // Terrain collision
    this.checkCollisions();
  }

  private checkCollisions(): void {
    const l = this.lander;
    const level = this.currentLevel!;

    // Get terrain height at lander position
    const terrainY = this.getTerrainHeight(l.x);

    if (l.y - 0.1 <= terrainY) {
      // Check if on a pad
      const pad = level.pads.find(
        (p) => l.x >= p.x - p.width / 2 && l.x <= p.x + p.width / 2,
      );

      const mods = DIFFICULTY_MODS[this.difficulty];
      const safeVy = SAFE_LAND_VY * mods.safeVyMult * this.upgrades.crashTolerance;
      const safeVx = SAFE_LAND_VX * this.upgrades.crashTolerance;
      const safeAngle = SAFE_LAND_ANGLE * mods.safeAngleMult * this.upgrades.landingAngleMult;

      if (
        pad &&
        Math.abs(l.vy) < safeVy &&
        Math.abs(l.vx) < safeVx &&
        Math.abs(l.angle) < safeAngle
      ) {
        // Successful landing!
        this.handleLanding(pad.multiplier, pad.x);
      } else {
        // Crash!
        this.handleCrash();
      }
    }
  }

  getTerrainHeight(x: number): number {
    if (!this.currentLevel) return 0;
    const pts = this.currentLevel.terrain;

    // Find the two points that bracket x
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
        return pts[i].y + t * (pts[i + 1].y - pts[i].y);
      }
    }

    // Off edges
    if (x < pts[0].x) return pts[0].y;
    return pts[pts.length - 1].y;
  }

  private handlePowerUpCollect(type: PowerUpType): void {
    const def = POWERUP_DEFS[type];
    this.audio.playPowerUp();
    this.totalPowerUpsCollected++;
    this.particles?.emit(this.lander.x, this.lander.y, 15, def.color, 1.5, 0.4);

    switch (type) {
      case PowerUpType.FUEL:
        this.fuelPickups++;
        break;
      case PowerUpType.SHIELD:
        this.shieldsUsed++;
        break;
      case PowerUpType.SLOW_MO:
        this.slowMosUsed++;
        break;
      case PowerUpType.SCORE_BOOST:
        this.scoreBoostsUsed++;
        break;
      case PowerUpType.MAGNET:
        this.magnetsUsed++;
        break;
      case PowerUpType.EXTRA_LIFE:
        this.extraLivesCollected++;
        break;
    }

    this.powerUps!.applyPowerUp(type, {
      current: this.lander.fuel,
      max: this.currentLevel?.fuel ?? 100,
    });

    // For fuel, apply directly
    if (type === PowerUpType.FUEL) {
      this.lander.fuel = Math.min(
        this.currentLevel?.fuel ?? 100,
        this.lander.fuel + (this.currentLevel?.fuel ?? 100) * 0.25,
      );
    }

    // Extra life: grant +1
    if (type === PowerUpType.EXTRA_LIFE) {
      this.lives++;
      this.achievements.unlock('extra_life_collect');
    }

    // Magnet: find nearest pad and set target
    if (type === PowerUpType.MAGNET && this.currentLevel) {
      let nearestDist = Infinity;
      for (const pad of this.currentLevel.pads) {
        const dx = this.lander.x - pad.x;
        const dy = this.lander.y - pad.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          this.powerUps!.magnetPadX = pad.x;
          this.powerUps!.magnetPadY = pad.y;
        }
      }
      this.achievements.unlock('magnet_collect');
    }

    // Power-up achievements
    if (this.totalPowerUpsCollected >= 1) this.achievements.unlock('first_powerup');
    if (this.totalPowerUpsCollected >= 10) this.achievements.unlock('powerup_10');
    if (this.totalPowerUpsCollected >= 25) this.achievements.unlock('powerup_25');
    if (this.fuelPickups >= 5) this.achievements.unlock('fuel_hoarder');
    if (this.scoreBoostsUsed >= 3) this.achievements.unlock('boost_collector');
  }

  private handleLanding(multiplier: number, padCenterX: number): void {
    const l = this.lander;
    l.alive = false;
    l.vy = 0;
    l.vx = 0;
    l.thrusting = false;

    this.audio.stopThrust();
    this.audio.playLand();

    // Landing dust particles
    this.particles?.emitLandingDust(l.x, l.y);

    const modeConfig = MODE_CONFIGS[this.mode];
    const landingTime = this.levelElapsedTime;

    // Calculate score
    let landScore = LAND_BASE_SCORE * multiplier;

    // Fuel bonus
    const fuelPercent = this.currentLevel ? l.fuel / this.currentLevel.fuel : 0;
    landScore += Math.floor(fuelPercent * 100) * FUEL_BONUS_MULT;

    // Precision bonus (how close to pad center)
    const centerDist = Math.abs(l.x - padCenterX);
    if (centerDist < 0.05) {
      landScore += PRECISION_BONUS;
      this.achievements.unlock('center_landing');
    }

    // Speed bonus (slower = more points)
    const touchdownSpeed = Math.abs(l.vy);
    landScore += Math.floor((1 - touchdownSpeed / SAFE_LAND_VY) * SPEED_BONUS_MULT);

    // Time bonus in time attack
    if (modeConfig.timedMode) {
      landScore += Math.max(0, Math.floor((30 - landingTime) * 10));
    }

    // Apply power-up score multiplier
    const puMult = this.powerUps?.consumeScoreMultiplier() ?? 1;
    landScore = Math.floor(landScore * puMult);
    if (puMult > 1) this.achievements.unlock('boosted_landing');

    this.score += landScore;
    this.onScoreChange?.(this.score);

    // Perfect landing check
    const perfect = this.isPerfectLanding;
    if (perfect) {
      this.perfectCombo++;
      if (this.perfectCombo >= 3) this.achievements.unlock('combo_3');
      if (this.perfectCombo >= 5) this.achievements.unlock('combo_5');
    } else {
      this.perfectCombo = 0;
    }

    // Stats
    this.statsManager.recordLanding(
      landScore, this.level, l.fuel,
      this.currentLevel?.fuel ?? 100,
      landingTime, perfect,
    );

    // Achievements
    this.achievements.unlock('first_landing');
    if (touchdownSpeed < 0.3) this.achievements.unlock('perfect_landing');
    if (landingTime < 10) this.achievements.unlock('fast_landing');
    if (landingTime < 5) this.achievements.unlock('land_under_5s');
    if (landingTime < 3) this.achievements.unlock('land_under_3s');
    if (landingTime > 60) this.achievements.unlock('slow_landing');
    if (fuelPercent > 0.8) this.achievements.unlock('fuel_saver');
    if (fuelPercent < 0.05 && !modeConfig.infiniteFuel) this.achievements.unlock('fumes_landing');
    if (fuelPercent < 0.01 && !modeConfig.infiniteFuel) this.achievements.unlock('land_min_fuel');
    if (fuelPercent > 0.9) this.achievements.unlock('min_fuel_used');
    if (multiplier >= 3) this.achievements.unlock('narrow_pad');
    if (this.levelElapsedTime - this.lastThrustTime > 2) this.achievements.unlock('no_thrust_land');
    if (this.currentLevel && Math.abs(this.currentLevel.wind) > 0.5) this.achievements.unlock('land_in_wind');
    if (this.currentLevel && Math.abs(this.currentLevel.wind) > 1.0) this.achievements.unlock('land_strong_wind');
    if (Math.abs(l.vx) < 0.05) this.achievements.unlock('zero_vx_landing');

    // Near-max safe parameter landings
    const mods2 = DIFFICULTY_MODS[this.difficulty];
    if (Math.abs(l.angle) > SAFE_LAND_ANGLE * mods2.safeAngleMult * 0.8) this.achievements.unlock('max_angle_land');
    if (Math.abs(l.vy) > SAFE_LAND_VY * mods2.safeVyMult * 0.8) this.achievements.unlock('max_vy_land');

    // No-rotation landing
    if (Math.abs(l.angle) < 0.01) this.achievements.unlock('no_rotation_land');

    // Single landing score
    if (landScore >= 2000) this.achievements.unlock('score_single_2000');

    // Score achievements
    if (this.score >= 1000) this.achievements.unlock('score_1000');
    if (this.score >= 5000) this.achievements.unlock('score_5000');
    if (this.score >= 10000) this.achievements.unlock('score_10000');
    if (this.score >= 25000) this.achievements.unlock('score_25000');
    if (this.score >= 50000) this.achievements.unlock('score_50000');
    if (this.score >= 100000) this.achievements.unlock('score_100000');

    // Landing count achievements
    const totalLandings = this.statsManager.stats.totalLandings;
    if (totalLandings >= 10) this.achievements.unlock('landings_10');
    if (totalLandings >= 25) this.achievements.unlock('landings_25');
    if (totalLandings >= 50) this.achievements.unlock('landings_50');
    if (totalLandings >= 100) this.achievements.unlock('landings_100');
    if (totalLandings >= 250) this.achievements.unlock('total_landings_250');

    // Total score achievements
    if (this.statsManager.stats.totalScore >= 100000) this.achievements.unlock('total_score_100k');
    if (this.statsManager.stats.totalScore >= 500000) this.achievements.unlock('total_score_500k');

    // Theme/skin achievements
    if (this.statsManager.stats.themesUsed.length >= 5) this.achievements.unlock('use_all_themes');
    if (this.statsManager.stats.skinsUsed.length >= 5) this.achievements.unlock('use_all_skins');

    // Difficulty achievements
    if (this.difficulty === Difficulty.HARD && perfect && this.currentLevel && Math.abs(this.currentLevel.wind) > 0.3) {
      this.achievements.unlock('hard_perfect');
    }

    // Play time achievements
    if (this.statsManager.stats.totalPlayTimeMs >= 3600000) this.achievements.unlock('play_1_hour');
    if (this.statsManager.stats.totalPlayTimeMs >= 18000000) this.achievements.unlock('play_5_hours');

    // Night owl
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) this.achievements.unlock('night_owl');
    if (hour >= 5 && hour < 7) this.achievements.unlock('early_bird');
    const day = new Date().getDay();
    if (day === 0 || day === 6) this.achievements.unlock('weekend_pilot');

    // Games played achievements
    if (this.statsManager.stats.gamesPlayed >= 10) this.achievements.unlock('games_played_10');
    if (this.statsManager.stats.gamesPlayed >= 50) this.achievements.unlock('games_played_50');

    this.levelCompleteTimer = 2.5;
    this.setState(GameState.LEVEL_COMPLETE);
    this.audio.playLevelComplete();
    this.audio.playLevelWarp();
    this.particles?.emitLevelWarp(l.x, l.y);
    this.autoSave();

    // No-crash streak tracking
    this.noCrashStreak++;
    if (this.noCrashStreak >= 5) this.achievements.unlock('no_crash_5');
    if (this.noCrashStreak >= 10) this.achievements.unlock('no_crash_10');

    // Track which pad was landed on
    const padIdx = this.currentLevel!.pads.findIndex((p) => p.x === padCenterX);
    if (padIdx >= 0) this.padsLandedThisLevel.add(padIdx);
    if (this.padsLandedThisLevel.size >= this.currentLevel!.pads.length && this.currentLevel!.pads.length > 1) {
      this.achievements.unlock('land_all_pads');
    }

    // Moving pad achievements
    const landedPad = this.currentLevel!.pads.find(
      (p) => l.x >= p.x - p.width / 2 && l.x <= p.x + p.width / 2,
    );
    if (landedPad?.moving) {
      this.achievements.unlock('land_moving_pad');
      if (landedPad.multiplier >= 3) this.achievements.unlock('land_moving_3x');
    }

    // Gravity flip mode
    if (this.mode === GameMode.GRAVITY_FLIP) {
      this.gravityFlipped = !this.gravityFlipped;
      this.achievements.unlock('play_gravity_flip');
      if (perfect) this.achievements.unlock('flip_perfect');
    }

    // Daily perfect landing
    if (this.mode === GameMode.DAILY && perfect) {
      this.achievements.unlock('perfect_daily');
    }

    // Slow-mo landing achievement
    if (this.powerUps?.gravityMultiplier !== undefined && this.powerUps.gravityMultiplier < 1) {
      this.achievements.unlock('slow_mo_land');
    }

    // Magnet landing achievement
    if (this.powerUps?.magnetActive) {
      this.achievements.unlock('magnet_land');
    }

    // All power-up types achievement
    if (this.fuelPickups > 0 && this.shieldsUsed > 0 && this.slowMosUsed > 0 &&
        this.scoreBoostsUsed > 0 && this.magnetsUsed > 0 && this.extraLivesCollected > 0) {
      this.achievements.unlock('all_powerup_types');
    }

    // Zero fuel landing
    if (l.fuel <= 0 && !MODE_CONFIGS[this.mode].infiniteFuel) {
      this.achievements.unlock('survive_no_fuel');
    }

    // Landing with active meteors
    if (this.meteors?.enabled) {
      this.achievements.unlock('land_with_meteors');
      if (this.levelsWithMeteors >= 5) this.achievements.unlock('meteor_veteran');
      if (this.levelsWithMeteors >= 10) this.achievements.unlock('meteor_ace');
      if (this.meteorHits === 0 && this.levelsWithMeteors >= 3) {
        this.achievements.unlock('untouchable');
      }
    }

    // Perfect landing count
    if (this.statsManager.stats.perfectLandings >= 10) this.achievements.unlock('perfect_10');
    if (this.statsManager.stats.perfectLandings >= 25) this.achievements.unlock('perfect_25');
    if (this.perfectCombo >= 10) this.achievements.unlock('combo_10');

    // Zen mode landings
    if (this.mode === GameMode.ZEN) {
      this.zenLandings++;
      if (this.zenLandings >= 100) this.achievements.unlock('zen_100_lands');
    }

    // Endless mode level achievements
    if (this.mode === GameMode.ENDLESS) {
      if (this.level >= 10) this.achievements.unlock('endless_10');
      if (this.level >= 20) this.achievements.unlock('endless_20');
    }
  }

  private handleCrash(): void {
    const l = this.lander;

    // Check shield power-up
    if (this.powerUps?.consumeShield()) {
      // Shield absorbed the crash!
      this.audio.playShieldBreak();
      this.particles?.emitExplosion(l.x, l.y, 20);
      this.shieldSavedThisGame = true;
      this.shieldSavesThisGame++;
      this.achievements.unlock('shield_save');
      if (this.shieldSavesThisGame >= 3) this.achievements.unlock('shield_3_saves');

      // Bounce lander up
      l.vy = Math.abs(l.vy) * 0.5 + 0.5;
      l.vx *= 0.3;
      l.angle *= 0.3;
      l.angularVel *= 0.3;
      return;
    }

    l.alive = false;
    l.thrusting = false;

    this.audio.stopThrust();
    this.audio.playCrash();

    // Explosion particles
    this.particles?.emitExplosion(l.x, l.y, 40);

    // Stats
    this.statsManager.recordCrash();
    this.perfectCombo = 0;
    this.noCrashStreak = 0;

    // Achievements
    this.achievements.unlock('first_crash');
    const totalCrashes = this.statsManager.stats.totalCrashes;
    if (totalCrashes >= 10) this.achievements.unlock('crash_10');
    if (totalCrashes >= 50) this.achievements.unlock('crash_50');
    if (totalCrashes >= 100) this.achievements.unlock('crash_100');
    if (totalCrashes >= 200) this.achievements.unlock('crash_200');

    // No-fuel crash
    if (l.fuel <= 0) this.achievements.unlock('no_fuel_crash');

    const speed = Math.sqrt(l.vx * l.vx + l.vy * l.vy);
    if (speed > MAX_VELOCITY * 0.9) this.achievements.unlock('high_speed_crash');
    if (Math.abs(l.angle) > Math.PI * 0.4) this.achievements.unlock('sideways_crash');
    if (l.y > 6) this.achievements.unlock('high_altitude_crash');

    // Lose life
    if (this.mode !== GameMode.ZEN) {
      this.lives--;
    }

    this.crashTimer = 2.0;

    if (this.lives <= 0 && this.mode !== GameMode.ZEN) {
      this.setState(GameState.CRASHED);
    } else {
      this.setState(GameState.CRASHED);
    }
  }

  private handleMeteorHit(): void {
    const l = this.lander;

    // Shield can absorb meteor hit too
    if (this.powerUps?.consumeShield()) {
      this.audio.playShieldBreak();
      this.particles?.emitExplosion(l.x, l.y, 25);
      this.shieldSavedThisGame = true;
      this.shieldSavesThisGame++;
      this.achievements.unlock('shield_save');
      this.achievements.unlock('shield_meteor_block');
      if (this.shieldSavesThisGame >= 3) this.achievements.unlock('shield_3_saves');

      // Knock lander away from impact
      l.vy += 1.5;
      l.vx += (Math.random() - 0.5) * 2;
      l.angularVel += (Math.random() - 0.5) * 3;
      return;
    }

    l.alive = false;
    l.thrusting = false;

    this.audio.stopThrust();
    this.audio.playCrash();

    // Big meteor explosion particles
    this.particles?.emitExplosion(l.x, l.y, 50);

    this.statsManager.recordCrash();
    this.perfectCombo = 0;
    this.noCrashStreak = 0;

    this.achievements.unlock('meteor_hit');

    if (this.mode !== GameMode.ZEN) {
      this.lives--;
    }

    this.crashTimer = 2.0;
    this.setState(GameState.CRASHED);
  }

  updateTimers(dt: number): void {
    if (this.state === GameState.READY) {
      this.readyTimer -= dt;
      if (this.readyTimer <= 0) {
        this.setState(GameState.PLAYING);
        this.audio.startAmbient();
      }
    }

    if (this.state === GameState.CRASHED) {
      this.crashTimer -= dt;
      if (this.crashTimer <= 0) {
        if (this.lives <= 0 && this.mode !== GameMode.ZEN) {
          this.endGame();
        } else {
          this.retryCountThisLevel++;
          if (this.retryCountThisLevel >= 5) this.achievements.unlock('retry_master');
          this.statsManager.recordRetry();
          this.loadLevel();
        }
      }
    }

    if (this.state === GameState.LEVEL_COMPLETE) {
      this.levelCompleteTimer -= dt;
      if (this.levelCompleteTimer <= 0) {
        this.advanceLevel();
      }
    }
  }

  private advanceLevel(): void {
    this.level++;
    this.retryCountThisLevel = 0;

    // Level achievements
    if (this.level >= 5) this.achievements.unlock('level_5');
    if (this.level >= 10) this.achievements.unlock('level_10');
    if (this.level >= 15) this.achievements.unlock('level_15');
    if (this.level >= 20) this.achievements.unlock('level_20');
    if (this.level >= 25) this.achievements.unlock('level_25');
    if (this.level >= 30) this.achievements.unlock('level_30');

    // Gravity flip level achievements
    if (this.mode === GameMode.GRAVITY_FLIP) {
      if (this.level >= 5) this.achievements.unlock('flip_5_levels');
      if (this.level >= 10) this.achievements.unlock('flip_10_levels');
    }

    // Meteor Storm level achievements
    if (this.mode === GameMode.METEOR_STORM) {
      if (this.level >= 5) this.achievements.unlock('storm_level_5');
      if (this.level >= 10) this.achievements.unlock('storm_level_10');
    }

    // Classic completion
    if (this.mode === GameMode.CLASSIC && this.level > 10) {
      this.achievements.unlock('complete_classic');
      if (this.difficulty === Difficulty.HARD) this.achievements.unlock('complete_classic_hard');
      if (this.difficulty === Difficulty.EASY) this.achievements.unlock('easy_win');
      if (this.difficulty === Difficulty.NORMAL) this.achievements.unlock('normal_win');
      if (this.difficulty === Difficulty.HARD) this.achievements.unlock('hard_win');
      if (this.noCrashStreak >= 10) this.achievements.unlock('no_crash_classic');
      if (this.totalGameTime < 300) this.achievements.unlock('speed_run_classic');
      this.endGame();
      return;
    }

    // Daily challenge complete
    if (this.mode === GameMode.DAILY) {
      this.statsManager.recordDailyComplete();
      this.achievements.unlock('play_daily');
      const dc = this.statsManager.stats.dailyChallengesCompleted;
      if (dc >= 3) this.achievements.unlock('daily_streak_3');
      if (dc >= 7) this.achievements.unlock('daily_streak_7');
      if (dc >= 14) this.achievements.unlock('daily_14');
      if (dc >= 30) this.achievements.unlock('daily_30');
      this.endGame();
      return;
    }

    this.loadLevel();
    this.autoSave();
  }

  private endGame(): void {
    this.statsManager.recordPlayTime(this.totalGameTime * 1000);
    this.audio.stopAmbient();

    // Add to leaderboard
    this.leaderboard.addEntry({
      score: this.score,
      level: this.level,
      mode: this.mode,
      difficulty: this.difficulty,
      date: new Date().toISOString().slice(0, 10),
    });

    if (this.lives <= 0) {
      this.audio.playGameOver();
    } else {
      this.audio.playLevelComplete();
    }

    this.setState(GameState.GAME_OVER);
    clearSave(); // Clear auto-save on game end
  }

  // Auto-save for resume capability
  autoSave(): void {
    if (this.state === GameState.MENU || this.state === GameState.GAME_OVER) return;
    const data: SaveState = {
      mode: this.mode,
      difficulty: this.difficulty,
      level: this.level,
      score: this.score,
      lives: this.lives,
      theme: this.theme,
      skin: this.skin,
      totalGameTime: this.totalGameTime,
      perfectCombo: this.perfectCombo,
      noCrashStreak: this.noCrashStreak,
      totalPowerUpsCollected: this.totalPowerUpsCollected,
      timestamp: Date.now(),
    };
    saveGame(data);
  }

  // Resume from saved state
  resumeGame(save: SaveState): void {
    this.mode = save.mode as GameMode;
    this.difficulty = save.difficulty as Difficulty;
    this.level = save.level;
    this.score = save.score;
    this.lives = save.lives;
    this.theme = save.theme as ArenaTheme;
    this.skin = save.skin as LanderSkin;
    this.totalGameTime = save.totalGameTime;
    this.perfectCombo = save.perfectCombo;
    this.noCrashStreak = save.noCrashStreak;
    this.totalPowerUpsCollected = save.totalPowerUpsCollected;
    this.retryCountThisLevel = 0;
    this.gravityFlipped = false;
    this.padsLandedThisLevel = new Set();
    this.powerUps?.resetActive();

    this.statsManager.recordGameStart(this.mode);
    this.statsManager.recordTheme(this.theme);
    this.statsManager.recordSkin(this.skin);

    this.loadLevel();
    clearSave();
  }

  // Star rating for game over (0-3 stars)
  getStarRating(): number {
    let stars = 0;
    // Star 1: Reached level 3+ or scored 500+
    if (this.level >= 3 || this.score >= 500) stars++;
    // Star 2: Reached level 6+ or scored 3000+ or had a perfect landing
    if (this.level >= 6 || this.score >= 3000 || this.statsManager.stats.perfectLandings > 0) stars++;
    // Star 3: Completed classic (level 11) or scored 10000+ or 3+ perfect combo
    if (this.level > 10 || this.score >= 10000 || this.perfectCombo >= 3) stars++;
    return stars;
  }

  togglePause(): void {
    if (this.state === GameState.PLAYING) {
      this.setState(GameState.PAUSED);
      this.audio.stopThrust();
      this.audio.stopAmbient();
    } else if (this.state === GameState.PAUSED) {
      this.setState(GameState.PLAYING);
      this.audio.startAmbient();
    }
  }

  returnToMenu(): void {
    this.audio.stopThrust();
    this.audio.stopAmbient();
    this.setState(GameState.MENU);
  }
}
