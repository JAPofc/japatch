// Regression for #210: the channel/DM hold menu must not be re-created while JaPatch's own rows are off.
// A wrapper function has no ref, so Discord called a method on nothing ("undefined is not a function").
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "patches/src/main/resources/japatch/bootstrap.js"), "utf8");

function slice(startMarker, endMarker) {
    const start = SOURCE.indexOf(startMarker);
    if (start < 0) throw new Error("missing: " + startMarker);
    const end = SOURCE.indexOf(endMarker, start);
    if (end < 0) throw new Error("missing end: " + endMarker);
    return SOURCE.slice(start, end);
}

const hookCode = slice("    function sheetInnerHook(rowsFor, active) {", "    // One new row in a message's hold menu");
const sheetSafeCode = slice("    function sheetSafe(fn) {", "    const fastDeleteInner = sheetInnerHook(");

let elementId = 0;
function element(type, props) {
    return {$$typeof: Symbol.for("react.element"), type, props, key: props && props.key != null ? props.key : null, _id: ++elementId};
}

function load(featuresOn, settingsOn) {
    const settings = Object.assign({debugLog: false}, settingsOn);
    const context = {
        settings,
        features: {fastDeleteChannels: true, viewRaw: true},
        enabled: key => !!settings[key] && (key === "viewRaw" ? !!(featuresOn.viewRaw) : !!(featuresOn.fastDeleteChannels)),
        React: {
            createElement: (type, props) => element(type, props),
            cloneElement: (node, props) => element(node.type, Object.assign({}, node.props, props)),
        },
        WeakMap, Object, Array, Error, console,
        dlog: () => {}, dlogText: String,
    };
    vm.createContext(context);
    vm.runInContext(
        sheetSafeCode + "\n" + hookCode +
        "\nthis.sheetInnerHook = sheetInnerHook; this.sheetSafe = sheetSafe;", context);
    return context;
}

let failures = 0;
function check(name, fn) {
    try { fn(); console.log("PASS", name); }
    catch (error) { failures++; console.log("FAIL", name, "-", error.message); }
}
function ok(value, label) { if (!value) throw new Error(label || "expected truthy"); }

// Discord's channel hold menu: a class component Discord keeps a ref to.
class ChannelLongPressSheet {
    render() { return element("View", {children: []}); }
}
ChannelLongPressSheet.prototype.isReactComponent = true;

// A function sheet, the shape Discord also ships (message sheets).
function FunctionSheet() { return element("View", {children: []}); }

function treeWith(type, props) {
    return element(type || FunctionSheet, Object.assign({channel: {id: "123456789012345678", guild_id: "1"}}, props));
}

check("option off: a function sheet comes back untouched", () => {
    const api = load({viewRaw: false, fastDeleteChannels: false}, {viewRaw: false, fastDeleteChannels: false});
    const rowsFor = (tree) => tree;
    const hook = api.sheetInnerHook(rowsFor, () => false);
    const orig = () => treeWith();
    const out = hook(orig, {}, [{channel: {id: "1"}}]);
    ok(out.type === FunctionSheet, "the sheet must stay Discord's own component");
});

check("option off: a class sheet keeps its identity", () => {
    const api = load({viewRaw: false, fastDeleteChannels: false}, {viewRaw: false, fastDeleteChannels: false});
    const hook = api.sheetInnerHook((tree) => tree, () => false);
    const out = hook(() => treeWith(ChannelLongPressSheet), {}, [{channel: {id: "1"}}]);
    ok(out.type === ChannelLongPressSheet, "class component must not be wrapped (its ref would be lost)");
});

check("option on: a class sheet is left alone, its ref matters", () => {
    const api = load({viewRaw: true, fastDeleteChannels: false}, {viewRaw: true});
    const hook = api.sheetInnerHook((tree) => tree, () => true);
    const out = hook(() => treeWith(ChannelLongPressSheet), {}, [{channel: {id: "1"}}]);
    ok(out.type === ChannelLongPressSheet, "class component must still not be wrapped");
});

check("option on: a function sheet gains the row", () => {
    const api = load({viewRaw: true, fastDeleteChannels: false}, {viewRaw: true});
    const withRow = (tree) => element(tree.type, Object.assign({}, tree.props, {row: true}));
    const hook = api.sheetInnerHook(withRow, () => true);
    const out = hook(() => treeWith(), {}, [{channel: {id: "1"}}]);
    ok(out.props && out.props.row === true, "the row should be added");
});

check("a row that can't be added never yields undefined", () => {
    const api = load({viewRaw: true, fastDeleteChannels: false}, {viewRaw: true});
    // rowsFor returns nothing at all (a menu shape it didn't expect).
    const hook = api.sheetInnerHook(() => undefined, () => true);
    const inner = hook(() => treeWith(), {}, [{channel: {id: "1"}}]);
    ok(inner && inner.type, "the wrapper must return the sheet's own tree");
    // Render the wrapper the hook produced: it must not return undefined either.
    const rendered = inner.type({channel: {id: "1"}});
    ok(rendered && rendered.type === "View", "render must return something");
});

check("sheetSafe still swallows a throwing row", () => {
    const api = load({viewRaw: true}, {viewRaw: true});
    const safe = api.sheetSafe(() => { throw new Error("boom"); });
    const out = safe(() => treeWith(), {}, [{channel: {id: "1"}}]);
    ok(out && out.type === FunctionSheet, "the original tree is returned");
});

if (failures) { console.log(failures + " failing"); process.exit(1); }
console.log("all passed");
