// Kept drafts: Discord's own DraftStore (metro 7510) is never saved on this build, so every unsent message dies with
// the app. These checks take the shipped functions out of the runtime and run them against a fake store and a fake
// documents folder, so the write, the read, the restore and every way the file can be wrong are all exercised.
//
// The rules the code promises, and that this test holds it to:
//   - nothing is written before the saved file has been read (an empty state must never replace an older file);
//   - a draft typed in this session beats the one on disk, so restoring never undoes typing;
//   - a draft that is sent (Discord clears it) disappears from the file as well;
//   - restoring does not itself trigger a write;
//   - a file from a newer version, a channel id that is not one, a slot that is not text, or a value JSON cannot hold
//     is skipped instead of repaired;
//   - with the switch off the module is left exactly as Discord shipped it.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "patches/src/main/resources/japatch/bootstrap.js"), "utf8");

let failures = 0;
function check(name, fn) {
    try { fn(); console.log("PASS " + name); }
    catch (error) { failures++; console.log("FAIL " + name + " - " + error.message); }
}
const eq = (actual, expected, label) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error((label || "") + " expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
};
function slice(from, to) {
    const start = SOURCE.indexOf(from);
    const end = SOURCE.indexOf(to, start + 1);
    if (start < 0 || end < 0) throw new Error("slice not found: " + from);
    return SOURCE.slice(start, end);
}

const BODY = slice("    const DRAFTS = \"japatch-drafts.json\"", "    // ---- A server nickname of your own");

// A store shaped the way DraftStore is: state is a plain map, getState hands it out, getDraft reads it, and every
// change ends in emitChange (which is what the message bar listens to).
function makeStore(state) {
    const store = {
        emitCount: 0,
        getState() { return state; },
        getDraft(channelId, draftType) { return state[channelId] && state[channelId][draftType] ? state[channelId][draftType].draft : ""; },
        emitChange() { store.emitCount++; },
    };
    return store;
}

// A fake phone: files land in a Map, and every write is counted so "never wrote" can be asserted.
function makeFiles(initial) {
    const disk = new Map(Object.entries(initial || {}));
    const calls = { reads: 0, writes: 0 };
    return {
        disk, calls,
        fileExists: name => Promise.resolve(disk.has(name)),
        readFile: (dir, name) => { calls.reads++; return disk.has(name) ? Promise.resolve(disk.get(name)) : Promise.reject(new Error("ENOENT")); },
        writeFile: (dir, name, text) => { calls.writes++; disk.set(name, text); return Promise.resolve(); },
    };
}

const flush = () => new Promise(resolve => setImmediate(resolve));
const settle = async () => { for (let i = 0; i < 6; i++) await flush(); };

function run(options) {
    const o = options || {};
    const store = makeStore(o.state || {});
    const files = makeFiles(o.disk);
    const logs = [];
    const timers = [];
    const ctx = {
        settings: { drafts: o.on !== false, debugLog: true },
        features: { drafts: o.on !== false },
        files,
        // Timers are collected rather than run, so a test decides when the debounce fires.
        later: (fn) => { timers.push(fn); return timers.length; },
        dlog: (level, area, text) => logs.push(text),
        dlogText: error => String(error && error.message || error),
        Date, JSON, Object, Array, Promise, Map, Set, Error, Number, String, Math, RegExp,
    };
    vm.createContext(ctx);
    vm.runInContext(BODY + "\nthis.attach = draftsWatch; this.drafts = drafts; this.save = draftsSave; this.load = draftsLoad; this.snapshot = draftsSnapshot;", ctx);
    const fire = () => { const pending = timers.splice(0); pending.forEach(fn => fn()); };
    return { store, files, logs, timers, ctx, fire, attach: () => ctx.attach({ default: store }) };
}

(async () => {
    // --- 1. a draft typed while the app is open must be written ---
    await (async () => {
        const env = run({ state: { "123456789": { ChannelMessage: { draft: "hello", timestamp: 1 } } } });
        env.attach();
        await settle();                 // the read finishes: nothing saved yet, so the store may write from now on
        env.store.getState()["123456789"].ChannelMessage.draft = "hello there";
        env.store.emitChange();         // Discord tells the message bar a draft moved
        env.fire();                     // the debounce
        await settle();
        check("a changed draft is written to the documents folder", () => {
            eq(env.files.calls.writes, 1, "writes");
            const saved = JSON.parse(env.files.disk.get("japatch-drafts.json"));
            eq(saved.version, 1, "version");
            eq(saved.drafts["123456789"].ChannelMessage.draft, "hello there", "draft");
        });
    })();

    // --- 2. nothing may be written before the saved file has been read ---
    await (async () => {
        const env = run({ disk: { "japatch-drafts.json": JSON.stringify({ version: 1, drafts: { "123456789": { ChannelMessage: { draft: "older", timestamp: 5 } } } }) } });
        env.attach();
        // A change arrives while the read is still in flight.
        env.store.getState()["123456789"] = { ChannelMessage: { draft: "typed", timestamp: 9 } };
        env.store.emitChange();
        env.fire();
        await settle();
        check("the file is not overwritten before it has been read", () => {
            const saved = JSON.parse(env.files.disk.get("japatch-drafts.json"));
            eq(saved.drafts["123456789"].ChannelMessage.draft, "older", "the saved draft is still the saved one");
        });
    })();

    // --- 3. a saved draft comes back, and the restore itself does not write ---
    await (async () => {
        const env = run({ disk: { "japatch-drafts.json": JSON.stringify({ version: 1, drafts: { "123456789": { ChannelMessage: { draft: "left here", timestamp: 5 } } } }) } });
        env.attach();
        await settle();
        check("a saved draft is put back where the message bar reads it", () => {
            eq(env.store.getDraft("123456789", "ChannelMessage"), "left here", "getDraft");
            eq(env.store.emitCount, 1, "the message bar was told once");
            eq(env.files.calls.writes, 0, "restoring does not write");
            eq(env.ctx.drafts.restored, 1, "restored");
        });
    })();

    // --- 4. a draft typed in this session wins over the one on disk ---
    await (async () => {
        const env = run({
            state: { "123456789": { ChannelMessage: { draft: "typed now", timestamp: 9 } } },
            disk: { "japatch-drafts.json": JSON.stringify({ version: 1, drafts: { "123456789": { ChannelMessage: { draft: "from before", timestamp: 5 } } } }) },
        });
        env.attach();
        await settle();
        check("restoring never undoes typing", () => {
            eq(env.store.getDraft("123456789", "ChannelMessage"), "typed now", "draft");
            eq(env.ctx.drafts.restored, 0, "restored");
        });
    })();

    // --- 5. a cleared draft (sent) leaves the file too ---
    await (async () => {
        const env = run({ disk: { "japatch-drafts.json": JSON.stringify({ version: 1, drafts: { "123456789": { ChannelMessage: { draft: "sending", timestamp: 5 } } } }) } });
        env.attach();
        await settle();
        delete env.store.getState()["123456789"].ChannelMessage.draft;   // Discord clears the draft on send
        env.store.emitChange();
        env.fire();
        await settle();
        check("a sent draft is dropped from the file", () => {
            const saved = JSON.parse(env.files.disk.get("japatch-drafts.json"));
            eq(Object.keys(saved.drafts), [], "no drafts left");
        });
    })();

    // --- 6. a file written by a newer version is left alone ---
    await (async () => {
        const newer = { version: 99, drafts: { "123456789": { ChannelMessage: { draft: "from a newer build", timestamp: 5 } } } };
        const env = run({ disk: { "japatch-drafts.json": JSON.stringify(newer) } });
        env.attach();
        await settle();
        check("a newer file version is not read and not replaced", () => {
            eq(env.store.getDraft("123456789", "ChannelMessage"), "", "nothing restored");
            eq(JSON.parse(env.files.disk.get("japatch-drafts.json")).version, 99, "file untouched");
        });
    })();

    // --- 7. a broken file does not stop the feature, and is still not silently reused ---
    await (async () => {
        const env = run({ disk: { "japatch-drafts.json": "{not json" }, state: { "123456789": { ChannelMessage: { draft: "after", timestamp: 7 } } } });
        env.attach();
        await settle();
        env.store.emitChange();
        env.fire();
        await settle();
        check("a broken file costs the saved drafts, not the app", () => {
            eq(env.ctx.drafts.applied, true, "changes may be written again");
            eq(JSON.parse(env.files.disk.get("japatch-drafts.json")).drafts["123456789"].ChannelMessage.draft, "after", "new draft saved");
            eq(env.logs.some(t => t.indexOf("not read") >= 0), true, "the problem is logged");
        });
    })();

    // --- 8. what must never be written: bad ids, non-text slots, enormous drafts ---
    await (async () => {
        const long = "x".repeat(9000);
        const env = run({
            state: {
                "123456789": { ChannelMessage: { draft: long, timestamp: 3 } },
                "not-a-number": { ChannelMessage: { draft: "no", timestamp: 3 } },
                "987654321": { ChannelMessage: { draft: 42, timestamp: 3 }, Poll: { draft: "kept", timestamp: 3 } },
                "555555555": { ChannelMessage: { draft: "", timestamp: 3 } },
            },
        });
        env.attach();
        await settle();
        const snapshot = env.ctx.snapshot();
        check("only a real channel with real text is written, and a draft is capped", () => {
            eq(Object.keys(snapshot).sort(), ["123456789", "987654321"], "channels");
            eq(snapshot["123456789"].ChannelMessage.draft.length, 4000, "capped");
            eq(snapshot["987654321"].ChannelMessage, undefined, "a number is not a draft");
            eq(snapshot["987654321"].Poll.draft, "kept", "the real one in the same channel is kept");
            eq(snapshot["555555555"], undefined, "an empty draft is not a draft");
        });
    })();

    // --- 9. the switch: off means the module is exactly as Discord shipped it ---
    await (async () => {
        const env = run({ on: false, state: { "123456789": { ChannelMessage: { draft: "x", timestamp: 1 } } } });
        const before = env.store.emitChange;
        const out = env.attach();
        check("with the switch off nothing is hooked and nothing is read", () => {
            eq(env.store.emitChange, before, "emitChange untouched");
            eq(env.files.calls.reads, 0, "no read");
            eq(out, undefined, "attach returns nothing to replace");
        });
    })();

    // --- 10. the module handler and the selection are wired the way the rest of the runtime is ---
    check("the store module is selected and hooked only for this feature", () => {
        if (!/if \(features\.drafts\) selectModules\(\[7510\]\);/.test(SOURCE)) throw new Error("7510 is not selected");
        if (!/case 7510: if \(features\.drafts\) draftsStart\(exports\); return exports;/.test(SOURCE))
            throw new Error("case 7510 does not call draftsStart");
        if (!/drafts:false/.test(SOURCE) || !/drafts: false/.test(SOURCE)) throw new Error("drafts is not in both settings literals");
    });

    console.log(failures ? "drafts_kept: FAIL (" + failures + ")" : "drafts_kept: PASS");
    process.exit(failures ? 1 : 0);
})();
