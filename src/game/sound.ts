import type { SoundCue } from './types'

const BACKGROUND_MUSIC_LOOP_SECONDS = 8
const MAX_INSTRUMENT_SAMPLE_CACHE_ENTRIES = 64

export type BackgroundMusicTheme = 'neutral' | 'classic' | 'mahjong' | 'arcade' | 'puzzle'

type MidiInstrument = 'warmBass' | 'electricPiano' | 'softPad' | 'pluckedString' | 'mallet' | 'bell' | 'arcadeBass' | 'arcadeLead'

interface InstrumentPatch {
  partials: Array<[ratio: number, gain: number]>
  attack: number
  decay: number
  sustain: number
  release: number
  noise: number
  tremolo: number
}

interface BackgroundMusicPattern {
  bassNotes: number[]
  upperNotes: number[]
  melodyNotes: number[]
  accentNotes: number[]
  bassInstrument: MidiInstrument
  upperInstrument: MidiInstrument
  melodyInstrument: MidiInstrument
  accentInstrument: MidiInstrument
  bassDuration: number
  upperDuration: number
  melodyDuration: number
  accentDuration: number
  upperOffset: number
  melodyOffset: number
  accentOffset: number
  bassGain: number
  upperGain: number
  melodyGain: number
  accentGain: number
  outputGain: number
}

const instrumentPatches: Record<MidiInstrument, InstrumentPatch> = {
  warmBass: {
    partials: [[1, 1], [2, 0.34], [3, 0.14], [4, 0.06]],
    attack: 0.015, decay: 1.8, sustain: 0.58, release: 0.16, noise: 0.008, tremolo: 0,
  },
  electricPiano: {
    partials: [[1, 1], [2, 0.52], [3, 0.22], [4, 0.12], [6, 0.06]],
    attack: 0.006, decay: 3.2, sustain: 0.24, release: 0.24, noise: 0.012, tremolo: 3.8,
  },
  softPad: {
    partials: [[1, 1], [2, 0.3], [3, 0.18], [5, 0.08]],
    attack: 0.075, decay: 0.7, sustain: 0.76, release: 0.36, noise: 0.004, tremolo: 0.65,
  },
  pluckedString: {
    partials: [[1, 1], [2, 0.68], [3, 0.38], [4, 0.24], [5, 0.14], [7, 0.08]],
    attack: 0.003, decay: 5.6, sustain: 0.07, release: 0.18, noise: 0.035, tremolo: 0,
  },
  mallet: {
    partials: [[1, 1], [2.01, 0.46], [3.98, 0.2], [6.03, 0.08]],
    attack: 0.002, decay: 6.4, sustain: 0.035, release: 0.2, noise: 0.02, tremolo: 0,
  },
  bell: {
    partials: [[1, 1], [2.01, 0.52], [2.99, 0.3], [4.12, 0.18], [5.43, 0.1]],
    attack: 0.002, decay: 4.8, sustain: 0.06, release: 0.26, noise: 0.006, tremolo: 0,
  },
  arcadeBass: {
    partials: [[1, 1], [2, 0.72], [3, 0.42], [5, 0.18], [7, 0.1]],
    attack: 0.004, decay: 3.4, sustain: 0.22, release: 0.12, noise: 0.004, tremolo: 0,
  },
  arcadeLead: {
    partials: [[1, 1], [2, 0.62], [3, 0.34], [4, 0.2], [6, 0.1]],
    attack: 0.003, decay: 4.2, sustain: 0.15, release: 0.14, noise: 0.003, tremolo: 7.5,
  },
}

const backgroundMusicPatterns: Record<BackgroundMusicTheme, BackgroundMusicPattern> = {
  neutral: {
    bassNotes: [45, 45, 47, 43, 45, 45, 50, 47],
    upperNotes: [57, 59, 62, 59, 57, 60, 64, 62],
    melodyNotes: [69, 71, 74, 71, 69, 72, 76, 74],
    accentNotes: [64, 66, 69, 66, 64, 67, 71, 69],
    bassInstrument: 'warmBass', upperInstrument: 'electricPiano', melodyInstrument: 'softPad', accentInstrument: 'mallet',
    bassDuration: 0.82, upperDuration: 0.42, melodyDuration: 0.24, accentDuration: 0.15,
    upperOffset: 0.34, melodyOffset: 0.66, accentOffset: 0.88,
    bassGain: 0.65, upperGain: 0.42, melodyGain: 0.2, accentGain: 0.14, outputGain: 1,
  },
  classic: {
    bassNotes: [43, 47, 50, 48, 45, 48, 52, 50],
    upperNotes: [55, 59, 62, 60, 57, 60, 64, 62],
    melodyNotes: [67, 69, 71, 72, 69, 71, 74, 72],
    accentNotes: [62, 64, 66, 67, 64, 66, 69, 67],
    bassInstrument: 'warmBass', upperInstrument: 'electricPiano', melodyInstrument: 'mallet', accentInstrument: 'bell',
    bassDuration: 0.92, upperDuration: 0.52, melodyDuration: 0.34, accentDuration: 0.18,
    upperOffset: 0.22, melodyOffset: 0.55, accentOffset: 0.84,
    bassGain: 0.68, upperGain: 0.4, melodyGain: 0.24, accentGain: 0.17, outputGain: 0.94,
  },
  mahjong: {
    bassNotes: [38, 38, 43, 45, 38, 40, 43, 38],
    upperNotes: [62, 64, 67, 69, 67, 64, 62, 59],
    melodyNotes: [74, 76, 79, 81, 79, 76, 74, 71],
    accentNotes: [81, 83, 86, 83, 81, 79, 76, 74],
    bassInstrument: 'warmBass', upperInstrument: 'pluckedString', melodyInstrument: 'pluckedString', accentInstrument: 'bell',
    bassDuration: 1.15, upperDuration: 0.72, melodyDuration: 0.28, accentDuration: 0.12,
    upperOffset: 0.08, melodyOffset: 0.46, accentOffset: 0.76,
    bassGain: 0.55, upperGain: 0.32, melodyGain: 0.2, accentGain: 0.12, outputGain: 0.88,
  },
  arcade: {
    bassNotes: [48, 52, 55, 52, 50, 55, 57, 55],
    upperNotes: [60, 64, 67, 64, 62, 67, 69, 67],
    melodyNotes: [72, 76, 79, 76, 74, 79, 81, 79],
    accentNotes: [76, 79, 83, 79, 77, 83, 84, 83],
    bassInstrument: 'arcadeBass', upperInstrument: 'arcadeLead', melodyInstrument: 'arcadeLead', accentInstrument: 'bell',
    bassDuration: 0.42, upperDuration: 0.28, melodyDuration: 0.18, accentDuration: 0.1,
    upperOffset: 0.18, melodyOffset: 0.46, accentOffset: 0.72,
    bassGain: 0.42, upperGain: 0.32, melodyGain: 0.18, accentGain: 0.12, outputGain: 0.9,
  },
  puzzle: {
    bassNotes: [41, 45, 48, 43, 41, 46, 50, 48],
    upperNotes: [60, 64, 67, 62, 60, 65, 69, 67],
    melodyNotes: [72, 76, 79, 74, 72, 77, 81, 79],
    accentNotes: [79, 83, 86, 81, 79, 84, 88, 86],
    bassInstrument: 'warmBass', upperInstrument: 'softPad', melodyInstrument: 'mallet', accentInstrument: 'bell',
    bassDuration: 1.05, upperDuration: 0.7, melodyDuration: 0.36, accentDuration: 0.2,
    upperOffset: 0.16, melodyOffset: 0.5, accentOffset: 0.8,
    bassGain: 0.52, upperGain: 0.32, melodyGain: 0.19, accentGain: 0.11, outputGain: 0.86,
  },
}

export interface AudioSettings {
  masterVolume: number
  soundEffectsVolume: number
  backgroundMusicVolume: number
  soundEffectsEnabled: boolean
  backgroundMusicEnabled: boolean
}

export const defaultAudioSettings: AudioSettings = {
  masterVolume: 0.65,
  soundEffectsVolume: 0.7,
  backgroundMusicVolume: 0.25,
  soundEffectsEnabled: true,
  backgroundMusicEnabled: false,
}

export const soundEventMap: Record<SoundCue, SoundCue> = {
  deal: 'deal',
  play: 'play',
  draw: 'draw',
  action: 'action',
  reverse: 'reverse',
  skip: 'skip',
  wild: 'wild',
  uno: 'uno',
  win: 'win',
  roundWin: 'roundWin',
  sessionWin: 'sessionWin',
  penaltyDraw: 'penaltyDraw',
  match: 'match',
  mismatch: 'mismatch',
  memoryFlip: 'memoryFlip',
  memoryMatch: 'memoryMatch',
  memoryTripleMatch: 'memoryTripleMatch',
  memoryMismatch: 'memoryMismatch',
  memoryAction: 'memoryAction',
  memoryWinnerTakesAll: 'memoryWinnerTakesAll',
  mahjongWallBuild: 'mahjongWallBuild',
  mahjongDraw: 'mahjongDraw',
  mahjongDiscard: 'mahjongDiscard',
  mahjongChow: 'mahjongChow',
  mahjongPong: 'mahjongPong',
  mahjongKong: 'mahjongKong',
  mahjongWin: 'mahjongWin',
  hardware: 'hardware',
  launcher: 'launcher',
  launcherBuild: 'launcherBuild',
  launcherFire: 'launcherFire',
  blastPressure: 'blastPressure',
  blastRelease: 'blastRelease',
  robotoBeep: 'robotoBeep',
  robotoInstruction: 'robotoInstruction',
  tippoWobble: 'tippoWobble',
  tippoTip: 'tippoTip',
  diceRoll: 'diceRoll',
  diceSettle: 'diceSettle',
  flash: 'flash',
  spin: 'spin',
  timeout: 'timeout',
  error: 'error',
}

export class SoundManager {
  private context: AudioContext | null = null
  private unlocked = false
  private masterVolume = defaultAudioSettings.masterVolume
  private soundEffectsVolume = defaultAudioSettings.soundEffectsVolume
  private backgroundMusicVolume = defaultAudioSettings.backgroundMusicVolume
  private soundEffectsEnabled = defaultAudioSettings.soundEffectsEnabled
  private backgroundMusicEnabled = defaultAudioSettings.backgroundMusicEnabled
  private backgroundMusicTheme: BackgroundMusicTheme = 'neutral'
  private soundEffectsCompressor: DynamicsCompressorNode | null = null
  private backgroundMusicGain: GainNode | null = null
  private backgroundMusicCompressor: DynamicsCompressorNode | null = null
  private backgroundMusicTimer: number | null = null
  private backgroundMusicSources: AudioScheduledSourceNode[] = []
  private instrumentSampleCache = new Map<string, AudioBuffer>()

  configure(settings: AudioSettings) {
    this.setMasterVolume(settings.masterVolume)
    this.setSoundEffectsVolume(settings.soundEffectsVolume)
    this.setBackgroundMusicVolume(settings.backgroundMusicVolume)
    this.setSoundEffectsEnabled(settings.soundEffectsEnabled)
    this.setBackgroundMusicEnabled(settings.backgroundMusicEnabled)
  }

  setMuted(muted: boolean) {
    this.setSoundEffectsEnabled(!muted)
  }

  setVolume(volume: number) {
    this.setMasterVolume(volume)
  }

  setMasterVolume(volume: number) {
    this.masterVolume = clampVolume(volume)
    this.syncBackgroundMusic()
  }

  setSoundEffectsVolume(volume: number) {
    this.soundEffectsVolume = clampVolume(volume)
  }

  setBackgroundMusicVolume(volume: number) {
    this.backgroundMusicVolume = clampVolume(volume)
    this.syncBackgroundMusic()
  }

  setSoundEffectsEnabled(enabled: boolean) {
    this.soundEffectsEnabled = enabled
  }

  setBackgroundMusicEnabled(enabled: boolean) {
    this.backgroundMusicEnabled = enabled
    this.syncBackgroundMusic()
  }

  setBackgroundMusicTheme(theme: BackgroundMusicTheme) {
    if (theme === this.backgroundMusicTheme) return
    this.backgroundMusicTheme = theme
    this.stopBackgroundMusic()
    this.syncBackgroundMusic()
  }

  unlock(): Promise<boolean> {
    const context = this.ensureContext()
    if (!context) return Promise.resolve(false)
    if (context.state !== 'running') {
      return context.resume().then(() => {
        this.unlocked = context.state === 'running'
        if (this.unlocked) this.syncBackgroundMusic()
        return this.unlocked
      }).catch(() => {
        this.unlocked = false
        return false
      })
    }
    this.unlocked = true
    this.syncBackgroundMusic()
    return Promise.resolve(true)
  }

  play(cue: SoundCue | undefined) {
    if (!cue || !this.soundEffectsEnabled) return
    const context = this.ensureContext()
    if (!context || (context.state === 'suspended' && !this.unlocked)) return
    const now = context.currentTime
    const gain = context.createGain()
    const profile = soundProfiles[soundEventMap[cue]]
    const effectiveVolume = this.masterVolume * this.soundEffectsVolume
    gain.gain.setValueAtTime(effectiveVolume * 0.0001, now)
    gain.gain.exponentialRampToValueAtTime(effectiveVolume * profile.gain, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration)
    gain.connect(this.ensureSoundEffectsOutput(context))

    profile.frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const noteStart = now + index * (profile.stagger ?? 0.055)
      oscillator.type = profile.type
      oscillator.frequency.setValueAtTime(frequency, noteStart)
      if (cue === 'launcher' || cue === 'launcherBuild') {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.55), now + 0.2 + index * 0.04)
      }
      if (cue === 'spin') {
        oscillator.frequency.linearRampToValueAtTime(frequency * 1.35, now + 0.08 + index * 0.035)
      }
      oscillator.connect(gain)
      oscillator.start(noteStart)
      oscillator.stop(noteStart + profile.noteLength)
    })
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    this.context ??= new AudioContextClass()
    return this.context
  }

  private ensureSoundEffectsOutput(context: AudioContext): DynamicsCompressorNode {
    if (this.soundEffectsCompressor) return this.soundEffectsCompressor
    const compressor = context.createDynamicsCompressor()
    compressor.threshold.value = -10
    compressor.knee.value = 8
    compressor.ratio.value = 8
    compressor.attack.value = 0.003
    compressor.release.value = 0.16
    compressor.connect(context.destination)
    this.soundEffectsCompressor = compressor
    return compressor
  }

  private syncBackgroundMusic() {
    if (!this.backgroundMusicEnabled || !this.unlocked) {
      this.stopBackgroundMusic()
      return
    }
    const context = this.ensureContext()
    if (!context || context.state !== 'running') return
    const gain = this.ensureBackgroundMusicGain(context)
    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    const pattern = backgroundMusicPatterns[this.backgroundMusicTheme]
    gain.gain.setTargetAtTime(this.masterVolume * this.backgroundMusicVolume * 0.42 * pattern.outputGain, now, 0.04)
    if (this.backgroundMusicTimer !== null) return
    this.scheduleBackgroundMusicLoop(context)
  }

  private ensureBackgroundMusicGain(context: AudioContext): GainNode {
    if (this.backgroundMusicGain && this.backgroundMusicCompressor) return this.backgroundMusicGain
    const gain = context.createGain()
    const compressor = context.createDynamicsCompressor()
    gain.gain.value = 0
    compressor.threshold.value = -12
    compressor.knee.value = 12
    compressor.ratio.value = 6
    compressor.attack.value = 0.004
    compressor.release.value = 0.22
    gain.connect(compressor)
    compressor.connect(context.destination)
    this.backgroundMusicGain = gain
    this.backgroundMusicCompressor = compressor
    return gain
  }

  private scheduleBackgroundMusicLoop(context: AudioContext) {
    const start = context.currentTime + 0.04
    const pattern = backgroundMusicPatterns[this.backgroundMusicTheme]
    pattern.bassNotes.forEach((midiNote, index) => {
      this.scheduleBackgroundMusicNote(context, start + index, midiNote, pattern.bassDuration, pattern.bassInstrument, pattern.bassGain)
      this.scheduleBackgroundMusicNote(context, start + index + pattern.upperOffset, pattern.upperNotes[index], pattern.upperDuration, pattern.upperInstrument, pattern.upperGain)
      this.scheduleBackgroundMusicNote(context, start + index + pattern.melodyOffset, pattern.melodyNotes[index], pattern.melodyDuration, pattern.melodyInstrument, pattern.melodyGain)
      this.scheduleBackgroundMusicNote(context, start + index + pattern.accentOffset, pattern.accentNotes[index], pattern.accentDuration, pattern.accentInstrument, pattern.accentGain)
    })
    this.backgroundMusicTimer = window.setTimeout(() => {
      this.backgroundMusicTimer = null
      this.syncBackgroundMusic()
    }, (BACKGROUND_MUSIC_LOOP_SECONDS - 0.12) * 1000)
  }

  private scheduleBackgroundMusicNote(context: AudioContext, start: number, midiNote: number, duration: number, instrument: MidiInstrument, gainAmount: number) {
    const musicGain = this.backgroundMusicGain
    if (!musicGain) return
    try {
      const source = context.createBufferSource()
      const noteGain = context.createGain()
      source.buffer = this.ensureInstrumentSample(context, midiNote, duration, instrument)
      noteGain.gain.setValueAtTime(gainAmount, start)
      source.connect(noteGain)
      noteGain.connect(musicGain)
      this.trackBackgroundMusicSource(source)
      source.start(start)
    } catch {
      this.scheduleFallbackMusicNote(context, start, midiNote, duration, instrument, gainAmount)
    }
  }

  private ensureInstrumentSample(context: AudioContext, midiNote: number, duration: number, instrument: MidiInstrument): AudioBuffer {
    const cacheKey = `${context.sampleRate}:${instrument}:${midiNote}:${duration.toFixed(3)}`
    const cached = this.instrumentSampleCache.get(cacheKey)
    if (cached) return cached

    const patch = instrumentPatches[instrument]
    const sampleDuration = duration + patch.release
    const frameCount = Math.ceil(sampleDuration * context.sampleRate)
    const buffer = context.createBuffer(1, frameCount, context.sampleRate)
    const samples = buffer.getChannelData(0)
    const frequency = midiNoteToFrequency(midiNote)
    const partialGain = patch.partials.reduce((total, [, gain]) => total + gain, 0)
    let noiseState = ((midiNote + 1) * 2654435761 + instrument.length * 1013904223) >>> 0

    for (let frame = 0; frame < frameCount; frame += 1) {
      const time = frame / context.sampleRate
      const envelope = instrumentEnvelope(patch, time, duration)
      let waveform = 0
      for (const [ratio, gain] of patch.partials) {
        waveform += Math.sin(Math.PI * 2 * frequency * ratio * time) * gain
      }
      noiseState = (noiseState * 1664525 + 1013904223) >>> 0
      const noise = ((noiseState / 0xffffffff) * 2 - 1) * patch.noise
      const tremolo = patch.tremolo > 0 ? 0.96 + Math.sin(Math.PI * 2 * patch.tremolo * time) * 0.04 : 1
      samples[frame] = ((waveform / partialGain) + noise) * envelope * tremolo * 0.92
    }

    if (this.instrumentSampleCache.size >= MAX_INSTRUMENT_SAMPLE_CACHE_ENTRIES) {
      const oldestCacheKey = this.instrumentSampleCache.keys().next().value
      if (oldestCacheKey) this.instrumentSampleCache.delete(oldestCacheKey)
    }
    this.instrumentSampleCache.set(cacheKey, buffer)
    return buffer
  }

  private scheduleFallbackMusicNote(context: AudioContext, start: number, midiNote: number, duration: number, instrument: MidiInstrument, gainAmount: number) {
    const musicGain = this.backgroundMusicGain
    if (!musicGain) return
    const oscillator = context.createOscillator()
    const noteGain = context.createGain()
    noteGain.gain.setValueAtTime(0.0001, start)
    noteGain.gain.exponentialRampToValueAtTime(gainAmount, start + 0.04)
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.type = fallbackOscillatorTypes[instrument]
    oscillator.frequency.setValueAtTime(midiNoteToFrequency(midiNote), start)
    oscillator.connect(noteGain)
    noteGain.connect(musicGain)
    this.trackBackgroundMusicSource(oscillator)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.04)
  }

  private trackBackgroundMusicSource(source: AudioScheduledSourceNode) {
    source.addEventListener('ended', () => {
      this.backgroundMusicSources = this.backgroundMusicSources.filter((activeSource) => activeSource !== source)
    })
    this.backgroundMusicSources.push(source)
  }

  private stopBackgroundMusic() {
    if (this.backgroundMusicTimer !== null) {
      window.clearTimeout(this.backgroundMusicTimer)
      this.backgroundMusicTimer = null
    }
    for (const source of this.backgroundMusicSources) {
      try {
        source.stop()
      } catch {
        // Sources that have already ended do not need further cleanup.
      }
    }
    this.backgroundMusicSources = []
    if (this.backgroundMusicGain && this.context) {
      const now = this.context.currentTime
      this.backgroundMusicGain.gain.cancelScheduledValues(now)
      this.backgroundMusicGain.gain.setTargetAtTime(0.0001, now, 0.02)
    }
  }
}

const fallbackOscillatorTypes: Record<MidiInstrument, OscillatorType> = {
  warmBass: 'sine',
  electricPiano: 'triangle',
  softPad: 'sine',
  pluckedString: 'triangle',
  mallet: 'sine',
  bell: 'sine',
  arcadeBass: 'square',
  arcadeLead: 'square',
}

function midiNoteToFrequency(note: number): number {
  return 440 * 2 ** ((note - 69) / 12)
}

function instrumentEnvelope(patch: InstrumentPatch, time: number, noteDuration: number): number {
  if (time < patch.attack) return time / patch.attack
  const decayTime = time - patch.attack
  const heldEnvelope = patch.sustain + (1 - patch.sustain) * Math.exp(-decayTime * patch.decay)
  if (time <= noteDuration) return heldEnvelope
  const releaseProgress = Math.min(1, (time - noteDuration) / patch.release)
  return heldEnvelope * (1 - releaseProgress) ** 2
}

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0
  return Math.max(0, Math.min(1, volume))
}

interface SoundProfile {
  frequencies: number[]
  duration: number
  noteLength: number
  gain: number
  type: OscillatorType
  stagger?: number
}

const soundProfiles: Record<SoundCue, SoundProfile> = {
  deal: { frequencies: [280, 360], duration: 0.2, noteLength: 0.16, gain: 0.75, type: 'triangle' },
  play: { frequencies: [420], duration: 0.16, noteLength: 0.13, gain: 0.62, type: 'triangle' },
  draw: { frequencies: [210], duration: 0.18, noteLength: 0.14, gain: 0.62, type: 'sine' },
  action: { frequencies: [180, 460], duration: 0.22, noteLength: 0.16, gain: 0.72, type: 'triangle' },
  reverse: { frequencies: [520, 280], duration: 0.24, noteLength: 0.16, gain: 0.68, type: 'triangle' },
  skip: { frequencies: [600, 300], duration: 0.22, noteLength: 0.13, gain: 0.68, type: 'square' },
  wild: { frequencies: [320, 520, 740], duration: 0.3, noteLength: 0.15, gain: 0.72, type: 'triangle' },
  uno: { frequencies: [660, 880], duration: 0.28, noteLength: 0.16, gain: 0.82, type: 'triangle' },
  win: { frequencies: [440, 660, 880, 1100], duration: 0.42, noteLength: 0.18, gain: 0.85, type: 'triangle' },
  roundWin: { frequencies: [440, 660, 880, 1100], duration: 0.48, noteLength: 0.18, gain: 0.86, type: 'triangle' },
  sessionWin: { frequencies: [392, 523, 659, 784, 1047], duration: 0.72, noteLength: 0.2, gain: 0.88, type: 'triangle' },
  penaltyDraw: { frequencies: [190, 170, 150, 130], duration: 0.42, noteLength: 0.1, gain: 0.72, type: 'sawtooth' },
  match: { frequencies: [520, 740, 980], duration: 0.28, noteLength: 0.12, gain: 0.74, type: 'triangle' },
  mismatch: { frequencies: [260, 190], duration: 0.26, noteLength: 0.14, gain: 0.68, type: 'sine' },
  memoryFlip: { frequencies: [310, 430], duration: 0.17, noteLength: 0.08, gain: 0.52, type: 'triangle' },
  memoryMatch: { frequencies: [520, 660, 880], duration: 0.34, noteLength: 0.13, gain: 0.72, type: 'triangle' },
  memoryTripleMatch: { frequencies: [440, 590, 740, 990], duration: 0.42, noteLength: 0.14, gain: 0.76, type: 'triangle' },
  memoryMismatch: { frequencies: [280, 230, 180], duration: 0.34, noteLength: 0.12, gain: 0.64, type: 'sine' },
  memoryAction: { frequencies: [180, 360, 720], duration: 0.4, noteLength: 0.16, gain: 0.74, type: 'sawtooth' },
  memoryWinnerTakesAll: { frequencies: [330, 494, 659, 988, 1318], duration: 0.68, noteLength: 0.2, gain: 0.86, type: 'triangle' },
  mahjongWallBuild: { frequencies: [190, 260, 215, 295, 235, 320], duration: 0.52, noteLength: 0.075, gain: 0.64, type: 'triangle', stagger: 0.065 },
  mahjongDraw: { frequencies: [430, 270], duration: 0.18, noteLength: 0.07, gain: 0.58, type: 'triangle', stagger: 0.045 },
  mahjongDiscard: { frequencies: [310, 170], duration: 0.22, noteLength: 0.09, gain: 0.68, type: 'triangle', stagger: 0.035 },
  mahjongChow: { frequencies: [440, 554.37, 659.25], duration: 0.34, noteLength: 0.14, gain: 0.69, type: 'triangle', stagger: 0.055 },
  mahjongPong: { frequencies: [330, 330, 494], duration: 0.36, noteLength: 0.13, gain: 0.74, type: 'triangle', stagger: 0.07 },
  mahjongKong: { frequencies: [220, 330, 440, 660], duration: 0.5, noteLength: 0.2, gain: 0.78, type: 'triangle', stagger: 0.045 },
  mahjongWin: { frequencies: [110, 220, 329.63, 440, 659.25], duration: 1.2, noteLength: 1.05, gain: 0.26, type: 'sine', stagger: 0 },
  hardware: { frequencies: [120, 240, 360], duration: 0.34, noteLength: 0.18, gain: 0.78, type: 'sawtooth' },
  launcher: { frequencies: [160, 110, 260], duration: 0.34, noteLength: 0.22, gain: 0.82, type: 'sawtooth' },
  launcherBuild: { frequencies: [105, 145, 190, 245], duration: 0.46, noteLength: 0.16, gain: 0.72, type: 'sawtooth' },
  launcherFire: { frequencies: [92, 68, 172], duration: 0.42, noteLength: 0.2, gain: 0.86, type: 'sawtooth' },
  blastPressure: { frequencies: [112, 136], duration: 0.3, noteLength: 0.18, gain: 0.7, type: 'sine' },
  blastRelease: { frequencies: [84, 126, 210, 294], duration: 0.44, noteLength: 0.13, gain: 0.84, type: 'sawtooth' },
  robotoBeep: { frequencies: [920, 920], duration: 0.2, noteLength: 0.07, gain: 0.56, type: 'square' },
  robotoInstruction: { frequencies: [420, 560, 720], duration: 0.32, noteLength: 0.1, gain: 0.62, type: 'square' },
  tippoWobble: { frequencies: [245, 205, 245], duration: 0.32, noteLength: 0.11, gain: 0.66, type: 'triangle' },
  tippoTip: { frequencies: [132, 96, 178], duration: 0.38, noteLength: 0.15, gain: 0.78, type: 'sawtooth' },
  diceRoll: { frequencies: [340, 280, 410, 320], duration: 0.34, noteLength: 0.07, gain: 0.62, type: 'triangle' },
  diceSettle: { frequencies: [520, 660], duration: 0.22, noteLength: 0.1, gain: 0.58, type: 'sine' },
  flash: { frequencies: [920, 640, 920], duration: 0.25, noteLength: 0.08, gain: 0.64, type: 'square' },
  spin: { frequencies: [360, 520, 680, 520], duration: 0.34, noteLength: 0.12, gain: 0.7, type: 'triangle' },
  timeout: { frequencies: [140, 120, 90], duration: 0.36, noteLength: 0.13, gain: 0.76, type: 'sawtooth' },
  error: { frequencies: [120], duration: 0.2, noteLength: 0.18, gain: 0.68, type: 'sawtooth' },
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
