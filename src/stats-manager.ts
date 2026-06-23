// === Neon Lander VR -- Stats Manager ===

const STORAGE_KEY = 'neon-lander-stats';

export interface GameStats {
  gamesPlayed: number;
  totalLandings: number;
  totalCrashes: number;
  perfectLandings: number;
  totalScore: number;
  bestScore: number;
  bestLevel: number;
  totalFuelUsed: number;
  totalPlayTimeMs: number;
  perfectStreak: number;
  bestPerfectStreak: number;
  fastestLanding: number; // seconds
  dailyChallengesCompleted: number;
  modesPlayed: string[];
  themesUsed: string[];
  skinsUsed: string[];
  retryCount: number;
}

function defaultStats(): GameStats {
  return {
    gamesPlayed: 0,
    totalLandings: 0,
    totalCrashes: 0,
    perfectLandings: 0,
    totalScore: 0,
    bestScore: 0,
    bestLevel: 0,
    totalFuelUsed: 0,
    totalPlayTimeMs: 0,
    perfectStreak: 0,
    bestPerfectStreak: 0,
    fastestLanding: Infinity,
    dailyChallengesCompleted: 0,
    modesPlayed: [],
    themesUsed: [],
    skinsUsed: [],
    retryCount: 0,
  };
}

export class StatsManager {
  stats: GameStats;

  constructor() {
    this.stats = defaultStats();
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.stats = { ...defaultStats(), ...data };
      }
    } catch { /* ignore */ }
  }

  save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats)); } catch { /* ignore */ }
  }

  recordLanding(score: number, level: number, fuel: number, maxFuel: number, timeSec: number, perfect: boolean): void {
    this.stats.totalLandings++;
    this.stats.totalScore += score;
    this.stats.totalFuelUsed += maxFuel - fuel;
    if (score > this.stats.bestScore) this.stats.bestScore = score;
    if (level > this.stats.bestLevel) this.stats.bestLevel = level;
    if (timeSec < this.stats.fastestLanding) this.stats.fastestLanding = timeSec;
    if (perfect) {
      this.stats.perfectLandings++;
      this.stats.perfectStreak++;
      if (this.stats.perfectStreak > this.stats.bestPerfectStreak) {
        this.stats.bestPerfectStreak = this.stats.perfectStreak;
      }
    } else {
      this.stats.perfectStreak = 0;
    }
    this.save();
  }

  recordCrash(): void {
    this.stats.totalCrashes++;
    this.stats.perfectStreak = 0;
    this.save();
  }

  recordGameStart(mode: string): void {
    this.stats.gamesPlayed++;
    if (!this.stats.modesPlayed.includes(mode)) {
      this.stats.modesPlayed.push(mode);
    }
    this.save();
  }

  recordTheme(theme: string): void {
    if (!this.stats.themesUsed.includes(theme)) {
      this.stats.themesUsed.push(theme);
      this.save();
    }
  }

  recordSkin(skin: string): void {
    if (!this.stats.skinsUsed.includes(skin)) {
      this.stats.skinsUsed.push(skin);
      this.save();
    }
  }

  recordRetry(): void {
    this.stats.retryCount++;
    this.save();
  }

  recordPlayTime(ms: number): void {
    this.stats.totalPlayTimeMs += ms;
    this.save();
  }

  recordDailyComplete(): void {
    this.stats.dailyChallengesCompleted++;
    this.save();
  }
}
