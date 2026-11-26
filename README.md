<div align="center">

# JaPatch

**A feature and privacy patch set for Discord on Android, built for [Morphe](https://morphe.software).**

[![Discord](https://img.shields.io/badge/Discord-351.11%20Stable-5865F2?logo=discord&logoColor=white)](#compatibility)
[![License](https://img.shields.io/badge/license-GPL--3.0-green)](LICENSE)
[![Build](https://github.com/JAPofc/japatch/actions/workflows/build.yml/badge.svg)](https://github.com/JAPofc/japatch/actions/workflows/build.yml)
[![Release](https://img.shields.io/github/v/release/JAPofc/japatch?label=release)](https://github.com/JAPofc/japatch/releases)
[![Languages](https://img.shields.io/badge/languages-29-8957E5)](#languages)

[**Add to Morphe**](https://morphe.software/add-source?github=JAPofc/japatch&name=JaPatch) ·
[Releases](https://github.com/JAPofc/japatch/releases) ·
[Report a bug](https://github.com/JAPofc/japatch/issues/new/choose) ·
[Discussions](https://github.com/JAPofc/japatch/discussions)

Offline by default. No tracking, no telemetry, no remote config.

</div>

---

## Table of contents

- [Overview](#overview)
- [Compatibility](#compatibility)
- [Install](#install)
- [Features](#features)
- [Privacy options](#privacy-options)
- [Custom branding](#custom-branding)
- [Languages](#languages)
- [Building from source](#building-from-source)
- [Project layout](#project-layout)
- [Contributing](#contributing)
- [Credits and prior art](#credits-and-prior-art)
- [License](#license)

## Overview

JaPatch is a patch bundle: a set of Kotlin/Morphe patches that rewrite Discord's own Android bytecode
and JavaScript runtime at patch time. Nothing is injected at runtime, no second app is needed, and no
data leaves the device except for the four features that talk to a network service on your behalf
(ReviewDB, Translate messages, Fix link previews, Bring back Tenor GIFs).

Every feature is off until you turn it on, in **Discord Settings → JaPatch → Features**.

## Compatibility

| Item | Value |
| --- | --- |
| Discord | **351.11 – Stable** (the original APKM, not a re-patched build) |
| Package | `com.discord` (or your own package with [Custom branding](#custom-branding)) |
| Morphe Manager | latest [release](https://github.com/MorpheApp/morphe-manager/releases) |
| Android | 8.0+ (some features need newer: system font/emoji need Android 9+) |

Only the pinned APKM is supported. Discord changes its bundle between releases, so a patched bundle
from another Discord version is expected to fail rather than silently misbehave.

## Install

1. Install [Morphe Manager](https://github.com/MorpheApp/morphe-manager/releases).
2. Tap **[Add to Morphe](https://morphe.software/add-source?github=JAPofc/japatch&name=JaPatch)**, or add
   `https://github.com/JAPofc/japatch` as a source.
3. Select the **original** Discord 351.11 APKM.
4. Keep the default patch selection (everything except **Custom branding**), then patch and install.
5. Open **Discord Settings → JaPatch → Features** and enable what you want.

You can also import `patches-<version>.mpp` from [Releases](https://github.com/JAPofc/japatch/releases)
under **Sources → + → Local**.

> The patched app is signed with your own key, so you may need to uninstall the official Discord first —
> which deletes its local data. [Custom branding](#custom-branding) installs JaPatch alongside Discord
> instead. Keep the same signing key between builds so updates install over the top.

## Features

### Messages

| Feature | Description |
| --- | --- |
| Keep deleted messages | Deleted messages and edits stay in chat, with a searchable message log |
| Bulk delete messages | Select and delete many messages at once, across chats |
| Hide blocked or ignored messages | Removes blocked and ignored message rows |
| Message highlights | Custom color and bar width for replies and mentions |
| Translate messages | Translate a chat or a single message, automatically or on request |
| Double-tap to reply | Double-tap to reply or edit your own message, triple-tap to delete |
| Load full-quality images | Original images instead of compressed copies |
| Skip delete / pin confirmation | No "Are you sure?" dialogs |
| Download voice messages | A download button under every voice message |
| Keep media playing | Audio keeps playing in the background; videos pop out into a small window |
| Banners in Do Not Disturb | Silent in-app banners while on DND |
| Always trust links and files | No link or download warnings |
| Jump to first message | Go straight to the start of a chat |
| Favourite any image or video | Save any image or video to your GIF favourites |

### Sending

| Feature | Description |
| --- | --- |
| Send Nitro stickers and emojis as links | Sends them as image links |
| Bring back Tenor GIFs | Tenor GIFs in Discord's GIF picker |
| Fix link previews | Working embeds for X, Instagram, TikTok, Reddit and more, tracking stripped |
| Send audio as voice messages | Audio files are sent as voice messages |
| Send long messages | Messages over the limit are sent in parts |
| Hide typing indicator | Others won't see you typing |
| Show file sizes when attaching | File sizes in the media picker |
| Anonymous file names | Sent files get random names |
| Tap mentions to open profiles | Tap a typed @mention to open that profile |
| Expand the message bar | A button that makes the message bar taller |
| Compress big files | Shrinks photos, videos and audio to fit the upload limit |
| Reply without pinging | Replies start with the ping off |
| View raw data | Raw JSON of messages, channels, servers, people and roles |
| Edit without "(edited)" | Edits your latest message without the tag |
| Delete without a trace | Blanks a message before deleting it |
| Edit messages on this phone | Change how any message reads, only on your device |

### People

| Feature | Description |
| --- | --- |
| Pastel name colors | Soft colors for names without a role color |
| Show device indicators | Device icons next to names |
| Show owner and mod tags | Owner, Admin and Mod tags in chat |
| Alert when you're removed | Know when you're unfriended, kicked or banned |
| Fix unknown mentions | Shows names instead of `@unknown-user` |
| Copy profile bios | Select and copy profile bios |
| Leave group DMs silently | No "left the group" message |
| Show timeout duration | How long someone is timed out |
| User and server reviews | Reviews from ReviewDB |
| User activity notifications | Notices and a log when chosen people change status, type or message |
| Account switcher | Up to 50 accounts, with notifications from all of them |
| Listen along | Listen along to a friend's Spotify (needs Premium) |
| HypeSquad house | Join or leave a HypeSquad house |
| Custom idle time | Choose when you go Idle, or never |
| Mutual group DMs | Group DMs you share with someone, on their profile |
| Platform spoof | Show as desktop, web or console. **Against Discord's rules** |

### Servers

| Feature | Description |
| --- | --- |
| Read all button | Mark everything as read in one tap |
| Show hidden channels | Channels you can't open, with a lock |
| Server info | Live server details from its icon |
| Edit servers locally | Your own server names and icons, only on your device |
| Clone emojis and stickers | Add any emoji or sticker to your own server |
| Clean channel names | Strips emoji, symbols and fancy fonts |
| Preview servers without joining | Browse servers that allow previews |
| Pause invites | Pause a server's invites until you resume them |
| Fast delete channels | Delete channels without confirmation. **No undo** |

### Appearance

| Feature | Description |
| --- | --- |
| Use your phone's font | Your phone's font everywhere |
| Use your phone's emojis | Your phone's emojis, or an imported emoji font |
| Remove anything | Hide almost any button or menu row |
| JaPatch button on profile bar | A shortcut to JaPatch settings |
| Unlock app icons | Any app icon without Nitro |
| Unlock Nitro themes | Gradient themes without Nitro, on this device |
| Full-screen chat in landscape | Chat fills the screen sideways |
| Material You colors | Colors from your wallpaper or a color you pick |
| Custom themes | Revenge and Vendetta themes |
| Icon packs | Replace Discord's icons with an icon pack |

### Quests and Advanced

| Feature | Description |
| --- | --- |
| Complete Quests automatically | Finishes video, Play and timed Activity Quests |
| Complete badges automatically | **Risky, experimental.** Earns game-time badges in the background |
| Unlock Discord experiments | Dev Tools and Experiments in Settings |
| Keep Bluetooth audio clear in calls | Keeps headphones in music quality during calls, with an optional headset microphone |
| Voice channel options | Join volume, audio output, join chimes and a goodbye sound |
| Fake deafen | Look deafened while still hearing the call |

JaPatch settings also include **Language** (29 languages), **Backup and restore**, and **About** with
debug logs and a crash screen.

## Privacy options

Enabled by default in Morphe — nothing to turn on. Patch again to change them.

| Option | What it stops |
| --- | --- |
| Disable analytics | Discord's usage tracking |
| Disable crash reporting | Crash reports sent to Sentry |
| Disable telemetry and touch logging | Performance tracking and tap logging |
| Disable advertising identifiers | Reading your Google advertising ID |
| Disable install attribution | AppsFlyer install tracking |

## Custom branding

Select **Custom branding** in Morphe to install JaPatch next to Discord. Options: **App name**,
**Package name** (`com.discord.japatch` by default), **Icon color** and **Icon picture**. The copy is a
separate app with its own sign-in and settings; keep the same package name so updates install over the top.

## Languages

29 languages ship with the bundle: Bulgarian, Chinese (Simplified and Traditional), Croatian, Czech,
Danish, Dutch, English, Finnish, French, German, Greek, Hindi, Hungarian, Indonesian, Italian, Japanese,
Korean, Lithuanian, Norwegian, Polish, Portuguese (Brazil), Romanian, Russian, Spanish, Swedish, Thai,
Turkish, Ukrainian and Vietnamese.

Every string is hand-reviewed. There is no machine translation in the bundle and no network call for
translations. To add or fix a language, see [`patches/src/main/resources/japatch/i18n/`](patches/src/main/resources/japatch/i18n/)
and `scripts/i18n_review.py`.

## Building from source

Requirements: Python 3.11+, a JDK (21 recommended), Node.js 22+, and ~1 GB of free RAM while building.

```bash
python3 scripts/build.py            # builds and tests patches/build/libs/patches-<version>.mpp
```

The build downloads its pinned toolchains (`kotlinc`, `d8`/`r8`, `hermesc`, `morphe.jar`) into
`work/tools` on first run, compiles the Kotlin patches and extensions, compacts and compiles the
JavaScript runtime to HBC98, validates the 29 language files, then writes the `.mpp` bundle.

Useful checks:

```bash
python3 scripts/release_info.py --check         # release notes are in Morphe's section format
node scripts/i18n_strings.cjs                   # every English string the runtime shows
node tests/badge_engine.cjs                     # badge rotation engine
```

Developer-only device tests need the original APKM and are described in
[`tests/`](tests/) and [`scripts/hbc/`](scripts/hbc/).

## Project layout

```
patches/                     the Morphe patch bundle
  src/main/kotlin/app/japatch/patches/   Kotlin patches (bytecode + runtime injection)
  src/main/resources/japatch/            injected JavaScript runtime (bootstrap.js) and 29 language files
extensions/                  native Android modules used by the patches
  audio  chat  compress  diag  emoji  font  i18n  media  monet  voice
scripts/                     build, i18n and HBC porting tools
tests/                       unit tests, UI shots and cold-boot benches
```

## Contributing

Issues and pull requests are welcome.

- **Bug reports:** use the template, and include the JaPatch version, Discord version and, for crashes,
  the log from **Settings → JaPatch → About → Debug logs** or the crash screen.
- **Code:** run `python3 scripts/build.py` before opening a PR; it must pass.
- **Translations:** add strings to every language file, or open an issue and mark it `i18n`.
- **New features:** keep them off by default, ship every user-visible string through `tr()`, and add the
  string to all 29 language files.

## Credits and prior art

JaPatch is an independent project. Its patches are written against Discord's own modules, but several
features are based on ideas from the community Discord client-mod ecosystem, and some contain ported
icon assets. The full list is kept in [NOTICE](NOTICE) — including Morphe, nexpid/ThemesPlus,
fshinz/Revenge-Plugins, mwittrien, Vendetta plugins, ReviewDB, and the icon pack authors.

JaPatch is not affiliated with, endorsed by, or sponsored by Discord Inc., Morphe, or any of the
projects above. Discord is a trademark of Discord Inc.

## License

[GPL-3.0](LICENSE). By using JaPatch you accept Discord's Terms of Service; some features (platform
spoof, automatic quests and badges) may put your account at risk and are off by default for that reason.
