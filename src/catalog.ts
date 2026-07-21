import type {
    FeelId,
    FeelParams,
    FeelType,
    RegisterSoundOptions,
    ResolvedFeelParams,
    SoundEntry,
    SoundSynthFn,
} from "./types";
import { logWarn, resolveFeelParams, validateFeelParams } from "./utils";

/** Built-in feel presets (also seeded into the feel catalog). */
export const FEEL_PRESETS: Record<FeelType, FeelParams> = {
    soft: { filterFreq: 2000, q: 1, oscType: "sine", decayMult: 1.5, gainMult: 0.7, pitchMult: 0.8 },
    aero: { filterFreq: 3500, q: 2, oscType: "sine", decayMult: 1.0, gainMult: 0.9, pitchMult: 1.0 },
    arcade: { filterFreq: 4000, q: 8, oscType: "square", decayMult: 0.5, gainMult: 1.0, pitchMult: 1.5 },
    organic: {
        filterFreq: 2500,
        q: 3,
        oscType: "triangle",
        decayMult: 1.3,
        gainMult: 0.85,
        pitchMult: 0.9,
    },
    glass: { filterFreq: 6000, q: 10, oscType: "sine", decayMult: 1.2, gainMult: 0.75, pitchMult: 1.8 },
    industrial: {
        filterFreq: 3000,
        q: 12,
        oscType: "sawtooth",
        decayMult: 0.6,
        gainMult: 1.2,
        pitchMult: 0.7,
    },
    minimal: { filterFreq: 2000, q: 1, oscType: "sine", decayMult: 0.8, gainMult: 0.4, pitchMult: 1.0 },
    retro: { filterFreq: 1500, q: 2, oscType: "square", decayMult: 1.1, gainMult: 0.8, pitchMult: 0.85 },
    crisp: {
        filterFreq: 5500,
        q: 4,
        oscType: "triangle",
        decayMult: 0.6,
        gainMult: 1.0,
        pitchMult: 1.1,
    },
};

const DEFAULT_THROTTLE: Record<string, number> = {
    hover: 150,
    keystroke: 80,
    tick: 50,
};

/**
 * Unified catalog: named feels + named sounds.
 * Built-ins and user registrations share the same maps.
 */
export class Catalog {
    private feels = new Map<string, FeelParams>();
    private sounds = new Map<string, SoundEntry>();
    private throttleOverrides = new Map<string, number>();
    private debug = false;

    constructor() {
        for (const [name, params] of Object.entries(FEEL_PRESETS)) {
            this.feels.set(name, { ...params });
        }
    }

    setDebug(debug: boolean): void {
        this.debug = debug;
    }

    // ----- Feels -----

    registerFeel(name: string, params: FeelParams, builtin = false): void {
        const key = name.trim();
        if (!key) {
            logWarn(this.debug, "registerFeel: name must be a non-empty string");
            return;
        }
        const err = validateFeelParams(params);
        if (err) {
            logWarn(this.debug, `registerFeel("${key}"): ${err}`);
            return;
        }
        if (!builtin && this.feels.has(key) && FEEL_PRESETS[key as FeelType]) {
            logWarn(
                this.debug,
                `registerFeel("${key}"): overwriting built-in feel — this affects the whole app`
            );
        }
        this.feels.set(key, { ...params });
    }

    unregisterFeel(name: string): void {
        const key = name.trim();
        if (key in FEEL_PRESETS) {
            logWarn(this.debug, `unregisterFeel("${key}"): cannot remove a built-in feel`);
            // restore preset in case it was overwritten
            this.feels.set(key, { ...FEEL_PRESETS[key as FeelType] });
            return;
        }
        this.feels.delete(key);
    }

    hasFeel(name: string): boolean {
        return this.feels.has(name);
    }

    listCustomFeels(): string[] {
        return Array.from(this.feels.keys()).filter((k) => !(k in FEEL_PRESETS));
    }

    /**
     * Resolve a feel name or raw params.
     * Unknown names → aero + debug warn.
     */
    resolveFeel(feelOrParams: FeelId | FeelParams): ResolvedFeelParams {
        if (typeof feelOrParams === "string") {
            const found = this.feels.get(feelOrParams);
            if (!found) {
                logWarn(
                    this.debug,
                    `Unknown feel "${feelOrParams}" — falling back to "aero". ` +
                        `Known: ${this.listFeelNames().join(", ")}`
                );
                return resolveFeelParams(FEEL_PRESETS.aero);
            }
            return resolveFeelParams(found);
        }
        const err = validateFeelParams(feelOrParams);
        if (err) {
            logWarn(this.debug, `${err} — falling back to "aero"`);
            return resolveFeelParams(FEEL_PRESETS.aero);
        }
        return resolveFeelParams(feelOrParams);
    }

    listFeelNames(): string[] {
        return Array.from(this.feels.keys());
    }

    // ----- Sounds -----

    registerSound(
        name: string,
        synth: SoundSynthFn,
        options: RegisterSoundOptions = {},
        builtin = false
    ): void {
        const key = name.trim();
        if (!key) {
            logWarn(this.debug, "registerSound: name must be a non-empty string");
            return;
        }
        if (typeof synth !== "function") {
            logWarn(this.debug, `registerSound("${key}"): synth must be a function`);
            return;
        }
        if (!builtin && this.sounds.get(key)?.builtin) {
            logWarn(
                this.debug,
                `registerSound("${key}"): overwriting built-in sound — this affects the whole app`
            );
        }

        const prev = this.sounds.get(key);
        this.sounds.set(key, {
            synth,
            throttleMs:
                options.throttleMs ??
                prev?.throttleMs ??
                DEFAULT_THROTTLE[key] ??
                0,
            defaultEvent: options.defaultEvent ?? prev?.defaultEvent ?? "click",
            ambient: options.ambient ?? prev?.ambient ?? false,
            builtin: builtin || prev?.builtin === true,
        });
    }

    unregisterSound(name: string): void {
        const key = name.trim();
        const entry = this.sounds.get(key);
        if (!entry) return;
        if (entry.builtin) {
            logWarn(this.debug, `unregisterSound("${key}"): cannot remove a built-in sound`);
            return;
        }
        this.sounds.delete(key);
        this.throttleOverrides.delete(key);
    }

    hasSound(name: string): boolean {
        return this.sounds.has(name);
    }

    getSound(name: string): SoundEntry | undefined {
        return this.sounds.get(name);
    }

    listCustomSounds(): string[] {
        return Array.from(this.sounds.entries())
            .filter(([, e]) => !e.builtin)
            .map(([k]) => k);
    }

    listSoundNames(): string[] {
        return Array.from(this.sounds.keys());
    }

    // ----- Throttle -----

    setThrottleOverrides(partial: Partial<Record<string, number>>): void {
        for (const [k, v] of Object.entries(partial)) {
            if (v === undefined) continue;
            this.throttleOverrides.set(k, v);
        }
    }

    throttleMsFor(id: string): number {
        if (this.throttleOverrides.has(id)) return this.throttleOverrides.get(id)!;
        return this.sounds.get(id)?.throttleMs ?? DEFAULT_THROTTLE[id] ?? 0;
    }

    defaultEventFor(id: string): string {
        return this.sounds.get(id)?.defaultEvent ?? "click";
    }
}
