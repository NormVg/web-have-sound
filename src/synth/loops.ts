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

        // Base + pulse depth kept well above laptop-speaker noise floor.
        // (Old 0.03 base + 110Hz was near-inaudible on small drivers.)
        const baseLevel = 0.16 * volume;
        const pulseDepth = 0.14 * volume;

        const master = ctx.createGain();
        master.gain.value = baseLevel;

        // Fundamental + octave so the beat is audible without a subwoofer
        const osc = ctx.createOscillator();
        const oscHi = ctx.createOscillator();
        osc.type = "sine";
        oscHi.type = "triangle";
        osc.frequency.value = 165 * params.pitchMult;
        oscHi.frequency.value = 330 * params.pitchMult;

        const mix = ctx.createGain();
        mix.gain.value = 1;
        const hiGain = ctx.createGain();
        hiGain.gain.value = 0.45;

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = "sine";
        lfo.frequency.value = 1.15 / Math.max(params.decayMult, 0.5);
        lfoGain.gain.value = pulseDepth;
        lfo.connect(lfoGain);
        lfoGain.connect(master.gain);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = Math.min(Math.max(params.filterFreq, 900), 2200);
        filter.Q.value = 1.2;

        osc.connect(mix);
        oscHi.connect(hiGain);
        hiGain.connect(mix);
        mix.connect(filter);
        filter.connect(master);
        connect(master);

        osc.start(time);
        oscHi.start(time);
        lfo.start(time);

        return { sources: [osc, oscHi, lfo] };
    });

    /** Low continuous drone — focus mode, recording, connection held. */
    r(
        "hum",
        (s) => {
            const { ctx, time, params, volume, connect } = s;

            // Audible drone: mid-bass partials + enough level for laptop speakers
            const master = ctx.createGain();
            master.gain.value = 0.2 * volume;

            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();
            osc1.type = "sine";
            osc2.type = "sine";
            osc3.type = "triangle";
            // ~110 / 165 / 220 Hz — reads on small speakers; still feels like a bed
            osc1.frequency.value = 110 * params.pitchMult;
            osc2.frequency.value = 165 * params.pitchMult;
            osc3.frequency.value = 220 * params.pitchMult;

            const g1 = ctx.createGain();
            const g2 = ctx.createGain();
            const g3 = ctx.createGain();
            g1.gain.value = 1;
            g2.gain.value = 0.7;
            g3.gain.value = 0.35;

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = Math.min(Math.max(params.filterFreq * 0.55, 800), 1600);
            filter.Q.value = 0.8;

            // Slow shimmer (depth small relative to base so it never collapses to silence)
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 0.18;
            lfoGain.gain.value = 0.04 * volume;
            lfo.connect(lfoGain);
            lfoGain.connect(master.gain);

            osc1.connect(g1);
            osc2.connect(g2);
            osc3.connect(g3);
            g1.connect(filter);
            g2.connect(filter);
            g3.connect(filter);
            filter.connect(master);
            connect(master);

            osc1.start(time);
            osc2.start(time);
            osc3.start(time);
            lfo.start(time);

            return { sources: [osc1, osc2, osc3, lfo] };
        },
        { fadeIn: 0.15, fadeOut: 0.3 }
    );
}
