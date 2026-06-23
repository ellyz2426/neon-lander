// === Neon Lander VR -- Tutorial System ===

const TUTORIAL_KEY = 'neon-lander-tutorial-done';

export interface TutorialStep {
  message: string;
  condition: 'any_key' | 'thrust' | 'rotate' | 'landing' | 'timer';
  timerDuration?: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    message: 'Welcome to Neon Lander! Land your spacecraft safely on the glowing pads.',
    condition: 'timer',
    timerDuration: 4,
  },
  {
    message: 'Press W / UP / SPACE to thrust. In VR, pull right trigger or push right stick up.',
    condition: 'thrust',
  },
  {
    message: 'Great! Press A/D or LEFT/RIGHT to rotate. In VR, use left stick.',
    condition: 'rotate',
  },
  {
    message: 'Watch your HUD - green means safe to land, yellow is caution, red is danger!',
    condition: 'timer',
    timerDuration: 4,
  },
  {
    message: 'Land gently on a glowing pad - keep velocity and angle low. Good luck!',
    condition: 'timer',
    timerDuration: 3,
  },
];

export class TutorialManager {
  active = false;
  currentStep = 0;
  stepTimer = 0;
  conditionMet = false;
  completed = false;

  constructor() {
    try {
      this.completed = localStorage.getItem(TUTORIAL_KEY) === 'true';
    } catch { /* ignore */ }
  }

  shouldShow(): boolean {
    return !this.completed;
  }

  start(): void {
    if (this.completed) return;
    this.active = true;
    this.currentStep = 0;
    this.stepTimer = 0;
    this.conditionMet = false;
  }

  getCurrentMessage(): string {
    if (!this.active || this.currentStep >= TUTORIAL_STEPS.length) return '';
    return TUTORIAL_STEPS[this.currentStep].message;
  }

  update(dt: number, thrustInput: boolean, rotateInput: boolean): void {
    if (!this.active || this.currentStep >= TUTORIAL_STEPS.length) return;

    const step = TUTORIAL_STEPS[this.currentStep];
    this.stepTimer += dt;

    switch (step.condition) {
      case 'timer':
        if (this.stepTimer >= (step.timerDuration ?? 3)) {
          this.advanceStep();
        }
        break;
      case 'thrust':
        if (thrustInput) this.conditionMet = true;
        if (this.conditionMet && this.stepTimer >= 1.5) {
          this.advanceStep();
        }
        break;
      case 'rotate':
        if (rotateInput) this.conditionMet = true;
        if (this.conditionMet && this.stepTimer >= 1.5) {
          this.advanceStep();
        }
        break;
      case 'any_key':
        if (thrustInput || rotateInput) {
          this.advanceStep();
        }
        break;
    }
  }

  advanceStep(): void {
    this.currentStep++;
    this.stepTimer = 0;
    this.conditionMet = false;

    if (this.currentStep >= TUTORIAL_STEPS.length) {
      this.finish();
    }
  }

  finish(): void {
    this.active = false;
    this.completed = true;
    this.onComplete?.();
    try {
      localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch { /* ignore */ }
  }

  onComplete: (() => void) | null = null;

  reset(): void {
    this.completed = false;
    try {
      localStorage.removeItem(TUTORIAL_KEY);
    } catch { /* ignore */ }
  }
}
