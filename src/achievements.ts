// === Neon Lander VR -- Achievements ===

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENT_DEFS: { id: string; title: string; description: string; category: string }[] = [
  // Landing achievements
  { id: 'first_landing', title: 'Touchdown', description: 'Complete your first landing', category: 'Landing' },
  { id: 'perfect_landing', title: 'Feather Touch', description: 'Land with velocity under 0.3', category: 'Landing' },
  { id: 'center_landing', title: 'Bullseye', description: 'Land within 5% of pad center', category: 'Landing' },
  { id: 'fast_landing', title: 'Speed Demon', description: 'Land in under 10 seconds', category: 'Landing' },
  { id: 'slow_landing', title: 'Patience', description: 'Take over 60 seconds to land', category: 'Landing' },
  { id: 'fuel_saver', title: 'Fuel Miser', description: 'Land with over 80% fuel remaining', category: 'Landing' },
  { id: 'fumes_landing', title: 'On Fumes', description: 'Land with less than 5% fuel', category: 'Landing' },
  { id: 'narrow_pad', title: 'Threading the Needle', description: 'Land on a 3x multiplier pad', category: 'Landing' },
  { id: 'no_thrust_land', title: 'Free Fall Pro', description: 'Land without thrusting in last 2 seconds', category: 'Landing' },
  { id: 'upside_hover', title: 'Gravity Defier', description: 'Hover inverted for 3 seconds without crashing', category: 'Landing' },
  // Level achievements
  { id: 'level_5', title: 'Cadet', description: 'Reach level 5', category: 'Progression' },
  { id: 'level_10', title: 'Pilot', description: 'Reach level 10', category: 'Progression' },
  { id: 'level_15', title: 'Commander', description: 'Reach level 15', category: 'Progression' },
  { id: 'level_20', title: 'Captain', description: 'Reach level 20', category: 'Progression' },
  { id: 'level_25', title: 'Admiral', description: 'Reach level 25', category: 'Progression' },
  { id: 'complete_classic', title: 'Mission Complete', description: 'Complete all 10 Classic levels', category: 'Progression' },
  { id: 'complete_classic_hard', title: 'Ace Pilot', description: 'Complete Classic on Hard', category: 'Progression' },
  // Score achievements
  { id: 'score_1000', title: 'Rookie Score', description: 'Score 1,000 points', category: 'Score' },
  { id: 'score_5000', title: 'Veteran Score', description: 'Score 5,000 points', category: 'Score' },
  { id: 'score_10000', title: 'Expert Score', description: 'Score 10,000 points', category: 'Score' },
  { id: 'score_25000', title: 'Master Score', description: 'Score 25,000 points', category: 'Score' },
  { id: 'score_50000', title: 'Legend Score', description: 'Score 50,000 points', category: 'Score' },
  { id: 'combo_3', title: 'Hat Trick', description: 'Land 3 perfect landings in a row', category: 'Score' },
  { id: 'combo_5', title: 'Streak Master', description: 'Land 5 perfect landings in a row', category: 'Score' },
  // Mode achievements
  { id: 'play_time_attack', title: 'Against the Clock', description: 'Play Time Attack mode', category: 'Modes' },
  { id: 'play_precision', title: 'Precision Pilot', description: 'Play Precision mode', category: 'Modes' },
  { id: 'play_endless', title: 'Endurance Test', description: 'Play Endless mode', category: 'Modes' },
  { id: 'play_zen', title: 'Inner Peace', description: 'Play Zen mode', category: 'Modes' },
  { id: 'play_daily', title: 'Daily Challenger', description: 'Complete a Daily Challenge', category: 'Modes' },
  { id: 'all_modes', title: 'Well Rounded', description: 'Play all game modes', category: 'Modes' },
  { id: 'daily_streak_3', title: 'Dedicated', description: 'Complete 3 daily challenges', category: 'Modes' },
  { id: 'daily_streak_7', title: 'Weekly Regular', description: 'Complete 7 daily challenges', category: 'Modes' },
  // Crash achievements
  { id: 'first_crash', title: 'Houston, We Have a Problem', description: 'Crash for the first time', category: 'Crashes' },
  { id: 'crash_10', title: 'Learning Curve', description: 'Crash 10 times', category: 'Crashes' },
  { id: 'crash_50', title: 'Persistent', description: 'Crash 50 times', category: 'Crashes' },
  { id: 'crash_100', title: 'Indestructible Spirit', description: 'Crash 100 times', category: 'Crashes' },
  { id: 'high_speed_crash', title: 'Meteor Impact', description: 'Crash at maximum velocity', category: 'Crashes' },
  { id: 'sideways_crash', title: 'Sidewinder', description: 'Crash while completely sideways', category: 'Crashes' },
  // Wind achievements
  { id: 'land_in_wind', title: 'Crosswind Landing', description: 'Land in wind over 0.5', category: 'Challenge' },
  { id: 'land_strong_wind', title: 'Storm Rider', description: 'Land in wind over 1.0', category: 'Challenge' },
  { id: 'land_all_pads', title: 'Pad Collector', description: 'Land on every pad in a level', category: 'Challenge' },
  // Career achievements
  { id: 'landings_10', title: 'Regular Lander', description: 'Complete 10 total landings', category: 'Career' },
  { id: 'landings_25', title: 'Experienced', description: 'Complete 25 total landings', category: 'Career' },
  { id: 'landings_50', title: 'Seasoned Pro', description: 'Complete 50 total landings', category: 'Career' },
  { id: 'landings_100', title: 'Centurion', description: 'Complete 100 total landings', category: 'Career' },
  { id: 'total_score_100k', title: 'Lifetime Achiever', description: 'Accumulate 100,000 total score', category: 'Career' },
  { id: 'games_played_10', title: 'Frequent Flyer', description: 'Play 10 games', category: 'Career' },
  { id: 'games_played_50', title: 'Veteran Player', description: 'Play 50 games', category: 'Career' },
  // Theme/skin achievements
  { id: 'use_all_themes', title: 'Space Tourist', description: 'Play on all arena themes', category: 'Customization' },
  { id: 'use_all_skins', title: 'Fleet Commander', description: 'Use all lander skins', category: 'Customization' },
  // Difficulty achievements
  { id: 'easy_win', title: 'Gentle Landing', description: 'Complete a game on Easy', category: 'Difficulty' },
  { id: 'normal_win', title: 'Standard Mission', description: 'Complete a game on Normal', category: 'Difficulty' },
  { id: 'hard_win', title: 'Test Pilot', description: 'Complete a game on Hard', category: 'Difficulty' },
  { id: 'hard_perfect', title: 'Untouchable', description: 'Perfect landing on Hard with wind', category: 'Difficulty' },
  // Misc
  { id: 'play_1_hour', title: 'Dedicated Pilot', description: 'Play for 1 hour total', category: 'Misc' },
  { id: 'night_owl', title: 'Night Owl', description: 'Play between midnight and 4 AM', category: 'Misc' },
  { id: 'retry_master', title: 'Never Give Up', description: 'Retry a level 5 times', category: 'Misc' },
];

const STORAGE_KEY = 'neon-lander-achievements';

export class AchievementManager {
  achievements: Map<string, Achievement> = new Map();
  onUnlock: ((a: Achievement) => void) | null = null;

  constructor() {
    this.loadAll();
  }

  private loadAll(): void {
    for (const def of ACHIEVEMENT_DEFS) {
      this.achievements.set(def.id, {
        ...def,
        unlocked: false,
      });
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as Record<string, number>;
        for (const [id, ts] of Object.entries(data)) {
          const a = this.achievements.get(id);
          if (a) {
            a.unlocked = true;
            a.unlockedAt = ts;
          }
        }
      }
    } catch { /* ignore */ }
  }

  private save(): void {
    const data: Record<string, number> = {};
    for (const [id, a] of this.achievements) {
      if (a.unlocked && a.unlockedAt) {
        data[id] = a.unlockedAt;
      }
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }

  unlock(id: string): boolean {
    const a = this.achievements.get(id);
    if (!a || a.unlocked) return false;
    a.unlocked = true;
    a.unlockedAt = Date.now();
    this.save();
    this.onUnlock?.(a);
    return true;
  }

  isUnlocked(id: string): boolean {
    return this.achievements.get(id)?.unlocked ?? false;
  }

  getAll(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getUnlocked(): Achievement[] {
    return this.getAll().filter((a) => a.unlocked);
  }

  getByCategory(category: string): Achievement[] {
    return this.getAll().filter((a) => a.category === category);
  }

  get totalCount(): number { return this.achievements.size; }
  get unlockedCount(): number { return this.getUnlocked().length; }
}
