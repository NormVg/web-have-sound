import type { Catalog } from "./catalog";
import type {
    BindUISoundsOptions,
    FeelId,
    FeelParams,
    PlayOptions,
    PlayResult,
    SoundId,
} from "./types";
import { logWarn } from "./utils";

export type PlayFn = (
    type: SoundId,
    feelOrOptions?: FeelId | FeelParams | PlayOptions,
    ctx?: AudioContext
) => PlayResult;

/**
 * Declarative DOM binding for `data-uisound` one-shots.
 */
export function bindUISoundsDom(
    catalog: Catalog,
    play: PlayFn,
    getDebug: () => boolean,
    options: BindUISoundsOptions = {}
): () => void {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return () => undefined;
    }

    const root: ParentNode = options.root ?? document;
    const capture = options.capture ?? true; // Must be true to catch non-bubbling pointerenter/focus
    const events = [
        "click",
        "pointerenter",
        "pointerdown",
        "pointerup",
        "keydown",
        "change",
        "focus",
    ] as const;

    const handler = (event: Event) => {
        try {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const el = target.closest("[data-uisound]") as HTMLElement | null;
            if (!el) return;
            if (root instanceof Element && !root.contains(el)) return;

            const sound = el.getAttribute("data-uisound");
            if (!sound || !catalog.hasSound(sound)) {
                if (sound && getDebug()) {
                    logWarn(true, `data-uisound="${sound}" is not a known one-shot sound`);
                }
                return;
            }

            const expected =
                el.getAttribute("data-uisound-event") || catalog.defaultEventFor(sound);
            if (event.type !== expected) return;

            if (sound === "keystroke" && event instanceof KeyboardEvent) {
                if (event.ctrlKey || event.metaKey || event.altKey) return;
                if (
                    event.key.length !== 1 &&
                    event.key !== "Backspace" &&
                    event.key !== "Enter"
                ) {
                    return;
                }
            }

            let feelOrParams: FeelId | FeelParams | undefined;
            const paramsRaw = el.getAttribute("data-uisound-params");
            const feelRaw = el.getAttribute("data-uisound-feel");

            if (paramsRaw) {
                try {
                    feelOrParams = JSON.parse(paramsRaw) as FeelParams;
                } catch {
                    logWarn(getDebug(), "Invalid JSON in data-uisound-params on element");
                    feelOrParams = feelRaw && catalog.hasFeel(feelRaw) ? feelRaw : undefined;
                }
            } else if (feelRaw) {
                if (catalog.hasFeel(feelRaw)) feelOrParams = feelRaw;
                else logWarn(getDebug(), `data-uisound-feel="${feelRaw}" is not a known feel`);
            }

            const panRaw = el.getAttribute("data-uisound-pan");
            const pan = panRaw !== null ? Number(panRaw) : undefined;

            if (pan !== undefined && !Number.isNaN(pan)) {
                play(sound, { feel: feelOrParams, pan });
            } else if (feelOrParams !== undefined) {
                play(sound, feelOrParams);
            } else {
                play(sound);
            }
        } catch {
            /* never throw from DOM */
        }
    };

    for (const ev of events) {
        root.addEventListener(ev, handler, capture);
    }

    return () => {
        for (const ev of events) {
            root.removeEventListener(ev, handler, capture);
        }
    };
}
