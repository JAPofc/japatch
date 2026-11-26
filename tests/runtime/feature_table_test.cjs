// The two bugs the device found in 1.0.4's own pages (#197, #191 and the Reviews switch).
//
// 1. Export chats was patched in and listed, but never added to FEATURE_ICONS, so the Features list and its
//    "N of M turned on" counter skipped it: turning it on still said "0 of 73".
// 2. A page's switch is drawn by switchRow(), which reads settings[key] and writes setSetting(key, value).
//    The Reviews page passed a key the settings table does not change for: reviewWarning is a reviewDB
//    sub-option, and setSetting() refuses a sub-option while its owner is off, so the list switch looked
//    dead while the master switch on Features worked.
// 3. The server editor was drawn inside pushModal with Discord's ActionSheet/Header/Close. Discord's modal host
//    mounts it in a different tree, and it crashed with "Cannot read property 'transitionState' of null".
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "patches/src/main/resources/japatch/bootstrap.js"), "utf8");

let failures = 0;
function check(name, fn) {
    try { fn(); console.log("PASS", name); }
    catch (error) { failures++; console.log("FAIL", name, "-", error.message); }
}
function eq(actual, expected, label) {
    if (actual !== expected) throw new Error((label || "") + " expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
}

// --- the feature table: every patched-in feature must be countable ---
function featureIconsKeys() {
    const start = SOURCE.indexOf("FEATURE_ICONS = {") + "FEATURE_ICONS = ".length;
    let depth = 0, end = start;
    for (let i = start; i < SOURCE.length; i++) {
        if (SOURCE[i] === "{") depth++;
        else if (SOURCE[i] === "}" && --depth === 0) { end = i + 1; break; }
    }
    const block = SOURCE.slice(start, end);
    return Array.from(block.matchAll(/([A-Za-z0-9_]+)\s*:\s*\[/g)).map(m => m[1]);
}
function kotlinFeatureKeys() {
    const kt = fs.readFileSync(path.join(ROOT, "patches/src/main/kotlin/app/japatch/patches/DiscordPatches.kt"), "utf8");
    // The selection list ends where the next Kotlin call starts, so slice to the closing parenthesis of listOf.
    const from = kt.indexOf('listOf("noTyping"');
    let depth = 0, end = from;
    for (let i = kt.indexOf("(", from); i < kt.length; i++) {
        if (kt[i] === "(") depth++;
        else if (kt[i] === ")" && --depth === 0) { end = i; break; }
    }
    return Array.from(kt.slice(from, end).matchAll(/"([A-Za-z0-9_]+)"/g)).map(m => m[1]);
}

check("every feature patched in can be counted and listed (chatExport was missing)", () => {
    const icons = featureIconsKeys(), patched = kotlinFeatureKeys();
    const missing = patched.filter(key => !icons.includes(key));
    eq(missing.join(","), "", "features in the bundle but not in FEATURE_ICONS:");
});

check("Export chats is one of them", () => {
    const icons = featureIconsKeys();
    eq(icons.includes("chatExport"), true, "chatExport in FEATURE_ICONS");
});

// --- every settings key a page's switch writes must be a real setting ---
check("switchRow() is only given keys the settings table knows", () => {
    // Settings that a switch may own are declared with a default value. Only those count: a key that is a
    // derived value (a computed field) or a page-local state must not be given to switchRow, because the switch
    // reads settings[key] and writes setSetting(key, ...), and neither exists for it.
    const defaults = SOURCE;
    const used = Array.from(SOURCE.matchAll(/switchRow\(\s*(?:Switch|ui\.TableSwitchRow)\s*,\s*"([A-Za-z0-9_]+)"/g)).map(m => m[1]);
    const unknown = used.filter(key => !new RegExp("(^|[,{ ])" + key + "\\s*:\\s*(false|true|\\d|\"|'|null)", "m").test(defaults));
    eq(unknown.join(","), "", "switchRow keys missing from the settings table:");
    eq(used.length > 10, true, "found switchRow calls");
});

// --- a page that draws a switch must redraw when that switch changes ---
check("every page with a switch subscribes to settings", () => {
    // useSettings(key) redraws that key and, because notify() also fires the owner's listeners, its whole
    // feature. A page with a switch and no subscription at all never redraws: that is the bug the device saw
    // on Reviews (the switch's knob stayed put while the value changed).
    const silent = [];
    const seen = new Set();
    for (const match of SOURCE.matchAll(/function (\w+Settings)\(\)\s*\{/g)) {
        const name = match[1];
        if (seen.has(name)) continue;
        seen.add(name);
        const body = SOURCE.slice(match.index, SOURCE.indexOf("\n    }", match.index));
        if (!/switchRow\(|TableSwitchRow/.test(body)) continue;
        if (!/useSettings\(/.test(body)) silent.push(name);
    }
    eq(silent.join(","), "", "switch pages with no useSettings():");
});

if (failures) { console.log(failures + " failing"); process.exit(1); }
console.log("all passed");
