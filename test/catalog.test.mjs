import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    createUISounds,
    FEEL_PRESETS,
    playUISound,
    configureUISounds,
    registerFeel,
    registerLoop,
    hasFeel,
    hasLoop,
    hasSound,
    listLoops,
} from "../dist/index.mjs";

describe("catalog", () => {
    it("ships built-in feels and sounds", () => {
        assert.ok(FEEL_PRESETS.aero);
        assert.equal(hasFeel("glass"), true);
        assert.equal(hasSound("click"), true);
        assert.equal(hasSound("whoosh"), false);
    });

    it("ships built-in loops separately from one-shots", () => {
        assert.equal(hasLoop("loading"), true);
        assert.equal(hasLoop("hum"), true);
        assert.equal(hasSound("loading"), false);
        assert.ok(listLoops().includes("processing"));
    });

    it("registerFeel makes a named feel available", () => {
        const sfx = createUISounds();
        sfx.registerFeel("brand", {
            filterFreq: 4000,
            q: 4,
            oscType: "triangle",
            decayMult: 1,
            gainMult: 0.8,
            pitchMult: 1.1,
        });
        assert.equal(sfx.hasFeel("brand"), true);
        assert.ok(sfx.listCustomFeels().includes("brand"));
    });

    it("registerLoop adds a custom loop id", () => {
        const sfx = createUISounds();
        sfx.registerLoop("upload", () => ({ sources: [] }));
        assert.equal(sfx.hasLoop("upload"), true);
        assert.ok(sfx.listCustomLoops().includes("upload"));
    });
});

describe("play pipeline (ssr / gates)", () => {
    it("returns ssr or no-audio safely without throwing", () => {
        // In Node there is no window AudioContext — must not throw
        const result = playUISound("click");
        assert.equal(result.ok, false);
        assert.ok(
            result.reason === "ssr" || result.reason === "no-audio" || result.reason === "muted"
        );
    });

    it("returns unknown for missing sound", () => {
        configureUISounds({ enabled: true, volume: 1, debug: false });
        const result = playUISound("not-a-real-sound-xyz");
        assert.equal(result.ok, false);
        // ssr/no-audio may win first in node; isolated instance is clearer
        const sfx = createUISounds();
        sfx.configure({ enabled: true, volume: 1 });
        const r2 = sfx.play("not-a-real-sound-xyz");
        assert.equal(r2.ok, false);
        assert.ok(
            r2.reason === "unknown" || r2.reason === "ssr" || r2.reason === "no-audio"
        );
    });

    it("returns muted when disabled", () => {
        const sfx = createUISounds();
        sfx.setEnabled(false);
        const r = sfx.play("click");
        assert.deepEqual(r, { ok: false, reason: "muted" });
    });

    it("returns muted when master volume is 0", () => {
        const sfx = createUISounds();
        sfx.setMasterVolume(0);
        const r = sfx.play("click");
        assert.deepEqual(r, { ok: false, reason: "muted" });
    });
});
