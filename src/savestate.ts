// === Neon Lander VR -- Save State System ===

const SAVE_KEY = 'neon-lander-save';

export interface SaveState {
  mode: string;
  difficulty: string;
  level: number;
  score: number;
  lives: number;
  theme: string;
  skin: string;
  totalGameTime: number;
  perfectCombo: number;
  noCrashStreak: number;
  totalPowerUpsCollected: number;
  timestamp: number;
}

export function saveGame(data: SaveState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded or private mode */ }
}

export function loadGame(): SaveState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveState;
    // Expire saves older than 24 hours
    if (Date.now() - parsed.timestamp > 86400000) {
      clearSave();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* ignore */ }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}
