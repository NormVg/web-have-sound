import { Catalog, FEEL_PRESETS } from "./catalog";
import { AudioEngine } from "./engine";
import { registerBuiltins } from "./synth/builtins";
import type {
    AmbientHandle,
    AmbientType,
    BindUISoundsOptions,
    FeelId,
    FeelParams,
    PlayOptions,
    PlayResult,
    RegisterSoundOptions,
    SoundId,
    SoundSynthFn,
    UISoundsConfig,
} from "./types";
import { applyRandomize, clamp, isFeelParams, logWarn, nowMs } from "./utils";

export interface UISoundsInstance {
    configure(config: UISoundsConfig): void;
    play(type: SoundId, feelOrOptions?: FeelId | FeelParams | PlayOptions, ctx?: AudioContext): PlayResult;
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
    startAmbient(type?: AmbientType | string, feelOrParams?: FeelId | FeelParams, ctx?: AudioContext): void;
    stopAmbient(): void;
    isAmbientPlaying(): boolean;
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

    let enabled = true;
    let masterVolume = 1;
    let defaultFeel: FeelId | FeelParams = "aero";
    let randomizeDefault = false;
    let debug = false;
    const lastPlayAt = new Map<string, number>();
    let activeAmbient: AmbientHandle | null = null;

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

        if (second === undefined) {
            return { feel, pan, randomize, ctx };
        }
        if (typeof second === "string") {
            return { feel: second, pan, randomize, ctx };
        }
        if (isFeelParams(second)) {
            return { feel: second, pan, randomize, ctx };
        }
        // PlayOptions
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

            const entry = catalog.getSound(type);
            if (!entry || entry.ambient) {
                logWarn(
                    debug,
                    entry?.ambient
                        ? `"${type}" is ambient — use startAmbient("${type}") instead`
                        : `Unknown sound "${type}". Known: ${catalog.listSoundNames().filter((n) => !catalog.getSound(n)?.ambient).join(", ")}`
                );
                return { ok: false, reason: "unknown" };
            }

            if (shouldThrottle(type, catalog.throttleMsFor(type))) {
                return { ok: false, reason: "throttled" };
            }

            const { feel, pan, randomize, ctx: optCtx } = parsePlayArgs(feelOrOptions, maybeCtx);
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

    const stopAmbient = () => {
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
    };

    const startAmbient: UISoundsInstance["startAmbient"] = (
        type = "loading",
        feelOrParams,
        ctx
    ) => {
        try {
            if (!enabled || masterVolume <= 0) return;
            if (typeof window === "undefined") return;

            const id = type;
            const entry = catalog.getSound(id);
            if (!entry?.ambient && id !== "loading") {
                logWarn(
                    debug,
                    `startAmbient("${id}"): not an ambient sound. Register with { ambient: true }.`
                );
                return;
            }

            stopAmbient();

            const audio = ctx ?? engine.getContext();
            if (!audio) return;

            const params = catalog.resolveFeel(feelOrParams ?? defaultFeel);
            const volume = params.gainMult * masterVolume;
            const t = audio.currentTime;
            const out = engine.createOutputChain(audio, params);
            const master = audio.createGain();
            master.gain.value = 0;
            master.gain.linearRampToValueAtTime(1, t + 0.08);
            out.connectFrom(master);

            const stopSources: AmbientHandle["stopSources"] = [];

            // Built-in loading bed
            if (id === "loading") {
                const pulseGain = audio.createGain();
                pulseGain.gain.value = 0.08 * volume;

                const oscA = audio.createOscillator();
                const oscB = audio.createOscillator();
                oscA.type = "sine";
                oscB.type = "sine";
                oscA.frequency.value = 440 * params.pitchMult;
                oscB.frequency.value = 554.37 * params.pitchMult;

                const lfo = audio.createOscillator();
                const lfoGain = audio.createGain();
                lfo.frequency.value = 2.2 / Math.max(params.decayMult, 0.3);
                lfoGain.gain.value = 0.05 * volume;
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
            }

            activeAmbient = { id, stopSources, gain: master, ctx: audio };
        } catch {
            activeAmbient = null;
            logWarn(debug, `startAmbient("${String(type)}") failed`);
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
                        logWarn(debug, `data-uisound="${sound}" is not a known sound`);
                    }
                    return;
                }

                const expected =
                    el.getAttribute("data-uisound-event") ||
                    catalog.defaultEventFor(sound);

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
                        feelOrParams = feelRaw && catalog.hasFeel(feelRaw) ? feelRaw : undefined;
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

    return {
        configure(config) {
            if (config.feel !== undefined) defaultFeel = config.feel;
            if (config.volume !== undefined) {
                masterVolume = clamp(config.volume, 0, 1);
                if (activeAmbient) {
                    try {
                        const g = catalog.resolveFeel(defaultFeel).gainMult;
                        activeAmbient.gain.gain.value = 0.08 * masterVolume * g;
                    } catch {
                        /* ignore */
                    }
                }
            }
            if (config.enabled !== undefined) {
                enabled = config.enabled;
                if (!enabled) stopAmbient();
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
            if (!value) stopAmbient();
        },
        isEnabled: () => enabled,

        setMasterVolume(volume) {
            masterVolume = clamp(volume, 0, 1);
            if (activeAmbient) {
                try {
                    const g = catalog.resolveFeel(defaultFeel).gainMult;
                    activeAmbient.gain.gain.value = 0.08 * masterVolume * g;
                } catch {
                    /* ignore */
                }
            }
        },
        getMasterVolume: () => masterVolume,

        registerFeel: (name, params) => catalog.registerFeel(name, params, false),
        unregisterFeel: (name) => catalog.unregisterFeel(name),
        hasFeel: (name) => catalog.hasFeel(name),
        listCustomFeels: () => catalog.listCustomFeels(),

        registerSound: (name, synth, options) =>
            catalog.registerSound(name, synth, options, false),
        unregisterSound: (name) => catalog.unregisterSound(name),
        hasSound: (name) => {
            const e = catalog.getSound(name);
            return !!e && !e.ambient;
        },
        listCustomSounds: () => catalog.listCustomSounds(),

        startAmbient,
        stopAmbient,
        isAmbientPlaying: () => activeAmbient !== null,

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
