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
