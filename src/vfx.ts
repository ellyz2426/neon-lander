// === Neon Lander VR -- Visual Effects System ===

import {
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
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
