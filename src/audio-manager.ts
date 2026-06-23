// === Neon Lander VR -- Audio Manager ===

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private thrustOsc: OscillatorNode | null = null;
  private thrustGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private _volume = 0.5;
  private _muted = false;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  get volume(): number { return this._volume; }
  set volume(v: number) {
    this._volume = v;
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : v;
  }

  get muted(): boolean { return this._muted; }
  set muted(m: boolean) {
    this._muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : this._volume;
  }

  startThrust(): void {
    if (this.thrustOsc) return;
    const ctx = this.ensureCtx();
    this.thrustOsc = ctx.createOscillator();
    this.thrustGain = ctx.createGain();
    this.thrustOsc.type = 'sawtooth';
    this.thrustOsc.frequency.value = 80;
    this.thrustGain.gain.value = 0.15;
    this.thrustOsc.connect(this.thrustGain);
    this.thrustGain.connect(this.masterGain!);
    this.thrustOsc.start();

    // Add rumble noise
    const noise = ctx.createOscillator();
    noise.type = 'square';
    noise.frequency.value = 40;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start();
    (this.thrustOsc as any)._noise = noise;
    (this.thrustOsc as any)._noiseGain = noiseGain;
  }

  stopThrust(): void {
    if (!this.thrustOsc) return;
    try {
      const noise = (this.thrustOsc as any)._noise as OscillatorNode;
      if (noise) noise.stop();
    } catch { /* ignore */ }
    try { this.thrustOsc.stop(); } catch { /* ignore */ }
    this.thrustOsc = null;
    this.thrustGain = null;
  }

  updateThrustPitch(fuel: number, maxFuel: number): void {
    if (!this.thrustOsc) return;
    // Pitch rises as fuel decreases
    const ratio = fuel / maxFuel;
    this.thrustOsc.frequency.value = 60 + (1 - ratio) * 60;
  }

  startAmbient(): void {
    if (this.ambientOsc) return;
    const ctx = this.ensureCtx();
    this.ambientOsc = ctx.createOscillator();
    this.ambientGain = ctx.createGain();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 55;
    this.ambientGain.gain.value = 0.04;
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain!);
    this.ambientOsc.start();
  }

  stopAmbient(): void {
    if (!this.ambientOsc) return;
    try { this.ambientOsc.stop(); } catch { /* ignore */ }
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  playLand(): void {
    const ctx = this.ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  playCrash(): void {
    const ctx = this.ensureCtx();
    // Low boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start();
  }

  playAchievement(): void {
    const ctx = this.ensureCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  }

  playClick(): void {
    const ctx = this.ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  playLevelComplete(): void {
    const ctx = this.ensureCtx();
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  }

  playGameOver(): void {
    const ctx = this.ensureCtx();
    const notes = [440, 370, 330, 262];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.5);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.5);
    });
  }

  playWindGust(): void {
    const ctx = this.ensureCtx();
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    source.connect(gain);
    gain.connect(this.masterGain!);
    source.start();
  }

  playPowerUp(): void {
    const ctx = this.ensureCtx();
    // Rising sparkle arpeggio
    const notes = [880, 1100, 1320, 1760];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.2);
    });
  }

  playShieldBreak(): void {
    const ctx = this.ensureCtx();
    // Electric shield break sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);

    // Shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 2000;
    gain2.gain.setValueAtTime(0.08, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.masterGain!);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.3);
  }

  playMeteorWhiz(): void {
    const ctx = this.ensureCtx();
    // Whooshing meteor flyby sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);

    // White noise whoosh
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.04;
    noise.connect(nGain);
    nGain.connect(this.masterGain!);
    noise.start();
  }

  playLevelWarp(): void {
    const ctx = this.ensureCtx();
    // Rising whoosh/warp sound for level transitions
    const notes = [220, 330, 440, 660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
  }

  private proximityOsc: OscillatorNode | null = null;
  private proximityGain: GainNode | null = null;
  private lastProxBeepTime = 0;

  playProximityBeep(altitude: number): void {
    // Beep frequency increases as altitude decreases
    if (altitude > 3 || altitude < 0) return;

    const now = performance.now();
    const interval = 200 + altitude * 300; // faster beeps when closer
    if (now - this.lastProxBeepTime < interval) return;
    this.lastProxBeepTime = now;

    const ctx = this.ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const freq = 800 + (3 - altitude) * 400; // higher pitch when closer
    osc.frequency.value = freq;
    const vol = Math.min(0.1, 0.03 + (3 - altitude) * 0.025);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  private lastFuelWarnTime = 0;

  playFuelWarning(): void {
    // Urgent double-beep when fuel is low
    const now = performance.now();
    if (now - this.lastFuelWarnTime < 1200) return;
    this.lastFuelWarnTime = now;

    const ctx = this.ensureCtx();
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1200;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  playWindWhistle(speed: number): void {
    // Wind whistle pitch varies with velocity
    if (speed < 1.5) return;
    const ctx = this.ensureCtx();
    const bufferSize = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Band-pass filtered noise approximation
    const pitchFactor = Math.min(speed / 8, 1);
    let prev = 0;
    for (let i = 0; i < bufferSize; i++) {
      const raw = Math.random() * 2 - 1;
      const env = Math.sin((i / bufferSize) * Math.PI);
      // Simple low-pass with variable cutoff
      prev = prev * (0.6 - pitchFactor * 0.3) + raw * (0.4 + pitchFactor * 0.3);
      data[i] = prev * env * 0.4;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 0.5 + pitchFactor * 1.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.02 + pitchFactor * 0.03;
    source.connect(gain);
    gain.connect(this.masterGain!);
    source.start();
  }
}
