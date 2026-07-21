import type { FeelParams, ResolvedFeelParams } from "./types";

export function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

export function nowMs(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function resolveFeelParams(base: FeelParams): ResolvedFeelParams {
    return {
        filterFreq: base.filterFreq,
        q: base.q,
        oscType: base.oscType,
        decayMult: base.decayMult,
        gainMult: base.gainMult,
        pitchMult: base.pitchMult,
        pan: base.pan ?? 0,
        attackMult: base.attackMult ?? 1,
        sustainLevel: base.sustainLevel ?? 0.6,
        releaseMult: base.releaseMult ?? 1,
    };
}

export function applyRandomize(
    params: ResolvedFeelParams,
    doRandomize: boolean
): ResolvedFeelParams {
    if (!doRandomize) return params;
    const jitter = () => 1 + (Math.random() * 0.08 - 0.04); // ±4%
    return {
        ...params,
        pitchMult: params.pitchMult * jitter(),
        decayMult: params.decayMult * jitter(),
        filterFreq: params.filterFreq * jitter(),
    };
}

/** Validate required FeelParams fields; returns error message or null. */
export function validateFeelParams(params: unknown): string | null {
    if (!params || typeof params !== "object") return "FeelParams must be an object";
    const p = params as Record<string, unknown>;
    const required = [
        "filterFreq",
        "q",
        "oscType",
        "decayMult",
        "gainMult",
        "pitchMult",
    ] as const;
    const missing = required.filter((k) => p[k] === undefined || p[k] === null);
    if (missing.length) return `Missing FeelParams fields: ${missing.join(", ")}`;
    return null;
}

export function isFeelParams(v: object): v is FeelParams {
    return (
        "filterFreq" in v &&
        "oscType" in v &&
        "decayMult" in v &&
        "gainMult" in v &&
        "pitchMult" in v &&
        "q" in v
    );
}

export function logWarn(debug: boolean, message: string): void {
    if (!debug) return;
    if (typeof console !== "undefined" && console.warn) {
        console.warn(`[web-have-sounds] ${message}`);
    }
}
