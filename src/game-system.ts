// === Neon Lander VR -- Game System (ECS) ===

import { createSystem } from '@iwsdk/core';
import { GameManager } from './game';
import { GameState, SKIN_COLORS } from './types';
import { ParticleManager } from './particles';
import type { Mesh, Object3D } from '@iwsdk/core';

interface RuntimeInput {
  keyboard?: {
    getKeyDown(key: string): boolean;
    getKeyPressed(key: string): boolean;
  };
  gamepads: Record<
    'left' | 'right',
    | {
        getButtonDown(id: string): boolean;
        getButtonValue(id: string): number;
        getAxesValues(id: string): { x: number; y: number } | undefined;
      }
    | undefined
  >;
}

interface GameSystemRefs {
  game: GameManager;
  particles: ParticleManager;
  camera: Object3D;
  padMeshes: Mesh[];
  windIndicator: Object3D | null;
}

// Camera tracking state
const CAM_BASE_Y = 4.5;
const CAM_BASE_Z = 8;
const CAM_TRACK_STRENGTH = 0.3;
const CAM_SMOOTH = 3.0;

export class GameSystem extends createSystem({}) {
  private refs: GameSystemRefs | null = null;
  private camTargetX = 0;
  private camTargetY = CAM_BASE_Y;
  private padGlowPhase = 0;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private lastState: GameState | null = null;

  setRefs(r: GameSystemRefs): void {
    this.refs = r;
  }

  update(delta: number, _time: number): void {
    if (!this.refs) return;
    const { game, particles, camera, padMeshes, windIndicator } = this.refs;
    const dt = Math.min(delta, 0.05);

    this.processInput(game);
    game.updatePhysics(dt);
    game.updateTimers(dt);
    this.updateLanderVisual(game);

    // Thrust particles
    if (game.state === GameState.PLAYING && game.lander.thrusting) {
      const l = game.lander;
      const skinColors = SKIN_COLORS[game.skin];
      particles.emitThrust(l.x, l.y - 0.1, l.angle, skinColors.flame);
    }

    // Detect crash for screen shake
    if (game.state === GameState.CRASHED && this.lastState !== GameState.CRASHED) {
      this.shakeTimer = 0.4;
      this.shakeIntensity = 0.12;
    }
    this.lastState = game.state;

    // Camera tracking — smooth follow lander position
    if (game.state === GameState.PLAYING || game.state === GameState.READY) {
      const l = game.lander;
      this.camTargetX = l.x * CAM_TRACK_STRENGTH;
      this.camTargetY = CAM_BASE_Y + (l.y - 4) * CAM_TRACK_STRENGTH * 0.5;
    } else {
      this.camTargetX = 0;
      this.camTargetY = CAM_BASE_Y;
    }
    const smoothFactor = 1 - Math.exp(-CAM_SMOOTH * dt);
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const decay = this.shakeTimer / 0.4;
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * decay;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * decay;
    }
    camera.position.x += (this.camTargetX - camera.position.x) * smoothFactor + shakeX;
    camera.position.y += (this.camTargetY - camera.position.y) * smoothFactor + shakeY;

    // Pad glow animation
    this.padGlowPhase += dt * 3;
    for (const padMesh of padMeshes) {
      const mat = padMesh.material as any;
      if (mat && mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.4 + Math.sin(this.padGlowPhase) * 0.3;
      }
    }

    // Wind indicator animation
    if (windIndicator && game.currentLevel) {
      const wind = game.currentLevel.wind;
      windIndicator.visible = Math.abs(wind) > 0.05;
      if (windIndicator.visible) {
        windIndicator.position.x = game.lander.x + (wind > 0 ? 0.6 : -0.6);
        windIndicator.position.y = game.lander.y + 0.3;
        windIndicator.scale.x = Math.abs(wind) * 0.8;
        windIndicator.rotation.z = wind > 0 ? 0 : Math.PI;
      }
    }
  }

  private processInput(game: GameManager): void {
    const inputMgr = this.input as unknown as RuntimeInput;
    const kb = inputMgr.keyboard;

    game.thrustInput = false;
    game.rotateLeftInput = false;
    game.rotateRightInput = false;

    if (game.state === GameState.PLAYING) {
      // Keyboard — getKeyPressed for continuous hold, not getKeyDown (single frame)
      if (kb) {
        if (kb.getKeyPressed('KeyW') || kb.getKeyPressed('ArrowUp') || kb.getKeyPressed('Space')) {
          game.thrustInput = true;
        }
        if (kb.getKeyPressed('KeyA') || kb.getKeyPressed('ArrowLeft')) {
          game.rotateLeftInput = true;
        }
        if (kb.getKeyPressed('KeyD') || kb.getKeyPressed('ArrowRight')) {
          game.rotateRightInput = true;
        }
      }

      // XR controllers
      const right = inputMgr.gamepads.right;
      const left = inputMgr.gamepads.left;

      if (right) {
        const stick = right.getAxesValues('xr-standard-thumbstick');
        if (stick && stick.y < -0.3) {
          game.thrustInput = true;
        }
        if (right.getButtonValue('xr-standard-trigger') > 0.3) {
          game.thrustInput = true;
        }
      }

      if (left) {
        const stick = left.getAxesValues('xr-standard-thumbstick');
        if (stick) {
          if (stick.x < -0.3) game.rotateLeftInput = true;
          if (stick.x > 0.3) game.rotateRightInput = true;
        }
      }

      // Manage thrust audio
      if (game.thrustInput && game.lander.fuel > 0) {
        game.audio.startThrust();
      } else {
        game.audio.stopThrust();
      }
    }

    // Pause
    if (kb) {
      if (kb.getKeyDown('Escape') || kb.getKeyDown('KeyP')) {
        if (game.state === GameState.PLAYING || game.state === GameState.PAUSED) {
          game.togglePause();
          game.audio.playClick();
        }
      }
    }

    const rightGp = inputMgr.gamepads.right;
    if (rightGp) {
      if (rightGp.getButtonDown('b-button')) {
        if (game.state === GameState.PLAYING || game.state === GameState.PAUSED) {
          game.togglePause();
          game.audio.playClick();
        }
      }
    }
    const leftGp = inputMgr.gamepads.left;
    if (leftGp) {
      if (leftGp.getButtonDown('y-button')) {
        if (game.state === GameState.PLAYING || game.state === GameState.PAUSED) {
          game.togglePause();
          game.audio.playClick();
        }
      }
    }
  }

  private updateLanderVisual(game: GameManager): void {
    if (!game.landerGroup) return;

    const l = game.lander;
    game.landerGroup.position.set(l.x, l.y, 0);
    game.landerGroup.rotation.z = -l.angle;

    if (game.flameMesh) {
      game.flameMesh.visible = l.thrusting;
      if (l.thrusting) {
        const flicker = 0.7 + Math.random() * 0.3;
        game.flameMesh.scale.set(flicker, 0.5 + Math.random() * 0.5, flicker);
      }
    }

    if (game.thrustLight) {
      game.thrustLight.intensity = l.thrusting ? 2 + Math.random() : 0;
    }

    if (!l.alive && game.state === GameState.CRASHED) {
      game.landerGroup.visible = false;
    } else {
      game.landerGroup.visible = true;
    }
  }
}
