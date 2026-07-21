import type { Catalog } from "../catalog";
import type { SynthContext } from "../types";
import { chord, envelope, noiseBurst, safeOscType, tone } from "./primitives";

/** Register all built-in one-shot sounds into the catalog. */
export function registerBuiltins(catalog: Catalog): void {
    const r = (
        name: string,
        synth: (s: SynthContext) => void,
        opts?: { throttleMs?: number; defaultEvent?: string }
    ) => catalog.registerSound(name, synth, opts, true);

    r("click", (s) => {
        noiseBurst(s, {
            duration: 0.008,
            expDiv: 50,
            filterType: "bandpass",
            filterFreq: s.params.filterFreq,
            peak: 0.5 * s.volume,
        });
    });

    r("pop", (s) => {
        tone(s, {
            freq: 400 * s.params.pitchMult,
            endFreq: Math.max(150 * s.params.pitchMult * 0.4, 40),
            duration: 0.05,
            peak: 0.35 * s.volume,
        });
    });

    r("toggle", (s) => {
        noiseBurst(s, {
            duration: 0.012,
            expDiv: 80,
            filterType: "bandpass",
            filterFreq: 2500,
            peak: 0.4 * s.volume,
        });
        tone(s, {
            freq: 800 * s.params.pitchMult,
            endFreq: Math.max(400 * s.params.pitchMult * 0.5, 40),
            duration: 0.04,
            peak: 0.15 * s.volume,
        });
    });

    r("tick", (s) => {
        noiseBurst(s, {
            duration: 0.004,
            expDiv: 20,
            filterType: "highpass",
            filterFreq: 3000 * s.params.pitchMult,
            peak: 0.3 * s.volume,
        });
    }, { throttleMs: 50 });

    r("drop", (s) => {
        tone(s, {
            freq: 800 * s.params.pitchMult,
            endFreq: Math.max(300 * s.params.pitchMult, 40),
            duration: 0.12,
            peak: 0.35 * s.volume,
        });
    });

    r("success", (s) => {
        chord(s, {
            notes: [523.25, 659.25, 783.99].map((n) => n * s.params.pitchMult),
            spacing: 0.08,
            peak: 0.25 * s.volume,
            duration: 0.15,
        });
    });

    r("error", (s) => {
        const { ctx, time, params, volume, connect } = s;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const baseFreq = 180 * params.pitchMult;
        osc1.type = params.oscType === "sine" ? "sawtooth" : safeOscType(params.oscType);
        osc1.frequency.setValueAtTime(baseFreq, time);
        osc1.frequency.exponentialRampToValueAtTime(80, time + 0.25 * params.decayMult);
        osc2.type = params.oscType === "sine" ? "square" : safeOscType(params.oscType);
        osc2.frequency.setValueAtTime(baseFreq * 1.05, time);
        osc2.frequency.exponentialRampToValueAtTime(85, time + 0.25 * params.decayMult);
        filter.type = "lowpass";
        filter.frequency.value = 800;
        const dur = envelope(gain, time, 0.2 * volume, params, 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(filter);
        connect(filter);
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + dur + 0.02);
        osc2.stop(time + dur + 0.02);
    });

    r("warning", (s) => {
        const notes = [880, 698].map((n) => n * s.params.pitchMult);
        notes.forEach((freq, i) => {
            tone(s, {
                freq,
                duration: 0.12,
                peak: 0.3 * s.volume,
                startOffset: i * 0.15 * s.params.decayMult,
                useEnvelope: false,
                oscType: s.params.oscType === "square" ? "triangle" : s.params.oscType,
            });
        });
    });

    r("startup", (s) => {
        const { ctx, time, params, volume, connect } = s;
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
            const start = time + delays[i];
            const duration = 0.6 * params.decayMult * params.releaseMult - delays[i];
            const peak = 0.14 * volume;
            const attack = 0.05 * params.attackMult;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), start + attack);
            gain.gain.setValueAtTime(
                Math.max(peak * params.sustainLevel, 0.0001),
                start + duration * 0.3
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                start + Math.max(duration, attack + 0.05)
            );
            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            connect(gain);
            osc.start(start);
            osc2.start(start);
            osc.stop(start + duration + 0.02);
            osc2.stop(start + duration + 0.02);
        });
    });

    r(
        "hover",
        (s) => {
            noiseBurst(s, {
                duration: 0.006,
                expDiv: 40,
                filterType: "bandpass",
                filterFreq: s.params.filterFreq * 1.2,
                peak: 0.18 * s.volume,
            });
            tone(s, {
                freq: 1200 * s.params.pitchMult,
                duration: 0.04,
                peak: 0.08 * s.volume,
                oscType: "sine",
                useEnvelope: false,
            });
        },
        { throttleMs: 150, defaultEvent: "pointerenter" }
    );

    r("press", (s) => {
        tone(s, {
            freq: 280 * s.params.pitchMult,
            endFreq: Math.max(120 * s.params.pitchMult, 40),
            duration: 0.06,
            peak: 0.28 * s.volume,
            oscType: safeOscType(s.params.oscType, "triangle"),
        });
    }, { defaultEvent: "pointerdown" });

    r("release", (s) => {
        tone(s, {
            freq: 320 * s.params.pitchMult,
            endFreq: Math.max(520 * s.params.pitchMult, 40),
            duration: 0.05,
            peak: 0.16 * s.volume,
            oscType: safeOscType(s.params.oscType, "sine"),
        });
    }, { defaultEvent: "pointerup" });

    r("select", (s) => {
        chord(s, {
            notes: [660, 880].map((n) => n * s.params.pitchMult),
            spacing: 0.035,
            peak: 0.18 * s.volume,
            duration: 0.09,
        });
    });

    r("deselect", (s) => {
        chord(s, {
            notes: [880, 550].map((n) => n * s.params.pitchMult),
            spacing: 0.04,
            peak: 0.14 * s.volume,
            duration: 0.1,
        });
    });

    const removeSynth = (s: SynthContext) => {
        noiseBurst(s, {
            duration: 0.08,
            expDiv: 120,
            filterType: "bandpass",
            filterFreq: s.params.filterFreq * 0.8,
            peak: 0.25 * s.volume,
            freqRampTo: s.params.filterFreq * 0.25,
        });
        const { ctx, time, params, volume, connect } = s;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = safeOscType(params.oscType, "sawtooth");
        osc.frequency.setValueAtTime(600 * params.pitchMult, time);
        osc.frequency.exponentialRampToValueAtTime(
            Math.max(80 * params.pitchMult, 40),
            time + 0.18 * params.decayMult
        );
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2000, time);
        filter.frequency.exponentialRampToValueAtTime(400, time + 0.18 * params.decayMult);
        const dur = envelope(gain, time, 0.2 * volume, params, 0.18);
        osc.connect(filter);
        filter.connect(gain);
        connect(gain);
        osc.start(time);
        osc.stop(time + dur + 0.02);
    };
    r("delete", removeSynth);
    r("remove", removeSynth);

    r("notify", (s) => {
        chord(s, {
            notes: [523.25, 659.25].map((n) => n * s.params.pitchMult),
            spacing: 0.07,
            peak: 0.2 * s.volume,
            duration: 0.2,
            oscType: "sine",
        });
    });

    r(
        "keystroke",
        (s) => {
            noiseBurst(s, {
                duration: 0.003,
                expDiv: 15,
                filterType: "highpass",
                filterFreq: 2500 * s.params.pitchMult,
                peak: 0.1 * s.volume,
            });
        },
        { throttleMs: 80, defaultEvent: "keydown" }
    );

    r("connect", (s) => {
        chord(s, {
            notes: [392, 523.25, 659.25].map((n) => n * s.params.pitchMult),
            spacing: 0.06,
            peak: 0.16 * s.volume,
            duration: 0.18,
        });
    });

    r("disconnect", (s) => {
        chord(s, {
            notes: [659.25, 523.25, 349.23].map((n) => n * s.params.pitchMult),
            spacing: 0.07,
            peak: 0.14 * s.volume,
            duration: 0.16,
            oscType: "triangle",
        });
    });
}
