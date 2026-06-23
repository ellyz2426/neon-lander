// === Neon Lander VR -- Entry Point ===

import {
  World,
  PanelUI,
  Follower,
  FogExp2,
  Color,
  AmbientLight,
  PointLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  ConeGeometry,
} from '@iwsdk/core';
import { GameManager } from './game';
import { GameSystem } from './game-system';
import { UISystem } from './ui-system';
import { ParticleSystem } from './particle-system';
import { ParticleManager } from './particles';
import { PowerUpManager } from './powerups';
import { buildTerrainMesh, buildStarField, generateLevel } from './terrain';
import { buildLanderMesh, updateLanderSkin } from './lander';
import { buildNebulaEffect } from './nebula';
import { buildApproachGuide, buildLandingBeam, buildTerrainGlowEdge, buildBackgroundGrid, buildParallaxLayers, buildPadBeacon, buildAtmosphereHaze, buildScanLines } from './vfx';
import { loadGame } from './savestate';
import { MeteorManager } from './meteors';
import { TrajectoryPredictor } from './trajectory';
import {
  FIELD_OFFSET_Y,
  GameState,
  ArenaTheme,
  LanderSkin,
  THEME_COLORS,
} from './types';

async function main(): Promise<void> {
  const container = document.getElementById('app') as HTMLDivElement;

  const world = await World.create(container, {
    xr: { offer: 'once' },
    render: {
      near: 0.01,
      far: 100,
    },
    features: {
      locomotion: false,
      physics: false,
    },
  });

  // Camera position - looking at play field
  world.camera.position.set(0, 4.5, 8);
  world.camera.lookAt(0, 3, 0);

  // Scene setup
  world.scene.fog = new FogExp2(0x000811, 0.04);
  world.scene.background = new Color(0x000811);

  // Lighting
  const ambientLight = new AmbientLight(0x223344, 0.4);
  world.scene.add(ambientLight);

  const mainLight = new PointLight(new Color(0x4488ff), 1.5, 30);
  mainLight.position.set(0, 10, 5);
  world.scene.add(mainLight);

  // Play field group - holds everything in the game world
  const fieldGroup = new Group();
  fieldGroup.position.set(0, FIELD_OFFSET_Y, 0);
  world.scene.add(fieldGroup);

  // Create game manager
  const game = new GameManager();

  // Particles
  const particles = new ParticleManager(fieldGroup);
  game.particles = particles;

  // Power-ups
  const powerUps = new PowerUpManager(fieldGroup);
  game.powerUps = powerUps;

  // Meteors
  const meteorManager = new MeteorManager(fieldGroup, game.theme);
  game.meteors = meteorManager;

  // Trajectory prediction
  const trajectory = new TrajectoryPredictor(fieldGroup);

  // Nebula background effect
  const nebulaGroup = buildNebulaEffect(game.theme);
  fieldGroup.add(nebulaGroup);

  // Background grid
  const gridGroup = buildBackgroundGrid(game.theme);
  fieldGroup.add(gridGroup);

  // Parallax background layers
  const parallaxGroup = buildParallaxLayers(game.theme);
  fieldGroup.add(parallaxGroup);

  // Atmosphere haze near terrain
  const hazeGroup = buildAtmosphereHaze(game.theme);
  fieldGroup.add(hazeGroup);

  // Scan lines overlay (retro CRT feel)
  const scanGroup = buildScanLines(game.theme);
  fieldGroup.add(scanGroup);

  // Build initial terrain (will be rebuilt on level change)
  let currentTerrainGroup: Group | null = null;
  let currentPadMeshes: any[] = [];
  let currentGuidesGroup: Group | null = null;

  // Star field
  let starField = buildStarField(game.theme);
  fieldGroup.add(starField);

  // Build lander
  const { landerGroup, bodyMesh, flameMesh, thrustLight } = buildLanderMesh(game.skin);
  fieldGroup.add(landerGroup);
  game.landerGroup = landerGroup;
  game.bodyMesh = bodyMesh;
  game.flameMesh = flameMesh;
  game.thrustLight = thrustLight;

  function rebuildTerrain(): void {
    // Remove old terrain
    if (currentTerrainGroup) {
      fieldGroup.remove(currentTerrainGroup);
    }
    if (currentGuidesGroup) {
      fieldGroup.remove(currentGuidesGroup);
    }

    if (!game.currentLevel) return;
    const { terrainGroup, padMeshes } = buildTerrainMesh(game.currentLevel, game.theme);
    currentTerrainGroup = terrainGroup;
    currentPadMeshes = padMeshes;
    fieldGroup.add(terrainGroup);

    // Add approach guides and landing beams
    currentGuidesGroup = new Group();
    for (const pad of game.currentLevel.pads) {
      const guide = buildApproachGuide(pad.x, pad.y, pad.width, game.theme);
      currentGuidesGroup.add(guide);
      const beam = buildLandingBeam(pad.x, pad.y, game.theme);
      currentGuidesGroup.add(beam);
      const beacon = buildPadBeacon(pad.x, pad.y, game.theme);
      currentGuidesGroup.add(beacon);
    }
    // Terrain glow edge
    const glowEdge = buildTerrainGlowEdge(game.currentLevel.terrain, game.theme);
    currentGuidesGroup.add(glowEdge);
    fieldGroup.add(currentGuidesGroup);
  }

  game.onLevelChange = () => {
    rebuildTerrain();
    landerGroup.visible = true;
  };

  // Wind indicator arrow
  const windGeo = new ConeGeometry(0.04, 0.15, 4);
  windGeo.rotateZ(-Math.PI / 2); // point right by default
  const windMat = new MeshStandardMaterial({
    color: 0xffcc44,
    emissive: 0xffaa00,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.7,
  });
  const windIndicator = new Mesh(windGeo, windMat);
  windIndicator.visible = false;
  fieldGroup.add(windIndicator);

  // ---- PanelUI setup ----
  const panelZ = -2;
  const panelY = 4;

  // HUD panel
  const hudEntity = world.createTransformEntity();
  hudEntity.object3D!.position.set(0, panelY + 3.5, panelZ - 2);
  hudEntity.object3D!.rotation.x = -0.15;
  hudEntity.addComponent(PanelUI, { config: './ui/hud.json' });

  // Menu panel
  const menuEntity = world.createTransformEntity();
  menuEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  menuEntity.object3D!.rotation.x = -0.2;
  menuEntity.addComponent(PanelUI, { config: './ui/menu.json' });

  // Game over panel
  const gameoverEntity = world.createTransformEntity();
  gameoverEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  gameoverEntity.object3D!.rotation.x = -0.2;
  gameoverEntity.object3D!.visible = false;
  gameoverEntity.addComponent(PanelUI, { config: './ui/gameover.json' });

  // Pause panel
  const pauseEntity = world.createTransformEntity();
  pauseEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  pauseEntity.object3D!.rotation.x = -0.2;
  pauseEntity.object3D!.visible = false;
  pauseEntity.addComponent(PanelUI, { config: './ui/pause.json' });

  // Mode select panel
  const modeselectEntity = world.createTransformEntity();
  modeselectEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  modeselectEntity.object3D!.rotation.x = -0.2;
  modeselectEntity.object3D!.visible = false;
  modeselectEntity.addComponent(PanelUI, { config: './ui/modeselect.json' });

  // Achievements panel
  const achievementsEntity = world.createTransformEntity();
  achievementsEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  achievementsEntity.object3D!.rotation.x = -0.2;
  achievementsEntity.object3D!.visible = false;
  achievementsEntity.addComponent(PanelUI, { config: './ui/achvlist.json' });

  // Settings panel
  const settingsEntity = world.createTransformEntity();
  settingsEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  settingsEntity.object3D!.rotation.x = -0.2;
  settingsEntity.object3D!.visible = false;
  settingsEntity.addComponent(PanelUI, { config: './ui/settings.json' });

  // Stats panel
  const statsEntity = world.createTransformEntity();
  statsEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  statsEntity.object3D!.rotation.x = -0.2;
  statsEntity.object3D!.visible = false;
  statsEntity.addComponent(PanelUI, { config: './ui/stats.json' });

  // Toast panel
  const toastEntity = world.createTransformEntity();
  toastEntity.object3D!.position.set(0, panelY + 3.8, panelZ - 2);
  toastEntity.object3D!.rotation.x = -0.15;
  toastEntity.object3D!.visible = false;
  toastEntity.addComponent(PanelUI, { config: './ui/toast.json' });

  // Leaderboard panel
  const leaderboardEntity = world.createTransformEntity();
  leaderboardEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  leaderboardEntity.object3D!.rotation.x = -0.2;
  leaderboardEntity.object3D!.visible = false;
  leaderboardEntity.addComponent(PanelUI, { config: './ui/leaderboard.json' });

  // Help panel
  const helpEntity = world.createTransformEntity();
  helpEntity.object3D!.position.set(0, panelY + 1.5, panelZ);
  helpEntity.object3D!.rotation.x = -0.2;
  helpEntity.object3D!.visible = false;
  helpEntity.addComponent(PanelUI, { config: './ui/help.json' });

  // Tutorial panel
  const tutorialEntity = world.createTransformEntity();
  tutorialEntity.object3D!.position.set(0, panelY + 2.5, panelZ - 1);
  tutorialEntity.object3D!.rotation.x = -0.15;
  tutorialEntity.object3D!.visible = false;
  tutorialEntity.addComponent(PanelUI, { config: './ui/tutorial.json' });

  // ---- Register systems ----
  world.registerSystem(GameSystem);
  world.registerSystem(UISystem);
  world.registerSystem(ParticleSystem);

  const gameSystem = world.getSystem(GameSystem)!;
  gameSystem.setRefs({ game, particles, camera: world.camera, padMeshes: currentPadMeshes, windIndicator, starField, trajectory, parallaxGroup, guidesGroup: currentGuidesGroup });

  // Keep padMeshes ref in sync after terrain rebuilds
  const origOnLevelChange = game.onLevelChange;
  game.onLevelChange = () => {
    origOnLevelChange?.();
    gameSystem.setRefs({ game, particles, camera: world.camera, padMeshes: currentPadMeshes, windIndicator, starField, trajectory, parallaxGroup, guidesGroup: currentGuidesGroup });
  };

  const particleSystem = world.getSystem(ParticleSystem)!;
  particleSystem.setRefs({ particles, game });

  const uiSystem = world.getSystem(UISystem)!;
  uiSystem.setRefs({
    game,
    hudEntity,
    menuEntity,
    gameoverEntity,
    pauseEntity,
    modeselectEntity,
    achievementsEntity,
    settingsEntity,
    statsEntity,
    toastEntity,
    leaderboardEntity,
    helpEntity,
    tutorialEntity,
  });

  // Theme change handler
  uiSystem.onThemeChange = (theme: ArenaTheme) => {
    const colors = THEME_COLORS[theme];
    (world.scene.fog as FogExp2).color.setHex(colors.fog);
    (world.scene.background as Color).setHex(colors.fog);
    mainLight.color.setHex(colors.accent);

    // Rebuild terrain with new theme
    rebuildTerrain();

    // Rebuild star field
    fieldGroup.remove(starField);
    starField = buildStarField(theme);
    fieldGroup.add(starField);

    // Rebuild nebula
    fieldGroup.remove(nebulaGroup);
    const newNebula = buildNebulaEffect(theme);
    fieldGroup.add(newNebula);
    Object.assign(nebulaGroup, newNebula); // Keep reference for GC

    // Update meteor theme
    meteorManager.setTheme(theme);

    game.statsManager.recordTheme(theme);
  };

  // Skin change handler
  uiSystem.onSkinChange = (skin: LanderSkin) => {
    updateLanderSkin(bodyMesh, flameMesh, thrustLight, skin);
    game.statsManager.recordSkin(skin);
  };

  // Resume game handler
  uiSystem.onResumeGame = (save) => {
    // Apply theme/skin before resuming
    const theme = save.theme as ArenaTheme;
    const skin = save.skin as LanderSkin;
    if (theme !== game.theme) {
      game.theme = theme;
      uiSystem.onThemeChange?.(theme);
    }
    if (skin !== game.skin) {
      game.skin = skin;
      uiSystem.onSkinChange?.(skin);
    }
    game.resumeGame(save);
  };

  // Achievement toast
  game.achievements.onUnlock = (a) => {
    game.audio.playAchievement();
    uiSystem.showToast(a);
  };
}

main().catch(console.error);
