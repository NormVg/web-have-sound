import type { Catalog } from "../catalog";
import type { LoopControl, SynthContext } from "../types";

/**
 * Built-in long-running beds.
 * Each returns stoppable sources so the loop engine can fade + tear down.
 */
export function registerBuiltinLoops(catalog: Catalog): void {
    const r = (
        name: string,
        synth: (s: SynthContext) => LoopControl | void,
        opts?: { fadeIn?: number; fadeOut?: number }
    ) => catalog.registerLoop(name, synth, opts, true);

    /** Soft dual-tone pulse — classic “work in progress”. */
    r("loading", (s) => {
        const { ctx, time, params, volume, connect } = s;

        const pulseGain = ctx.createGain();
        pulseGain.gain.value = 0.08 * volume;

        const oscA = ctx.createOscillator();
        const oscB = ctx.createOscillator();
        oscA.type = "sine";
        oscB.type = "sine";
        oscA.frequency.value = 440 * params.pitchMult;
        oscB.frequency.value = 554.37 * params.pitchMult;

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 2.2 / Math.max(params.decayMult, 0.3);
        lfoGain.gain.value = 0.05 * volume;
        lfo.connect(lfoGain);
        lfoGain.connect(pulseGain.gain);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = Math.min(params.filterFreq, 1800);
        filter.Q.value = 1;

        oscA.connect(filter);
        oscB.connect(filter);
        filter.connect(pulseGain);
        connect(pulseGain);

        oscA.start(time);
        oscB.start(time);
        lfo.start(time);

        return { sources: [oscA, oscB, lfo] };
    });

    /** Faster ticking bed — computations, sync, progress. */
    r(
        "processing",
        (s) => {
            const { ctx, time, params, volume, connect } = s;

            const master = ctx.createGain();
            master.gain.value = 0.1 * volume;

            const osc = ctx.createOscillator();
            osc.type = params.oscType === "sine" ? "triangle" : params.oscType;
            osc.frequency.value = 660 * params.pitchMult;

            // Amplitude “tick” via LFO (duty-ish pulse feel)
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            const base = ctx.createGain();
            base.gain.value = 0.04 * volume;
            lfo.type = "square";
            lfo.frequency.value = 4 / Math.max(params.decayMult, 0.4);
            lfoGain.gain.value = 0.06 * volume;
            lfo.connect(lfoGain);
            lfoGain.connect(master.gain);

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = Math.min(params.filterFreq, 2400);
            filter.Q.value = Math.max(params.q, 2);

            osc.connect(filter);
            filter.connect(master);
            base.connect(master);
            connect(master);

            osc.start(time);
            lfo.start(time);

            return { sources: [osc, lfo] };
        },
        { fadeIn: 0.05, fadeOut: 0.08 }
    );

    /** Slow soft heartbeat — waiting, idle online state. */
    r("pulse", (s) => {
        const { ctx, time, params, volume, connect } = s;

        const master = ctx.createGain();
        master.gain.value = 0.06 * volume;

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 110 * params.pitchMult;

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 1.1 / Math.max(params.decayMult, 0.5);
        lfoGain.gain.value = 0.05 * volume;
        // Center the LFO around a small base so it doesn't go fully silent/negative awkwardly
        master.gain.value = 0.03 * volume;
        lfo.connect(lfoGain);
        lfoGain.connect(master.gain);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;

        osc.connect(filter);
        filter.connect(master);
        connect(master);

        osc.start(time);
        lfo.start(time);

        return { sources: [osc, lfo] };
    });

    /** Low continuous drone — focus mode, recording, connection held. */
    r(
        "hum",
        (s) => {
            const { ctx, time, params, volume, connect } = s;

            const master = ctx.createGain();
            master.gain.value = 0.05 * volume;

            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            osc1.type = "sine";
            osc2.type = "sine";
            osc1.frequency.value = 65 * params.pitchMult;
            osc2.frequency.value = 65 * 1.5 * params.pitchMult;

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = Math.min(params.filterFreq * 0.3, 500);

            // Very slow shimmer
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 0.15;
            lfoGain.gain.value = 0.015 * volume;
            lfo.connect(lfoGain);
            lfoGain.connect(master.gain);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(master);
            connect(master);

            osc1.start(time);
            osc2.start(time);
            lfo.start(time);

            return { sources: [osc1, osc2, lfo] };
        },
        { fadeIn: 0.2, fadeOut: 0.35 }
    );
}
