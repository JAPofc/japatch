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
[Privacy](PRIVACY.md) ·
[Report a bug](https://github.com/JAPofc/japatch/issues/new/choose) ·
[Discussions](https://github.com/JAPofc/japatch/discussions)

Offline by default. No tracking, no telemetry, no remote config.

</div>

---

## Table of contents

- [What JaPatch is, and what it isn't](#what-japatch-is-and-what-it-isnt)
- [Compatibility](#compatibility)
- [Install](#install)
- [Update to a newer JaPatch](#update-to-a-newer-japatch)
- [Features](#features)
- [Privacy options](#privacy-options)
- [Privacy](PRIVACY.md)
- [Custom branding](#custom-branding)
- [Languages](#languages)
- [Building from source](#building-from-source)
- [Project layout](#project-layout)
- [Contributing](#contributing)
- [Credits and prior art](#credits-and-prior-art)
- [License](#license)

## What JaPatch is, and what it isn't

JaPatch is a patch bundle for [Morphe](https://morphe.software): a set of Kotlin/Morphe patches that rewrite Discord's
own Android bytecode, and its JavaScript runtime, at patch time. Nothing is injected at runtime, no second app or
Xposed module is needed, and the bundle carries no remote code.

It started from a fork, as patch sets do, but most of what it does now was written here and is checked here:

| | JaPatch | A typical fork |
| --- | --- | --- |
| **Privacy** | Discord's analytics, crash reporting, telemetry, ad IDs and install attribution are off by default, and the paths that survived the first sweep are documented, with the way to check them, in [Privacy](PRIVACY.md) | Often only the first sweep, or a switch you have to find |
| **Features built here** | Text replace when sending, chat export, backups, a local message log, an in-app crash screen, icon packs, JaPatch themes | Copies of the same upstream patches |
| **Settings** | Everything lives in **Discord Settings → JaPatch**, in your language, each feature with its own page | Raw JSON or patch-time only |
| **Tests** | Runtime tests for the hooks run on every push in CI, plus a build that refuses to ship with missing translation keys | Usually none |
| **Releases** | Every release is built by GitHub Actions, published as a `.mpp` you add once to Morphe, with a checksum file | Builds from the author's laptop |
| **Scope** | Runs on the pinned Discord build, and says so instead of guessing | Varies |

The parts that came from other patch sets keep their credit in the feature table and in the source, as the licence
requires. Nothing is claimed as new that isn't: if a feature says "Based on … by …", that is where it came from.

Every feature is **off** until you turn it on, and most pages explain what they send and to whom before you do.

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
under **Sources → + → Local**. Every release publishes a `SHA256SUMS` file beside the bundle:

```bash
sha256sum -c SHA256SUMS     # on the phone, from the folder you downloaded both files into
```

`OK` means the file is the one CI built. A mismatch means the download was changed or corrupted, and it
should not be installed.

> The patched app is signed with your own key, so you may need to uninstall the official Discord first —
> which deletes its local data. [Custom branding](#custom-branding) installs JaPatch alongside Discord
> instead. Keep the same signing key between builds so updates install over the top.

## Update to a newer JaPatch

**No uninstalling.** Patch the same original Discord 351.11 APKM again with the newer bundle and install
it **over** the copy already on the phone:

1. Morphe Manager → **Sources** → refresh **JaPatch** (newer releases show an *Update* badge on Discord's
   card). A local `.mpp` from [Releases](https://github.com/JAPofc/japatch/releases) works the same way.
2. Patch the same APKM, then tap **Install** and confirm the update dialog. If Android asks "*Update app?*"
   instead of complaining about a conflict, the signing key already matches.
3. Open Discord once, then **close it completely** (recents → swipe away, or *Force stop*) so the runtime
   boots with the new file, and reopen it.

Android only installs over your copy when the new build carries the **same signing key**, so export it
from Morphe Manager (**Settings → System → Import & export → Signing key**) and keep `Morphe.keystore`
somewhere private — especially before a phone reset or a move to another device.

You only need to uninstall when Android refuses with a **signature / app-conflict** error. That means
the installed copy was signed with a different key (for example: patched on another phone, from Morphe
Desktop instead of Manager, or after resetting Manager's key). Uninstalling deletes Discord's local data,
so back up what matters first:

- **JaPatch settings:** *Settings → JaPatch → Backup and restore → Back up.* The file never includes the
  ReviewDB sign-in or saved accounts.
- **Your account:** your Discord password, or a backup-code. A patched app that is removed and installed
  again starts signed out.

Two things stay your responsibility across updates: keep the same **package name** (leave *Custom
branding* off to keep `com.discord`, or keep the same name if you renamed it), and don't let the version
code go back if Morphe offers to change it.

## Features

<!-- Generated by scripts/readme_features.py from patches-list.json; do not edit by hand. -->
<!-- features:start -->

### Messages

| Feature | What it does |
| --- | --- |
| Banners in Do Not Disturb | New messages still pop up at the top while you're on Do Not Disturb, without a sound |
| Bulk delete messages | Select multiple messages and delete them all at once, in one chat or across channels, servers and DMs |
| Delete without a trace | Blanks your message before deleting it, so message loggers on other clients keep nothing |
| Double-tap to reply | Double-tap a message to reply, or your own to edit it. Triple-tap your own to delete it. Based on Geastures+ by kmmiio99o |
| Download voice messages | A Download button under each voice message saves it to your phone. Based on VoiceDownload by puv |
| Edit messages on this phone | Hold any message and change how it reads to you. Only you see the change |
| Edit without "(edited)" | Edit a message without the "(edited)" tag |
| Export chats | Hold a chat or thread in the channel list to save the messages Discord has loaded on this phone as a JSON file |
| Favourite any image or video | Star any image or video to keep it in your GIF favourites |
| Hide blocked or ignored messages | Removes the "blocked messages" and "ignored messages" rows from chat, and can hide replies to them too. From Rain |
| Jump to first message | A button to go straight to the start of a chat, channel or thread |
| Keep deleted messages | Deleted messages stay in chat, outlined in red, and edited messages show what they said before. Can be kept after restarting |
| Keep media playing | Voice messages and audio keep playing when you leave Discord or turn off the screen, and videos pop out into a small window |
| Load full-quality images | Pictures in chat and full screen load as uploaded, not as Discord's smaller, compressed copy, and profile pictures stay sharp |
| Message highlights | Pick bar width and colors for replies, mentions and deleted messages |
| Replace text when sending | Rewrite what you type before it is sent, one rule per line ("brb => be right back") |
| Skip delete confirmation | Messages and link previews are removed right away, with no "Are you sure?". It can't be undone |
| Skip pin confirmation | Pins and unpins messages without asking first. Based on NoConfirmPin by Skamt |
| Translate messages | Messages in other languages show in yours. Their text is sent to Google Translate, without your account |
| View raw data | Hold a message, channel, server, person or role to read its raw data as JSON and copy it. Email and phone number are left out |

### Sending

| Feature | What it does |
| --- | --- |
| Always trust links and files | Opens links and files without Discord's "Are you sure?" warnings. Based on AlwaysTrust by zt and Trwy |
| Anonymous file names | Files you send get a random name instead of the one on your phone. Based on Anonymous File Names by k1ng_op |
| Bring back Tenor GIFs | Tenor GIFs show in Discord's GIF picker again, mixed with Discord's own or on their own. Inspired by BringBackTenor by Livie |
| Compress big files | Photos, videos and audio over Discord's file size limit are made smaller to fit as you send them, instead of being refused |
| Expand the message bar | Adds a button to the top right of the message bar that opens it up tall, so you can see much more of what you're typing |
| Fix link previews | Links to X, Instagram, TikTok, Tumblr and more show the post |
| Hide typing indicator | Others won't see when you're typing. You still see when they are |
| Reply without pinging | Replies start with the ping off, so nobody gets pinged unless you turn it on |
| Send Nitro stickers and emojis as links | Sends Nitro emojis and stickers as links that show as the image |
| Send audio as voice messages | Audio files are sent as voice messages. Android 10 or newer |
| Send long messages | Type past the character limit. Long messages are sent in parts, split between lines or words. Based on SplitLargeMessages by sunnie |
| Show file sizes when attaching | Photos and videos in the picker show their size |
| Tap mentions to open profiles | Tap an @mention in the message bar to see who it is. Based on ClickableMentions by mwittrien |

### People

| Feature | What it does |
| --- | --- |
| Account switcher | Switch between multiple Discord accounts from the You tab, your profile bar or Settings |
| Alert when you're removed | Get a heads-up when a friend unfriends you, or a server kicks or bans you. Based on RemovedConnectionAlerts by iyu46 |
| Copy profile bios | Hold a bio to select and copy it |
| Custom idle time | Choose how long Discord waits before setting you to Idle, or never. Discord's own time is 10 minutes |
| Fix unknown mentions | @unknown-user mentions are looked up and show the person's name. Based on ValidUser by fshin, o.oer and kmmiio99o |
| HypeSquad house | Join or leave a HypeSquad house (Bravery, Brilliance or Balance) from JaPatch settings. Discord limits how often you can change house |
| Leave group DMs silently | Leave group DMs without the "left the group" message. Based on SilentLeave by coder.gg |
| Listen along | Play what a friend is listening to on Spotify, from their profile. Needs Spotify Premium |
| Mutual group DMs | Profiles show the group DMs you share with that person |
| Pastel name colors | Names without a role color get a soft pastel one |
| Platform spoof | Show as desktop, web or console instead of mobile. Discord doesn't allow this and it could put your account at risk. Use at your own risk |
| Show device indicators | Desktop, mobile, web, console or VR icons next to names, colored by status |
| Show owner and mod tags | Shows an Owner, Admin, Manager or Mod tag next to people's names in chat. Based on StaffTag by mwittrien |
| Show timeout duration | A tag next to timed-out people says how long until they can talk again. Based on ShowTimeoutDuration by Ven |
| User activity notifications | Shows a notice when chosen friends or users change status, start typing or send a message. Based on UserNotif by cywrx and coder.gg |
| User and server reviews | Read and write reviews on profiles and servers, through a ReviewDB server you choose |

### Servers

| Feature | What it does |
| --- | --- |
| Clean channel names | Removes emoji and symbols from channel names, and can show spaces instead of dashes |
| Clone emojis and stickers | Tap a custom emoji or sticker in chat to add it to one of your servers. Based on ExpressionCloner by Ven |
| Edit servers locally | Give any server your own name and icon. Only you see them. Based on EditServers by mwittrien |
| Fast delete channels | Delete a channel without the confirmation, or hold it and tap Delete channel in its menu. Needs Manage Channels. There is no undo |
| Pause invites | Hold a server's icon to pause its invites until you resume them, to stop a raid. Needs Manage Server |
| Preview servers without joining | Open a server from its ID or invite link and read it without joining. Based on GuildLurk by fshin |
| Read all button | A button under Direct Messages that marks servers, DMs or both as read |
| Server info | Hold a server's icon to see its details, boosts and friends there. Based on ServerInfo by fshin |
| Show hidden channels | Channels you can't open appear with a lock. Only their name and dates show, not messages |

### Appearance

| Feature | What it does |
| --- | --- |
| Custom themes | Install color themes from a link and switch between them. Works with Revenge and Vendetta themes |
| Full-screen chat in landscape | Chat fills the screen sideways. Swipe from the left for servers and channels |
| Icon packs | Replace Discord's icons with community icon packs or a custom icon pack link. Works with Themes+ icon packs |
| JaPatch button on profile bar | A shortcut to JaPatch settings, next to the notifications bell |
| Material You colors | Colors Discord to match your wallpaper, in light and dark. Wallpaper colors need Android 12 or newer |
| Remove anything | Tap a button you never use to remove it, right where it is: turn on removal mode, then tap the red X on the voice message, attach, gift, call, video, search, Quests, Shop or Nitro buttons,… |
| Unlock Nitro themes | Use Discord's gradient themes in Settings > Appearance without Nitro. Only this phone sees them |
| Unlock app icons | Use any Discord app icon in Settings without Nitro |
| Use your phone's emojis | In chat, reactions and the emoji picker, or from an emoji font you import |
| Use your phone's font | Replaces Discord's font everywhere with your phone's or one you import. Android 9 or newer |

### Quests and advanced

| Feature | What it does |
| --- | --- |
| Complete Quests automatically | Finishes video, Play and Activity Quests in the background. Discord may pause Quests on accounts that do this |
| Complete badges automatically | Plays real PC games in the background, up to 3 at once, toward your Hours Played and Unique Games Played badges |
| Fake deafen | Look deafened in a call while you can still hear. Choose whether your mic stays muted |
| Keep Bluetooth audio clear in calls | Headphones stay in music quality in calls. Your phone's mic picks up your voice |
| Unlock Discord experiments | Adds Dev Tools to Settings, to try features Discord is still testing. Only on this phone. Based on Experiments by maisy |
| Voice channel options | Choose the volume, audio output and sounds for voice channels |

### Setup

| Feature | What it does |
| --- | --- |
| Custom branding | Installs JaPatch as its own app next to the normal Discord app, with the name, color and icon you pick |
| JaPatch settings | Adds JaPatch to Discord's settings, where you turn each feature on or off, in your language. Needed by every feature |

**76 features**, all off until you turn them on in **Discord Settings → JaPatch → Features**.

<!-- features:end -->

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
sh tests/runtime/run.sh                         # Reviews server rules + hold-menu guard (also runs in CI)
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
