# Website deployment

The primary site is https://cyj-hashtag.dev/ and is hosted as Cloudflare Workers Static Assets in the `cyj-hashtag-site` Worker. Cloudflare manages HTTPS and the domain. The GitHub Pages site remains available at https://cyj-hashtag.github.io/ so existing local learning progress can still be exported.

## Publish an update

From a checkout of this repository with an existing authenticated Wrangler installation:

```powershell
git pull --ff-only
wrangler deploy
```

On the original workstation, the already installed CLI can be called without installing anything:

```powershell
node D:\Workspace4All\KoreanStudy\api\node_modules\wrangler\bin\wrangler.js deploy
```

GitHub Actions continues publishing the GitHub Pages copy. Cloudflare updates currently require the separate Wrangler deploy command. `.assetsignore` excludes repository metadata and deployment configuration from the Cloudflare public assets.

## Multiplayer game

The Cloudflare Worker serves a same-origin game configuration and forwards only `POST /api/session` and WebSocket `/socket` to the existing Render backend. Other files use the static assets service directly. Browser cookies and Origin/Referer headers are not forwarded. Foreign browser origins are rejected. This keeps the original game backend running without changing its deployment or restarting its existing rooms.

## Learning progress

The Korean app uses the same existing Cloudflare Worker and D1 learning profile on both origins. Its origin allowlist includes both websites. In the old learning app, use **同步与备份 → 导出进度** before moving to a new browser origin. In the new app, restore that backup and use the private pairing link for the same profile to keep devices synchronized. Private pairing credentials must never be committed to this repository.

Keep the GitHub Pages copy accessible until the user's devices have been paired with the new origin. Domain changes alone do not move IndexedDB or offline caches between origins.
