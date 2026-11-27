#!/usr/bin/env python3
"""The release notes for one version, in the section format Morphe Manager draws as cards.

    python3 scripts/release_info.py --check     # validates every entry below, fails on anything Morphe can't split up
    python3 scripts/release_info.py 1.0.1       # the GitHub release body for 1.0.1

Morphe Manager turns each "### " heading into a card (New, Fixes, Improvements, Performance) and each
"* **Scope:** text" bullet into a row. Keep that shape: a plain sentence shows as one grey block.
"""
import re
import sys

ROOT = __import__("pathlib").Path(__file__).resolve().parents[1]

# The headings Morphe Manager maps to its own icons and titles, in the order they're written. App support comes
# first, so the Discord version a release works with is the first thing you read.
SECTIONS = ["### 🚀 Updated App Support", "### ✨ New Features", "### 🐛 Bug Fixes", "### 🔧 Improvements",
            "### ⚡ Performance Improvements"]
HEADING = re.compile(r"^## \[(?P<version>[^\]\s]+)\] \((?P<date>\d{4}-\d{2}-\d{2})\)$")
BULLET = re.compile(r"^\* \*\*Discord(?: - [^*:]+)?:\*\* (?P<desc>\S.*[^.])$")
# Release-page leftovers that don't belong in notes.
BANNED = re.compile(r"good to know|sha-?256|^#+ install|wasn't published separately|checked by patching", re.I | re.M)

# Newest first. One "## [version] (date)" per release; the body is Morphe's section format.
RELEASES = r"""
## [1.0.14] (2026-11-27)

### ✨ New Features

* **Discord - Translate messages:** The bar now appears for a reader whose language is Indonesian. It never could before: Indonesian was missing from the list of Latin-script languages the reader's own words are looked up in, so the check gave up before reading a single word — no chat, in any server or DM, could raise it. Malay shares the same missing entry and is fixed with it
* **Discord - Translate messages:** A chat in Spanish, French, German or English now raises the bar for an Indonesian reader. The last word check only ever ran for readers whose language was English, so a short line in another Latin-script language stayed silent unless it carried a `¿` or an accent
* **Discord - Translate messages:** English itself is recognised properly. Its word list had 20 entries, so an ordinary English sentence matched none of them and was never offered for translation; it now has its own real list
* **Discord - User and server reviews:** Reviews arrives pointed at the server JaPatch runs, https://japatch-reviewdb.fly.dev, so there is nothing to fill in before using it. It is still one editable line under Reviews -> Server: any ReviewDB-compatible server goes there instead, and clearing it turns Reviews off

### 🐛 Bug Fixes

* **Discord - Translate messages:** Fixed the bar being drawn in the same colour as the chat header, which made it look like part of the header rather than something to tap. It now sits on the lowest surface with a brand-coloured border, and floats when a chat has no header to sit under
* **Discord - Translate messages:** Fixed the bar being drawn only in manual mode. With Translate set to automatic, the bar is the only way to reach it, and it was the one the mode did not draw
* **Discord - Quest completer:** Fixed closing Discord while a quest is running leaving a request in flight to be killed by Android ("Request has been terminated"), which Discord then showed on its quest page as "Something went wrong", with a reminder that never came back. Quests now stop the moment the app leaves the screen and resume from the last report on the next launch

## [1.0.13] (2026-11-26)

### ✨ New Features

* **Discord - User and server reviews:** Reviews can be marked helpful or not, with a thumb each way and the count under the text. It is one vote per person per review and tapping the same thumb again takes it back; a server that has no votes simply does not show them
* **Discord - User and server reviews:** The server menu's Reviews row opens the same sheet a profile's menu opens. It used to expand inside the server sheet, which drew one row and swallowed the rest of the sheet

### 🔧 Improvements

* **Discord - User and server reviews:** The review box says "Tap to edit your review" once you have written one, because writing again replaces your words rather than adding a second review

## [1.0.12] (2026-11-26)

### 🐛 Bug Fixes

* **Discord - User and server reviews:** Fixed the page still saying "Signed in as" after the server address was changed. The sign-in belonged to the old server, so it showed a name for an address never signed in to; changing the address now signs out of the old one first
* **Discord - User and server reviews:** Fixed a sign-in made on one server being carried over to the next. A token is only good for the server that issued it, and the next address typed could have been anyone's

### 🔧 Improvements

* **Discord - User and server reviews:** The sign-in app row no longer keeps the previous server's app after the address changes, so it asks the new server which app it belongs to

## [1.0.11] (2026-11-26)

### ✨ New Features

* **Discord - User and server reviews:** The patch bundle is signed now, so an install can tell a bundle this source built from one someone else swapped in. Morphe Manager trusts the key the first signed bundle carries, so this release starts that trust

### 🔧 Improvements

* **Discord - User and server reviews:** The key behind the signature is published with the bundle, which is what lets Manager hold every later release to the same one

## [1.0.10] (2026-11-26)

### 🐛 Bug Fixes

* **Discord - User and server reviews:** Fixed the app asking where a server's reviews live: a server that answers its /health with "not found" (the community server does) was counted as broken, so a server of your own could be mixed up with it. Only an answer that names its own app is trusted now

## [1.0.9] (2026-11-26)

### ✨ New Features

* **Discord - User and server reviews:** Reviews can now run on a server of your own. Type its address on Reviews > ReviewDB server and the app asks the server which Discord application it signs in with, so the address alone is enough; the app being used is shown right under it
* **Discord - User and server reviews:** The address accepts a server that answers under /api/reviewdb as well as at its root, which is the shape ReviewDB's own addresses have

### 🔧 Improvements

* **Discord - User and server reviews:** The page now says which Discord app a sign-in will use, so a server that belongs to someone else is never mistaken for the community server

## [1.0.8] (2026-11-26)

### 🐛 Bug Fixes

* **Discord - Show names your way:** Fixed the name never changing in chat. The feature hooked the name Discord draws on a profile card, which the message list does not use, so the chat kept showing Discord's own choice; the chat row is rewritten now
* **Discord - Show names your way:** Fixed the other names never appearing: they were glued into brackets after the name, where they were easy to miss. They now sit on their own small line under the name

### 🔧 Improvements

* **Discord - Show names your way:** Each name under "Also show" now shows what a tap will do: a plus adds it, an X takes it away
* **Discord - Show names your way:** Changing the order or the extra names redraws the chat you have open instead of waiting for it to reload

## [1.0.7] (2026-11-26)

### 🐛 Bug Fixes

* **Discord - Replace text when sending:** Fixed Save, Cancel and the X doing nothing in the rules box. It is opened as a sheet but was closed as a modal, so only the swipe got rid of it
* **Discord - Show names your way:** Fixed the names under "Also show" that were not ticked refusing to be tapped at all. A row's own tick state was hiding the switch that decides whether rows can be tapped
* **Discord - Show names your way:** Fixed a name that was unticked staying unticked: once the last one was removed the list could not be filled again

### 🔧 Improvements

* **Discord - Show names your way:** The page now says that Nickname and Server nickname are the same name on Discord, so the two rows are no longer expected to differ

## [1.0.6] (2026-11-26)

### 🐛 Bug Fixes

* **Discord - Export chats:** Fixed picking a format never changing it: every setting was coerced to true or false on the way in, so the format stayed JSON and the tick never moved
* **Discord - Show names your way:** Fixed tapping a name in the order doing nothing, for the same reason; the choice setting now keeps its text
* **Discord - Show names your way and Export chats:** Fixed the format and the name order being refused outright: their settings resolved to themselves instead of to the feature that owns them
* **Discord - Replace text when sending:** Fixed the rules box not closing: Save, Cancel and the X now dismiss the sheet, and the swipe no longer leaves it half open
* **Discord - User and server reviews:** Fixed the server box not closing for the same reason
* **Discord - Translate messages:** Fixed a translation Google returned being thrown away when it dropped or merged one mention or emoji, which made the message look untranslated; the missing piece is put back at the end instead
* **Discord:** Fixed every setting having its value turned into true when written, which is how the above went unnoticed

### 🔧 Improvements

* **Discord:** A setting written by a page is now tested to keep what it was given: text, numbers and choices, not just switches
* **Discord:** A sheet's own close button is what dismisses it, the same way Discord's own sheets behave

## [1.0.5] (2026-11-26)

### ✨ New Features

* **Discord - Show names your way:** Pick which of someone's four names is shown (@username, display name, nickname or server nickname) and what follows in brackets; the name is replaced where Discord draws it, so it works on a phone with no hover
* **Discord - Export chats:** Export now also writes a page that looks like Discord and opens offline, a plain text transcript, or all three in one ZIP

### 🐛 Bug Fixes

* **Discord - Export chats:** Fixed the feature never appearing in the Features list, so it could be turned on from its page but the list still said "0 of 73" and had no row or switch for it
* **Discord - User and server reviews:** Fixed ReviewDB server closing Discord with "Cannot read property 'transitionState' of null"; the editor now opens as a sheet, the same way the rest of JaPatch opens, with a plain dialog if a sheet is unavailable
* **Discord - User and server reviews:** Fixed the page not redrawing when a switch changed, so "Show the be-respectful note" left its knob where it was instead of turning blue

### 🔧 Improvements

* **Discord:** A page that draws a switch is now checked in CI to redraw when that switch changes; Reviews was the only one that didn't

## [1.0.0] (2026-11-26)

### ✨ New Features

* **Discord:** First release: 70 features in one settings page inside Discord, with search, per-feature pages, 29 languages, backup and restore, debug logs and a crash screen
* **Discord - Messages:** Keep deleted messages, bulk delete, hide blocked and ignored rows, message highlights, translate, double-tap to reply, full-quality images, download voice messages, keep media playing, Do Not Disturb banners, jump to first message and favourite any image or video
* **Discord - Sending:** Nitro stickers and emojis as links, Tenor GIFs, working link previews, audio as voice messages, long messages in parts, file sizes in the picker, anonymous file names, tap-to-open mentions, a taller message bar, reply without pinging and compress big files
* **Discord - People:** Pastel name colors, device indicators, owner and mod tags, alerts when you're removed, timeout duration, account switcher with up to 50 accounts, listen along, HypeSquad, custom idle time and mutual group DMs
* **Discord - Servers:** Read all, hidden channels, server info, server edits that stay on your device, cloning emojis and stickers, clean channel names, previews without joining and pausing invites
* **Discord - Appearance:** Your phone's font and emojis, Remove anything, Material You colors, icon packs, Revenge and Vendetta themes, Nitro themes and app icons unlocked for this device, full-screen chat in landscape and a JaPatch button on the profile bar
* **Discord - Quests and advanced:** Quests and badges completed automatically, experiments unlocked, clear Bluetooth audio in calls, voice channel options and fake deafen
* **Discord:** Privacy patches on by default: analytics, crash reporting, telemetry, touch logging, advertising IDs and install attribution all switched off
* **Discord - Keep Bluetooth audio clear in calls:** Add `Use the headset microphone`, so a headset whose microphone is needed goes back to call quality instead of staying silent

### 🐛 Bug Fixes

* **Discord - Icon packs:** Fixed a pack picture that no longer exists closing Discord with "Discord has crashed" on startup; that icon stays Discord's own
* **Discord - Fast delete channels:** Fixed holding a channel or category closing the app with "Cannot read property 'color' of undefined"
* **Discord - Keep media playing:** Fixed Discord being closed with a foreground-service error when a sound kept playing in the background
* **Discord - Compress big files:** Fixed videos that already fit the upload limit being compressed anyway, by planning against the file type's limit and the account's own
* **Discord - Edit without "(edited)":** Fixed the resend-and-delete way running in DMs and group DMs, which have nothing to log against; they use the normal edit again
* **Discord - Complete badges automatically:** Fixed the rotation picking adult games, whose play time then stays on your profile
* **Discord - Complete badges automatically:** Fixed a started game winning over Quest Completer on every launch, so new Quests waited until the badge was switched off
* **Discord - Expand the message bar:** Fixed the button sitting on Send and on the close button: it moved to its own row above the text, so it can't overlap either
* **Discord - JaPatch button on profile bar:** Fixed the Settings button floating as a small card when it is the only button left, instead of filling the bar
* **Discord - Show device indicators:** Fixed the phone badge staying on avatars with `Hide the phone badge` on, when the avatar status arrives as a wrapped component

### 🔧 Improvements

* **Discord:** Icon packs and custom themes install from a link, with every pack picture falling back to Discord's own icon when it can't load
* **Discord:** Settings are kept per account, so switching accounts keeps every switch where you left it

## [1.0.1] (2026-11-26)

### ✨ New Features

* **Discord - User and server reviews:** Pick the ReviewDB server yourself under Reviews, Server; it starts empty, and with no server there Reviews stays off and nothing leaves your phone

### 🔧 Improvements

* **Discord - User and server reviews:** Reviews never calls a server you didn't type in yourself, including the sign-in exchange and the admins list

## [1.0.2] (2026-11-26)

### 🐛 Bug Fixes

* **Discord - User and server reviews:** Fixed the server field drawing in a shape Discord's action sheet doesn't expect, which could leave the sheet blank on some builds

## [1.0.3] (2026-11-26)

### 🐛 Bug Fixes

* **Discord - Fast delete channels and View raw data:** Fixed holding a channel or DM in the channel list closing Discord with "undefined is not a function"; the hold menu is now left exactly as Discord drew it unless one of those rows is on
* **Discord - Fast delete channels:** Fixed a hold menu that couldn't take the extra row replacing the whole sheet with nothing

## [1.0.4] (2026-11-26)

### ✨ New Features

* **Discord - Export chats:** Hold a chat or thread and pick Export chat as JSON to save the messages Discord has loaded, as a file you choose; nothing is uploaded
* **Discord - Replace text when sending:** Rewrite what you type before it goes out, one rule per line ("brb => be right back"), with a live preview on the page

### 🐛 Bug Fixes

* **Discord - Fast delete channels:** Fixed holding a channel or DM closing Discord with "undefined is not a function" or "Rendered more hooks than during the previous render"; the protection added in 1.0.3 was itself calling the wrong function
* **Discord:** Fixed the hold menu being rebuilt while Fast delete was on, which is what made the crash appear and vanish between launches

### 🔧 Improvements

* **Discord - Leaving group DMs:** The feature now has its own page, with an option to skip the "Leave group" question entirely; servers still ask
* **Discord:** README rewritten around JaPatch's own behaviour, plus a Privacy page listing every destination data can reach and how to check it yourself
"""


def entries():
    """(version, body) for every release, newest first."""
    found, current = [], None
    for line in RELEASES.strip().splitlines():
        match = HEADING.match(line)
        if match:
            current = [match.group("version"), []]
            found.append(current)
        elif line.startswith("## "):
            raise SystemExit(f"release_info.py: bad release heading: {line}")
        elif current is not None:
            current[1].append(line)
    return [(version, "\n".join(body).strip()) for version, body in found]


def check():
    for version, body in entries():
        order, section, bullets = [], None, 0
        for line in body.splitlines():
            if not line.strip():
                continue
            if line.startswith("#"):
                if line not in SECTIONS:
                    raise SystemExit(f"release_info.py {version}: unknown section '{line}'. Use one of {SECTIONS}")
                if line in order:
                    raise SystemExit(f"release_info.py {version}: '{line}' appears twice")
                if order and SECTIONS.index(line) < SECTIONS.index(order[-1]):
                    raise SystemExit(f"release_info.py {version}: put sections in this order: {SECTIONS}")
                order.append(line)
                section = line
                continue
            if not section:
                raise SystemExit(f"release_info.py {version}: text outside a section: {line}")
            match = BULLET.match(line)
            if not match:
                raise SystemExit(f"release_info.py {version}: write '* **Discord - Patch name:** Short change' "
                                 f"on one line, without a full stop: {line}")
            if section == "### 🐛 Bug Fixes" and not match.group("desc").startswith("Fixed "):
                raise SystemExit(f"release_info.py {version}: every bug fix must start with 'Fixed ': {line}")
            bullets += 1
        if not bullets:
            raise SystemExit(f"release_info.py {version}: no changes listed")
    print(f"release_info.py: {len(entries())} releases in Morphe's section format")


def notes(version):
    for found, body in entries():
        if found == version.lstrip("v"):
            return body + "\n"
    raise SystemExit(f"release_info.py has no {version}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    if sys.argv[1] == "--check":
        check()
    else:
        sys.stdout.write(notes(sys.argv[1]))
