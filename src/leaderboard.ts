// === Neon Lander VR -- Leaderboard ===

const STORAGE_KEY = 'neon-lander-leaderboard';

export interface LeaderboardEntry {
  score: number;
  level: number;
  mode: string;
  difficulty: string;
  date: string;
}

export class LeaderboardManager {
  entries: LeaderboardEntry[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) this.entries = JSON.parse(saved);
    } catch { /* ignore */ }
  }

  private save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries)); } catch { /* ignore */ }
  }

  addEntry(entry: LeaderboardEntry): number {
    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    if (this.entries.length > 20) this.entries.length = 20;
    this.save();
    return this.entries.indexOf(entry) + 1;
  }

  getTop(count: number = 10): LeaderboardEntry[] {
    return this.entries.slice(0, count);
  }

  getBestScore(): number {
    return this.entries.length > 0 ? this.entries[0].score : 0;
  }
}
