// === Neon Lander VR -- Particle System (ECS) ===

import { createSystem } from '@iwsdk/core';
import { ParticleManager } from './particles';
import { GameManager } from './game';

interface ParticleSystemRefs {
  particles: ParticleManager;
  game: GameManager;
}

export class ParticleSystem extends createSystem({}) {
  private refs: ParticleSystemRefs | null = null;
  private starTwinkleTimer = 0;

  setRefs(r: ParticleSystemRefs): void {
    this.refs = r;
  }

  update(delta: number, _time: number): void {
    if (!this.refs) return;
    const { particles } = this.refs;
    const dt = Math.min(delta, 0.05);

    particles.update(dt);

    // Wind visual particles (occasional)
    this.starTwinkleTimer -= dt;
    if (this.starTwinkleTimer <= 0) {
      this.starTwinkleTimer = 2 + Math.random() * 3;
    }
  }
}
