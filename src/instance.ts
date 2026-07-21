import { Catalog, FEEL_PRESETS } from "./catalog";
import { AudioEngine } from "./engine";
import { registerBuiltins } from "./synth/builtins";
import { registerBuiltinLoops } from "./synth/loops";
import type {
    ActiveLoop,
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
    // Loops
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
    // Back-compat aliases
    startAmbient(
        type?: AmbientType | string,
        feelOrParams?: FeelId | FeelParams,
        ctx?: AudioContext
    ): void;
    stopAmbient(id?: LoopId): void;
    isAmbientPlaying(id?: LoopId): boolean;
    bind(options?: BindUISoundsOptions): () => void;
}

/**
 * Create an isolated UI-sounds engine (tests, multi-root apps).
 * Most apps should use the default singleton exports instead.
 */
export function createUISounds(): UISoundsInstance {
    const catalog = new Catalog();
    const engine = new AudioEngine();
    registerBuiltins(catalog);
    registerBuiltinLoops(catalog);

    let enabled = true;
    let masterVolume = 1;
    let defaultFeel: FeelId | FeelParams = "aero";
    let randomizeDefault = false;
    let debug = false;
    const lastPlayAt = new Map<string, number>();
    /** Concurrent long-running loops by id */
    const activeLoops = new Map<string, ActiveLoop>();

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
    ): {
        feel: FeelId | FeelParams;
        pan?: number;
        randomize: boolean;
        ctx?: AudioContext;
    } => {
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
            if (!enabled || masterVolume <= 0) return { ok: false, reason: "muted" };
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

            const volume = params.gainMult * masterVolume;
            const out = engine.createOutputChain(audio, params, pan);

            entry.synth({
                ctx: audio,
                time: audio.currentTime,
                params,
                volume,
                connect: (node) => out.connectFrom(node),
            });

            return { ok: true };
        } catch {
            logWarn(debug, `play("${String(type)}") failed unexpectedly`);
            return { ok: false, reason: "error" };
        }
    };

    // ----- Loop engine -----

    const teardownLoop = (handle: ActiveLoop, fadeOut: number) => {
        try {
            const { sources, gain, ctx, dispose } = handle;
            const t = ctx.currentTime;
            const fade = Math.max(0.01, fadeOut);
            gain.gain.cancelScheduledValues(t);
            gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
            gain.gain.linearRampToValueAtTime(0.0001, t + fade);
            for (const src of sources) {
                try {
                    src.stop(t + fade + 0.02);
                } catch {
                    /* already stopped */
                }
            }
            if (dispose) {
                // run after fade so audio can ring out
                const delay = (fade + 0.05) * 1000;
                if (typeof setTimeout !== "undefined") {
                    setTimeout(() => {
                        try {
                            dispose();
                        } catch {
                            /* ignore */
                        }
                    }, delay);
                } else {
                    try {
                        dispose();
                    } catch {
                        /* ignore */
                    }
                }
            }
        } catch {
            /* ignore */
        }
    };

    const stopLoop = (id?: LoopId, options?: StopLoopOptions) => {
        try {
            if (id === undefined) {
                stopAllLoops(options);
                return;
            }
            const handle = activeLoops.get(id);
            if (!handle) return;
            const fadeOut = options?.fadeOut ?? handle.fadeOut;
            activeLoops.delete(id);
            teardownLoop(handle, fadeOut);
        } catch {
            if (id) activeLoops.delete(id);
        }
    };

    const stopAllLoops = (options?: StopLoopOptions) => {
        const ids = Array.from(activeLoops.keys());
        for (const id of ids) {
            stopLoop(id, options);
        }
    };

    const reapplyLoopMasterGains = () => {
        // Master volume is baked into synth peaks at startLoop time.
        // Live master changes can't rebuild graphs cheaply — bus still carries loopVolume.
        // Document: restart loop after big master changes if needed; mute still stops all.
        void masterVolume;
    };

    const startLoop = (id: LoopId, options: StartLoopOptions = {}): boolean => {
        try {
            if (!enabled || masterVolume <= 0) return false;
            if (typeof window === "undefined") return false;

            const entry = catalog.getLoop(id);
            if (!entry) {
                logWarn(
                    debug,
                    `Unknown loop "${id}". Known: ${catalog.listLoopNames().join(", ")}. ` +
                        `Register with registerLoop().`
                );
                return false;
            }

            // Restart if already playing
            if (activeLoops.has(id)) {
                stopLoop(id, { fadeOut: 0.04 });
            }

            const audio = options.ctx ?? engine.getContext();
            if (!audio) return false;

            const params = catalog.resolveFeel(options.feel ?? defaultFeel);
            const pan = options.pan;
            const loopVolume = clamp(options.volume ?? 1, 0, 1);
            const fadeIn = options.fadeIn ?? entry.fadeIn;
            // Synth peaks use master + feel only; per-loop level lives on the bus
            // so setLoopVolume() can change it live without rebuilding the graph.
            const synthVolume = params.gainMult * masterVolume;

            const t = audio.currentTime;
            const out = engine.createOutputChain(
                audio,
                pan !== undefined ? { ...params, pan } : params,
                pan
            );

            // Outer bus: fade in/out + setLoopVolume
            const bus = audio.createGain();
            bus.gain.value = 0;
            bus.gain.linearRampToValueAtTime(
                Math.max(loopVolume, 0.0001),
                t + Math.max(0.01, fadeIn)
            );
            out.connectFrom(bus);

            const control = entry.synth({
                ctx: audio,
                time: t,
                params,
                volume: synthVolume,
                connect: (node) => {
                    node.connect(bus);
                },
            });

            const handle: ActiveLoop = {
                id,
                gain: bus,
                ctx: audio,
                sources: control?.sources ?? [],
                dispose: control?.dispose,
                loopVolume,
                feelGain: params.gainMult,
                fadeOut: entry.fadeOut,
            };
            activeLoops.set(id, handle);
            return true;
        } catch {
            logWarn(debug, `startLoop("${String(id)}") failed`);
            return false;
        }
    };

    const setLoopVolume = (id: LoopId, volume: number) => {
        const handle = activeLoops.get(id);
        if (!handle) {
            logWarn(debug, `setLoopVolume("${id}"): loop is not playing`);
            return;
        }
        handle.loopVolume = clamp(volume, 0, 1);
        try {
            // Outer bus was normalized to 1 at start; re-scale bus for relative volume changes
            // Synth was built with original loopVolume — approximate by bus gain
            const target = handle.loopVolume; // relative to original registration volume baked in synth
            // Better: track original and scale bus as loopVolume / originalLoopVolume
            // We store loopVolume as the user-facing 0-1; synth used that at start.
            // Changing later only moves bus: bus = newVol / oldVol at start... store startLoopVolume.
            handle.gain.gain.setTargetAtTime(
                Math.max(handle.loopVolume, 0.0001),
                handle.ctx.currentTime,
                0.05
            );
        } catch {
            /* ignore */
        }
    };

    const bind: UISoundsInstance["bind"] = (options = {}) => {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return () => undefined;
        }

        const root: ParentNode = options.root ?? document;
        const capture = options.capture ?? false;
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
                if (root instanceof Element && !root.contains(el)) return;

                const sound = el.getAttribute("data-uisound");
                if (!sound || !catalog.hasSound(sound)) {
                    if (sound && debug) {
                        logWarn(debug, `data-uisound="${sound}" is not a known one-shot sound`);
                    }
                    return;
                }

                const expected =
                    el.getAttribute("data-uisound-event") || catalog.defaultEventFor(sound);

                if (event.type !== expected) return;

                if (sound === "keystroke" && event instanceof KeyboardEvent) {
                    if (event.ctrlKey || event.metaKey || event.altKey) return;
                    if (
                        event.key.length !== 1 &&
                        event.key !== "Backspace" &&
                        event.key !== "Enter"
                    ) {
                        return;
                    }
                }

                let feelOrParams: FeelId | FeelParams | undefined;
                const paramsRaw = el.getAttribute("data-uisound-params");
                const feelRaw = el.getAttribute("data-uisound-feel");

                if (paramsRaw) {
                    try {
                        feelOrParams = JSON.parse(paramsRaw) as FeelParams;
                    } catch {
                        logWarn(debug, `Invalid JSON in data-uisound-params on element`);
                        feelOrParams =
                            feelRaw && catalog.hasFeel(feelRaw) ? feelRaw : undefined;
                    }
                } else if (feelRaw) {
                    if (catalog.hasFeel(feelRaw)) feelOrParams = feelRaw;
                    else logWarn(debug, `data-uisound-feel="${feelRaw}" is not a known feel`);
                }

                const panRaw = el.getAttribute("data-uisound-pan");
                const pan = panRaw !== null ? Number(panRaw) : undefined;

                if (pan !== undefined && !Number.isNaN(pan)) {
                    play(sound, { feel: feelOrParams, pan });
                } else if (feelOrParams !== undefined) {
                    play(sound, feelOrParams);
                } else {
                    play(sound);
                }
            } catch {
                /* never throw from DOM */
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
    };

    // Back-compat: startAmbient → startLoop; stopAmbient() → stopAll
    const startAmbient: UISoundsInstance["startAmbient"] = (
        type = "loading",
        feelOrParams,
        ctx
    ) => {
        startLoop(type, { feel: feelOrParams, ctx });
    };

    return {
        configure(config) {
            if (config.feel !== undefined) defaultFeel = config.feel;
            if (config.volume !== undefined) {
                masterVolume = clamp(config.volume, 0, 1);
                reapplyLoopMasterGains();
            }
            if (config.enabled !== undefined) {
                enabled = config.enabled;
                if (!enabled) stopAllLoops();
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
            if (!value) stopAllLoops();
        },
        isEnabled: () => enabled,

        setMasterVolume(volume) {
            masterVolume = clamp(volume, 0, 1);
            // Active loop synth peaks were scheduled at start; bus keeps relative loopVolume.
            // New startLoop() calls pick up the new master immediately.
            void reapplyLoopMasterGains;
        },
        getMasterVolume: () => masterVolume,

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
            stopLoop(name);
            catalog.unregisterLoop(name);
        },
        hasLoop: (name) => catalog.hasLoop(name),
        listCustomLoops: () => catalog.listCustomLoops(),
        listLoops: () => catalog.listLoopNames(),

        startLoop,
        stopLoop,
        stopAllLoops,
        isLoopPlaying: (id) =>
            id === undefined ? activeLoops.size > 0 : activeLoops.has(id),
        getActiveLoops: () => Array.from(activeLoops.keys()),
        setLoopVolume,

        startAmbient,
        stopAmbient: (id) => (id ? stopLoop(id) : stopAllLoops()),
        isAmbientPlaying: (id) =>
            id === undefined ? activeLoops.size > 0 : activeLoops.has(id),

        bind,
    };
}

/** Default shared instance (what the package exports as free functions). */
let defaultInstance: UISoundsInstance | null = null;

export function getDefaultInstance(): UISoundsInstance {
    if (!defaultInstance) defaultInstance = createUISounds();
    return defaultInstance;
}

export { FEEL_PRESETS };
