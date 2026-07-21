import { bindUISoundsDom } from "./bind";
import { Catalog, FEEL_PRESETS } from "./catalog";
import { AudioEngine } from "./engine";
import { LoopRuntime } from "./loopRuntime";
import { registerBuiltins } from "./synth/builtins";
import { registerBuiltinLoops } from "./synth/loops";
import type {
    AmbientType,
    BindUISoundsOptions,
    FeelId,
    FeelParams,
    LoopId,
    LoopSynthFn,
    PlayOptions,
    PlayResult,
    RegisterLoopOptions,
    RegisterSoundOptions,
    SoundId,
    SoundSynthFn,
    StartLoopOptions,
    StopLoopOptions,
    UISoundsConfig,
} from "./types";
import { applyRandomize, clamp, isFeelParams, logWarn, nowMs } from "./utils";

export interface UISoundsInstance {
    configure(config: UISoundsConfig): void;
    play(
        type: SoundId,
        feelOrOptions?: FeelId | FeelParams | PlayOptions,
        ctx?: AudioContext
    ): PlayResult;
    warmUp(ctx?: AudioContext): void;
    getAudioContext(): AudioContext | null;
    setEnabled(value: boolean): void;
    isEnabled(): boolean;
    setMasterVolume(volume: number): void;
    getMasterVolume(): number;
    registerFeel(name: string, params: FeelParams): void;
    unregisterFeel(name: string): void;
    hasFeel(name: string): boolean;
    listCustomFeels(): string[];
    registerSound(name: string, synth: SoundSynthFn, options?: RegisterSoundOptions): void;
    unregisterSound(name: string): void;
    hasSound(name: string): boolean;
    listCustomSounds(): string[];
    registerLoop(name: string, synth: LoopSynthFn, options?: RegisterLoopOptions): void;
    unregisterLoop(name: string): void;
    hasLoop(name: string): boolean;
    listCustomLoops(): string[];
    listLoops(): string[];
    startLoop(id: LoopId, options?: StartLoopOptions): boolean;
    stopLoop(id?: LoopId, options?: StopLoopOptions): void;
    stopAllLoops(options?: StopLoopOptions): void;
    isLoopPlaying(id?: LoopId): boolean;
    getActiveLoops(): string[];
    setLoopVolume(id: LoopId, volume: number): void;
    /** @deprecated Prefer startLoop */
    startAmbient(
        type?: AmbientType | string,
        feelOrParams?: FeelId | FeelParams,
        ctx?: AudioContext
    ): void;
    /** @deprecated Prefer stopLoop / stopAllLoops */
    stopAmbient(id?: LoopId): void;
    /** @deprecated Prefer isLoopPlaying */
    isAmbientPlaying(id?: LoopId): boolean;
    bind(options?: BindUISoundsOptions): () => void;
}

/**
 * Create an isolated UI-sounds engine.
 * Default package exports use a shared singleton via `getDefaultInstance()`.
 *
 * Layers:
 *   catalog → play / LoopRuntime → AudioEngine (master bus)
 */
export function createUISounds(): UISoundsInstance {
    const catalog = new Catalog();
    const engine = new AudioEngine();
    registerBuiltins(catalog);
    registerBuiltinLoops(catalog);

    let enabled = true;
    let defaultFeel: FeelId | FeelParams = "aero";
    let randomizeDefault = false;
    let debug = false;
    const lastPlayAt = new Map<string, number>();

    const loops = new LoopRuntime({
        catalog,
        engine,
        getEnabled: () => enabled,
        getDefaultFeel: () => defaultFeel,
        getDebug: () => debug,
    });

    const setDebug = (value: boolean) => {
        debug = value;
        catalog.setDebug(value);
        engine.setDebug(value);
    };

    const shouldThrottle = (key: string, ms: number): boolean => {
        if (ms <= 0) return false;
        const t = nowMs();
        const last = lastPlayAt.get(key) ?? 0;
        if (t - last < ms) return true;
        lastPlayAt.set(key, t);
        return false;
    };

    const parsePlayArgs = (
        second?: FeelId | FeelParams | PlayOptions,
        third?: AudioContext
    ) => {
        let feel: FeelId | FeelParams = defaultFeel;
        let pan: number | undefined;
        let randomize = randomizeDefault;
        let ctx = third;

        if (second === undefined) return { feel, pan, randomize, ctx };
        if (typeof second === "string") return { feel: second, pan, randomize, ctx };
        if (isFeelParams(second)) return { feel: second, pan, randomize, ctx };
        if (second.feel !== undefined) feel = second.feel;
        if (second.pan !== undefined) pan = second.pan;
        if (second.randomize !== undefined) randomize = second.randomize;
        if (second.ctx) ctx = second.ctx;
        return { feel, pan, randomize, ctx };
    };

    const play: UISoundsInstance["play"] = (type, feelOrOptions, maybeCtx) => {
        try {
            if (!enabled || engine.getMasterVolume() <= 0) {
                return { ok: false, reason: "muted" };
            }
            if (typeof window === "undefined") return { ok: false, reason: "ssr" };

            if (catalog.hasLoop(type) && !catalog.hasSound(type)) {
                logWarn(
                    debug,
                    `"${type}" is a loop — use startLoop("${type}") / stopLoop("${type}")`
                );
                return { ok: false, reason: "unknown" };
            }

            const entry = catalog.getSound(type);
            if (!entry) {
                logWarn(
                    debug,
                    `Unknown sound "${type}". Known: ${catalog.listSoundNames().join(", ")}`
                );
                return { ok: false, reason: "unknown" };
            }

            if (shouldThrottle(type, catalog.throttleMsFor(type))) {
                return { ok: false, reason: "throttled" };
            }

            const { feel, pan, randomize, ctx: optCtx } = parsePlayArgs(
                feelOrOptions,
                maybeCtx
            );
            const audio = optCtx ?? engine.getContext();
            if (!audio) return { ok: false, reason: "no-audio" };

            let params = applyRandomize(catalog.resolveFeel(feel), randomize);
            if (pan !== undefined) params = { ...params, pan };

            const out = engine.createOutputChain(audio, params, pan);

            entry.synth({
                ctx: audio,
                time: audio.currentTime,
                params,
                volume: params.gainMult, // feel only; master bus applies global volume
                connect: (node) => out.connectFrom(node),
            });

            return { ok: true };
        } catch {
            logWarn(debug, `play("${String(type)}") failed unexpectedly`);
            return { ok: false, reason: "error" };
        }
    };

    return {
        configure(config) {
            if (config.feel !== undefined) defaultFeel = config.feel;
            if (config.volume !== undefined) {
                engine.setMasterVolume(clamp(config.volume, 0, 1));
            }
            if (config.enabled !== undefined) {
                enabled = config.enabled;
                if (!enabled) loops.stopAll();
            }
            if (config.randomize !== undefined) randomizeDefault = config.randomize;
            if (config.throttleMs !== undefined) catalog.setThrottleOverrides(config.throttleMs);
            if (config.debug !== undefined) setDebug(config.debug);
        },

        play,
        warmUp: (ctx) => engine.warmUp(ctx),
        getAudioContext: () => engine.getContext(),

        setEnabled(value) {
            enabled = value;
            if (!value) loops.stopAll();
        },
        isEnabled: () => enabled,

        setMasterVolume(volume) {
            engine.setMasterVolume(volume);
        },
        getMasterVolume: () => engine.getMasterVolume(),

        registerFeel: (name, params) => catalog.registerFeel(name, params, false),
        unregisterFeel: (name) => catalog.unregisterFeel(name),
        hasFeel: (name) => catalog.hasFeel(name),
        listCustomFeels: () => catalog.listCustomFeels(),

        registerSound: (name, synth, options) =>
            catalog.registerSound(name, synth, options, false),
        unregisterSound: (name) => catalog.unregisterSound(name),
        hasSound: (name) => catalog.hasSound(name),
        listCustomSounds: () => catalog.listCustomSounds(),

        registerLoop: (name, synth, options) =>
            catalog.registerLoop(name, synth, options, false),
        unregisterLoop: (name) => {
            loops.stop(name);
            catalog.unregisterLoop(name);
        },
        hasLoop: (name) => catalog.hasLoop(name),
        listCustomLoops: () => catalog.listCustomLoops(),
        listLoops: () => catalog.listLoopNames(),

        startLoop: (id, options) => loops.start(id, options),
        stopLoop: (id, options) => loops.stop(id, options),
        stopAllLoops: (options) => loops.stopAll(options),
        isLoopPlaying: (id) => loops.isPlaying(id),
        getActiveLoops: () => loops.listActive(),
        setLoopVolume: (id, volume) => loops.setVolume(id, volume),

        startAmbient: (type = "loading", feelOrParams, ctx) => {
            loops.start(type, { feel: feelOrParams, ctx });
        },
        stopAmbient: (id) => (id ? loops.stop(id) : loops.stopAll()),
        isAmbientPlaying: (id) => loops.isPlaying(id),

        bind: (options) => bindUISoundsDom(catalog, play, () => debug, options),
    };
}

let defaultInstance: UISoundsInstance | null = null;

export function getDefaultInstance(): UISoundsInstance {
    if (!defaultInstance) defaultInstance = createUISounds();
    return defaultInstance;
}

export { FEEL_PRESETS };
