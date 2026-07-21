// ---------------------------------------------------------------------------
// Types
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

/**
 * Built-in sound name, or any string registered via `registerSound`.
 * `string & {}` keeps built-in autocomplete while allowing custom ids.
 */
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

/** Fully resolved params after defaults are applied (what custom synths receive). */
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

/** @deprecated Use ResolvedFeelParams */
type ResolvedParams = ResolvedFeelParams;

/**
 * Context passed to a custom sound synthesizer registered with `registerSound`.
 * Always connect audio nodes through `connect()` so pan / routing stay correct.
 */
export interface SoundSynthContext {
    /** Active AudioContext */
    ctx: AudioContext;
    /** `ctx.currentTime` at schedule start */
    time: number;
    /** Active feel (global, per-call, or registered), with randomization applied */
    params: ResolvedFeelParams;
    /**
     * Absolute gain scale already including `gainMult * masterVolume`.
     * Use as a multiplier on your peak gains (e.g. `0.3 * volume`).
     */
    volume: number;
    /** Connect a node into the output chain (handles stereo pan). */
    connect: (node: AudioNode) => void;
}

/** Custom one-shot sound implementation. */
export type SoundSynthFn = (synth: SoundSynthContext) => void;

export interface RegisterSoundOptions {
    /** Min ms between plays of this sound. Default 0 (no throttle). */
    throttleMs?: number;
    /**
     * Default DOM event for `bindUISounds` when `data-uisound-event` is omitted.
     * Default: `"click"`.
     */
    defaultEvent?: string;
}

export interface UISoundsConfig {
    /** Global feel preset, registered feel name, or raw params. Default: "aero". */
    feel?: FeelId | FeelParams;
    /** Master volume 0–1. Default: 1. */
    volume?: number;
    /** Global mute. Default: true (enabled). */
    enabled?: boolean;
    /** Jitter pitch/timing ±~4% on each play. Default: false. */
    randomize?: boolean;
    /**
     * Minimum ms between plays of the same sound type.
     * High-rate types (hover, keystroke) default to 150ms when not set.
     * Pass 0 to disable throttling for a type. Works for custom sound names too.
     */
    throttleMs?: Partial<Record<string, number>>;
}

export interface PlayOptions {
    /** Override global feel for this call only (built-in, registered, or raw params). */
    feel?: FeelId | FeelParams;
    /** Per-call pan override (-1 to 1). */
    pan?: number;
    /** Per-call randomization override. */
    randomize?: boolean;
    /** Custom AudioContext. */
    ctx?: AudioContext;
}

// ---------------------------------------------------------------------------
// Feel presets
// ---------------------------------------------------------------------------

export const FEEL_PRESETS: Record<FeelType, FeelParams> = {
    soft: { filterFreq: 2000, q: 1, oscType: "sine", decayMult: 1.5, gainMult: 0.7, pitchMult: 0.8 },
    aero: { filterFreq: 3500, q: 2, oscType: "sine", decayMult: 1.0, gainMult: 0.9, pitchMult: 1.0 },
    arcade: { filterFreq: 4000, q: 8, oscType: "square", decayMult: 0.5, gainMult: 1.0, pitchMult: 1.5 },
    organic: { filterFreq: 2500, q: 3, oscType: "triangle", decayMult: 1.3, gainMult: 0.85, pitchMult: 0.9 },
    glass: { filterFreq: 6000, q: 10, oscType: "sine", decayMult: 1.2, gainMult: 0.75, pitchMult: 1.8 },
    industrial: { filterFreq: 3000, q: 12, oscType: "sawtooth", decayMult: 0.6, gainMult: 1.2, pitchMult: 0.7 },
    minimal: { filterFreq: 2000, q: 1, oscType: "sine", decayMult: 0.8, gainMult: 0.4, pitchMult: 1.0 },
    retro: { filterFreq: 1500, q: 2, oscType: "square", decayMult: 1.1, gainMult: 0.8, pitchMult: 0.85 },
    crisp: { filterFreq: 5500, q: 4, oscType: "triangle", decayMult: 0.6, gainMult: 1.0, pitchMult: 1.1 },
};

/** Default throttle intervals (ms) for high-fire-rate sounds. */
const DEFAULT_THROTTLE_MS: Partial<Record<string, number>> = {
    hover: 150,
    keystroke: 80,
    tick: 50,
};

// ---------------------------------------------------------------------------
// Custom feel + sound registries (developer-defined, app-wide)
// ---------------------------------------------------------------------------

const customFeels = new Map<string, FeelParams>();
const customSounds = new Map<string, SoundSynthFn>();
const customSoundMeta = new Map<string, RegisterSoundOptions>();

/**
 * Register a named Feel for use anywhere: `playUISound`, `configureUISounds`,
 * and `data-uisound-feel="myBrand"`.
 *
 * Re-registering the same name overwrites the previous definition.
 *
 * @example
 * ```ts
 * registerFeel('brand', {
 *   filterFreq: 4200, q: 6, oscType: 'triangle',
 *   decayMult: 0.7, gainMult: 0.9, pitchMult: 1.15,
 * });
 * configureUISounds({ feel: 'brand' });
 * playUISound('success'); // brand feel
 * playUISound('click', 'brand');
 * ```
 */
export function registerFeel(name: string, params: FeelParams): void {
    const key = name.trim();
    if (!key) return;
    customFeels.set(key, { ...params });
}

/** Remove a previously registered feel. Built-in feels cannot be removed. */
export function unregisterFeel(name: string): void {
    customFeels.delete(name.trim());
}

/** Whether a feel name is available (built-in or registered). */
export function hasFeel(name: string): boolean {
    return name in FEEL_PRESETS || customFeels.has(name);
}

/** Snapshot of all registered custom feels (not including built-ins). */
export function listCustomFeels(): string[] {
    return Array.from(customFeels.keys());
}

/**
 * Register a custom one-shot sound synthesizer.
 * After registration: `playUISound('whoosh')` and `data-uisound="whoosh"` work app-wide.
 *
 * Your function receives a `SoundSynthContext` — schedule nodes on `ctx` at `time`,
 * scale levels with `volume`, and **always** `connect(node)` so pan works.
 *
 * @example
 * ```ts
 * registerSound('whoosh', ({ ctx, time, params, volume, connect }) => {
 *   const osc = ctx.createOscillator();
 *   const gain = ctx.createGain();
 *   osc.type = params.oscType;
 *   osc.frequency.setValueAtTime(800 * params.pitchMult, time);
 *   osc.frequency.exponentialRampToValueAtTime(120, time + 0.2 * params.decayMult);
 *   gain.gain.setValueAtTime(0.3 * volume, time);
 *   gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25 * params.decayMult);
 *   osc.connect(gain);
 *   connect(gain);
 *   osc.start(time);
 *   osc.stop(time + 0.3 * params.decayMult);
 * }, { throttleMs: 100 });
 *
 * playUISound('whoosh', 'glass');
 * ```
 */
export function registerSound(
    name: string,
    synthFn: SoundSynthFn,
    options: RegisterSoundOptions = {}
): void {
    const key = name.trim();
    if (!key) return;
    customSounds.set(key, synthFn);
    customSoundMeta.set(key, { ...options });
    if (options.throttleMs !== undefined) {
        throttleOverrides[key] = options.throttleMs;
    }
    if (options.defaultEvent) {
        customDefaultEvents[key] = options.defaultEvent;
    }
}

/** Remove a custom sound. Built-in sounds cannot be removed. */
export function unregisterSound(name: string): void {
    const key = name.trim();
    customSounds.delete(key);
    customSoundMeta.delete(key);
    delete customDefaultEvents[key];
    // only clear throttle override if it came from registration defaults path — leave configure overrides
}

/** Whether a sound id is playable (built-in or registered). */
export function hasSound(name: string): boolean {
    return BUILTIN_SOUND_TYPES.has(name) || customSounds.has(name);
}

/** Snapshot of registered custom sound names. */
export function listCustomSounds(): string[] {
    return Array.from(customSounds.keys());
}

// ---------------------------------------------------------------------------
// Global runtime state (singleton)
// ---------------------------------------------------------------------------

let globalAudioContext: AudioContext | null = null;
let audioUnavailable = false;

let enabled = true;
let masterVolume = 1;
let defaultFeel: FeelId | FeelParams = "aero";
let randomizeDefault = false;
let throttleOverrides: Partial<Record<string, number>> = {};
const customDefaultEvents: Record<string, string> = {};

const lastPlayAt = new Map<string, number>();

interface AmbientHandle {
    type: AmbientType;
    nodes: AudioNode[];
    stopSources: Array<{ stop: (when?: number) => void }>;
    gain: GainNode;
    ctx: AudioContext;
}

let activeAmbient: AmbientHandle | null = null;

// ---------------------------------------------------------------------------
// Config / mute / volume
// ---------------------------------------------------------------------------

/**
 * Configure global defaults for all subsequent playUISound / ambient calls.
 * Partial — only provided fields are updated.
 */
export function configureUISounds(config: UISoundsConfig): void {
    if (config.feel !== undefined) defaultFeel = config.feel;
    if (config.volume !== undefined) setMasterVolume(config.volume);
    if (config.enabled !== undefined) setUISoundsEnabled(config.enabled);
    if (config.randomize !== undefined) randomizeDefault = config.randomize;
    if (config.throttleMs !== undefined) {
        throttleOverrides = { ...throttleOverrides, ...config.throttleMs };
    }
}

/** Enable or disable all UI sounds (master mute). Ambient sounds stop when disabled. */
export function setUISoundsEnabled(value: boolean): void {
    enabled = value;
    if (!value && activeAmbient) {
        stopAmbient();
    }
}

export function isUISoundsEnabled(): boolean {
    return enabled;
}

/** Master volume 0–1. Clamped. Applied on top of per-sound gainMult. */
export function setMasterVolume(volume: number): void {
    masterVolume = clamp(volume, 0, 1);
    if (activeAmbient) {
        try {
            activeAmbient.gain.gain.value = 0.08 * masterVolume * (resolveParams(defaultFeel).gainMult);
        } catch {
            /* ignore */
        }
    }
}

export function getMasterVolume(): number {
    return masterVolume;
}

// ---------------------------------------------------------------------------
// AudioContext — SSR-safe, silent-fail, idempotent singleton
// ---------------------------------------------------------------------------

/**
 * Returns the shared AudioContext, creating it lazily on first use.
 * One context per page; safe to call repeatedly.
 * Returns null if unavailable (SSR, blocked, unsupported) — never throws.
 */
export function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (audioUnavailable) return null;

    try {
        if (!globalAudioContext) {
            const AC =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AC) {
                audioUnavailable = true;
                return null;
            }
            globalAudioContext = new AC();
        }
        resumeContext(globalAudioContext);
        return globalAudioContext;
    } catch {
        audioUnavailable = true;
        globalAudioContext = null;
        return null;
    }
}

/**
 * Warm up the AudioContext after a user gesture so the first real sound
 * has no resume latency. Call from a click/keydown handler early in the session.
 */
export function warmUpAudio(ctx?: AudioContext): void {
    try {
        const audio = ctx ?? getAudioContext();
        if (!audio) return;
        resumeContext(audio);
        // Tiny silent buffer to fully unlock on some mobile browsers
        const buffer = audio.createBuffer(1, 1, audio.sampleRate);
        const src = audio.createBufferSource();
        src.buffer = buffer;
        src.connect(audio.destination);
        src.start(0);
    } catch {
        /* never throw */
    }
}

function resumeContext(ctx: AudioContext): void {
    if (ctx.state === "suspended") {
        void ctx.resume().catch(() => {
            /* autoplay still blocked — silent */
        });
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

function lookupFeel(name: string): FeelParams | undefined {
    if (name in FEEL_PRESETS) return FEEL_PRESETS[name as FeelType];
    return customFeels.get(name);
}

function resolveParams(feelOrParams: FeelId | FeelParams): ResolvedFeelParams {
    const base: FeelParams =
        typeof feelOrParams === "string"
            ? lookupFeel(feelOrParams) ?? FEEL_PRESETS.aero
            : feelOrParams;

    return {
        filterFreq: base.filterFreq,
        q: base.q,
        oscType: base.oscType,
        decayMult: base.decayMult,
        gainMult: base.gainMult,
        pitchMult: base.pitchMult,
        pan: base.pan ?? 0,
        attackMult: base.attackMult ?? 1,
        sustainLevel: base.sustainLevel ?? 0.6,
        releaseMult: base.releaseMult ?? 1,
    };
}

function applyRandomize(params: ResolvedParams, doRandomize: boolean): ResolvedParams {
    if (!doRandomize) return params;
    const jitter = () => 1 + (Math.random() * 0.08 - 0.04); // ±4%
    return {
        ...params,
        pitchMult: params.pitchMult * jitter(),
        decayMult: params.decayMult * jitter(),
        filterFreq: params.filterFreq * jitter(),
    };
}

function shouldThrottle(key: string, ms: number): boolean {
    if (ms <= 0) return false;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const last = lastPlayAt.get(key) ?? 0;
    if (now - last < ms) return true;
    lastPlayAt.set(key, now);
    return false;
}

function throttleMsFor(type: string): number {
    if (throttleOverrides[type] !== undefined) return throttleOverrides[type]!;
    const fromRegister = customSoundMeta.get(type)?.throttleMs;
    if (fromRegister !== undefined) return fromRegister;
    return DEFAULT_THROTTLE_MS[type] ?? 0;
}

function effectiveGain(params: ResolvedParams): number {
    return params.gainMult * masterVolume;
}

/**
 * Connect source → optional pan → destination.
 * Returns the terminal node to connect into (pan or destination).
 */
function createOutputChain(
    ctx: AudioContext,
    params: ResolvedParams,
    panOverride?: number
): { input: AudioNode; connectFrom: (node: AudioNode) => void } {
    const panValue = panOverride !== undefined ? panOverride : params.pan;
    const destination = ctx.destination;

    if (panValue !== 0 && typeof ctx.createStereoPanner === "function") {
        try {
            const panner = ctx.createStereoPanner();
            panner.pan.value = clamp(panValue, -1, 1);
            panner.connect(destination);
            return {
                input: panner,
                connectFrom: (node) => {
                    node.connect(panner);
                },
            };
        } catch {
            /* fall through */
        }
    }

    return {
        input: destination,
        connectFrom: (node) => {
            node.connect(destination);
        },
    };
}

/** ADSR-style gain envelope on a GainNode. Peak is absolute linear gain. */
function applyEnvelope(
    gain: GainNode,
    t: number,
    peak: number,
    params: ResolvedParams,
    baseDuration: number
): number {
    const attack = Math.max(0.001, 0.01 * params.attackMult);
    const release = Math.max(0.01, baseDuration * params.releaseMult * params.decayMult);
    const sustain = peak * clamp(params.sustainLevel, 0, 1);
    const sustainEnd = t + attack + Math.max(0, baseDuration * params.decayMult * 0.35);

    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), sustainEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, sustainEnd + release);

    return sustainEnd + release - t;
}

function safeOscType(type: OscillatorType, fallback: OscillatorType = "sine"): OscillatorType {
    return type || fallback;
}

/**
 * Optional helpers for writing custom sounds without reinventing envelopes.
 * Full Web Audio access is always available via `SoundSynthContext.ctx`.
 */
export const synthHelpers = {
    clamp,
    /**
     * ADSR-ish exponential envelope on a GainNode.
     * @returns total duration in seconds from `time`
     */
    envelope(
        gain: GainNode,
        time: number,
        peak: number,
        params: ResolvedFeelParams,
        baseDuration: number
    ): number {
        return applyEnvelope(gain, time, peak, params, baseDuration);
    },
};

// ---------------------------------------------------------------------------
// playUISound
// ---------------------------------------------------------------------------

/**
 * Play a generated UI sound (built-in or registered via `registerSound`).
 *
 * - SSR-safe and never throws (silent no-op on failure / muted / throttled / unknown).
 * - Uses the shared AudioContext unless `options.ctx` (or legacy 3rd arg) is provided.
 * - Feel defaults to configureUISounds({ feel }) or "aero" (supports registered feel names).
 *
 * @param type Sound identifier (built-in or custom)
 * @param feelOrParamsOrOptions Feel name, custom params, or PlayOptions
 * @param maybeCtx Legacy: AudioContext as third argument
 */
export function playUISound(
    type: SoundId,
    feelOrParamsOrOptions?: FeelId | FeelParams | PlayOptions,
    maybeCtx?: AudioContext
): void {
    try {
        if (!enabled || masterVolume <= 0) return;
        if (typeof window === "undefined") return;
        if (!hasSound(type)) return;

        if (shouldThrottle(type, throttleMsFor(type))) return;

        // Parse flexible 2nd/3rd args for backward compatibility
        let feelOrParams: FeelId | FeelParams = defaultFeel;
        let panOverride: number | undefined;
        let doRandomize = randomizeDefault;
        let ctx: AudioContext | null | undefined = maybeCtx;

        if (feelOrParamsOrOptions !== undefined) {
            if (typeof feelOrParamsOrOptions === "string") {
                feelOrParams = feelOrParamsOrOptions;
            } else if (isPlayOptions(feelOrParamsOrOptions)) {
                if (feelOrParamsOrOptions.feel !== undefined) feelOrParams = feelOrParamsOrOptions.feel;
                if (feelOrParamsOrOptions.pan !== undefined) panOverride = feelOrParamsOrOptions.pan;
                if (feelOrParamsOrOptions.randomize !== undefined) doRandomize = feelOrParamsOrOptions.randomize;
                if (feelOrParamsOrOptions.ctx) ctx = feelOrParamsOrOptions.ctx;
            } else {
                // FeelParams object
                feelOrParams = feelOrParamsOrOptions;
            }
        }

        const audio = ctx ?? getAudioContext();
        if (!audio) return;

        let params = applyRandomize(resolveParams(feelOrParams), doRandomize);
        if (panOverride !== undefined) {
            params = { ...params, pan: panOverride };
        }

        synthesize(type, audio, params);
    } catch {
        /* production-safe: never throw from a UI event handler */
    }
}

function isPlayOptions(v: FeelParams | PlayOptions): v is PlayOptions {
    // FeelParams always includes synthesis fields; PlayOptions does not.
    if ("filterFreq" in v && "oscType" in v && "decayMult" in v) return false;
    return "feel" in v || "pan" in v || "randomize" in v || "ctx" in v;
}

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------

function synthesize(type: SoundId, ctx: AudioContext, params: ResolvedFeelParams): void {
    const t = ctx.currentTime;
    const g = effectiveGain(params);
    const out = createOutputChain(ctx, params);

    // Developer-registered custom sounds
    const custom = customSounds.get(type);
    if (custom) {
        custom({
            ctx,
            time: t,
            params,
            volume: g,
            connect: (node) => out.connectFrom(node),
        });
        return;
    }

    switch (type as SoundType) {
        case "click": {
            playNoiseBurst(ctx, t, params, out, {
                duration: 0.008,
                expDiv: 50,
                filterType: "bandpass",
                filterFreq: params.filterFreq,
                gain: 0.5 * g,
            });
            break;
        }

        case "pop": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = safeOscType(params.oscType);
            osc.frequency.setValueAtTime(400 * params.pitchMult, t);
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(150 * params.pitchMult * 0.4, 40),
                t + 0.04 * params.decayMult
            );
            const dur = applyEnvelope(gain, t, 0.35 * g, params, 0.05);
            osc.connect(gain);
            out.connectFrom(gain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
            break;
        }

        case "toggle": {
            playNoiseBurst(ctx, t, params, out, {
                duration: 0.012,
                expDiv: 80,
                filterType: "bandpass",
                filterFreq: 2500,
                gain: 0.4 * g,
            });
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = safeOscType(params.oscType);
            osc.frequency.setValueAtTime(800 * params.pitchMult, t);
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(400 * params.pitchMult * 0.5, 40),
                t + 0.03 * params.decayMult
            );
            const dur = applyEnvelope(oscGain, t, 0.15 * g, params, 0.04);
            osc.connect(oscGain);
            out.connectFrom(oscGain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
            break;
        }

        case "tick": {
            playNoiseBurst(ctx, t, params, out, {
                duration: 0.004,
                expDiv: 20,
                filterType: "highpass",
                filterFreq: 3000 * params.pitchMult,
                gain: 0.3 * g,
            });
            break;
        }

        case "drop": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = safeOscType(params.oscType);
            osc.frequency.setValueAtTime(800 * params.pitchMult, t);
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(300 * params.pitchMult, 40),
                t + 0.1 * params.decayMult
            );
            const dur = applyEnvelope(gain, t, 0.35 * g, params, 0.12);
            osc.connect(gain);
            out.connectFrom(gain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
            break;
        }

        case "success": {
            const notes = [523.25, 659.25, 783.99].map((n) => n * params.pitchMult);
            const spacing = 0.08 * params.decayMult;
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = params.oscType === "square" ? "triangle" : safeOscType(params.oscType);
                osc.frequency.value = freq;
                const start = t + i * spacing;
                const peak = 0.25 * g;
                const attack = Math.max(0.001, 0.01 * params.attackMult);
                const release = 0.15 * params.decayMult * params.releaseMult;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + attack);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + release);
                osc.connect(gain);
                out.connectFrom(gain);
                osc.start(start);
                osc.stop(start + release + 0.02);
            });
            break;
        }

        case "error": {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            const baseFreq = 180 * params.pitchMult;
            osc1.type = params.oscType === "sine" ? "sawtooth" : safeOscType(params.oscType);
            osc1.frequency.setValueAtTime(baseFreq, t);
            osc1.frequency.exponentialRampToValueAtTime(80, t + 0.25 * params.decayMult);
            osc2.type = params.oscType === "sine" ? "square" : safeOscType(params.oscType);
            osc2.frequency.setValueAtTime(baseFreq * 1.05, t);
            osc2.frequency.exponentialRampToValueAtTime(85, t + 0.25 * params.decayMult);
            filter.type = "lowpass";
            filter.frequency.value = 800;
            const dur = applyEnvelope(gain, t, 0.2 * g, params, 0.25);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(filter);
            out.connectFrom(filter);
            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + dur + 0.02);
            osc2.stop(t + dur + 0.02);
            break;
        }

        case "warning": {
            [0, 0.15 * params.decayMult].forEach((delay, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = params.oscType === "square" ? "triangle" : safeOscType(params.oscType);
                osc.frequency.value = (i === 0 ? 880 : 698) * params.pitchMult;
                const start = t + delay;
                const peak = 0.3 * g;
                const attack = Math.max(0.001, 0.01 * params.attackMult);
                const release = 0.12 * params.decayMult * params.releaseMult;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + attack);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + release);
                osc.connect(gain);
                out.connectFrom(gain);
                osc.start(start);
                osc.stop(start + release + 0.02);
            });
            break;
        }

        case "startup": {
            const chordNotes = [392, 493.88, 587.33, 784].map((n) => n * params.pitchMult);
            const delays = [0, 0.02, 0.04, 0.06].map((d) => d * params.decayMult);
            chordNotes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                osc.type = params.oscType === "square" ? "triangle" : safeOscType(params.oscType);
                osc.frequency.value = freq;
                osc2.type = osc.type;
                osc2.frequency.value = freq * 1.002;
                filter.type = "lowpass";
                filter.frequency.value = 2000;
                const start = t + delays[i];
                const duration = 0.6 * params.decayMult * params.releaseMult - delays[i];
                const peak = 0.14 * g;
                const attack = 0.05 * params.attackMult;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + attack);
                gain.gain.setValueAtTime(Math.max(peak * params.sustainLevel, 0.0001), start + duration * 0.3);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(duration, attack + 0.05));
                osc.connect(filter);
                osc2.connect(filter);
                filter.connect(gain);
                out.connectFrom(gain);
                osc.start(start);
                osc2.start(start);
                osc.stop(start + duration + 0.02);
                osc2.stop(start + duration + 0.02);
            });
            break;
        }

        case "hover": {
            // Soft, very short high tick — designed for pointerenter at throttle 150ms
            playNoiseBurst(ctx, t, params, out, {
                duration: 0.006,
                expDiv: 40,
                filterType: "bandpass",
                filterFreq: params.filterFreq * 1.2,
                gain: 0.18 * g,
            });
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 1200 * params.pitchMult;
            const peak = 0.08 * g;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t + 0.004 * params.attackMult);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 * params.decayMult);
            osc.connect(gain);
            out.connectFrom(gain);
            osc.start(t);
            osc.stop(t + 0.05 * params.decayMult);
            break;
        }

        case "press": {
            // Downward tactile thump
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = safeOscType(params.oscType, "triangle");
            osc.frequency.setValueAtTime(280 * params.pitchMult, t);
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(120 * params.pitchMult, 40),
                t + 0.05 * params.decayMult
            );
            const dur = applyEnvelope(gain, t, 0.28 * g, params, 0.06);
            osc.connect(gain);
            out.connectFrom(gain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
            break;
        }

        case "release": {
            // Upward soft ping
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = safeOscType(params.oscType, "sine");
            osc.frequency.setValueAtTime(320 * params.pitchMult, t);
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(520 * params.pitchMult, 40),
                t + 0.04 * params.decayMult
            );
            const dur = applyEnvelope(gain, t, 0.16 * g, params, 0.05);
            osc.connect(gain);
            out.connectFrom(gain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
            break;
        }

        case "select": {
            const notes = [660, 880].map((n) => n * params.pitchMult);
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = safeOscType(params.oscType, "sine");
                osc.frequency.value = freq;
                const start = t + i * 0.035 * params.decayMult;
                const peak = 0.18 * g;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + 0.008 * params.attackMult);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09 * params.decayMult * params.releaseMult);
                osc.connect(gain);
                out.connectFrom(gain);
                osc.start(start);
                osc.stop(start + 0.1 * params.decayMult);
            });
            break;
        }

        case "deselect": {
            const notes = [880, 550].map((n) => n * params.pitchMult);
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = safeOscType(params.oscType, "sine");
                osc.frequency.value = freq;
                const start = t + i * 0.04 * params.decayMult;
                const peak = 0.14 * g;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + 0.008 * params.attackMult);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1 * params.decayMult * params.releaseMult);
                osc.connect(gain);
                out.connectFrom(gain);
                osc.start(start);
                osc.stop(start + 0.12 * params.decayMult);
            });
            break;
        }

        case "delete":
        case "remove": {
            // Descending swoosh: noise + falling tone
            playNoiseBurst(ctx, t, params, out, {
                duration: 0.08,
                expDiv: 120,
                filterType: "bandpass",
                filterFreq: params.filterFreq * 0.8,
                gain: 0.25 * g,
                freqRampTo: params.filterFreq * 0.25,
            });
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = safeOscType(params.oscType, "sawtooth");
            osc.frequency.setValueAtTime(600 * params.pitchMult, t);
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(80 * params.pitchMult, 40),
                t + 0.18 * params.decayMult
            );
            const dur = applyEnvelope(gain, t, 0.2 * g, params, 0.18);
            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(2000, t);
            filter.frequency.exponentialRampToValueAtTime(400, t + 0.18 * params.decayMult);
            osc.connect(filter);
            filter.connect(gain);
            out.connectFrom(gain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
            break;
        }

        case "notify": {
            // Lightweight two-tone chime (not alarming)
            const notes = [523.25, 659.25].map((n) => n * params.pitchMult);
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                const start = t + i * 0.07 * params.decayMult;
                const peak = 0.2 * g;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + 0.012 * params.attackMult);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2 * params.decayMult * params.releaseMult);
                osc.connect(gain);
                out.connectFrom(gain);
                osc.start(start);
                osc.stop(start + 0.22 * params.decayMult);
            });
            break;
        }

        case "keystroke": {
            // Extremely quiet, short — throttle handles spam
            playNoiseBurst(ctx, t, params, out, {
                duration: 0.003,
                expDiv: 15,
                filterType: "highpass",
                filterFreq: 2500 * params.pitchMult,
                gain: 0.1 * g,
            });
            break;
        }

        case "connect": {
            // Ascending resolve
            const notes = [392, 523.25, 659.25].map((n) => n * params.pitchMult);
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = safeOscType(params.oscType, "sine");
                osc.frequency.value = freq;
                const start = t + i * 0.06 * params.decayMult;
                const peak = 0.16 * g;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + 0.015 * params.attackMult);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18 * params.decayMult * params.releaseMult);
                osc.connect(gain);
                out.connectFrom(gain);
                osc.start(start);
                osc.stop(start + 0.2 * params.decayMult);
            });
            break;
        }

        case "disconnect": {
            // Soft descending resolve
            const notes = [659.25, 523.25, 349.23].map((n) => n * params.pitchMult);
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = safeOscType(params.oscType, "triangle");
                osc.frequency.value = freq;
                const start = t + i * 0.07 * params.decayMult;
                const peak = 0.14 * g;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + 0.012 * params.attackMult);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16 * params.decayMult * params.releaseMult);
                osc.connect(gain);
                out.connectFrom(gain);
                osc.start(start);
                osc.stop(start + 0.18 * params.decayMult);
            });
            break;
        }
    }
}

interface NoiseBurstOpts {
    duration: number;
    expDiv: number;
    filterType: BiquadFilterType;
    filterFreq: number;
    gain: number;
    freqRampTo?: number;
}

function playNoiseBurst(
    ctx: AudioContext,
    t: number,
    params: ResolvedParams,
    out: ReturnType<typeof createOutputChain>,
    opts: NoiseBurstOpts
): void {
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
    filter.Q.value = params.q;
    if (opts.freqRampTo !== undefined) {
        filter.frequency.setValueAtTime(opts.filterFreq, t);
        filter.frequency.exponentialRampToValueAtTime(Math.max(opts.freqRampTo, 40), t + duration);
    }
    const gain = ctx.createGain();
    gain.gain.value = opts.gain;
    noise.connect(filter);
    filter.connect(gain);
    out.connectFrom(gain);
    noise.start(t);
}

// ---------------------------------------------------------------------------
// Ambient (loopable) sounds
// ---------------------------------------------------------------------------

/**
 * Start a loopable ambient sound (e.g. loading). Only one ambient at a time;
 * starting a new one stops the previous.
 * No-ops silently if muted, SSR, or audio unavailable.
 */
export function startAmbient(
    type: AmbientType = "loading",
    feelOrParams?: FeelId | FeelParams,
    ctx?: AudioContext
): void {
    try {
        if (!enabled || masterVolume <= 0) return;
        if (typeof window === "undefined") return;

        stopAmbient();

        const audio = ctx ?? getAudioContext();
        if (!audio) return;

        const params = resolveParams(feelOrParams ?? defaultFeel);
        const g = effectiveGain(params);
        const t = audio.currentTime;
        const out = createOutputChain(audio, params);
        const master = audio.createGain();
        master.gain.value = 0;
        // Fade in
        master.gain.linearRampToValueAtTime(1, t + 0.08);
        out.connectFrom(master);

        const stopSources: AmbientHandle["stopSources"] = [];
        const nodes: AudioNode[] = [master];

        if (type === "loading") {
            // Soft pulsing dual-tone loop
            const pulseGain = audio.createGain();
            pulseGain.gain.value = 0.08 * g;
            nodes.push(pulseGain);

            const oscA = audio.createOscillator();
            const oscB = audio.createOscillator();
            oscA.type = "sine";
            oscB.type = "sine";
            oscA.frequency.value = 440 * params.pitchMult;
            oscB.frequency.value = 554.37 * params.pitchMult;

            // LFO-style amplitude pulse via scheduled loop approximation:
            // continuous sine LFO on gain
            const lfo = audio.createOscillator();
            const lfoGain = audio.createGain();
            lfo.frequency.value = 2.2 / Math.max(params.decayMult, 0.3);
            lfoGain.gain.value = 0.05 * g;
            lfo.connect(lfoGain);
            lfoGain.connect(pulseGain.gain);

            const filter = audio.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = Math.min(params.filterFreq, 1800);
            filter.Q.value = 1;

            oscA.connect(filter);
            oscB.connect(filter);
            filter.connect(pulseGain);
            pulseGain.connect(master);

            oscA.start(t);
            oscB.start(t);
            lfo.start(t);
            stopSources.push(oscA, oscB, lfo);
            nodes.push(filter, pulseGain, lfoGain);
        }

        activeAmbient = { type, nodes, stopSources, gain: master, ctx: audio };
    } catch {
        activeAmbient = null;
    }
}

/**
 * Stop the current ambient sound with a short fade-out.
 */
export function stopAmbient(): void {
    try {
        if (!activeAmbient) return;
        const { stopSources, gain, ctx } = activeAmbient;
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.1);
        for (const src of stopSources) {
            try {
                src.stop(t + 0.12);
            } catch {
                /* already stopped */
            }
        }
        activeAmbient = null;
    } catch {
        activeAmbient = null;
    }
}

export function isAmbientPlaying(): boolean {
    return activeAmbient !== null;
}

// ---------------------------------------------------------------------------
// Declarative DOM binding
// ---------------------------------------------------------------------------

const BUILTIN_SOUND_TYPES = new Set<string>([
    "click",
    "pop",
    "toggle",
    "tick",
    "drop",
    "success",
    "error",
    "warning",
    "startup",
    "hover",
    "press",
    "release",
    "select",
    "deselect",
    "delete",
    "remove",
    "notify",
    "keystroke",
    "connect",
    "disconnect",
]);

/** Default DOM event for each sound when data-uisound-event is omitted. */
const DEFAULT_EVENT_FOR_SOUND: Partial<Record<string, string>> = {
    hover: "pointerenter",
    press: "pointerdown",
    release: "pointerup",
    keystroke: "keydown",
};

export interface BindUISoundsOptions {
    /** Root to bind within. Default: document. */
    root?: ParentNode;
    /** Event listener capture phase. Default: false. */
    capture?: boolean;
}

/**
 * Declarative binding: elements with `data-uisound="click"` (etc.) play on interaction.
 * Supports built-in and `registerSound` / `registerFeel` names.
 *
 * Attributes:
 * - `data-uisound` — sound id (required; built-in or registered)
 * - `data-uisound-feel` — feel name (built-in or registered)
 * - `data-uisound-params` — JSON FeelParams (overrides feel when both set)
 * - `data-uisound-event` — DOM event name (default: click, or type-specific / registerSound defaultEvent)
 * - `data-uisound-pan` — number -1..1
 *
 * @returns Unbind function to remove listeners.
 */
export function bindUISounds(options: BindUISoundsOptions = {}): () => void {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return () => undefined;
    }

    const root: ParentNode = options.root ?? document;
    const capture = options.capture ?? false;

    // Listen for a union of events that cover all defaults + custom data-uisound-event values
    const events = [
        "click",
        "pointerenter",
        "pointerdown",
        "pointerup",
        "keydown",
        "change",
        "focus",
    ] as const;

    const handler = (event: Event) => {
        try {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const el = target.closest("[data-uisound]") as HTMLElement | null;
            if (!el) return;
            // When binding to a subtree, ignore elements outside it
            if (root instanceof Element && !root.contains(el)) return;

            const sound = el.getAttribute("data-uisound");
            if (!sound || !hasSound(sound)) return;

            const customEvent = el.getAttribute("data-uisound-event");
            const expected =
                customEvent ||
                customDefaultEvents[sound] ||
                DEFAULT_EVENT_FOR_SOUND[sound] ||
                "click";

            if (event.type !== expected) return;

            // For keystroke, ignore modifier-only / non-character keys
            if (sound === "keystroke" && event instanceof KeyboardEvent) {
                if (event.ctrlKey || event.metaKey || event.altKey) return;
                if (event.key.length !== 1 && event.key !== "Backspace" && event.key !== "Enter") return;
            }

            let feelOrParams: FeelId | FeelParams | undefined;
            const paramsRaw = el.getAttribute("data-uisound-params");
            const feelRaw = el.getAttribute("data-uisound-feel");

            if (paramsRaw) {
                try {
                    feelOrParams = JSON.parse(paramsRaw) as FeelParams;
                } catch {
                    feelOrParams = feelRaw && hasFeel(feelRaw) ? feelRaw : undefined;
                }
            } else if (feelRaw && hasFeel(feelRaw)) {
                feelOrParams = feelRaw;
            }

            const panRaw = el.getAttribute("data-uisound-pan");
            const pan = panRaw !== null ? Number(panRaw) : undefined;

            if (pan !== undefined && !Number.isNaN(pan)) {
                playUISound(sound, { feel: feelOrParams, pan });
            } else if (feelOrParams !== undefined) {
                playUISound(sound, feelOrParams);
            } else {
                playUISound(sound);
            }
        } catch {
            /* never throw from DOM handlers */
        }
    };

    for (const ev of events) {
        root.addEventListener(ev, handler, capture);
    }

    return () => {
        for (const ev of events) {
            root.removeEventListener(ev, handler, capture);
        }
    };
}
