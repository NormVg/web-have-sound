import type { Catalog } from "./catalog";
import type { AudioEngine } from "./engine";
import type {
    ActiveLoop,
    FeelId,
    FeelParams,
    LoopId,
    StartLoopOptions,
    StopLoopOptions,
} from "./types";
import { clamp, logWarn } from "./utils";

export interface LoopRuntimeDeps {
    catalog: Catalog;
    engine: AudioEngine;
    getEnabled: () => boolean;
    getDefaultFeel: () => FeelId | FeelParams;
    getDebug: () => boolean;
}

/**
 * Concurrent long-running loops.
 * Gain: synth (feel gainMult) → loop bus (loopVolume + fade) → engine master.
 */
export class LoopRuntime {
    private active = new Map<string, ActiveLoop>();

    constructor(private deps: LoopRuntimeDeps) {}

    start(id: LoopId, options: StartLoopOptions = {}): boolean {
        const { catalog, engine, getEnabled, getDefaultFeel, getDebug } = this.deps;
        const debug = getDebug();

        try {
            if (!getEnabled()) return false;
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

            if (this.active.has(id)) {
                this.stop(id, { fadeOut: 0.04 });
            }

            const audio = options.ctx ?? engine.getContext();
            if (!audio) return false;

            const params = catalog.resolveFeel(options.feel ?? getDefaultFeel());
            const pan = options.pan;
            const loopVolume = clamp(options.volume ?? 1, 0, 1);
            const fadeIn = options.fadeIn ?? entry.fadeIn;
            const t = audio.currentTime;

            const out = engine.createOutputChain(
                audio,
                pan !== undefined ? { ...params, pan } : params,
                pan
            );

            // Loop bus: relative level + fade (master is further downstream)
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
                volume: params.gainMult, // feel only — master bus applies global volume
                connect: (node) => {
                    node.connect(bus);
                },
            });

            this.active.set(id, {
                id,
                bus,
                ctx: audio,
                sources: control?.sources ?? [],
                dispose: control?.dispose,
                loopVolume,
                fadeOut: entry.fadeOut,
            });
            return true;
        } catch {
            logWarn(debug, `startLoop("${String(id)}") failed`);
            return false;
        }
    }

    stop(id?: LoopId, options?: StopLoopOptions): void {
        try {
            if (id === undefined) {
                this.stopAll(options);
                return;
            }
            const handle = this.active.get(id);
            if (!handle) return;
            const fadeOut = options?.fadeOut ?? handle.fadeOut;
            this.active.delete(id);
            this.teardown(handle, fadeOut);
        } catch {
            if (id) this.active.delete(id);
        }
    }

    stopAll(options?: StopLoopOptions): void {
        for (const id of Array.from(this.active.keys())) {
            this.stop(id, options);
        }
    }

    isPlaying(id?: LoopId): boolean {
        return id === undefined ? this.active.size > 0 : this.active.has(id);
    }

    listActive(): string[] {
        return Array.from(this.active.keys());
    }

    setVolume(id: LoopId, volume: number): void {
        const handle = this.active.get(id);
        if (!handle) {
            logWarn(this.deps.getDebug(), `setLoopVolume("${id}"): loop is not playing`);
            return;
        }
        handle.loopVolume = clamp(volume, 0, 1);
        try {
            const t = handle.ctx.currentTime;
            handle.bus.gain.cancelScheduledValues(t);
            handle.bus.gain.setTargetAtTime(
                Math.max(handle.loopVolume, 0.0001),
                t,
                0.05
            );
        } catch {
            try {
                handle.bus.gain.value = handle.loopVolume;
            } catch {
                /* ignore */
            }
        }
    }

    private teardown(handle: ActiveLoop, fadeOut: number): void {
        try {
            const { sources, bus, ctx, dispose } = handle;
            const t = ctx.currentTime;
            const fade = Math.max(0.01, fadeOut);
            bus.gain.cancelScheduledValues(t);
            bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), t);
            bus.gain.linearRampToValueAtTime(0.0001, t + fade);
            for (const src of sources) {
                try {
                    src.stop(t + fade + 0.02);
                } catch {
                    /* already stopped */
                }
            }
            if (dispose) {
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
    }
}
