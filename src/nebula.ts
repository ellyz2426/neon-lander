// === Neon Lander VR -- Nebula Background Effect ===

import {
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  PlaneGeometry,
  Color,
} from '@iwsdk/core';
import { ArenaTheme, THEME_COLORS } from './types';

export function buildNebulaEffect(theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const group = new Group();
  group.position.z = -5; // well behind everything

  const accentColor = new Color(colors.accent);
  const starColor = new Color(colors.stars);

  // Nebula clouds: large, translucent spheres
  const cloudGeo = new SphereGeometry(0.8, 8, 8);

  for (let i = 0; i < 6; i++) {
    const color = i % 2 === 0 ? accentColor : starColor;
    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.015 + Math.random() * 0.02,
    });
    const cloud = new Mesh(cloudGeo, mat);
    cloud.position.set(
      (Math.random() - 0.5) * 16,
      Math.random() * 9 + 1,
      -2 - Math.random() * 5,
    );
    const s = 2 + Math.random() * 4;
    cloud.scale.set(s, s * 0.5, s * 0.2);
    group.add(cloud);
  }

  // Dust lanes: thin plane strips
  const dustGeo = new PlaneGeometry(12, 0.15);
  for (let i = 0; i < 4; i++) {
    const mat = new MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.015 + Math.random() * 0.02,
    });
    const dust = new Mesh(dustGeo, mat);
    dust.position.set(
      (Math.random() - 0.5) * 4,
      1 + Math.random() * 6,
      -2 - Math.random() * 3,
    );
    dust.rotation.z = (Math.random() - 0.5) * 0.5;
    group.add(dust);
  }

  // Bright pinpoint stars (slightly larger than normal starfield)
  const brightStarGeo = new PlaneGeometry(0.04, 0.04);
  for (let i = 0; i < 15; i++) {
    const mat = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6 + Math.random() * 0.4,
    });
    const star = new Mesh(brightStarGeo, mat);
    star.position.set(
      (Math.random() - 0.5) * 16,
      Math.random() * 10,
      -2 - Math.random() * 3,
    );
    group.add(star);
  }

  return group;
}
