import type { ResolvedFeelParams, SynthContext } from "../types";
import { clamp } from "../utils";

export function safeOscType(
    type: OscillatorType,
    fallback: OscillatorType = "sine"
): OscillatorType {
    return type || fallback;
}

/**
 * ADSR-ish exponential envelope.
 * @returns total duration in seconds from `time`
 */
export function envelope(
    gain: GainNode,
    time: number,
    peak: number,
    params: ResolvedFeelParams,
    baseDuration: number
): number {
    const attack = Math.max(0.001, 0.01 * params.attackMult);
    const release = Math.max(0.01, baseDuration * params.releaseMult * params.decayMult);
    const sustain = peak * clamp(params.sustainLevel, 0, 1);
    const sustainEnd = time + attack + Math.max(0, baseDuration * params.decayMult * 0.35);

    gain.gain.cancelScheduledValues(time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), time + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), sustainEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, sustainEnd + release);

    return sustainEnd + release - time;
}

export interface NoiseBurstOptions {
    duration: number;
    expDiv: number;
    filterType: BiquadFilterType;
    filterFreq: number;
    peak: number;
    freqRampTo?: number;
    q?: number;
}

/** Filtered noise burst (click/tick/hover body). */
export function noiseBurst(s: SynthContext, opts: NoiseBurstOptions): void {
    const { ctx, time, params, connect } = s;
    const duration = Math.max(opts.duration * params.decayMult, 0.001);
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (opts.expDiv * params.decayMult));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType;
    filter.frequency.value = opts.filterFreq;
    filter.Q.value = opts.q ?? params.q;
    if (opts.freqRampTo !== undefined) {
        filter.frequency.setValueAtTime(opts.filterFreq, time);
        filter.frequency.exponentialRampToValueAtTime(
            Math.max(opts.freqRampTo, 40),
            time + duration
        );
    }

    const gain = ctx.createGain();
    gain.gain.value = opts.peak;

    noise.connect(filter);
    filter.connect(gain);
    connect(gain);
    noise.start(time);
}

export interface ToneOptions {
    freq: number;
    endFreq?: number;
    duration: number;
    peak: number;
    oscType?: OscillatorType;
    /** If false, use simple attack/release instead of full ADSR helper. Default true. */
    useEnvelope?: boolean;
    startOffset?: number;
    filterFreq?: number;
    filterType?: BiquadFilterType;
}

/** Single oscillator tone with optional pitch ramp + envelope. */
export function tone(s: SynthContext, opts: ToneOptions): number {
    const { ctx, time, params, connect } = s;
    const start = time + (opts.startOffset ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = safeOscType(opts.oscType ?? params.oscType);

    osc.frequency.setValueAtTime(Math.max(opts.freq, 20), start);
    if (opts.endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
            Math.max(opts.endFreq, 20),
            start + opts.duration * params.decayMult
        );
    }

    let node: AudioNode = osc;
    if (opts.filterFreq !== undefined) {
        const filter = ctx.createBiquadFilter();
        filter.type = opts.filterType ?? "lowpass";
        filter.frequency.value = opts.filterFreq;
        osc.connect(filter);
        node = filter;
    }

    let dur: number;
    if (opts.useEnvelope === false) {
        const attack = Math.max(0.001, 0.01 * params.attackMult);
        const release = opts.duration * params.decayMult * params.releaseMult;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(opts.peak, 0.0001), start + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + release);
        dur = release;
    } else {
        // envelope schedules from `start` — temporarily offset by scheduling on gain at start
        // applyEnvelope uses absolute time; pass start as time base
        dur = envelope(gain, start, opts.peak, params, opts.duration);
    }

    node.connect(gain);
    connect(gain);
    osc.start(start);
    osc.stop(start + dur + 0.02);
    return dur;
}

export interface ChordNoteOptions {
    notes: number[];
    spacing: number;
    peak: number;
    duration: number;
    oscType?: OscillatorType;
}

/** Staggered chord / arpeggio of pure tones. */
export function chord(s: SynthContext, opts: ChordNoteOptions): void {
    const { ctx, time, params, connect } = s;
    const oscType =
        opts.oscType ??
        (params.oscType === "square" ? "triangle" : safeOscType(params.oscType));

    opts.notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscType;
        osc.frequency.value = freq;
        const start = time + i * opts.spacing * params.decayMult;
        const attack = Math.max(0.001, 0.01 * params.attackMult);
        const release = opts.duration * params.decayMult * params.releaseMult;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(opts.peak, 0.0001), start + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + release);
        osc.connect(gain);
        connect(gain);
        osc.start(start);
        osc.stop(start + release + 0.02);
    });
}

/** Shared helpers for custom sound authors (and internal builtins). */
export const synthHelpers = {
    clamp,
    envelope,
    noiseBurst,
    tone,
    chord,
    safeOscType,
};
