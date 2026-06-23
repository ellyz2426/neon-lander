// === Neon Lander VR -- Power-ups System ===

import {
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  OctahedronGeometry,
  BoxGeometry,
  CylinderGeometry,
  PointLight,
  Color,
} from '@iwsdk/core';

export enum PowerUpType {
  FUEL = 'fuel',
  SHIELD = 'shield',
  SLOW_MO = 'slow_mo',
  SCORE_BOOST = 'score_boost',
}

export interface PowerUpDef {
  type: PowerUpType;
  label: string;
  color: number;
  emissive: number;
  duration: number; // seconds, 0 = instant
  description: string;
}

export const POWERUP_DEFS: Record<PowerUpType, PowerUpDef> = {
  [PowerUpType.FUEL]: {
    type: PowerUpType.FUEL,
    label: 'FUEL',
    color: 0x00ff88,
    emissive: 0x00cc66,
    duration: 0,
    description: 'Restores 25% fuel',
  },
  [PowerUpType.SHIELD]: {
    type: PowerUpType.SHIELD,
    label: 'SHIELD',
    color: 0x44aaff,
    emissive: 0x2288dd,
    duration: 8,
    description: 'Survive one crash',
  },
  [PowerUpType.SLOW_MO]: {
    type: PowerUpType.SLOW_MO,
    label: 'SLOW',
    color: 0xcc44ff,
    emissive: 0x9922cc,
    duration: 5,
    description: 'Reduces gravity for 5s',
  },
  [PowerUpType.SCORE_BOOST]: {
    type: PowerUpType.SCORE_BOOST,
    label: '2X',
    color: 0xffcc00,
    emissive: 0xcc9900,
    duration: 0,
    description: '2x score next landing',
  },
};

export interface ActivePowerUp {
  type: PowerUpType;
  remaining: number; // seconds remaining
}

export interface SpawnedPowerUp {
  type: PowerUpType;
  x: number;
  y: number;
  group: Group;
  light: PointLight;
  bobPhase: number;
  collected: boolean;
}

export class PowerUpManager {
  spawned: SpawnedPowerUp[] = [];
  active: ActivePowerUp[] = [];
  shieldActive = false;
  scoreMultiplier = 1;
  gravityMultiplier = 1;
  private parentGroup: Group;

  constructor(parentGroup: Group) {
    this.parentGroup = parentGroup;
  }

  spawnForLevel(pads: { x: number; y: number; width: number }[], terrainHeightFn: (x: number) => number): void {
    this.clearSpawned();

    // Spawn 1-3 power-ups per level
    const count = 1 + Math.floor(Math.random() * 2);
    const types = Object.values(PowerUpType);

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const def = POWERUP_DEFS[type];

      // Random position, avoiding pad areas
      let x: number;
      let attempts = 0;
      do {
        x = -5 + Math.random() * 10;
        attempts++;
      } while (
        attempts < 30 &&
        pads.some((p) => Math.abs(x - p.x) < p.width)
      );

      const terrainY = terrainHeightFn(x);
      const y = terrainY + 1.5 + Math.random() * 2;

      const group = new Group();
      group.position.set(x, y, 0);

      // Create pickup mesh based on type
      let mesh: Mesh;
      const mat = new MeshStandardMaterial({
        color: def.color,
        emissive: def.emissive,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.6,
        transparent: true,
        opacity: 0.85,
      });

      switch (type) {
        case PowerUpType.FUEL:
          mesh = new Mesh(new CylinderGeometry(0.08, 0.08, 0.18, 6), mat);
          break;
        case PowerUpType.SHIELD:
          mesh = new Mesh(new SphereGeometry(0.1, 8, 8), mat);
          break;
        case PowerUpType.SLOW_MO:
          mesh = new Mesh(new OctahedronGeometry(0.1), mat);
          break;
        case PowerUpType.SCORE_BOOST:
          mesh = new Mesh(new BoxGeometry(0.14, 0.14, 0.14), mat);
          break;
      }

      group.add(mesh);

      // Glow light
      const light = new PointLight(new Color(def.color), 0.8, 2);
      light.position.set(0, 0, 0.1);
      group.add(light);

      this.parentGroup.add(group);
      this.spawned.push({
        type,
        x,
        y,
        group,
        light,
        bobPhase: Math.random() * Math.PI * 2,
        collected: false,
      });
    }
  }

  checkCollection(landerX: number, landerY: number, collectRadius: number = 0.3): PowerUpType | null {
    for (const pu of this.spawned) {
      if (pu.collected) continue;
      const dx = landerX - pu.x;
      const dy = landerY - pu.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < collectRadius) {
        pu.collected = true;
        pu.group.visible = false;
        return pu.type;
      }
    }
    return null;
  }

  applyPowerUp(type: PowerUpType, fuel: { current: number; max: number }): void {
    const def = POWERUP_DEFS[type];

    switch (type) {
      case PowerUpType.FUEL:
        fuel.current = Math.min(fuel.max, fuel.current + fuel.max * 0.25);
        break;
      case PowerUpType.SHIELD:
        this.shieldActive = true;
        this.active.push({ type, remaining: def.duration });
        break;
      case PowerUpType.SLOW_MO:
        this.gravityMultiplier = 0.4;
        this.active.push({ type, remaining: def.duration });
        break;
      case PowerUpType.SCORE_BOOST:
        this.scoreMultiplier = 2;
        break;
    }
  }

  updateTimers(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const a = this.active[i];
      a.remaining -= dt;
      if (a.remaining <= 0) {
        // Expire
        switch (a.type) {
          case PowerUpType.SHIELD:
            this.shieldActive = false;
            break;
          case PowerUpType.SLOW_MO:
            this.gravityMultiplier = 1;
            break;
        }
        this.active.splice(i, 1);
      }
    }
  }

  updateVisuals(dt: number): void {
    for (const pu of this.spawned) {
      if (pu.collected) continue;
      pu.bobPhase += dt * 2.5;
      pu.group.position.y = pu.y + Math.sin(pu.bobPhase) * 0.15;
      pu.group.rotation.y += dt * 1.5;

      // Pulse glow
      pu.light.intensity = 0.6 + Math.sin(pu.bobPhase * 1.5) * 0.4;
    }
  }

  consumeScoreMultiplier(): number {
    const mult = this.scoreMultiplier;
    this.scoreMultiplier = 1;
    return mult;
  }

  consumeShield(): boolean {
    if (this.shieldActive) {
      this.shieldActive = false;
      // Remove shield from active list
      const idx = this.active.findIndex((a) => a.type === PowerUpType.SHIELD);
      if (idx >= 0) this.active.splice(idx, 1);
      return true;
    }
    return false;
  }

  clearSpawned(): void {
    for (const pu of this.spawned) {
      this.parentGroup.remove(pu.group);
    }
    this.spawned.length = 0;
  }

  resetActive(): void {
    this.active.length = 0;
    this.shieldActive = false;
    this.scoreMultiplier = 1;
    this.gravityMultiplier = 1;
  }

  reset(): void {
    this.clearSpawned();
    this.resetActive();
  }

  getActiveLabel(): string {
    if (this.active.length === 0) return '';
    return this.active.map((a) => {
      const def = POWERUP_DEFS[a.type];
      return `${def.label} ${Math.ceil(a.remaining)}s`;
    }).join(' | ');
  }
}
