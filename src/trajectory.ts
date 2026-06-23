// === Neon Lander VR -- Trajectory Prediction Line ===

import {
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from '@iwsdk/core';
import { GRAVITY, DIFFICULTY_MODS, Difficulty } from './types';

const MAX_DOTS = 20;
const PREDICTION_STEP = 0.05; // seconds per step
const DOT_SIZE = 0.015;

export class TrajectoryPredictor {
  private group: Group;
  private dots: Mesh[] = [];
  private dotGeo: SphereGeometry;
  private dotMats: MeshBasicMaterial[] = [];

  constructor(parent: Group) {
    this.group = new Group();
    parent.add(this.group);
    this.dotGeo = new SphereGeometry(DOT_SIZE, 4, 4);

    for (let i = 0; i < MAX_DOTS; i++) {
      const alpha = 1 - i / MAX_DOTS;
      const mat = new MeshBasicMaterial({
        color: 0xffcc44,
        transparent: true,
        opacity: alpha * 0.4,
      });
      const mesh = new Mesh(this.dotGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.dots.push(mesh);
      this.dotMats.push(mat);
    }
  }

  update(
    x: number,
    y: number,
    vx: number,
    vy: number,
    wind: number,
    difficulty: Difficulty,
    visible: boolean,
    getTerrainHeight: (x: number) => number,
  ): void {
    if (!visible) {
      for (const d of this.dots) d.visible = false;
      return;
    }

    const mods = DIFFICULTY_MODS[difficulty];
    const g = GRAVITY * mods.gravityMult;
    let px = x;
    let py = y;
    let pvx = vx;
    let pvy = vy;

    for (let i = 0; i < MAX_DOTS; i++) {
      // Simulate physics forward
      pvx += wind * PREDICTION_STEP * 0.3;
      pvy -= g * PREDICTION_STEP;
      px += pvx * PREDICTION_STEP;
      py += pvy * PREDICTION_STEP;

      // Stop prediction if it goes below terrain
      const terrainY = getTerrainHeight(px);
      if (py <= terrainY) {
        this.dots[i].visible = false;
        // Hide remaining dots
        for (let j = i + 1; j < MAX_DOTS; j++) {
          this.dots[j].visible = false;
        }
        return;
      }

      this.dots[i].position.set(px, py, 0.05);
      this.dots[i].visible = true;
    }
  }

  setColor(color: number): void {
    for (const mat of this.dotMats) {
      mat.color.setHex(color);
    }
  }

  hide(): void {
    for (const d of this.dots) d.visible = false;
  }
}
