// === Neon Lander VR -- Meteor Hazard System ===

import {
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  PointLight,
  Color,
} from '@iwsdk/core';
import { FIELD_WIDTH, FIELD_HEIGHT, ArenaTheme, THEME_COLORS } from './types';

export interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  group: Group;
  mesh: Mesh;
  light: PointLight;
  alive: boolean;
  rotation: number;
  rotSpeed: number;
}

const METEOR_COLORS: Record<ArenaTheme, { body: number; emissive: number; trail: number }> = {
  deep_space: { body: 0x886644, emissive: 0xff4422, trail: 0xff6633 },
  lunar: { body: 0x999988, emissive: 0xffaa44, trail: 0xffcc66 },
  mars: { body: 0xaa5533, emissive: 0xff3300, trail: 0xff5500 },
  ice_moon: { body: 0x6688aa, emissive: 0x44ccff, trail: 0x66ddff },
  neon_city: { body: 0x884488, emissive: 0xff44ff, trail: 0xff88ff },
};

export class MeteorManager {
  meteors: Meteor[] = [];
  private parentGroup: Group;
  private spawnTimer = 0;
  private spawnInterval = 3; // seconds between spawns
  private maxMeteors = 5;
  enabled = false;
  theme: ArenaTheme;

  constructor(parentGroup: Group, theme: ArenaTheme) {
    this.parentGroup = parentGroup;
    this.theme = theme;
  }

  configure(level: number, enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearAll();
      return;
    }
    // More frequent and faster meteors at higher levels
    this.spawnInterval = Math.max(1.0, 3.5 - level * 0.15);
    this.maxMeteors = Math.min(8, 3 + Math.floor(level / 3));
    this.spawnTimer = this.spawnInterval * 0.5; // first spawn quicker
  }

  update(dt: number): void {
    if (!this.enabled) return;

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.meteors.filter((m) => m.alive).length < this.maxMeteors) {
      this.spawnMeteor();
      this.spawnTimer = this.spawnInterval + (Math.random() - 0.5) * this.spawnInterval * 0.4;
    }

    // Update positions
    for (const m of this.meteors) {
      if (!m.alive) continue;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.rotation += m.rotSpeed * dt;
      m.group.position.set(m.x, m.y, 0);
      m.mesh.rotation.z = m.rotation;
      m.mesh.rotation.x = m.rotation * 0.7;

      // Pulse glow
      m.light.intensity = 0.4 + Math.sin(m.rotation * 3) * 0.2;

      // Remove if out of bounds
      if (m.y < -1 || m.x < -FIELD_WIDTH - 1 || m.x > FIELD_WIDTH + 1 || m.y > FIELD_HEIGHT + 2) {
        m.alive = false;
        m.group.visible = false;
      }
    }

    // Cleanup dead meteors periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }
  }

  checkCollision(landerX: number, landerY: number, radius: number = 0.2): boolean {
    for (const m of this.meteors) {
      if (!m.alive) continue;
      const dx = landerX - m.x;
      const dy = landerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius + m.size * 0.5) {
        // Mark meteor as destroyed
        m.alive = false;
        m.group.visible = false;
        return true;
      }
    }
    return false;
  }

  private spawnMeteor(): void {
    const colors = METEOR_COLORS[this.theme] || METEOR_COLORS.deep_space;
    const size = 0.08 + Math.random() * 0.12;

    // Spawn from top or sides
    const side = Math.random();
    let x: number;
    let y: number;
    let vx: number;
    let vy: number;

    if (side < 0.7) {
      // Top
      x = -FIELD_WIDTH * 0.4 + Math.random() * FIELD_WIDTH * 0.8;
      y = FIELD_HEIGHT + 0.5;
      vx = (Math.random() - 0.5) * 1.5;
      vy = -(1.5 + Math.random() * 2.0);
    } else if (side < 0.85) {
      // Left
      x = -FIELD_WIDTH * 0.5 - 0.5;
      y = FIELD_HEIGHT * 0.3 + Math.random() * FIELD_HEIGHT * 0.6;
      vx = 1.0 + Math.random() * 1.5;
      vy = -(0.5 + Math.random() * 1.5);
    } else {
      // Right
      x = FIELD_WIDTH * 0.5 + 0.5;
      y = FIELD_HEIGHT * 0.3 + Math.random() * FIELD_HEIGHT * 0.6;
      vx = -(1.0 + Math.random() * 1.5);
      vy = -(0.5 + Math.random() * 1.5);
    }

    const group = new Group();
    group.position.set(x, y, 0);

    // Irregular rocky shape
    const geo = new OctahedronGeometry(size, 0);
    // Distort vertices for rocky look
    const posAttr = geo.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i);
      const py = posAttr.getY(i);
      const pz = posAttr.getZ(i);
      const jitter = 0.7 + Math.random() * 0.6;
      posAttr.setXYZ(i, px * jitter, py * jitter, pz * jitter);
    }
    geo.computeVertexNormals();

    const mat = new MeshStandardMaterial({
      color: colors.body,
      emissive: colors.emissive,
      emissiveIntensity: 0.5,
      roughness: 0.7,
      metalness: 0.3,
    });
    const mesh = new Mesh(geo, mat);
    group.add(mesh);

    // Trail glow
    const trailGeo = new SphereGeometry(size * 0.6, 4, 4);
    const trailMat = new MeshStandardMaterial({
      color: colors.trail,
      emissive: colors.trail,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4,
    });
    const trail = new Mesh(trailGeo, trailMat);
    trail.position.set(-vx * 0.08, -vy * 0.08, 0);
    group.add(trail);

    const light = new PointLight(new Color(colors.emissive), 0.5, 1.5);
    group.add(light);

    this.parentGroup.add(group);
    this.meteors.push({
      x, y, vx, vy, size, group, mesh, light,
      alive: true,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 6,
    });
  }

  private cleanup(): void {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      if (!this.meteors[i].alive) {
        this.parentGroup.remove(this.meteors[i].group);
        this.meteors.splice(i, 1);
      }
    }
  }

  clearAll(): void {
    for (const m of this.meteors) {
      this.parentGroup.remove(m.group);
    }
    this.meteors.length = 0;
    this.spawnTimer = 0;
  }

  setTheme(theme: ArenaTheme): void {
    this.theme = theme;
  }
}
