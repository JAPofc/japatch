# Privacy

JaPatch is a patch set for Discord's own Android app. It runs entirely on your phone: the runtime is bundled in the
patch bundle, there is no remote code, no account, and no server of its own. This page lists exactly what can leave
your phone, so you can check it yourself instead of taking it on trust.

## What never happens

- **No analytics, no telemetry, no crash reporting.** JaPatch turns Discord's own off: Sentry crash reporting,
  `sendTelemetryEvent`, analytics breadcrumbs and recording, the websocket telemetry hook, resume analytics, and the
  AppsFlyer/AdsModule/InstallReferrer modules. The **Privacy options** section in the app is on by default.
- **No password is ever read or stored.** Sign-in goes through Discord's own screens.
- **No Discord token is copied anywhere.** The account switcher only raises Discord's own limits
  (`MAX_ACCOUNTS`, `MAX_PUSH_SYNC_ACCOUNTS`) so the switcher Discord already ships can hold more than one account.
  Discord stores those sign-ins itself. They leave the phone only if *you* export them (Settings → JaPatch →
  Account switcher → Export), which warns first.
- **No keylogging, no screenshots, no clipboard reading, no contact list access.** The only permission JaPatch adds is
  `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, so a voice message can keep playing when you leave the app.

## The only ways data leaves your phone

Every one of these is a feature you switch on yourself, and each is listed with its destination:

| When | Destination | What is sent |
| --- | --- | --- |
| Images, avatars and attachments in chat | `cdn.discordapp.com`, `media.discordapp.net` | Discord's own traffic; JaPatch adds nothing |
| Icon packs (Appearance → Icon packs) | `raw.githubusercontent.com` | A plain GET for the pack's icon files |
| Translate messages (**off** by default) | `translate.googleapis.com` | The text of the message you asked to translate |
| User and server reviews (**off** by default) | *the ReviewDB server you type in under Reviews → Server* | That profile's or server's ID; nothing else |
| Listen along (**off** by default) | `api.spotify.com` | The track request Discord itself makes |
| Install attribution disabled | nothing — AppsFlyer is blocked | — |

Two of these deserve a sentence:

- **Reviews is off until you give it a server.** Since 1.0.1 the ReviewDB address is a setting and starts empty, and
  with no server the Reviews rows are not drawn at all, so no profile ID, review or sign-in request is made. JaPatch
  does not pick a community server for you.
- **Translate sends text to Google.** If that is not acceptable, leave it off; nothing else in JaPatch touches a
  translation service.

## What stays on the phone

JaPatch writes two things, both in the app's own private storage (`/data/data/<package>/files`):

- `japatch-patches.json` — your feature switches, your rules, themes, icon-pack links, server edits, and (if you signed
  in) the ReviewDB token. Nothing else.
- its debug log, only while *Debug logging* is on.

Uninstalling the patched app deletes both. **Backup and restore** writes a file where you choose, and that file
deliberately leaves out the ReviewDB sign-in and exported accounts.

## Checking it yourself

You do not have to read the source to confirm the list above:

1. Install [PCAPdroid](https://github.com/emanuele-f/PCAPdroid) or NetGuard and record while you use Discord.
2. With every optional feature off you should see Discord's own domains only (`discord.com`, `discordapp.com`,
   `discordapp.net`, `discord.gg`, and Discord's CDN hosts).
3. Turn on one feature at a time and watch for its domain from the table above.

In the source, the outbound calls are easy to find:

```bash
grep -rn "fetch(\|XMLHttpRequest" patches/src/main/resources/japatch/bootstrap.js | grep -v "^.*//"
grep -rn "https://" patches/src/main/resources/japatch/bootstrap.js
```

The privacy patches themselves are in `patches/src/main/kotlin/app/japatch/patches/PrivacyPatches.kt` and
`HbcPrivacy.kt`.

## If you find something

Open an issue with the domain, the screen you were on, and the feature switches that were on. A privacy claim that
can't be checked is worth very little, so reports are welcome.
