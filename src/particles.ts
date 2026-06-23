// === Neon Lander VR -- Particle Manager ===

import {
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from '@iwsdk/core';

interface Particle {
  mesh: Mesh;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class ParticleManager {
  private particles: Particle[] = [];
  private pool: Mesh[] = [];
  private group: Group;
  private geo: SphereGeometry;

  constructor(parent: Group) {
    this.group = new Group();
    parent.add(this.group);
    this.geo = new SphereGeometry(0.012, 4, 4);
  }

  private getOrCreate(color: number): Mesh {
    const pooled = this.pool.pop();
    if (pooled) {
      (pooled.material as MeshBasicMaterial).color.setHex(color);
      pooled.visible = true;
      return pooled;
    }
    const mat = new MeshBasicMaterial({ color, transparent: true });
    const mesh = new Mesh(this.geo, mat);
    this.group.add(mesh);
    return mesh;
  }

  emit(
    x: number,
    y: number,
    count: number,
    color: number,
    speed: number = 1,
    life: number = 0.5,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.5 + Math.random() * 0.5);
      const mesh = this.getOrCreate(color);
      mesh.position.set(x, y, 0);

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
      });
    }
  }

  emitThrust(x: number, y: number, angle: number, color: number): void {
    // Emit particles downward from lander position
    const spread = 0.4;
    for (let i = 0; i < 2; i++) {
      const a = angle - Math.PI / 2 + (Math.random() - 0.5) * spread;
      const spd = 1.5 + Math.random() * 1.5;
      const mesh = this.getOrCreate(color);
      mesh.position.set(x, y, 0);

      this.particles.push({
        mesh,
        vx: -Math.sin(a) * spd,
        vy: -Math.cos(a) * spd,
        life: 0.2 + Math.random() * 0.2,
        maxLife: 0.3,
      });
    }
  }

  emitExplosion(x: number, y: number, count: number = 30): void {
    const colors = [0xff4400, 0xff8800, 0xffcc00, 0xff0000, 0xffff00];
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 3;
      const mesh = this.getOrCreate(color);
      mesh.position.set(x, y, 0);

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.4 + Math.random() * 0.6,
        maxLife: 0.8,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        this.pool.push(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.vy -= 0.5 * dt; // gravity on particles

      const alpha = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = alpha;
      const scale = 0.5 + alpha * 0.5;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  clear(): void {
    for (const p of this.particles) {
      p.mesh.visible = false;
      this.pool.push(p.mesh);
    }
    this.particles.length = 0;
  }
}
