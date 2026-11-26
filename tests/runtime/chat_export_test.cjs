// Chat export (#197): the JSON is built from the messages Discord already has on the phone, and nothing is uploaded.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "patches/src/main/resources/japatch/bootstrap.js"), "utf8");

const start = SOURCE.indexOf("    // Chat export (#197");
// Stop before the menu row and the settings page: they need React and Discord's menu helpers, which aren't
// what this file tests. The first "// The row goes in" comment marks that boundary.
const end = SOURCE.indexOf("    // The row goes in the channel's hold menu");
if (start < 0 || end < start) throw new Error("the chat export block is missing from bootstrap.js");

// Discord hands out messages wrapped in its own collection: some builds have toArray(), some only each().
const collection = list => ({
    toArray: () => list,
    last: () => list[list.length - 1],
});
const messages = [
    {id: "1", content: "first", timestamp: new Date("2024-05-01T10:00:00Z"), author: {id: "9", username: "ana", globalName: "Ana"}},
    {id: "2", content: "look", timestamp: new Date("2024-05-01T10:05:00Z"), editedTimestamp: new Date("2024-05-01T10:06:00Z"),
        author: {id: "9", username: "ana"},
        attachments: [{filename: "cat.png", url: "https://cdn.discordapp.com/x", size: 12, contentType: "image/png"}]},
    {id: "3", content: "reply", timestamp: new Date("2024-05-01T10:07:00Z"), author: {id: "7", username: "bo"},
        messageReference: {message_id: "2"}},
];

const list = collection(messages);
const context = {
    msgStore: {getMessages: id => (id === "10" ? list : null)},
    inspectedExport: () => null,
    React: null, enabled: () => true, console,
    tr: (s, v) => s.replace("{n}", v && v.n !== undefined ? v.n : "{n}"),
};
vm.createContext(context);
vm.runInContext(SOURCE.slice(start, end) + "\nthis.api = {exportMessages, exportMessage, exportJson};", context);
const api = context.api;

let failures = 0;
function check(name, fn) {
    try { fn(); console.log("PASS", name); }
    catch (error) { failures++; console.log("FAIL", name, "-", error.message); }
}
function eq(actual, expected, label) {
    if (actual !== expected) throw new Error((label || "") + " expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
}

check("every loaded message is exported, in order", () => {
    const out = api.exportMessages("10");
    eq(out.length, 3, "count");
    eq(out.map(m => m.id).join(","), "1,2,3", "ids");
});

check("a channel Discord hasn't loaded exports nothing", () => {
    eq(api.exportMessages("404").length, 0, "count");
});

check("authors come out as name, with the display name preferred", () => {
    const out = api.exportMessages("10");
    eq(out[0].author.name, "Ana", "display name");
    eq(out[1].author.name, "ana", "falls back to the username");
    eq(out[0].author.id, "9", "id");
});

check("attachments and the reply link survive the trip", () => {
    const out = api.exportMessages("10");
    eq(out[1].attachments[0].name, "cat.png", "file name");
    eq(out[1].attachments[0].size, 12, "size");
    eq(out[2].reply_to, "2", "reply target");
    eq(out[0].reply_to, null, "no reply");
});

check("times are ISO strings, and only edited messages carry one", () => {
    const out = api.exportMessages("10");
    eq(out[0].at, "2024-05-01T10:00:00.000Z", "sent");
    eq(out[0].edited_at, null, "not edited");
    eq(out[1].edited_at, "2024-05-01T10:06:00.000Z", "edited");
});

check("a collection with only each() still exports (Discord's own variant)", () => {
    const onlyEach = {each: fn => messages.forEach(fn)};
    context.msgStore = {getMessages: () => onlyEach};
    eq(api.exportMessages("10").length, 3, "count");
    context.msgStore = {getMessages: () => list};
});

check("the file is valid JSON and says how far back it goes", () => {
    const text = api.exportJson({id: "10", name: "umum", type: 0}, api.exportMessages("10"));
    const data = JSON.parse(text);
    eq(data.app, "JaPatch", "app");
    eq(data.format, 1, "format");
    eq(data.count, 3, "count");
    eq(data.channel.name, "umum", "channel");
    eq(/not included/.test(data.note), true, "the note admits old messages are missing");
    eq(data.messages.length, 3, "messages");
});

check("nothing in the export needs the network", () => {
    const text = api.exportJson({id: "10", name: "umum", type: 0}, api.exportMessages("10"));
    eq(/fetch\(|XMLHttpRequest/.test(text), false, "no request code in the output");
});

if (failures) { console.log(failures + " failing"); process.exit(1); }
console.log("all passed");
