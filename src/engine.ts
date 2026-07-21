import type { ResolvedFeelParams } from "./types";
import { clamp, logWarn } from "./utils";

/**
 * Lazy AudioContext + global master bus + pan routing.
 *
 * Graph:
 *   synth → [StereoPanner?] → masterGain → destination
 *
 * `setMasterVolume` updates masterGain live for all one-shots and loops.
 */
export class AudioEngine {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private masterVolume = 1;
    private unavailable = false;
    private warnedUnavailable = false;
    private debug = false;

    setDebug(debug: boolean): void {
        this.debug = debug;
    }

    isUnavailable(): boolean {
        return this.unavailable;
    }

    getMasterVolume(): number {
        return this.masterVolume;
    }

    /** Live master volume 0–1 for everything routed through this engine. */
    setMasterVolume(volume: number): void {
        this.masterVolume = clamp(volume, 0, 1);
        if (this.master) {
            try {
                const t = this.master.context.currentTime;
                this.master.gain.cancelScheduledValues(t);
                this.master.gain.setTargetAtTime(
                    Math.max(this.masterVolume, 0.0001),
                    t,
                    0.03
                );
            } catch {
                try {
                    this.master.gain.value = this.masterVolume;
                } catch {
                    /* ignore */
                }
            }
        }
    }

    /**
     * Shared AudioContext, created on first use.
     * Returns null if SSR / blocked / unsupported.
     */
    getContext(): AudioContext | null {
        if (typeof window === "undefined") return null;
        if (this.unavailable) return null;

        try {
            if (!this.ctx) {
                const AC =
                    window.AudioContext ||
                    (window as unknown as { webkitAudioContext?: typeof AudioContext })
                        .webkitAudioContext;
                if (!AC) {
                    this.markUnavailable("AudioContext is not supported in this environment");
                    return null;
                }
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = this.masterVolume;
                this.master.connect(this.ctx.destination);
            }
            this.resume(this.ctx);
            return this.ctx;
        } catch {
            this.markUnavailable("Failed to create AudioContext");
            this.ctx = null;
            this.master = null;
            return null;
        }
    }

    /** Unlock / resume after a user gesture. */
    warmUp(external?: AudioContext): void {
        try {
            const audio = external ?? this.getContext();
            if (!audio) return;
            this.resume(audio);
            const buffer = audio.createBuffer(1, 1, audio.sampleRate);
            const src = audio.createBufferSource();
            src.buffer = buffer;
            const sink = this.resolveSink(audio);
            src.connect(sink);
            src.start(0);
        } catch {
            /* never throw */
        }
    }

    resume(ctx: AudioContext): void {
        if (ctx.state === "suspended") {
            void ctx.resume().catch(() => {
                /* autoplay still blocked */
            });
        }
    }

    /**
     * Build: node → [pan] → master (or destination for foreign contexts).
     */
    createOutputChain(
        ctx: AudioContext,
        params: ResolvedFeelParams,
        panOverride?: number
    ): { connectFrom: (node: AudioNode) => void } {
        const sink = this.resolveSink(ctx);
        const panValue = panOverride !== undefined ? panOverride : params.pan;

        if (panValue !== 0 && typeof ctx.createStereoPanner === "function") {
            try {
                const panner = ctx.createStereoPanner();
                panner.pan.value = clamp(panValue, -1, 1);
                panner.connect(sink);
                return {
                    connectFrom: (node) => {
                        node.connect(panner);
                    },
                };
            } catch {
                /* fall through */
            }
        }

        return {
            connectFrom: (node) => {
                node.connect(sink);
            },
        };
    }

    /**
     * Shared master for our context; ephemeral gain for a foreign context
     * (so custom AudioContexts still respect current masterVolume).
     */
    private resolveSink(ctx: AudioContext): AudioNode {
        if (this.ctx === ctx) {
            if (!this.master) {
                this.master = ctx.createGain();
                this.master.gain.value = this.masterVolume;
                this.master.connect(ctx.destination);
            }
            return this.master;
        }
        const g = ctx.createGain();
        g.gain.value = this.masterVolume;
        g.connect(ctx.destination);
        return g;
    }

    private markUnavailable(reason: string): void {
        this.unavailable = true;
        if (!this.warnedUnavailable) {
            this.warnedUnavailable = true;
            logWarn(this.debug, reason);
        }
    }
}
