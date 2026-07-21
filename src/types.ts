// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SoundType =
    | "click"
    | "pop"
    | "toggle"
    | "tick"
    | "drop"
    | "success"
    | "error"
    | "warning"
    | "startup"
    | "hover"
    | "press"
    | "release"
    | "select"
    | "deselect"
    | "delete"
    | "remove"
    | "notify"
    | "keystroke"
    | "connect"
    | "disconnect";

/** Built-in sound name, or any string registered via `registerSound`. */
export type SoundId = SoundType | (string & {});

/** Built-in long-running beds. Custom: any string via `registerLoop`. */
export type BuiltInLoopType = "loading" | "processing" | "pulse" | "hum";

/** @deprecated Use BuiltInLoopType | LoopId */
export type AmbientType = BuiltInLoopType;

export type LoopId = BuiltInLoopType | (string & {});

export type FeelType =
    | "soft"
    | "aero"
    | "arcade"
    | "organic"
    | "glass"
    | "industrial"
    | "minimal"
    | "retro"
    | "crisp";

export type FeelId = FeelType | (string & {});

export interface FeelParams {
    filterFreq: number;
    q: number;
    oscType: OscillatorType;
    decayMult: number;
    gainMult: number;
    pitchMult: number;
    pan?: number;
    attackMult?: number;
    sustainLevel?: number;
    releaseMult?: number;
}

export interface ResolvedFeelParams {
    filterFreq: number;
    q: number;
    oscType: OscillatorType;
    decayMult: number;
    gainMult: number;
    pitchMult: number;
    pan: number;
    attackMult: number;
    sustainLevel: number;
    releaseMult: number;
}

/**
 * Shared context for one-shot and loop synthesizers.
 *
 * Gain model (clean graph):
 *   synth peaks use `volume` (= feel `gainMult` only)
 *   → optional pan
 *   → loop bus (loops only, carries loopVolume + fade)
 *   → engine master bus (masterVolume, live)
 *   → destination
 *
 * Always route nodes through `connect()` so pan/master stay correct.
 */
export interface SynthContext {
    ctx: AudioContext;
    /** Schedule start = ctx.currentTime */
    time: number;
    params: ResolvedFeelParams;
    /**
     * Feel gain scale only (`params.gainMult`).
     * Do **not** multiply by master volume — the engine master bus handles that.
     */
    volume: number;
    /** Connect a node into the output chain (pan → master). */
    connect: (node: AudioNode) => void;
}

/** @deprecated Alias of SynthContext */
export type SoundSynthContext = SynthContext;
/** @deprecated Alias of SynthContext */
export type LoopSynthContext = SynthContext;

export type SoundSynthFn = (synth: SynthContext) => void;

export interface LoopControl {
    sources?: Array<{ stop: (when?: number) => void }>;
    dispose?: () => void;
}

export type LoopSynthFn = (synth: SynthContext) => LoopControl | void;

export interface RegisterSoundOptions {
    throttleMs?: number;
    defaultEvent?: string;
}

export interface RegisterLoopOptions {
    fadeIn?: number;
    fadeOut?: number;
}

export interface StartLoopOptions {
    feel?: FeelId | FeelParams;
    pan?: number;
    /** Per-loop volume 0–1 (on top of master). Default 1. */
    volume?: number;
    fadeIn?: number;
    ctx?: AudioContext;
}

export interface StopLoopOptions {
    fadeOut?: number;
}

export interface UISoundsConfig {
    feel?: FeelId | FeelParams;
    volume?: number;
    enabled?: boolean;
    randomize?: boolean;
    throttleMs?: Partial<Record<string, number>>;
    debug?: boolean;
}

export interface PlayOptions {
    feel?: FeelId | FeelParams;
    pan?: number;
    randomize?: boolean;
    ctx?: AudioContext;
}

export type PlayFailReason =
    | "muted"
    | "ssr"
    | "throttled"
    | "unknown"
    | "no-audio"
    | "error";

export type PlayResult = { ok: true } | { ok: false; reason: PlayFailReason };

export interface BindUISoundsOptions {
    root?: ParentNode;
    capture?: boolean;
}

export interface SoundEntry {
    synth: SoundSynthFn;
    throttleMs: number;
    defaultEvent: string;
    builtin: boolean;
}

export interface LoopEntry {
    synth: LoopSynthFn;
    fadeIn: number;
    fadeOut: number;
    builtin: boolean;
}

export interface ActiveLoop {
    id: string;
    /** Per-loop bus (loopVolume + fade). Feeds into engine master. */
    bus: GainNode;
    ctx: AudioContext;
    sources: Array<{ stop: (when?: number) => void }>;
    dispose?: () => void;
    loopVolume: number;
    fadeOut: number;
}
