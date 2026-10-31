import { KeyboardSoundpack } from '../types/depthos';

/**
 * DepthOS Procedural Web Audio Engine
 * Zero external audio files — 100% synthesized through Web Audio API
 */
class DepthOSAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private fanGain: GainNode | null = null;
  private fanOsc: OscillatorNode | null = null;
  private fanFilter: BiquadFilterNode | null = null;
  private surgeGain: GainNode | null = null;
  private surgeOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;

  private isMuted: boolean = false;
  private isSurgeActive: boolean = false;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Continuous Fan Bus
      this.fanGain = this.ctx.createGain();
      this.fanGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.fanGain.connect(this.masterGain);

      this.fanFilter = this.ctx.createBiquadFilter();
      this.fanFilter.type = 'lowpass';
      this.fanFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.fanFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);
      this.fanFilter.connect(this.fanGain);

      this.fanOsc = this.ctx.createOscillator();
      this.fanOsc.type = 'triangle';
      this.fanOsc.frequency.setValueAtTime(75, this.ctx.currentTime);
      this.fanOsc.connect(this.fanFilter);
      this.fanOsc.start();

      // Surge Alarm Bus
      this.surgeGain = this.ctx.createGain();
      this.surgeGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.surgeGain.connect(this.masterGain);

      this.surgeOsc = this.ctx.createOscillator();
      this.surgeOsc.type = 'sawtooth';
      this.surgeOsc.frequency.setValueAtTime(880, this.ctx.currentTime);

      const surgeFilter = this.ctx.createBiquadFilter();
      surgeFilter.type = 'bandpass';
      surgeFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      surgeFilter.Q.setValueAtTime(4, this.ctx.currentTime);

      this.surgeOsc.connect(surgeFilter);
      surgeFilter.connect(this.surgeGain);
      this.surgeOsc.start();

      // Ambient low drone
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.ambientOsc = this.ctx.createOscillator();
      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.ambientOsc.connect(this.ambientGain);
      this.ambientOsc.start();

      this.isInitialized = true;
    } catch {
      // AudioContext policy fallback
    }
  }

  public ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(sfx: number, music: number) {
    if (this.ctx && this.sfxGain && this.ambientGain) {
      this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
      this.ambientGain.gain.setTargetAtTime(music * 0.05, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Update fan hum pitch and volume based on Heat (25°C to 100°C)
   */
  public updateHeatAudio(heat: number, inSurge: boolean) {
    if (!this.ctx || !this.fanOsc || !this.fanFilter || !this.fanGain) return;
    const t = this.ctx.currentTime;

    // Pitch multiplier: 0.8 at 25°C up to 2.4 at 100°C
    const normalized = Math.max(0, Math.min(1, (heat - 25) / 75));
    const baseFreq = 70 + normalized * 180; // 70Hz to 250Hz
    const cutoff = 120 + normalized * 650;  // Filter opens up as heat rises
    const fanVol = 0.04 + normalized * 0.12;

    this.fanOsc.frequency.setTargetAtTime(baseFreq, t, 0.1);
    this.fanFilter.frequency.setTargetAtTime(cutoff, t, 0.1);
    this.fanGain.gain.setTargetAtTime(fanVol, t, 0.1);

    // Thermal Surge Warble / Alarm
    if (this.surgeGain && this.surgeOsc) {
      if (inSurge) {
        this.isSurgeActive = true;
        const surgeIntensity = Math.min(1, Math.max(0, (heat - 85) / 15));
        const warbleFreq = 800 + Math.sin(t * 12) * 200 + surgeIntensity * 300;
        this.surgeOsc.frequency.setTargetAtTime(warbleFreq, t, 0.05);
        this.surgeGain.gain.setTargetAtTime(0.04 + surgeIntensity * 0.08, t, 0.05);
      } else if (this.isSurgeActive) {
        this.isSurgeActive = false;
        this.surgeGain.gain.setTargetAtTime(0, t, 0.1);
      }
    }
  }

  /**
   * Mechanical Process Click
   */
  public playProcessClick(soundpack: KeyboardSoundpack, isCritical: boolean = false) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    if (soundpack === 'cherry_blue') {
      // Crisp mechanical tactile click
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      const pitch = isCritical ? 1400 : 900 + (Math.random() * 120 - 60);
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.035);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isCritical ? 0.45 : 0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.045);
    } else if (soundpack === 'ibm_model_m') {
      // Heavy buckling spring clack
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320 + Math.random() * 40, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.07);
    } else if (soundpack === 'laser_synth') {
      // Futuristic zap
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isCritical ? 2400 : 1600, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.065);
    } else {
      // Retro bubble
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(750, t + 0.04);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  /**
   * Flush Started & Channel Loop
   */
  public playFlushChime() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Harmonic high-speed transfer chime
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = t + idx * 0.04;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  /**
   * Fatal BSOD Overheat Crash
   */
  public playBSODCrash() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Sub-bass pop
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.5);

    // Harsh glitch static noise
    const bufferSize = this.ctx.sampleRate * 0.35;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.36);
  }

  /**
   * Emergency Cryogenic Nitrogen Vent
   */
  public playCryoVent() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.8;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.86);
  }

  /**
   * Upgrade purchased sound
   */
  public playUpgradeSound() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(659.25, t + 0.08);
    osc.frequency.setValueAtTime(880, t + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.33);
  }
}

export const audio = new DepthOSAudioEngine();
