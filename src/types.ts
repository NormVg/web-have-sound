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

export type AmbientType = "loading";

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

/** Built-in feel name, or any string registered via `registerFeel`. */
export type FeelId = FeelType | (string & {});

export interface FeelParams {
    filterFreq: number;
    q: number;
    oscType: OscillatorType;
    decayMult: number;
    gainMult: number;
    pitchMult: number;
    /** Stereo pan, -1 (left) to 1 (right). Default 0. */
    pan?: number;
    /** Attack time multiplier. Default 1. */
    attackMult?: number;
    /** Sustain gain level (0–1) relative to peak. Default 0.6. */
    sustainLevel?: number;
    /** Release time multiplier. Default 1. */
    releaseMult?: number;
}

/** Fully resolved feel params (defaults applied). What synths receive. */
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
 * Context passed to every sound synthesizer (built-in and custom).
 * Always route audio through `connect()` so pan stays correct.
 */
export interface SoundSynthContext {
    ctx: AudioContext;
    /** Schedule start = ctx.currentTime */
    time: number;
    params: ResolvedFeelParams;
    /**
     * Absolute gain scale: `gainMult * masterVolume`.
     * Multiply your peak levels by this (e.g. `0.3 * volume`).
     */
    volume: number;
    /** Connect a node into the panned output chain. */
    connect: (node: AudioNode) => void;
}

export type SoundSynthFn = (synth: SoundSynthContext) => void;

export interface RegisterSoundOptions {
    /** Min ms between plays. Default 0. */
    throttleMs?: number;
    /**
     * Default DOM event for `bindUISounds` when `data-uisound-event` is omitted.
     * Default: `"click"`.
     */
    defaultEvent?: string;
    /** If true, usable with startAmbient (looping bed). */
    ambient?: boolean;
}

export interface UISoundsConfig {
    /** Global feel (name or raw params). Default: "aero". */
    feel?: FeelId | FeelParams;
    /** Master volume 0–1. Default: 1. */
    volume?: number;
    /** Master mute. Default: true (enabled). */
    enabled?: boolean;
    /** ±~4% pitch/timing jitter. Default: false. */
    randomize?: boolean;
    /**
     * Per-sound throttle overrides (ms).
     * Pass 0 to disable. Works for custom names too.
     */
    throttleMs?: Partial<Record<string, number>>;
    /**
     * Dev warnings for unknown sounds/feels, bad registration, no audio, etc.
     * Never throws from play paths. Default: false.
     * Tip: `debug: import.meta.env.DEV` or `process.env.NODE_ENV !== 'production'`.
     */
    debug?: boolean;
}

export interface PlayOptions {
    /** Feel name, or raw FeelParams. */
    feel?: FeelId | FeelParams;
    /** Stereo pan -1…1 for this play only. */
    pan?: number;
    /** Override global randomize. */
    randomize?: boolean;
    /** Custom AudioContext. */
    ctx?: AudioContext;
}

export type PlayFailReason =
    | "muted"
    | "ssr"
    | "throttled"
    | "unknown"
    | "no-audio"
    | "error";

export type PlayResult =
    | { ok: true }
    | { ok: false; reason: PlayFailReason };

export interface BindUISoundsOptions {
    /** Root to bind within. Default: document. */
    root?: ParentNode;
    /** Event listener capture phase. Default: false. */
    capture?: boolean;
}

/** Internal catalog entry for a sound. */
export interface SoundEntry {
    synth: SoundSynthFn;
    throttleMs: number;
    defaultEvent: string;
    ambient: boolean;
    /** True for library-shipped sounds (cannot unregister). */
    builtin: boolean;
}

export interface AmbientHandle {
    id: string;
    stopSources: Array<{ stop: (when?: number) => void }>;
    gain: GainNode;
    ctx: AudioContext;
}
