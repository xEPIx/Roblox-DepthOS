/**
 * Procedural Web Audio Sound System
 * Generates authentic Roblox-style sound effects & procedural background music
 * Zero external audio files (100% synthesized in Web Audio API)
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private currentNoteIndex: number = 0;

  constructor() {
    // Initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * The iconic Roblox "OOF!" sound
   * Synthesized with a multi-harmonic vocal drop + formant filter
   */
  public playOof() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Body vocal oscillator (sawtooth softened through bandpass)
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    // Pitch drops from ~350Hz down to ~150Hz
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

    // Formant filter (mouth cavity vowel simulation 'Uh-oo-f')
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.exponentialRampToValueAtTime(320, t + 0.18);
    filter.Q.setValueAtTime(3.5, t);

    // Envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.9, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    // Subtle breath noise puff
    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(450, t);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.23);
    noise.stop(t + 0.13);
  }

  /**
   * Classic Roblox jump boing / boop
   */
  public playJump() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.11);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Checkpoint pad touched chime (two harmonic bells)
   */
  public playCheckpoint() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const startTime = t + idx * 0.06;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  }

  /**
   * Blox-bux / Coin pickup ping
   */
  public playCoin() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.07); // E6

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  /**
   * Speed coil activate whoosh & sparkle
   */
  public playSpeedCoil() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  /**
   * Gravity coil high spring boing
   */
  public playGravityCoil() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(560, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.41);
  }

  /**
   * Sword Slash
   */
  public playSwordSlash() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Sword Hit / Impact
   */
  public playSwordHit() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Bloxy Cola Slurp / Chug
   */
  public playCola() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Pop
    const popOsc = this.ctx.createOscillator();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(450, t);
    popOsc.frequency.exponentialRampToValueAtTime(80, t + 0.05);

    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.4, t);
    popGain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);

    popOsc.start(t);
    popOsc.stop(t + 0.06);

    // Fizzy bubbles
    for (let i = 0; i < 3; i++) {
      const bubbleTime = t + 0.08 + i * 0.07;
      const bOsc = this.ctx.createOscillator();
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(600 + i * 150, bubbleTime);
      bOsc.frequency.exponentialRampToValueAtTime(1100 + i * 200, bubbleTime + 0.05);

      const bGain = this.ctx.createGain();
      bGain.gain.setValueAtTime(0.18, bubbleTime);
      bGain.gain.exponentialRampToValueAtTime(0.001, bubbleTime + 0.06);

      bOsc.connect(bGain);
      bGain.connect(this.sfxGain);

      bOsc.start(bubbleTime);
      bOsc.stop(bubbleTime + 0.07);
    }
  }

  /**
   * Jump pad launch boing
   */
  public playJumpPad() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  /**
   * Procedural Happy Roblox Upbeat Theme Song
   */
  public startMusic() {
    this.initCtx();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Upbeat pentatonic happy melody
    const melody = [
      { note: 261.63, dur: 0.16 }, // C4
      { note: 329.63, dur: 0.16 }, // E4
      { note: 392.00, dur: 0.16 }, // G4
      { note: 523.25, dur: 0.24 }, // C5
      { note: 392.00, dur: 0.16 }, // G4
      { note: 440.00, dur: 0.24 }, // A4
      { note: 392.00, dur: 0.32 }, // G4
      { note: 329.63, dur: 0.16 }, // E4
      { note: 293.66, dur: 0.16 }, // D4
      { note: 329.63, dur: 0.16 }, // E4
      { note: 392.00, dur: 0.24 }, // G4
      { note: 293.66, dur: 0.36 }, // D4
      { note: 261.63, dur: 0.16 }, // C4
      { note: 329.63, dur: 0.16 }, // E4
      { note: 392.00, dur: 0.16 }, // G4
      { note: 587.33, dur: 0.24 }, // D5
      { note: 523.25, dur: 0.45 }, // C5
    ];

    const bass = [130.81, 164.81, 174.61, 196.00]; // C3, E3, F3, G3

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const t = this.ctx.currentTime;
      const noteData = melody[this.currentNoteIndex % melody.length];

      // Lead synth (soft square)
      const lead = this.ctx.createOscillator();
      lead.type = 'sine';
      lead.frequency.setValueAtTime(noteData.note, t);

      const leadGain = this.ctx.createGain();
      leadGain.gain.setValueAtTime(0.12, t);
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + noteData.dur);

      lead.connect(leadGain);
      leadGain.connect(this.musicGain);
      lead.start(t);
      lead.stop(t + noteData.dur + 0.05);

      // Bass note every 2 steps
      if (this.currentNoteIndex % 2 === 0) {
        const bassFreq = bass[(this.currentNoteIndex / 2) % bass.length];
        const bassOsc = this.ctx.createOscillator();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        const bGain = this.ctx.createGain();
        bGain.gain.setValueAtTime(0.16, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        bassOsc.connect(bGain);
        bGain.connect(this.musicGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.35);
      }

      this.currentNoteIndex++;
    }, 220);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const sound = new SoundSystem();
