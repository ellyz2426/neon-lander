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

  // Timers
  readyTimer = 0;
  crashTimer = 0;
  levelCompleteTimer = 0;
  retryCountThisLevel = 0;
  lastThrustTime = 0;
  invertedTimer = 0;
  perfectCombo = 0;

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

    this.statsManager.recordGameStart(mode);
    this.statsManager.recordTheme(this.theme);
    this.statsManager.recordSkin(this.skin);

    // Mode-specific achievement tracking
    if (mode === GameMode.TIME_ATTACK) this.achievements.unlock('play_time_attack');
    if (mode === GameMode.PRECISION) this.achievements.unlock('play_precision');
    if (mode === GameMode.ENDLESS) this.achievements.unlock('play_endless');
    if (mode === GameMode.ZEN) this.achievements.unlock('play_zen');

    // Check if all modes played
    if (this.statsManager.stats.modesPlayed.length >= 6) {
      this.achievements.unlock('all_modes');
    }

    this.loadLevel();
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

    this.setState(GameState.READY);
    this.onLevelChange?.();
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

    // Rotation
    if (this.rotateLeftInput) l.angularVel -= ROTATION_SPEED * dt;
    if (this.rotateRightInput) l.angularVel += ROTATION_SPEED * dt;
    l.angularVel *= DRAG;
    l.angle += l.angularVel * dt;

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
      const thrustX = Math.sin(l.angle) * THRUST_POWER * dt;
      const thrustY = Math.cos(l.angle) * THRUST_POWER * dt;
      l.vx -= thrustX;
      l.vy += thrustY;

      if (!modeConfig.infiniteFuel) {
        l.fuel -= 20 * dt;
        if (l.fuel < 0) l.fuel = 0;
      }

      this.lastThrustTime = this.levelElapsedTime;
      this.audio.updateThrustPitch(l.fuel, this.currentLevel.fuel);
    }

    // Gravity
    l.vy -= GRAVITY * this.currentLevel.gravity * dt;

    // Wind
    l.vx += this.currentLevel.wind * dt;

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
      const safeVy = SAFE_LAND_VY * mods.safeVyMult;
      const safeVx = SAFE_LAND_VX;
      const safeAngle = SAFE_LAND_ANGLE * mods.safeAngleMult;

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

  private handleLanding(multiplier: number, padCenterX: number): void {
    const l = this.lander;
    l.alive = false;
    l.vy = 0;
    l.vx = 0;
    l.thrusting = false;

    this.audio.stopThrust();
    this.audio.playLand();

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
    if (landingTime > 60) this.achievements.unlock('slow_landing');
    if (fuelPercent > 0.8) this.achievements.unlock('fuel_saver');
    if (fuelPercent < 0.05 && !modeConfig.infiniteFuel) this.achievements.unlock('fumes_landing');
    if (multiplier >= 3) this.achievements.unlock('narrow_pad');
    if (this.levelElapsedTime - this.lastThrustTime > 2) this.achievements.unlock('no_thrust_land');
    if (this.currentLevel && Math.abs(this.currentLevel.wind) > 0.5) this.achievements.unlock('land_in_wind');
    if (this.currentLevel && Math.abs(this.currentLevel.wind) > 1.0) this.achievements.unlock('land_strong_wind');

    // Score achievements
    if (this.score >= 1000) this.achievements.unlock('score_1000');
    if (this.score >= 5000) this.achievements.unlock('score_5000');
    if (this.score >= 10000) this.achievements.unlock('score_10000');
    if (this.score >= 25000) this.achievements.unlock('score_25000');
    if (this.score >= 50000) this.achievements.unlock('score_50000');

    // Landing count achievements
    const totalLandings = this.statsManager.stats.totalLandings;
    if (totalLandings >= 10) this.achievements.unlock('landings_10');
    if (totalLandings >= 25) this.achievements.unlock('landings_25');
    if (totalLandings >= 50) this.achievements.unlock('landings_50');
    if (totalLandings >= 100) this.achievements.unlock('landings_100');

    // Total score achievements
    if (this.statsManager.stats.totalScore >= 100000) this.achievements.unlock('total_score_100k');

    // Theme/skin achievements
    if (this.statsManager.stats.themesUsed.length >= 5) this.achievements.unlock('use_all_themes');
    if (this.statsManager.stats.skinsUsed.length >= 5) this.achievements.unlock('use_all_skins');

    // Difficulty achievements
    if (this.difficulty === Difficulty.HARD && perfect && this.currentLevel && Math.abs(this.currentLevel.wind) > 0.3) {
      this.achievements.unlock('hard_perfect');
    }

    // Play time achievements
    if (this.statsManager.stats.totalPlayTimeMs >= 3600000) this.achievements.unlock('play_1_hour');

    // Night owl
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) this.achievements.unlock('night_owl');

    // Games played achievements
    if (this.statsManager.stats.gamesPlayed >= 10) this.achievements.unlock('games_played_10');
    if (this.statsManager.stats.gamesPlayed >= 50) this.achievements.unlock('games_played_50');

    this.levelCompleteTimer = 2.5;
    this.setState(GameState.LEVEL_COMPLETE);
    this.audio.playLevelComplete();
  }

  private handleCrash(): void {
    const l = this.lander;
    l.alive = false;
    l.thrusting = false;

    this.audio.stopThrust();
    this.audio.playCrash();

    // Explosion particles
    this.particles?.emitExplosion(l.x, l.y, 40);

    // Stats
    this.statsManager.recordCrash();
    this.perfectCombo = 0;

    // Achievements
    this.achievements.unlock('first_crash');
    const totalCrashes = this.statsManager.stats.totalCrashes;
    if (totalCrashes >= 10) this.achievements.unlock('crash_10');
    if (totalCrashes >= 50) this.achievements.unlock('crash_50');
    if (totalCrashes >= 100) this.achievements.unlock('crash_100');

    const speed = Math.sqrt(l.vx * l.vx + l.vy * l.vy);
    if (speed > MAX_VELOCITY * 0.9) this.achievements.unlock('high_speed_crash');
    if (Math.abs(l.angle) > Math.PI * 0.4) this.achievements.unlock('sideways_crash');

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

    // Classic completion
    if (this.mode === GameMode.CLASSIC && this.level > 10) {
      this.achievements.unlock('complete_classic');
      if (this.difficulty === Difficulty.HARD) this.achievements.unlock('complete_classic_hard');
      if (this.difficulty === Difficulty.EASY) this.achievements.unlock('easy_win');
      if (this.difficulty === Difficulty.NORMAL) this.achievements.unlock('normal_win');
      if (this.difficulty === Difficulty.HARD) this.achievements.unlock('hard_win');
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
      this.endGame();
      return;
    }

    this.loadLevel();
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
