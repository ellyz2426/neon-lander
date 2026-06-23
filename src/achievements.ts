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
  // Power-up achievements
  { id: 'first_powerup', title: 'Power Surge', description: 'Collect your first power-up', category: 'Power-ups' },
  { id: 'powerup_10', title: 'Collector', description: 'Collect 10 power-ups', category: 'Power-ups' },
  { id: 'powerup_25', title: 'Power Hungry', description: 'Collect 25 power-ups', category: 'Power-ups' },
  { id: 'fuel_hoarder', title: 'Fuel Hoarder', description: 'Collect 5 fuel power-ups', category: 'Power-ups' },
  { id: 'shield_save', title: 'Guardian Angel', description: 'Survive a crash with a shield', category: 'Power-ups' },
  { id: 'boost_collector', title: 'Score Hunter', description: 'Use 3 score boost power-ups', category: 'Power-ups' },
  { id: 'boosted_landing', title: 'Double Down', description: 'Land with 2x score active', category: 'Power-ups' },
  // Speed records
  { id: 'land_under_5s', title: 'Lightning Strike', description: 'Land in under 5 seconds', category: 'Speed' },
  { id: 'land_under_3s', title: 'Instant Descent', description: 'Land in under 3 seconds', category: 'Speed' },
  { id: 'speed_demon_10', title: 'Speed Run 10', description: 'Complete 10 levels in under 5 min total', category: 'Speed' },
  // Precision records
  { id: 'no_rotation_land', title: 'Dead Stick', description: 'Land without rotating at all', category: 'Precision' },
  { id: 'min_fuel_used', title: 'Efficiency Expert', description: 'Use less than 10% fuel on a landing', category: 'Precision' },
  { id: 'zero_vx_landing', title: 'Straight Down', description: 'Land with near-zero horizontal velocity', category: 'Precision' },
  // Endurance
  { id: 'endless_10', title: 'Endurance Runner', description: 'Reach level 10 in Endless mode', category: 'Endurance' },
  { id: 'endless_20', title: 'Marathon Pilot', description: 'Reach level 20 in Endless mode', category: 'Endurance' },
  { id: 'no_crash_classic', title: 'Flawless', description: 'Complete Classic without crashing', category: 'Endurance' },
  { id: 'no_crash_5', title: 'Clean Streak', description: 'Land 5 levels without crashing', category: 'Endurance' },
  { id: 'no_crash_10', title: 'Untouchable Pilot', description: 'Land 10 levels without crashing', category: 'Endurance' },
  // Extreme
  { id: 'land_min_fuel', title: 'Clutch Landing', description: 'Land with less than 1% fuel', category: 'Extreme' },
  { id: 'max_angle_land', title: 'Tilt Master', description: 'Land at near-max safe angle', category: 'Extreme' },
  { id: 'max_vy_land', title: 'Hard Landing', description: 'Land at near-max safe velocity', category: 'Extreme' },
  { id: 'high_altitude_crash', title: 'Space Debris', description: 'Crash above altitude 6', category: 'Extreme' },
  { id: 'full_360', title: 'Full Spin', description: 'Complete a full 360 rotation', category: 'Extreme' },
  // Hidden / secret
  { id: 'zen_100_lands', title: 'Inner Master', description: 'Land 100 times in Zen mode', category: 'Hidden' },
  { id: 'score_single_2000', title: 'Jackpot', description: 'Score 2000+ on a single landing', category: 'Hidden' },
  // Gravity Flip
  { id: 'play_gravity_flip', title: 'Upside Down', description: 'Land in Gravity Flip mode', category: 'Modes' },
  { id: 'flip_5_levels', title: 'Flip Master', description: 'Complete 5 flipped levels', category: 'Modes' },
  { id: 'flip_10_levels', title: 'Gravity Bender', description: 'Complete 10 flipped levels', category: 'Modes' },
  // Multi-pad
  { id: 'land_3_pads_game', title: 'Multi-Pad Master', description: 'Land on 3 different pads in one game', category: 'Challenge' },
  // Score milestones
  { id: 'score_100000', title: 'Legendary Score', description: 'Score 100,000 points in one game', category: 'Score' },
  { id: 'total_score_500k', title: 'Half Million', description: 'Accumulate 500,000 total score', category: 'Career' },
  { id: 'total_landings_250', title: 'Quarter Thousand', description: 'Complete 250 total landings', category: 'Career' },
  // Misc new
  { id: 'play_5_hours', title: 'Space Veteran', description: 'Play for 5 hours total', category: 'Misc' },
  { id: 'weekend_pilot', title: 'Weekend Pilot', description: 'Play on a Saturday or Sunday', category: 'Misc' },
  { id: 'early_bird', title: 'Early Bird', description: 'Play between 5 AM and 7 AM', category: 'Misc' },
  { id: 'speed_run_classic', title: 'Speed Runner', description: 'Complete Classic in under 5 minutes', category: 'Speed' },
  // Tutorial
  { id: 'tutorial_complete', title: 'Graduate', description: 'Complete the tutorial', category: 'Misc' },
  // Lander mastery
  { id: 'hover_10s', title: 'Hover Master', description: 'Hover at altitude 3+ for 10 seconds', category: 'Extreme' },
  { id: 'no_fuel_crash', title: 'Empty Tank', description: 'Run out of fuel and crash', category: 'Crashes' },
  { id: 'survive_no_fuel', title: 'Glider', description: 'Land successfully with 0 fuel', category: 'Extreme' },
  { id: 'land_all_themes', title: 'Cosmic Explorer', description: 'Land on every theme', category: 'Customization' },
  { id: 'land_all_skins', title: 'Fashion Pilot', description: 'Land with every skin', category: 'Customization' },
  { id: 'level_30', title: 'Commander in Chief', description: 'Reach level 30', category: 'Progression' },
  { id: 'crash_200', title: 'Phoenix', description: 'Crash 200 times', category: 'Crashes' },
  { id: 'perfect_10', title: 'Perfect Ten', description: 'Land 10 perfect landings total', category: 'Score' },
  { id: 'perfect_25', title: 'Precision Legend', description: 'Land 25 perfect landings total', category: 'Score' },
  { id: 'combo_10', title: 'Unstoppable', description: 'Land 10 perfect landings in a row', category: 'Score' },
  { id: 'daily_14', title: 'Two Week Streak', description: 'Complete 14 daily challenges', category: 'Modes' },
  { id: 'daily_30', title: 'Monthly Regular', description: 'Complete 30 daily challenges', category: 'Modes' },
  { id: 'powerup_50', title: 'Power Addict', description: 'Collect 50 power-ups', category: 'Power-ups' },
  { id: 'shield_3_saves', title: 'Lucky Charm', description: 'Shield saves 3 times in one game', category: 'Power-ups' },
  { id: 'slow_mo_land', title: 'Bullet Time', description: 'Land while slow-mo is active', category: 'Power-ups' },
  // Magnet & Extra Life
  { id: 'magnet_collect', title: 'Attraction', description: 'Collect a magnet power-up', category: 'Power-ups' },
  { id: 'magnet_land', title: 'Guided Landing', description: 'Land while magnet is active', category: 'Power-ups' },
  { id: 'extra_life_collect', title: 'Second Chance', description: 'Collect an extra life', category: 'Power-ups' },
  { id: 'all_powerup_types', title: 'Full Arsenal', description: 'Collect all 6 power-up types', category: 'Power-ups' },
  // Meteor achievements
  { id: 'meteor_hit', title: 'Space Rock', description: 'Get hit by a meteor', category: 'Meteors' },
  { id: 'meteor_dodger_10', title: 'Meteor Dodger', description: 'Narrowly dodge 10 meteors', category: 'Meteors' },
  { id: 'meteor_dodger_50', title: 'Asteroid Slalom', description: 'Narrowly dodge 50 meteors', category: 'Meteors' },
  { id: 'land_with_meteors', title: 'Danger Zone', description: 'Land while meteors are falling', category: 'Meteors' },
  { id: 'meteor_veteran', title: 'Meteor Veteran', description: 'Survive 5 levels with meteors', category: 'Meteors' },
  { id: 'meteor_ace', title: 'Meteor Ace', description: 'Survive 10 levels with meteors', category: 'Meteors' },
  { id: 'untouchable', title: 'Ghost Ship', description: 'Clear 3+ meteor levels without getting hit', category: 'Meteors' },
  { id: 'shield_meteor_block', title: 'Force Field', description: 'Block a meteor with a shield', category: 'Meteors' },
  // Additional mastery achievements
  { id: 'triple_narrow', title: 'Triple Needle', description: 'Land on 3x pads three times', category: 'Landing' },
  { id: 'zero_damage_hard', title: 'Invincible', description: 'Complete 5 Hard levels without crashing', category: 'Difficulty' },
  { id: 'score_150000', title: 'Mythic Score', description: 'Score 150,000 points in one game', category: 'Score' },
  { id: 'total_score_1m', title: 'Millionaire', description: 'Accumulate 1,000,000 total score', category: 'Career' },
  { id: 'landings_500', title: 'Half Thousand', description: 'Complete 500 total landings', category: 'Career' },
  { id: 'all_easy_hard', title: 'Full Spectrum', description: 'Win on both Easy and Hard', category: 'Difficulty' },
  { id: 'ten_games_one_session', title: 'Marathon Session', description: 'Play 10 games without closing', category: 'Misc' },
  { id: 'perfect_daily', title: 'Perfect Day', description: 'Perfect landing on a Daily Challenge', category: 'Modes' },
  { id: 'endless_30', title: 'Infinity Pilot', description: 'Reach level 30 in Endless mode', category: 'Endurance' },
  { id: 'flip_perfect', title: 'Flipped Perfection', description: 'Perfect landing in Gravity Flip', category: 'Modes' },
  // Meteor Storm mode
  { id: 'play_meteor_storm', title: 'Into the Storm', description: 'Play Meteor Storm mode', category: 'Modes' },
  { id: 'storm_level_5', title: 'Storm Chaser', description: 'Reach level 5 in Meteor Storm', category: 'Modes' },
  { id: 'storm_level_10', title: 'Storm King', description: 'Reach level 10 in Meteor Storm', category: 'Modes' },
  // Moving pad achievements
  { id: 'land_moving_pad', title: 'Moving Target', description: 'Land on a moving pad', category: 'Challenge' },
  { id: 'land_moving_3x', title: 'Moving Bullseye', description: 'Land on a moving 3x pad', category: 'Challenge' },
  // Upgrade achievements
  { id: 'first_upgrade', title: 'Upgraded', description: 'Purchase your first upgrade', category: 'Upgrades' },
  { id: 'max_thrust', title: 'Full Throttle', description: 'Max out Thrust Power', category: 'Upgrades' },
  { id: 'max_fuel_eff', title: 'Green Machine', description: 'Max out Fuel Efficiency', category: 'Upgrades' },
  { id: 'max_rotation', title: 'Spin Doctor', description: 'Max out Rotation Speed', category: 'Upgrades' },
  { id: 'max_armor', title: 'Tank', description: 'Max out Hull Armor', category: 'Upgrades' },
  { id: 'max_landing_gear', title: 'Soft Touch', description: 'Max out Landing Gear', category: 'Upgrades' },
  { id: 'all_upgrades_max', title: 'Fully Loaded', description: 'Max out all upgrades', category: 'Upgrades' },
  { id: 'spent_10k', title: 'Big Spender', description: 'Spend 10,000 on upgrades', category: 'Upgrades' },
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
