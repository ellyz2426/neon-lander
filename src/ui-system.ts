// === Neon Lander VR -- UI System (ECS) ===

import {
  createSystem,
  PanelUI,
  PanelDocument,
  UIKitDocument,
  UIKit,
  eq,
} from '@iwsdk/core';
import { GameManager } from './game';
import {
  GameState,
  GameMode,
  Difficulty,
  ArenaTheme,
  LanderSkin,
  SKIN_COLORS,
} from './types';
import type { Achievement } from './achievements';

export class UISystem extends createSystem({
  hud: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/hud.json')],
  },
  menu: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/menu.json')],
  },
  gameover: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/gameover.json')],
  },
  pause: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/pause.json')],
  },
  modeselect: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/modeselect.json')],
  },
  achievements: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/achvlist.json')],
  },
  settings: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/settings.json')],
  },
  stats: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/stats.json')],
  },
  toast: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/toast.json')],
  },
  leaderboard: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/leaderboard.json')],
  },
  help: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/help.json')],
  },
}) {
  private game!: GameManager;

  // Entity refs (passed from index.ts)
  private hudEntity: any = null;
  private menuEntity: any = null;
  private gameoverEntity: any = null;
  private pauseEntity: any = null;
  private modeselectEntity: any = null;
  private achievementsEntity: any = null;
  private settingsEntity: any = null;
  private statsEntity: any = null;
  private toastEntity: any = null;
  private leaderboardEntity: any = null;
  private helpEntity: any = null;

  // Doc refs
  private hudDoc: UIKitDocument | null = null;
  private menuDoc: UIKitDocument | null = null;
  private gameoverDoc: UIKitDocument | null = null;
  private pauseDoc: UIKitDocument | null = null;
  private modeselectDoc: UIKitDocument | null = null;
  private achievementsDoc: UIKitDocument | null = null;
  private settingsDoc: UIKitDocument | null = null;
  private statsDoc: UIKitDocument | null = null;
  private toastDoc: UIKitDocument | null = null;
  private leaderboardDoc: UIKitDocument | null = null;
  private helpDoc: UIKitDocument | null = null;

  private toastTimer = 0;
  private lastState: GameState | null = null;
  private hudUpdateTimer = 0;

  onThemeChange: ((theme: ArenaTheme) => void) | null = null;
  onSkinChange: ((skin: LanderSkin) => void) | null = null;

  setRefs(refs: {
    game: GameManager;
    hudEntity: any;
    menuEntity: any;
    gameoverEntity: any;
    pauseEntity: any;
    modeselectEntity: any;
    achievementsEntity: any;
    settingsEntity: any;
    statsEntity: any;
    toastEntity: any;
    leaderboardEntity: any;
    helpEntity: any;
  }): void {
    this.game = refs.game;
    this.hudEntity = refs.hudEntity;
    this.menuEntity = refs.menuEntity;
    this.gameoverEntity = refs.gameoverEntity;
    this.pauseEntity = refs.pauseEntity;
    this.modeselectEntity = refs.modeselectEntity;
    this.achievementsEntity = refs.achievementsEntity;
    this.settingsEntity = refs.settingsEntity;
    this.statsEntity = refs.statsEntity;
    this.toastEntity = refs.toastEntity;
    this.leaderboardEntity = refs.leaderboardEntity;
    this.helpEntity = refs.helpEntity;
  }

  init(): void {
    this.queries.hud.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (doc) this.hudDoc = doc;
    });

    this.queries.menu.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.menuDoc = doc;
      this.wireMenu(doc);
    });

    this.queries.gameover.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.gameoverDoc = doc;
      this.wireGameover(doc);
    });

    this.queries.pause.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.pauseDoc = doc;
      this.wirePause(doc);
    });

    this.queries.modeselect.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.modeselectDoc = doc;
      this.wireModeSelect(doc);
    });

    this.queries.achievements.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.achievementsDoc = doc;
      this.wireBack(doc);
    });

    this.queries.settings.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.settingsDoc = doc;
      this.wireSettings(doc);
    });

    this.queries.stats.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.statsDoc = doc;
      this.wireBack(doc);
    });

    this.queries.toast.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (doc) this.toastDoc = doc;
    });

    this.queries.leaderboard.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.leaderboardDoc = doc;
      this.wireBack(doc);
    });

    this.queries.help.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      this.helpDoc = doc;
      this.wireBack(doc);
    });
  }

  private wireMenu(doc: UIKitDocument): void {
    const game = this.game;

    const playBtn = doc.getElementById('btn-play') as UIKit.Text | undefined;
    playBtn?.addEventListener('click', () => {
      game.audio.playClick();
      game.startGame(game.mode, game.difficulty);
    });

    const modesBtn = doc.getElementById('btn-modes') as UIKit.Text | undefined;
    modesBtn?.addEventListener('click', () => {
      game.audio.playClick();
      game.setState(GameState.MODE_SELECT);
    });

    const achievBtn = doc.getElementById('btn-achievements') as UIKit.Text | undefined;
    achievBtn?.addEventListener('click', () => {
      game.audio.playClick();
      this.showOverlay('achievements');
    });

    const settingsBtn = doc.getElementById('btn-settings') as UIKit.Text | undefined;
    settingsBtn?.addEventListener('click', () => {
      game.audio.playClick();
      this.showOverlay('settings');
    });

    const statsBtn = doc.getElementById('btn-stats') as UIKit.Text | undefined;
    statsBtn?.addEventListener('click', () => {
      game.audio.playClick();
      this.showOverlay('stats');
    });

    const lbBtn = doc.getElementById('btn-leaderboard') as UIKit.Text | undefined;
    lbBtn?.addEventListener('click', () => {
      game.audio.playClick();
      this.showOverlay('leaderboard');
    });

    const helpBtn = doc.getElementById('btn-help') as UIKit.Text | undefined;
    helpBtn?.addEventListener('click', () => {
      game.audio.playClick();
      this.showOverlay('help');
    });
  }

  private wireGameover(doc: UIKitDocument): void {
    const game = this.game;

    const retryBtn = doc.getElementById('btn-retry') as UIKit.Text | undefined;
    retryBtn?.addEventListener('click', () => {
      game.audio.playClick();
      game.startGame(game.mode, game.difficulty);
    });

    const menuBtn = doc.getElementById('btn-menu') as UIKit.Text | undefined;
    menuBtn?.addEventListener('click', () => {
      game.audio.playClick();
      game.returnToMenu();
    });
  }

  private wirePause(doc: UIKitDocument): void {
    const game = this.game;

    const resumeBtn = doc.getElementById('btn-resume') as UIKit.Text | undefined;
    resumeBtn?.addEventListener('click', () => {
      game.audio.playClick();
      game.togglePause();
    });

    const menuBtn = doc.getElementById('btn-menu') as UIKit.Text | undefined;
    menuBtn?.addEventListener('click', () => {
      game.audio.playClick();
      game.returnToMenu();
    });
  }

  private wireModeSelect(doc: UIKitDocument): void {
    const game = this.game;
    const modes = Object.values(GameMode);
    for (const mode of modes) {
      const btn = doc.getElementById(`btn-mode-${mode}`) as UIKit.Text | undefined;
      btn?.addEventListener('click', () => {
        game.audio.playClick();
        game.mode = mode;
        game.startGame(mode, game.difficulty);
      });
    }
    this.wireBack(doc, () => game.setState(GameState.MENU));
  }

  private wireSettings(doc: UIKitDocument): void {
    const game = this.game;

    // Difficulty
    for (const diff of Object.values(Difficulty)) {
      const btn = doc.getElementById(`btn-diff-${diff}`) as UIKit.Text | undefined;
      btn?.addEventListener('click', () => {
        game.audio.playClick();
        game.difficulty = diff;
        this.updateSettingsDisplay();
      });
    }

    // Theme
    for (const theme of Object.values(ArenaTheme)) {
      const btn = doc.getElementById(`btn-theme-${theme}`) as UIKit.Text | undefined;
      btn?.addEventListener('click', () => {
        game.audio.playClick();
        game.theme = theme;
        this.onThemeChange?.(theme);
        this.updateSettingsDisplay();
      });
    }

    // Skin
    for (const skin of Object.values(LanderSkin)) {
      const btn = doc.getElementById(`btn-skin-${skin}`) as UIKit.Text | undefined;
      btn?.addEventListener('click', () => {
        game.audio.playClick();
        game.skin = skin;
        this.onSkinChange?.(skin);
        this.updateSettingsDisplay();
      });
    }

    // Volume
    const volUp = doc.getElementById('btn-vol-up') as UIKit.Text | undefined;
    volUp?.addEventListener('click', () => {
      game.audio.volume = Math.min(1, game.audio.volume + 0.1);
      game.audio.playClick();
      this.updateSettingsDisplay();
    });

    const volDown = doc.getElementById('btn-vol-down') as UIKit.Text | undefined;
    volDown?.addEventListener('click', () => {
      game.audio.volume = Math.max(0, game.audio.volume - 0.1);
      game.audio.playClick();
      this.updateSettingsDisplay();
    });

    const muteBtn = doc.getElementById('btn-mute') as UIKit.Text | undefined;
    muteBtn?.addEventListener('click', () => {
      game.audio.muted = !game.audio.muted;
      game.audio.playClick();
      this.updateSettingsDisplay();
    });

    this.wireBack(doc);
  }

  private wireBack(doc: UIKitDocument, customAction?: () => void): void {
    const backBtn = doc.getElementById('btn-back') as UIKit.Text | undefined;
    backBtn?.addEventListener('click', () => {
      this.game.audio.playClick();
      if (customAction) {
        customAction();
      } else {
        this.hideAllOverlays();
        this.game.setState(GameState.MENU);
      }
    });
  }

  private showOverlay(name: string): void {
    this.hideAllOverlays();
    const map: Record<string, any> = {
      achievements: this.achievementsEntity,
      settings: this.settingsEntity,
      stats: this.statsEntity,
      leaderboard: this.leaderboardEntity,
      help: this.helpEntity,
    };
    const entity = map[name];
    if (entity?.object3D) entity.object3D.visible = true;
    if (this.menuEntity?.object3D) this.menuEntity.object3D.visible = false;

    // Update data on show
    if (name === 'achievements') this.updateAchievementsDisplay();
    if (name === 'stats') this.updateStatsDisplay();
    if (name === 'leaderboard') this.updateLeaderboardDisplay();
    if (name === 'settings') this.updateSettingsDisplay();
  }

  private hideAllOverlays(): void {
    const entities = [
      this.achievementsEntity, this.settingsEntity, this.statsEntity,
      this.leaderboardEntity, this.helpEntity,
    ];
    for (const e of entities) {
      if (e?.object3D) e.object3D.visible = false;
    }
    if (this.menuEntity?.object3D) this.menuEntity.object3D.visible = true;
  }

  showToast(achievement: Achievement): void {
    if (!this.toastDoc) return;
    const titleEl = this.toastDoc.getElementById('toast-title') as UIKit.Text | undefined;
    const descEl = this.toastDoc.getElementById('toast-desc') as UIKit.Text | undefined;
    titleEl?.setProperties({ text: achievement.title });
    descEl?.setProperties({ text: achievement.description });
    if (this.toastEntity?.object3D) this.toastEntity.object3D.visible = true;
    this.toastTimer = 3.0;
  }

  private updateHUD(): void {
    if (!this.hudDoc) return;
    const game = this.game;
    const l = game.lander;
    const maxFuel = game.currentLevel?.fuel ?? 100;
    const fuelPct = Math.max(0, Math.floor((l.fuel / maxFuel) * 100));

    const setText = (id: string, text: string) => {
      const el = this.hudDoc!.getElementById(id) as UIKit.Text | undefined;
      el?.setProperties({ text });
    };

    const setColor = (id: string, color: string) => {
      const el = this.hudDoc!.getElementById(id) as UIKit.Text | undefined;
      el?.setProperties({ color });
    };

    setText('fuel-value', `${fuelPct}%`);
    setText('alt-value', `${Math.max(0, l.y - game.getTerrainHeight(l.x)).toFixed(1)}`);
    setText('vx-value', `${Math.abs(l.vx).toFixed(1)}`);
    setText('vy-value', `${Math.abs(l.vy).toFixed(1)}`);
    setText('score-value', `${game.score}`);
    setText('level-value', `${game.level}`);
    setText('lives-value', `${game.lives}`);
    setText('wind-value', `${game.currentLevel ? game.currentLevel.wind.toFixed(1) : '0.0'}`);
    setText('angle-value', `${Math.round((l.angle * 180) / Math.PI)}`);

    // Fuel bar width + color
    const fuelBar = this.hudDoc.getElementById('fuel-bar') as UIKit.Text | undefined;
    if (fuelBar) {
      const w = Math.max(5, fuelPct * 0.7);
      const fuelColor = fuelPct > 50 ? '#00ff88' : fuelPct > 20 ? '#ffcc44' : '#ff4444';
      fuelBar.setProperties({ width: w, backgroundColor: fuelColor });
    }
    // Fuel text color
    const fuelTextColor = fuelPct > 50 ? '#00ff88' : fuelPct > 20 ? '#ffcc44' : '#ff4444';
    setColor('fuel-value', fuelTextColor);

    // Velocity danger colors - green/yellow/red based on safe thresholds
    const vyAbs = Math.abs(l.vy);
    const vxAbs = Math.abs(l.vx);
    const vyColor = vyAbs < 0.8 ? '#44ff44' : vyAbs < 1.2 ? '#ffcc44' : '#ff4444';
    const vxColor = vxAbs < 0.4 ? '#44ff44' : vxAbs < 0.6 ? '#ffcc44' : '#ff4444';
    setColor('vy-value', vyColor);
    setColor('vx-value', vxColor);

    // Angle danger color
    const angleAbs = Math.abs(l.angle);
    const angleColor = angleAbs < 0.15 ? '#44ff44' : angleAbs < 0.25 ? '#ffcc44' : '#ff4444';
    setColor('angle-value', angleColor);

    // Status indicator
    const isSafe = vyAbs < 0.8 && vxAbs < 0.4 && angleAbs < 0.15;
    const isCaution = vyAbs < 1.2 && vxAbs < 0.6 && angleAbs < 0.25;
    if (isSafe) {
      setText('status-indicator', '>> SAFE');
      setColor('status-indicator', '#44ff44');
    } else if (isCaution) {
      setText('status-indicator', '>> CAUTION');
      setColor('status-indicator', '#ffcc44');
    } else {
      setText('status-indicator', '>> DANGER');
      setColor('status-indicator', '#ff4444');
    }

    // Power-up status
    const puLabel = game.powerUps?.getActiveLabel() ?? '';
    setText('powerup-status', puLabel);

    // Combo display
    if (game.perfectCombo >= 2) {
      setText('combo-text', `${game.perfectCombo}x COMBO`);
      setColor('combo-text', '#ffcc00');
    } else if (game.noCrashStreak >= 3) {
      setText('combo-text', `${game.noCrashStreak} STREAK`);
      setColor('combo-text', '#44ffaa');
    } else {
      setText('combo-text', '');
    }

    // Ready countdown
    if (game.state === GameState.READY) {
      const countVal = Math.ceil(game.readyTimer);
      setText('countdown-text', countVal > 0 ? `${countVal}` : 'GO!');
      setColor('countdown-text', '#44ffaa');
    } else {
      setText('countdown-text', '');
    }
  }

  private updateSettingsDisplay(): void {
    if (!this.settingsDoc) return;
    const game = this.game;
    const setText = (id: string, text: string) => {
      const el = this.settingsDoc!.getElementById(id) as UIKit.Text | undefined;
      el?.setProperties({ text });
    };
    setText('current-diff', game.difficulty.toUpperCase());
    setText('current-theme', game.theme.replace(/_/g, ' ').toUpperCase());
    setText('current-skin', SKIN_COLORS[game.skin].label.toUpperCase());
    setText('current-vol', game.audio.muted ? 'MUTED' : `${Math.round(game.audio.volume * 100)}%`);
  }

  private updateGameover(): void {
    if (!this.gameoverDoc) return;
    const game = this.game;
    const setText = (id: string, text: string) => {
      const el = this.gameoverDoc!.getElementById(id) as UIKit.Text | undefined;
      el?.setProperties({ text });
    };
    setText('final-score', `${game.score}`);
    setText('final-level', `${game.level}`);
    setText('best-score', `${game.leaderboard.getBestScore()}`);
    const isWin = game.mode === GameMode.CLASSIC && game.level > 10;
    setText('gameover-title', isWin ? 'MISSION COMPLETE' : 'GAME OVER');
  }

  private updateAchievementsDisplay(): void {
    if (!this.achievementsDoc) return;
    const game = this.game;
    const countEl = this.achievementsDoc.getElementById('achv-count') as UIKit.Text | undefined;
    countEl?.setProperties({
      text: `${game.achievements.unlockedCount} / ${game.achievements.totalCount}`,
    });

    const all = game.achievements.getAll();
    for (let i = 0; i < 8; i++) {
      const nameEl = this.achievementsDoc.getElementById(`achv-name-${i}`) as UIKit.Text | undefined;
      const descEl = this.achievementsDoc.getElementById(`achv-desc-${i}`) as UIKit.Text | undefined;
      if (i < all.length) {
        const a = all[i];
        nameEl?.setProperties({ text: a.unlocked ? a.title : '???' });
        descEl?.setProperties({ text: a.unlocked ? a.description : 'Locked' });
      }
    }
  }

  private updateStatsDisplay(): void {
    if (!this.statsDoc) return;
    const stats = this.game.statsManager.stats;
    const setText = (id: string, text: string) => {
      const el = this.statsDoc!.getElementById(id) as UIKit.Text | undefined;
      el?.setProperties({ text });
    };
    setText('stat-games', `${stats.gamesPlayed}`);
    setText('stat-landings', `${stats.totalLandings}`);
    setText('stat-crashes', `${stats.totalCrashes}`);
    setText('stat-perfect', `${stats.perfectLandings}`);
    setText('stat-best-score', `${stats.bestScore}`);
    setText('stat-best-level', `${stats.bestLevel}`);
    setText('stat-best-streak', `${stats.bestPerfectStreak}`);
    setText('stat-total-score', `${stats.totalScore}`);
  }

  private updateLeaderboardDisplay(): void {
    if (!this.leaderboardDoc) return;
    const entries = this.game.leaderboard.getTop(8);
    for (let i = 0; i < 8; i++) {
      const rankEl = this.leaderboardDoc.getElementById(`lb-rank-${i}`) as UIKit.Text | undefined;
      const scoreEl = this.leaderboardDoc.getElementById(`lb-score-${i}`) as UIKit.Text | undefined;
      const dateEl = this.leaderboardDoc.getElementById(`lb-date-${i}`) as UIKit.Text | undefined;
      if (i < entries.length) {
        const e = entries[i];
        rankEl?.setProperties({ text: `#${i + 1}` });
        scoreEl?.setProperties({ text: `${e.score}` });
        dateEl?.setProperties({ text: e.date });
      } else {
        rankEl?.setProperties({ text: `#${i + 1}` });
        scoreEl?.setProperties({ text: '---' });
        dateEl?.setProperties({ text: '' });
      }
    }
  }

  update(delta: number, _time: number): void {
    if (!this.game) return;
    const dt = Math.min(delta, 0.1);

    // Toast timer
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0 && this.toastEntity?.object3D) {
        this.toastEntity.object3D.visible = false;
      }
    }

    // State change handling
    if (this.game.state !== this.lastState) {
      this.lastState = this.game.state;
      this.onStateChanged(this.game.state);
    }

    // HUD update (throttled)
    this.hudUpdateTimer -= dt;
    if (this.hudUpdateTimer <= 0 &&
      (this.game.state === GameState.PLAYING || this.game.state === GameState.READY)) {
      this.hudUpdateTimer = 0.1;
      this.updateHUD();
    }
  }

  private onStateChanged(state: GameState): void {
    // Hide all overlay panels
    const allPanels = [
      this.menuEntity, this.gameoverEntity, this.pauseEntity,
      this.modeselectEntity, this.achievementsEntity, this.settingsEntity,
      this.statsEntity, this.leaderboardEntity, this.helpEntity,
    ];
    for (const e of allPanels) {
      if (e?.object3D) e.object3D.visible = false;
    }

    // HUD visible during gameplay
    if (this.hudEntity?.object3D) {
      this.hudEntity.object3D.visible =
        state === GameState.PLAYING || state === GameState.READY ||
        state === GameState.CRASHED || state === GameState.LEVEL_COMPLETE;
    }

    switch (state) {
      case GameState.MENU:
        if (this.menuEntity?.object3D) this.menuEntity.object3D.visible = true;
        break;
      case GameState.MODE_SELECT:
        if (this.modeselectEntity?.object3D) this.modeselectEntity.object3D.visible = true;
        break;
      case GameState.GAME_OVER:
        if (this.gameoverEntity?.object3D) this.gameoverEntity.object3D.visible = true;
        this.updateGameover();
        break;
      case GameState.PAUSED:
        if (this.pauseEntity?.object3D) this.pauseEntity.object3D.visible = true;
        break;
    }
  }
}
