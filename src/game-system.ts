// === Neon Lander VR -- Game System (ECS) ===

import { createSystem } from '@iwsdk/core';
import { GameManager } from './game';
import { GameState, SKIN_COLORS } from './types';
import { ParticleManager } from './particles';

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
}

export class GameSystem extends createSystem({}) {
  private refs: GameSystemRefs | null = null;

  setRefs(r: GameSystemRefs): void {
    this.refs = r;
  }

  update(delta: number, _time: number): void {
    if (!this.refs) return;
    const { game, particles } = this.refs;
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
  }

  private processInput(game: GameManager): void {
    const inputMgr = this.input as unknown as RuntimeInput;
    const kb = inputMgr.keyboard;

    game.thrustInput = false;
    game.rotateLeftInput = false;
    game.rotateRightInput = false;

    if (game.state === GameState.PLAYING) {
      // Keyboard
      if (kb) {
        if (kb.getKeyDown('KeyW') || kb.getKeyDown('ArrowUp')) {
          game.thrustInput = true;
        }
        if (kb.getKeyDown('KeyA') || kb.getKeyDown('ArrowLeft')) {
          game.rotateLeftInput = true;
        }
        if (kb.getKeyDown('KeyD') || kb.getKeyDown('ArrowRight')) {
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
