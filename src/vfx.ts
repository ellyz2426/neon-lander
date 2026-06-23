// === Neon Lander VR -- Visual Effects System ===

import {
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  BoxGeometry,
  Color,
  PointLight,
} from '@iwsdk/core';
import { THEME_COLORS, ArenaTheme } from './types';

/**
 * Approach guidance ring - shows safe landing zone around each pad
 */
export function buildApproachGuide(padX: number, padY: number, padWidth: number, theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();
  group.position.set(padX, padY + 0.05, 0.01);

  // Inner ring (tight landing zone)
  const innerGeo = new RingGeometry(padWidth * 0.3, padWidth * 0.35, 16);
  const innerMat = new MeshBasicMaterial({
    color: colors.pad,
    transparent: true,
    opacity: 0.3,
  });
  const inner = new Mesh(innerGeo, innerMat);
  group.add(inner);

  // Outer ring (approach zone)
  const outerGeo = new RingGeometry(padWidth * 0.7, padWidth * 0.73, 16);
  const outerMat = new MeshBasicMaterial({
    color: colors.pad,
    transparent: true,
    opacity: 0.15,
  });
  const outer = new Mesh(outerGeo, outerMat);
  group.add(outer);

  return group;
}

/**
 * Landing zone column - vertical guide beam above pads
 */
export function buildLandingBeam(padX: number, padY: number, theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();

  // Vertical beam from pad to top
  const beamGeo = new PlaneGeometry(0.02, 6);
  const beamMat = new MeshBasicMaterial({
    color: colors.pad,
    transparent: true,
    opacity: 0.08,
  });
  const beam = new Mesh(beamGeo, beamMat);
  beam.position.set(padX, padY + 3.5, -0.02);
  group.add(beam);

  // Altitude markers along the beam
  const markerGeo = new PlaneGeometry(0.15, 0.005);
  for (let h = 1; h <= 5; h++) {
    const markerMat = new MeshBasicMaterial({
      color: colors.pad,
      transparent: true,
      opacity: 0.15,
    });
    const marker = new Mesh(markerGeo, markerMat);
    marker.position.set(padX, padY + h, -0.01);
    group.add(marker);
  }

  return group;
}

/**
 * Terrain glow edge effect - animated glowing outline on terrain surface
 */
export function buildTerrainGlowEdge(
  terrainPoints: { x: number; y: number }[],
  theme: ArenaTheme,
): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();

  // Create small glowing spheres along terrain edge
  const sphereGeo = new SphereGeometry(0.015, 4, 4);
  const stride = 3; // every 3rd point

  for (let i = 0; i < terrainPoints.length; i += stride) {
    const pt = terrainPoints[i];
    const mat = new MeshBasicMaterial({
      color: colors.terrainEmissive,
      transparent: true,
      opacity: 0.4 + Math.random() * 0.3,
    });
    const sphere = new Mesh(sphereGeo, mat);
    sphere.position.set(pt.x, pt.y + 0.02, 0.02);
    group.add(sphere);
  }

  return group;
}

/**
 * Parallax background layers - floating geometric shapes at different depths
 * Creates depth illusion with shapes that will animate at different speeds
 */
export function buildParallaxLayers(theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();

  // Layer 1 - Far background (z = -8), large slow shapes
  const layer1 = new Group();
  layer1.position.z = -8;
  const farGeo = new PlaneGeometry(0.5, 0.5);
  for (let i = 0; i < 8; i++) {
    const mat = new MeshBasicMaterial({
      color: colors.accent,
      transparent: true,
      opacity: 0.015 + Math.random() * 0.015,
    });
    const mesh = new Mesh(farGeo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 20,
      Math.random() * 10,
      0,
    );
    mesh.rotation.z = Math.random() * Math.PI;
    mesh.scale.set(0.5 + Math.random() * 1.5, 0.5 + Math.random() * 1.5, 1);
    layer1.add(mesh);
  }
  group.add(layer1);

  // Layer 2 - Mid background (z = -6), medium shapes
  const layer2 = new Group();
  layer2.position.z = -6;
  const midGeo = new SphereGeometry(0.1, 6, 6);
  for (let i = 0; i < 12; i++) {
    const mat = new MeshBasicMaterial({
      color: colors.terrainEmissive,
      transparent: true,
      opacity: 0.02 + Math.random() * 0.02,
    });
    const mesh = new Mesh(midGeo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 18,
      Math.random() * 9,
      0,
    );
    mesh.scale.set(1 + Math.random() * 2, 1 + Math.random() * 2, 1);
    layer2.add(mesh);
  }
  group.add(layer2);

  // Layer 3 - Near background (z = -3), small fast diamonds
  const layer3 = new Group();
  layer3.position.z = -3;
  const nearGeo = new PlaneGeometry(0.06, 0.06);
  for (let i = 0; i < 15; i++) {
    const mat = new MeshBasicMaterial({
      color: colors.pad,
      transparent: true,
      opacity: 0.02 + Math.random() * 0.03,
    });
    const mesh = new Mesh(nearGeo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 16,
      Math.random() * 8,
      0,
    );
    mesh.rotation.z = Math.PI / 4; // diamond orientation
    layer3.add(mesh);
  }
  group.add(layer3);

  return group;
}

/**
 * Pad beacon light - pulsing point light above each landing pad
 */
export function buildPadBeacon(padX: number, padY: number, theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();

  // Beacon light source
  const beacon = new PointLight(new Color(colors.pad), 0.5, 4);
  beacon.position.set(padX, padY + 2.5, 0.1);
  group.add(beacon);

  // Small glowing orb at beacon position
  const orbGeo = new SphereGeometry(0.03, 6, 6);
  const orbMat = new MeshBasicMaterial({
    color: colors.pad,
    transparent: true,
    opacity: 0.6,
  });
  const orb = new Mesh(orbGeo, orbMat);
  orb.position.set(padX, padY + 2.5, 0.1);
  group.add(orb);

  // Vertical dash line from pad to beacon
  const dashGeo = new PlaneGeometry(0.008, 0.08);
  const dashMat = new MeshBasicMaterial({
    color: colors.pad,
    transparent: true,
    opacity: 0.12,
  });
  for (let h = 0.5; h < 2.5; h += 0.25) {
    const dash = new Mesh(dashGeo, dashMat);
    dash.position.set(padX, padY + h, 0.05);
    group.add(dash);
  }

  return group;
}

/**
 * Animated background grid - subtle grid lines in the background
 */
export function buildBackgroundGrid(theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();
  group.position.z = -4;

  const lineMat = new MeshBasicMaterial({
    color: colors.accent,
    transparent: true,
    opacity: 0.02,
  });

  // Horizontal lines
  const hGeo = new PlaneGeometry(16, 0.005);
  for (let y = 0; y <= 8; y += 1) {
    const line = new Mesh(hGeo, lineMat);
    line.position.y = y;
    group.add(line);
  }

  // Vertical lines
  const vGeo = new PlaneGeometry(0.005, 10);
  for (let x = -8; x <= 8; x += 1) {
    const line = new Mesh(vGeo, lineMat);
    line.position.x = x;
    group.add(line);
  }

  return group;
}

/**
 * Atmosphere haze - subtle volumetric-like horizontal bands
 * Creates depth illusion near the terrain surface
 */
export function buildAtmosphereHaze(theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();

  // Low-altitude haze bands
  const hazeGeo = new PlaneGeometry(16, 0.3);
  for (let i = 0; i < 5; i++) {
    const mat = new MeshBasicMaterial({
      color: colors.accent,
      transparent: true,
      opacity: 0.008 + i * 0.003,
    });
    const haze = new Mesh(hazeGeo, mat);
    haze.position.set(0, 0.3 + i * 0.4, -1 - i * 0.5);
    group.add(haze);
  }

  // Subtle horizon glow
  const glowGeo = new PlaneGeometry(20, 0.8);
  const glowMat = new MeshBasicMaterial({
    color: colors.terrainEmissive,
    transparent: true,
    opacity: 0.01,
  });
  const glow = new Mesh(glowGeo, glowMat);
  glow.position.set(0, 0.1, -2);
  group.add(glow);

  return group;
}

/**
 * Scan line effect - subtle CRT-style horizontal lines overlay
 * Adds retro-futuristic feel
 */
export function buildScanLines(theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();
  group.position.z = -0.5;

  const lineGeo = new PlaneGeometry(14, 0.003);
  const lineMat = new MeshBasicMaterial({
    color: colors.accent,
    transparent: true,
    opacity: 0.01,
  });

  // Sparse scan lines across play area
  for (let y = 0; y < 9; y += 0.4) {
    const line = new Mesh(lineGeo, lineMat);
    line.position.set(0, y, 0);
    group.add(line);
  }

  return group;
}
