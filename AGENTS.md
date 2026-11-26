# shift-calendar — Agent Team Rules

> Keep this top rules block stable so implicit prompt caching applies across runs.

## Never (Hard Rules)
- Never modify `ShiftCalendar.apk`, `duty.json`, `cal/*.ics`, or icon/PNG assets unless explicitly requested by the user.
- Never break the iOS Web Push rule in `sw.js:19-27`: every `push` event MUST call `showNotification(...)` even on malformed/empty payloads, or iOS revokes the subscription.
- Never change cached assets (`index.html`, `iphone-alarm.html`, `manifest.webmanifest`) without bumping `CACHE` in `sw.js:1`.
- Never install packages, push, deploy, delete files, or spend money without explicit user approval.
- Never ask for API keys or secrets in chat; never send `thinking_budget`.
- Never pretend a check ran; paste the last 20 lines of actual command output and 1-based `path:line` citations.

## Project
- **Stack**: Zero-build GitHub Pages PWA (`index.html`, `iphone-alarm.html`, `sw.js`, `manifest.webmanifest`, `duty.json`, `cal/{A,B,C,D}.ics`, `ShiftCalendar.apk`).
- **Core Logic**: 4-team 8-day shift schedule math (`index.html:495-575`), ICS generation (`index.html:615-715`), iOS Shortcut alarm sync (`index.html:1042-1116`), Web Push subscription & server sync (`index.html:1162-1553`), offline-first SW with 2.5s nav timeout (`sw.js:35-63`).
- **Riskiest Files**: `sw.js` (`L1`, `L19-27`, `L41-56`), `index.html` (`L495-745`, `L1042-1553`).

## Commands
- **Service Worker syntax check**: `node --check sw.js`
- **Inline HTML `<script>` syntax check**:
  `node -e "const fs=require('fs'),vm=require('vm');for(const f of ['index.html','iphone-alarm.html']){const h=fs.readFileSync(f,'utf8');let i=0;for(const m of h.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){new vm.Script(m[1],{filename:f+'#'+(++i)});}console.log('OK',f,'scripts:',i);}"`
- **JSON/manifest validation**:
  `node -e "const fs=require('fs');for(const f of ['duty.json','manifest.webmanifest']){JSON.parse(fs.readFileSync(f,'utf8'));console.log('OK',f);}"`

## Ownership
- `@coordinator` (`gemini-4-neon`, thinking `high`; `xhigh` only for 1 deep bug): Sole user interface; plans, assigns ownership, reviews verifier output, prepares PRs.
- `@pwa-app` (`gemini-4-hydrogen`): Owns `index.html`, `iphone-alarm.html`. Must not touch `sw.js`, `ShiftCalendar.apk`, `duty.json`, `cal/**`, icons, `AGENTS.md`.
- `@pwa-sw` (`gemini-4-hydrogen`): Owns `sw.js`, `manifest.webmanifest`. Must not touch `index.html`, `iphone-alarm.html`, `ShiftCalendar.apk`, `duty.json`, `cal/**`, `AGENTS.md`.
- `@verifier` (**must run on a different model than workers**, read-only): Owns no files; never edits. Reports to `@coordinator`.

## Done Means
1. Every worker changed only files inside its `OWNS` paths.
2. `node --check sw.js`, the inline `<script>` check on `index.html` and `iphone-alarm.html`, and JSON validation all pass.
3. If any asset listed in `sw.js:2` (`CORE`) changed, `CACHE` in `sw.js:1` was bumped.
4. `@verifier` opened all cited files/lines, re-ran commands, pasted the last 20 lines, and approved within at most 2 reject rounds.
5. Changes land on a feature/fix branch and open a PR (never direct push to `main`).
