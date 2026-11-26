// Show names your way (#191, second half): the name is rewritten in place, because a phone has no hover.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "patches/src/main/resources/japatch/bootstrap.js"), "utf8");
const start = SOURCE.indexOf("    const NAME_KINDS");
const end = SOURCE.indexOf("    function ShowMeYourNameSettings");
if (start < 0 || end < start) throw new Error("the Show names your way block is missing from bootstrap.js");

const settings = {showMeYourName: true, showMeYourNameOrder: "nickname,display,username", showMeYourNameExtra: "username"};
const context = {settings, React: null, enabled: () => true, console};
vm.createContext(context);
vm.runInContext(SOURCE.slice(start, end) + "\nthis.api = {nameOrder, nameParts, pickedName, nameSuffix, showMeYourName};", context);
const api = context.api;

let failures = 0;
function check(name, fn) {
    try { fn(); console.log("PASS", name); }
    catch (error) { failures++; console.log("FAIL", name, "-", error.message); }
}
function eq(actual, expected, label) {
    if (actual !== expected) throw new Error((label || "") + " expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
}

const person = {user: {id: "1", username: "ana", globalName: "Ana"}, member: {nick: "Ani"}};

check("the first name the person has wins", () => {
    eq(api.pickedName(person).text, "Ani", "nickname first");
});

check("without a server, the display name comes next", () => {
    eq(api.pickedName({user: {username: "bo", globalName: "Bo"}}).text, "Bo", "display");
});

check("without any display name, the @username is used", () => {
    eq(api.pickedName({user: {username: "cy"}}).text, "cy", "username");
});

check("the order is respected, and unknown parts are ignored", () => {
    settings.showMeYourNameOrder = "display,nonsense,nickname";
    eq(api.nameOrder().join(","), "display,nickname,username,serverNickname", "order");
    eq(api.pickedName(person).text, "Ana", "display wins");
    settings.showMeYourNameOrder = "nickname,display,username";
});

check("an empty order falls back to the default", () => {
    settings.showMeYourNameOrder = "";
    eq(api.nameOrder()[0], "username", "default order");
    settings.showMeYourNameOrder = "nickname,display,username";
});

check("other names follow in brackets, without repeating the shown one", () => {
    eq(api.nameSuffix(person, "Ani"), " (ana)", "brackets");
    eq(api.nameSuffix({user: {username: "ana", globalName: "Ana"}}, "Ana"), " (ana)", "username differs from display");
});

check("with nothing else to show there are no brackets", () => {
    settings.showMeYourNameExtra = "";
    eq(api.nameSuffix(person, "Ani"), "", "no brackets");
    settings.showMeYourNameExtra = "username";
});

check("the name is rewritten in place, on the props Discord draws", () => {
    const props = {user: person.user, member: person.member, name: "Ani", displayName: "Ani"};
    const next = api.showMeYourName(props);
    eq(next.name, "Ani (ana)", "name");
    eq(next.displayName, "Ani (ana)", "displayName");
    eq(props.name, "Ani", "the original props are not mutated");
});

check("turned off, nothing is touched", () => {
    settings.showMeYourName = false;
    const props = {user: person.user, member: person.member, name: "Ani"};
    eq(api.showMeYourName(props), props, "same object");
    settings.showMeYourName = true;
});

if (failures) { console.log(failures + " failing"); process.exit(1); }
console.log("all passed");
