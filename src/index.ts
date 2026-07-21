/**
 * @thenormvg/web-have-sounds
 *
 * Architecture:
 *   catalog  — named feels + one-shots + loops
 *   engine   — AudioContext, pan, warm-up
 *   pipeline — play / startLoop / bind
 *   synth    — shared primitives; builtins registered like user content
 */

import { getDefaultInstance, createUISounds, FEEL_PRESETS } from "./instance";
import { synthHelpers } from "./synth/primitives";

export type {
    SoundType,
    SoundId,
    AmbientType,
    BuiltInLoopType,
    LoopId,
    FeelType,
    FeelId,
    FeelParams,
    ResolvedFeelParams,
    SoundSynthContext,
    SoundSynthFn,
    LoopSynthContext,
    LoopSynthFn,
    LoopControl,
    RegisterSoundOptions,
    RegisterLoopOptions,
    StartLoopOptions,
    StopLoopOptions,
    UISoundsConfig,
    PlayOptions,
    PlayResult,
    PlayFailReason,
    BindUISoundsOptions,
} from "./types";

export type { UISoundsInstance } from "./instance";

export { FEEL_PRESETS, createUISounds, synthHelpers };

// ---------------------------------------------------------------------------
// Default singleton API
// ---------------------------------------------------------------------------

const api = () => getDefaultInstance();

export function configureUISounds(
    config: import("./types").UISoundsConfig
): void {
    api().configure(config);
}

/**
 * Play a one-shot UI sound.
 * Never throws. Returns `{ ok: true }` or `{ ok: false, reason }`.
 * For long-running beds use `startLoop` / `stopLoop`.
 */
export function playUISound(
    type: import("./types").SoundId,
    feelOrOptions?:
        | import("./types").FeelId
        | import("./types").FeelParams
        | import("./types").PlayOptions,
    ctx?: AudioContext
): import("./types").PlayResult {
    return api().play(type, feelOrOptions, ctx);
}

export function warmUpAudio(ctx?: AudioContext): void {
    api().warmUp(ctx);
}

export function getAudioContext(): AudioContext | null {
    return api().getAudioContext();
}

export function setUISoundsEnabled(value: boolean): void {
    api().setEnabled(value);
}

export function isUISoundsEnabled(): boolean {
    return api().isEnabled();
}

export function setMasterVolume(volume: number): void {
    api().setMasterVolume(volume);
}

export function getMasterVolume(): number {
    return api().getMasterVolume();
}

export function registerFeel(
    name: string,
    params: import("./types").FeelParams
): void {
    api().registerFeel(name, params);
}

export function unregisterFeel(name: string): void {
    api().unregisterFeel(name);
}

export function hasFeel(name: string): boolean {
    return api().hasFeel(name);
}

export function listCustomFeels(): string[] {
    return api().listCustomFeels();
}

export function registerSound(
    name: string,
    synthFn: import("./types").SoundSynthFn,
    options?: import("./types").RegisterSoundOptions
): void {
    api().registerSound(name, synthFn, options);
}

export function unregisterSound(name: string): void {
    api().unregisterSound(name);
}

export function hasSound(name: string): boolean {
    return api().hasSound(name);
}

export function listCustomSounds(): string[] {
    return api().listCustomSounds();
}

// ---------------------------------------------------------------------------
// Loops (long-running / ambient beds)
// ---------------------------------------------------------------------------

/**
 * Register a custom long-running loop.
 * Your synth starts continuous sources and returns `{ sources }` so stop can end them.
 *
 * @example
 * ```ts
 * registerLoop('upload', ({ ctx, time, params, volume, connect }) => {
 *   const osc = ctx.createOscillator();
 *   const gain = ctx.createGain();
 *   osc.frequency.value = 220 * params.pitchMult;
 *   gain.gain.value = 0.06 * volume;
 *   osc.connect(gain);
 *   connect(gain);
 *   osc.start(time);
 *   return { sources: [osc] };
 * }, { fadeIn: 0.1, fadeOut: 0.2 });
 *
 * startLoop('upload');
 * // …
 * stopLoop('upload');
 * ```
 */
export function registerLoop(
    name: string,
    synthFn: import("./types").LoopSynthFn,
    options?: import("./types").RegisterLoopOptions
): void {
    api().registerLoop(name, synthFn, options);
}

export function unregisterLoop(name: string): void {
    api().unregisterLoop(name);
}

export function hasLoop(name: string): boolean {
    return api().hasLoop(name);
}

export function listCustomLoops(): string[] {
    return api().listCustomLoops();
}

/** All known loop ids (built-in + custom). */
export function listLoops(): string[] {
    return api().listLoops();
}

/**
 * Start a long-running loop by id. Multiple loops can run at once.
 * Re-starting the same id restarts it. Returns false if muted / unknown / no audio.
 */
export function startLoop(
    id: import("./types").LoopId,
    options?: import("./types").StartLoopOptions
): boolean {
    return api().startLoop(id, options);
}

/**
 * Stop one loop, or all loops if `id` is omitted.
 */
export function stopLoop(
    id?: import("./types").LoopId,
    options?: import("./types").StopLoopOptions
): void {
    api().stopLoop(id, options);
}

export function stopAllLoops(options?: import("./types").StopLoopOptions): void {
    api().stopAllLoops(options);
}

/** If `id` omitted, true when any loop is active. */
export function isLoopPlaying(id?: import("./types").LoopId): boolean {
    return api().isLoopPlaying(id);
}

export function getActiveLoops(): string[] {
    return api().getActiveLoops();
}

/** Live relative volume for a playing loop (0–1). */
export function setLoopVolume(id: import("./types").LoopId, volume: number): void {
    api().setLoopVolume(id, volume);
}

// ---------------------------------------------------------------------------
// Back-compat ambient aliases → loop API
// ---------------------------------------------------------------------------

/** @deprecated Prefer `startLoop('loading')` — same behavior, multi-loop capable. */
export function startAmbient(
    type: import("./types").AmbientType | string = "loading",
    feelOrParams?: import("./types").FeelId | import("./types").FeelParams,
    ctx?: AudioContext
): void {
    api().startAmbient(type, feelOrParams, ctx);
}

/** @deprecated Prefer `stopLoop(id)` or `stopAllLoops()`. */
export function stopAmbient(id?: import("./types").LoopId): void {
    api().stopAmbient(id);
}

/** @deprecated Prefer `isLoopPlaying(id)`. */
export function isAmbientPlaying(id?: import("./types").LoopId): boolean {
    return api().isAmbientPlaying(id);
}

/**
 * Declarative binding for `data-uisound` attributes (one-shots only).
 * @returns unbind function
 */
export function bindUISounds(
    options?: import("./types").BindUISoundsOptions
): () => void {
    return api().bind(options);
}
