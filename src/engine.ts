import type { ResolvedFeelParams } from "./types";
import { clamp, logWarn } from "./utils";

/**
 * Lazy singleton AudioContext + output routing.
 * SSR-safe; never throws to callers.
 */
export class AudioEngine {
    private ctx: AudioContext | null = null;
    private unavailable = false;
    private warnedUnavailable = false;
    private debug = false;

    setDebug(debug: boolean): void {
        this.debug = debug;
    }

    isUnavailable(): boolean {
        return this.unavailable;
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
            }
            this.resume(this.ctx);
            return this.ctx;
        } catch {
            this.markUnavailable("Failed to create AudioContext");
            this.ctx = null;
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
            src.connect(audio.destination);
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
     * Build pan → destination chain.
     * Always connect synth nodes via `connectFrom`.
     */
    createOutputChain(
        ctx: AudioContext,
        params: ResolvedFeelParams,
        panOverride?: number
    ): { connectFrom: (node: AudioNode) => void } {
        const panValue = panOverride !== undefined ? panOverride : params.pan;
        const destination = ctx.destination;

        if (panValue !== 0 && typeof ctx.createStereoPanner === "function") {
            try {
                const panner = ctx.createStereoPanner();
                panner.pan.value = clamp(panValue, -1, 1);
                panner.connect(destination);
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
                node.connect(destination);
            },
        };
    }

    private markUnavailable(reason: string): void {
        this.unavailable = true;
        if (!this.warnedUnavailable) {
            this.warnedUnavailable = true;
            logWarn(this.debug, reason);
        }
    }
}
