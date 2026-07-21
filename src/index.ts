/**
 * @thenormvg/web-have-sounds
 *
 * Architecture:
 *   catalog  — named feels + sounds (built-ins + register*)
 *   engine   — AudioContext, pan, warm-up
 *   pipeline — play / ambient / bind (single path)
 *   synth    — shared primitives; builtins registered like user sounds
 */

import { getDefaultInstance, createUISounds, FEEL_PRESETS } from "./instance";
import { synthHelpers } from "./synth/primitives";

export type {
    SoundType,
    SoundId,
    AmbientType,
    FeelType,
    FeelId,
    FeelParams,
    ResolvedFeelParams,
    SoundSynthContext,
    SoundSynthFn,
    RegisterSoundOptions,
    UISoundsConfig,
    PlayOptions,
    PlayResult,
    PlayFailReason,
    BindUISoundsOptions,
} from "./types";

export type { UISoundsInstance } from "./instance";

export { FEEL_PRESETS, createUISounds, synthHelpers };

// ---------------------------------------------------------------------------
// Default singleton API (most apps use these)
// ---------------------------------------------------------------------------

const api = () => getDefaultInstance();

/** Configure global defaults (feel, volume, mute, randomize, throttle, debug). */
export function configureUISounds(
    config: import("./types").UISoundsConfig
): void {
    api().configure(config);
}

/**
 * Play a UI sound (built-in or registered).
 * Never throws. Returns `{ ok: true }` or `{ ok: false, reason }`.
 *
 * @example playUISound('click')
 * @example playUISound('success', 'glass')
 * @example playUISound('notify', { feel: 'brand', pan: 0.5 })
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

export function startAmbient(
    type: import("./types").AmbientType | string = "loading",
    feelOrParams?: import("./types").FeelId | import("./types").FeelParams,
    ctx?: AudioContext
): void {
    api().startAmbient(type, feelOrParams, ctx);
}

export function stopAmbient(): void {
    api().stopAmbient();
}

export function isAmbientPlaying(): boolean {
    return api().isAmbientPlaying();
}

/**
 * Declarative binding for `data-uisound` attributes.
 * @returns unbind function
 */
export function bindUISounds(
    options?: import("./types").BindUISoundsOptions
): () => void {
    return api().bind(options);
}
