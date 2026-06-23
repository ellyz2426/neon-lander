// === Neon Lander VR -- Terrain Generator ===

import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Group,
  LineSegments,
  LineBasicMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  BoxGeometry,
  Color,
  DoubleSide,
} from '@iwsdk/core';
import {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  FIELD_DEPTH,
  TERRAIN_SEGMENTS,
  MIN_PAD_WIDTH,
  MAX_PAD_WIDTH,
  PAD_NARROW_WIDTH,
  TerrainPoint,
  LandingPad,
  LevelData,
  INITIAL_FUEL,
  Difficulty,
  DIFFICULTY_MODS,
  ArenaTheme,
  THEME_COLORS,
} from './types';

// Seeded RNG for daily challenges
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function generateLevel(
  levelNum: number,
  difficulty: Difficulty,
  seed?: number,
): LevelData {
  const rng = seed != null ? seededRng(seed) : Math.random;
  const mods = DIFFICULTY_MODS[difficulty];

  // Terrain complexity increases with level
  const roughness = Math.min(0.3 + levelNum * 0.05, 0.8);
  const baseHeight = 0.15 + rng() * 0.1;

  // Generate terrain profile
  const points: TerrainPoint[] = [];
  const halfW = FIELD_WIDTH / 2;

  // Number of pads decreases with level, minimum 1
  const numPads = Math.max(1, 3 - Math.floor(levelNum / 4));

  // Decide pad positions first
  const padPositions: { x: number; width: number }[] = [];
  const usedRegions: { start: number; end: number }[] = [];

  for (let p = 0; p < numPads; p++) {
    let padWidth: number;
    if (p === 0) {
      // First pad is always approachable
      padWidth = lerp(MIN_PAD_WIDTH, MAX_PAD_WIDTH, 1 - Math.min(levelNum / 10, 0.7)) * mods.padWidthMult;
    } else {
      // Extra pads can be narrow for bonus
      padWidth = lerp(PAD_NARROW_WIDTH, MIN_PAD_WIDTH, rng()) * mods.padWidthMult;
    }

    let padX: number;
    let attempts = 0;
    do {
      padX = -halfW + 1.5 + rng() * (FIELD_WIDTH - 3);
      attempts++;
    } while (
      attempts < 50 &&
      usedRegions.some(
        (r) => padX + padWidth / 2 > r.start - 0.5 && padX - padWidth / 2 < r.end + 0.5,
      )
    );

    padPositions.push({ x: padX, width: padWidth });
    usedRegions.push({ start: padX - padWidth / 2, end: padX + padWidth / 2 });
  }

  // Generate terrain points
  const step = FIELD_WIDTH / TERRAIN_SEGMENTS;
  for (let i = 0; i <= TERRAIN_SEGMENTS; i++) {
    const x = -halfW + i * step;
    let y = baseHeight;

    // Multiple octaves of noise
    y += Math.sin(x * 1.2 + levelNum) * roughness * 0.8;
    y += Math.sin(x * 2.7 + levelNum * 2.3) * roughness * 0.4;
    y += Math.sin(x * 5.1 + levelNum * 4.1) * roughness * 0.15;

    // Add some variation
    y += (rng() - 0.5) * roughness * 0.15;

    // Clamp to reasonable range
    y = Math.max(0.05, Math.min(FIELD_HEIGHT * 0.5, y));

    points.push({ x, y });
  }

  // Flatten terrain at pad positions
  const pads: LandingPad[] = [];
  for (const pp of padPositions) {
    const padLeft = pp.x - pp.width / 2;
    const padRight = pp.x + pp.width / 2;

    // Find average height in pad region
    let sumY = 0;
    let count = 0;
    for (const pt of points) {
      if (pt.x >= padLeft && pt.x <= padRight) {
        sumY += pt.y;
        count++;
      }
    }
    const padY = count > 0 ? sumY / count : baseHeight;

    // Flatten points in pad region
    for (const pt of points) {
      if (pt.x >= padLeft - 0.05 && pt.x <= padRight + 0.05) {
        pt.y = padY;
      }
    }

    // Score multiplier: narrower pads = higher multiplier
    const mult = pp.width < 0.5 ? 3 : pp.width < 0.8 ? 2 : 1;
    pads.push({ x: pp.x, width: pp.width, y: padY, multiplier: mult });
  }

  // Wind increases with level
  const windBase = Math.min(levelNum * 0.12, 1.5) * mods.windMult;
  const wind = (rng() - 0.5) * 2 * windBase;

  // Fuel decreases with level
  const fuel = Math.max(40, INITIAL_FUEL - levelNum * 4) * mods.fuelMult;

  // Start position: top center, slightly random
  const startX = (rng() - 0.5) * 2;
  const startY = FIELD_HEIGHT * 0.85;

  return {
    terrain: points,
    pads,
    wind,
    gravity: mods.gravityMult,
    fuel,
    startX,
    startY,
  };
}

export function buildTerrainMesh(
  level: LevelData,
  theme: ArenaTheme,
): { terrainGroup: Group; padMeshes: Mesh[] } {
  const colors = THEME_COLORS[theme];
  const terrainGroup = new Group();

  // Build terrain geometry from profile
  const pts = level.terrain;
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const x0 = pts[i].x;
    const y0 = pts[i].y;
    const x1 = pts[i + 1].x;
    const y1 = pts[i + 1].y;

    const vi = i * 4;

    // Front face quad (two triangles)
    // Bottom-left, bottom-right, top-right, top-left
    vertices.push(
      x0, 0, 0,        // bottom-left
      x1, 0, 0,        // bottom-right
      x1, y1, 0,       // top-right
      x0, y0, 0,       // top-left
    );

    normals.push(
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    );

    indices.push(
      vi, vi + 1, vi + 2,
      vi, vi + 2, vi + 3,
    );
  }

  const terrainGeo = new BufferGeometry();
  terrainGeo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  terrainGeo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  terrainGeo.setIndex(indices);

  const terrainMat = new MeshStandardMaterial({
    color: colors.terrain,
    emissive: colors.terrainEmissive,
    emissiveIntensity: 0.3,
    roughness: 0.8,
    metalness: 0.2,
    side: DoubleSide,
  });

  const terrainMesh = new Mesh(terrainGeo, terrainMat);
  terrainGroup.add(terrainMesh);

  // Terrain outline (top edge)
  const lineVerts: number[] = [];
  for (const pt of pts) {
    lineVerts.push(pt.x, pt.y, 0.01);
  }
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute('position', new Float32BufferAttribute(lineVerts, 3));
  const lineMat = new LineBasicMaterial({ color: colors.accent, linewidth: 2 });
  const outline = new LineSegments(lineGeo, lineMat);
  // Convert to line strip via indices
  const lineIndices: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    lineIndices.push(i, i + 1);
  }
  lineGeo.setIndex(lineIndices);
  terrainGroup.add(outline);

  // Landing pad indicators
  const padMeshes: Mesh[] = [];
  for (const pad of level.pads) {
    const padGeo = new BoxGeometry(pad.width, 0.03, FIELD_DEPTH * 0.5);
    const padMat = new MeshStandardMaterial({
      color: colors.pad,
      emissive: colors.padEmissive,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
    });
    const padMesh = new Mesh(padGeo, padMat);
    padMesh.position.set(pad.x, pad.y + 0.015, 0);
    terrainGroup.add(padMesh);
    padMeshes.push(padMesh);

    // Pad markers (chevrons on each side)
    const markerGeo = new BoxGeometry(0.04, 0.08, 0.04);
    const markerMat = new MeshStandardMaterial({
      color: colors.pad,
      emissive: colors.padEmissive,
      emissiveIntensity: 0.8,
    });
    const leftMarker = new Mesh(markerGeo, markerMat);
    leftMarker.position.set(pad.x - pad.width / 2, pad.y + 0.06, 0);
    terrainGroup.add(leftMarker);

    const rightMarker = new Mesh(markerGeo, markerMat);
    rightMarker.position.set(pad.x + pad.width / 2, pad.y + 0.06, 0);
    terrainGroup.add(rightMarker);

    // Multiplier indicator: more markers for higher multiplier
    if (pad.multiplier >= 2) {
      const multMat = new MeshStandardMaterial({
        color: 0xffcc00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.6,
      });
      const multGeo = new BoxGeometry(0.03, 0.03, 0.03);
      for (let m = 0; m < pad.multiplier; m++) {
        const mm = new Mesh(multGeo, multMat);
        mm.position.set(
          pad.x - (pad.multiplier - 1) * 0.05 / 2 + m * 0.05,
          pad.y + 0.12,
          0,
        );
        terrainGroup.add(mm);
      }
    }
  }

  return { terrainGroup, padMeshes };
}

export function buildStarField(theme: ArenaTheme): Group {
  const colors = THEME_COLORS[theme];
  const starGroup = new Group();

  const starCount = 200;
  const starGeo = new PlaneGeometry(0.02, 0.02);
  const starMat = new MeshBasicMaterial({ color: colors.stars, transparent: true, opacity: 0.8 });

  for (let i = 0; i < starCount; i++) {
    const star = new Mesh(starGeo, starMat.clone());
    star.position.set(
      (Math.random() - 0.5) * FIELD_WIDTH * 1.5,
      Math.random() * FIELD_HEIGHT * 1.2,
      -0.5 - Math.random() * 2,
    );
    (star.material as MeshBasicMaterial).opacity = 0.3 + Math.random() * 0.7;
    starGroup.add(star);
  }

  return starGroup;
}
