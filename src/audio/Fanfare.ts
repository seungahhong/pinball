const NOTES = [523.25, 659.25, 783.99, 1046.5] as const;

interface ToneConfig {
  type: OscillatorType;
  freqStart: number;
  freqEnd: number;
  freqRampDuration: number;
  gainStart: number;
  gainEnd: number;
  gainRampDuration: number;
  duration: number;
}

export class Fanfare {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  async resume(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  private playTone(config: ToneConfig, startTime: number): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = config.type;
    osc.frequency.setValueAtTime(config.freqStart, startTime);
    if (config.freqEnd !== config.freqStart) {
      osc.frequency.exponentialRampToValueAtTime(
        config.freqEnd,
        startTime + config.freqRampDuration,
      );
    }
    gain.gain.setValueAtTime(config.gainStart, startTime);
    gain.gain.exponentialRampToValueAtTime(config.gainEnd, startTime + config.gainRampDuration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + config.duration);
  }

  play(): void {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const durations = [0.2, 0.2, 0.2, 0.5];

    let offset = 0;
    NOTES.forEach((freq, i) => {
      this.playTone(
        {
          type: 'triangle',
          freqStart: freq,
          freqEnd: freq,
          freqRampDuration: 0,
          gainStart: 0.25,
          gainEnd: 0.01,
          gainRampDuration: durations[i] + 0.3,
          duration: durations[i] + 0.4,
        },
        now + offset,
      );
      this.playTone(
        {
          type: 'sine',
          freqStart: freq * 1.25,
          freqEnd: freq * 1.25,
          freqRampDuration: 0,
          gainStart: 0.1,
          gainEnd: 0.01,
          gainRampDuration: durations[i] + 0.2,
          duration: durations[i] + 0.3,
        },
        now + offset,
      );
      offset += durations[i];
    });

    NOTES.forEach((freq) => {
      this.playTone(
        {
          type: 'triangle',
          freqStart: freq,
          freqEnd: freq,
          freqRampDuration: 0,
          gainStart: 0.15,
          gainEnd: 0.001,
          gainRampDuration: 1.5,
          duration: 1.6,
        },
        now + offset,
      );
    });
  }

  playSwitch(): void {
    if (this.ctx?.state === 'suspended') return;
    const now = this.ensureContext().currentTime;
    this.playTone(
      {
        type: 'square',
        freqStart: 800,
        freqEnd: 400,
        freqRampDuration: 0.15,
        gainStart: 0.1,
        gainEnd: 0.01,
        gainRampDuration: 0.2,
        duration: 0.25,
      },
      now,
    );
  }

  playObstacle(): void {
    if (this.ctx?.state === 'suspended') return;
    const now = this.ensureContext().currentTime;
    this.playTone(
      {
        type: 'sawtooth',
        freqStart: 200,
        freqEnd: 100,
        freqRampDuration: 0.3,
        gainStart: 0.08,
        gainEnd: 0.01,
        gainRampDuration: 0.35,
        duration: 0.4,
      },
      now,
    );
  }

  playFlip(): void {
    if (this.ctx?.state === 'suspended') return;
    const now = this.ensureContext().currentTime;
    // Low rumble
    this.playTone(
      {
        type: 'sawtooth',
        freqStart: 60,
        freqEnd: 30,
        freqRampDuration: 0.6,
        gainStart: 0.15,
        gainEnd: 0.01,
        gainRampDuration: 0.8,
        duration: 0.9,
      },
      now,
    );
    // Impact crack
    this.playTone(
      {
        type: 'square',
        freqStart: 300,
        freqEnd: 50,
        freqRampDuration: 0.2,
        gainStart: 0.12,
        gainEnd: 0.01,
        gainRampDuration: 0.4,
        duration: 0.5,
      },
      now + 0.1,
    );
  }

  playGravityReverse(): void {
    if (this.ctx?.state === 'suspended') return;
    const now = this.ensureContext().currentTime;
    // Ascending sweep
    this.playTone(
      {
        type: 'sine',
        freqStart: 100,
        freqEnd: 800,
        freqRampDuration: 0.6,
        gainStart: 0.15,
        gainEnd: 0.01,
        gainRampDuration: 0.8,
        duration: 0.9,
      },
      now,
    );
    // Harmonic shimmer
    this.playTone(
      {
        type: 'triangle',
        freqStart: 200,
        freqEnd: 1200,
        freqRampDuration: 0.5,
        gainStart: 0.08,
        gainEnd: 0.01,
        gainRampDuration: 0.7,
        duration: 0.8,
      },
      now + 0.1,
    );
  }

  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  startAmbientLoop(): void {
    if (this.ambientOsc) return;
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    this.ambientOsc = osc;
    this.ambientGain = gain;
  }

  stopAmbientLoop(): void {
    if (!this.ambientOsc || !this.ambientGain) return;
    const ctx = this.ensureContext();
    this.ambientGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    const osc = this.ambientOsc;
    const gain = this.ambientGain;
    setTimeout(() => {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
      gain.disconnect();
    }, 400);
    this.ambientOsc = null;
    this.ambientGain = null;
  }
}
