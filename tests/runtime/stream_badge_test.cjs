// The Streaming badge feature makes a promise in its own warning: it reports a session that already exists and cannot
// create one. Every check below holds that promise to the code, because the failure mode is silent: an invented
// session id would report hours for a broadcast that never happened.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..", "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "patches/src/main/resources/japatch/bootstrap.js"), "utf8");
const slice = (from, to) => {
    const start = SOURCE.indexOf(from);
    const end = SOURCE.indexOf(to, start + 1);
    if (start < 0 || end < 0) throw new Error(`slice not found: ${from}`);
    return SOURCE.slice(start, end);
};

let failures = 0;
function check(name, fn) {
    try { fn(); console.log("PASS " + name); }
    catch (error) { failures++; console.log("FAIL " + name + " - " + error.message); }
}

const body = slice("    const STREAM_CONNECTED = 4;", "    function badgeProgressCard(s, on) {");

function run(options) {
    const o = options || {};
    const posts = [];
    const ctx = {
        tr: (text, vars) => String(text).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined ? vars[k] : "{" + k + "}")),
        enabled: key => key === "streamBadge" ? o.on !== false : false,
        features: {},
        badges: { user: "111" },
        currentUser: () => ({ id: "111" }),
        global: { clearTimeout: () => {} },
        later: () => 1,
        inspectedExport: id => o.store ? o.store : undefined,
        badgeAuth: () => "auth",
        badgeAnalyticsToken: async () => "analytics",
        badgeEvent: (type, props) => ({ type, properties: props }),
        questRequest: async (url, payload, desktop, method) => { posts.push({ url, payload, method }); return { body: {} }; },
        notify: () => {},
    };
    vm.createContext(ctx);
    vm.runInContext(body + "\nthis.api = {streamBadgeSession, streamBadgeStatus, streamBadgeReport, streamBadgeStop, state: streamBadge};", ctx);
    return { api: ctx.api, posts };
}

const liveStore = (extra) => Object.assign({
    getStreamForUser: () => Object.assign({ streamId: "REAL-STREAM-1", state: 4, startTime: Date.now() - 120000, viewerCount: 2 }, extra || {}),
}, {});

check("a live session with viewers is read from Discord, never invented", () => {
    const { api } = run({ store: liveStore() });
    const live = api.streamBadgeSession();
    assert.strictEqual(live.id, "REAL-STREAM-1");
    assert.strictEqual(live.viewers, 2);
});

check("no session means nothing to report", () => {
    const { api } = run({ store: { getStreamForUser: () => null } });
    assert.strictEqual(api.streamBadgeSession(), null);
    assert.strictEqual(api.streamBadgeStatus().live, false);
});

check("a session that is not connected yet is not treated as live", () => {
    // Only CONNECTED has media; a pending session earns nothing and must not be reported.
    const { api } = run({ store: liveStore({ state: 1 }) });
    assert.strictEqual(api.streamBadgeSession(), null);
});

check("streaming to nobody reports nothing at all", () => {
    // The measured behaviour of every public attempt: with zero viewers Discord ignores the session entirely.
    const { api, posts } = run({ store: liveStore({ viewerCount: 0 }) });
    const status = api.streamBadgeStatus();
    assert.strictEqual(status.live, true);
    assert.strictEqual(status.counted, false);
    return api.streamBadgeReport().then(() => assert.strictEqual(posts.length, 0, "a report went out with no viewers"));
});

check("a watched session reports once, with the session's own id", async () => {
    const { api, posts } = run({ store: liveStore() });
    await api.streamBadgeReport();
    assert.strictEqual(posts.length, 1);
    assert.strictEqual(posts[0].url, "/science");
    assert.strictEqual(posts[0].payload.events[0].properties.stream_id, "REAL-STREAM-1");
});

check("the duration reported is the time since the session started", async () => {
    const { api, posts } = run({ store: liveStore({ startTime: Date.now() - 180000 }) });
    await api.streamBadgeReport();
    const ms = posts[0].payload.events[0].properties.duration_tracked_ms;
    assert.ok(ms >= 180000 && ms < 240000, "expected ~3 minutes, got " + ms);
});

check("the same minute is never reported twice", async () => {
    const { api, posts } = run({ store: liveStore() });
    await api.streamBadgeReport();
    await api.streamBadgeReport();
    await api.streamBadgeReport();
    assert.strictEqual(posts.length, 1, "duplicate reports inflate the total");
});

check("turning the feature off stops reporting", async () => {
    const { api, posts } = run({ store: liveStore(), on: false });
    await api.streamBadgeReport();
    assert.strictEqual(posts.length, 0);
});

check("the feature is marked risky, and its warning says what it cannot do", () => {
    const risky = slice("    const RISKY_FEATURES = {", "    // Cancelling remounts the switch");
    assert.ok(/streamBadge:\s*\(\) => tr\(/.test(risky), "streamBadge must ask before switching on");
    assert.ok(/cannot create one/i.test(risky), "the warning has to say it cannot create a session");
});

check("it is never described as creating a stream", () => {
    const page = slice("    function StreamBadgeSettings() {", "    function BadgeSettings() {");
    assert.ok(!/start (a|the) stream|begin (a|the) stream|go live for you/i.test(page), "the page must not claim to start a stream");
    assert.ok(/Nothing is created|nothing is created/i.test(page + slice("        withOptions(\"quests\", \"streamBadge\"", "StreamBadgeSettings);")));
});

if (failures) { console.log(failures + " failing"); process.exit(1); }
console.log("all passed");
