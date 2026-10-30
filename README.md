# logto-ext

Extension service for [Logto](https://logto.io): a user account center SPA and a small
extension API (credential check, webhook receiver), built with Bun + Hono.

It is delivered the [lode](https://github.com/bkhq/lode) way: the app ships as a GitHub
Release asset (`logto-ext.tar.gz`), and lode downloads, verifies, runs, hot-updates and
rolls it back. There is no app-specific Docker image.

## Endpoints

| Path | Description |
|---|---|
| `/user/` | User account center (profile, password, email/phone, MFA, linked accounts) |
| `GET /ext/health` | `{ "status": "ok", "version": "x.y.z" }` |
| `POST /ext/auth/login` | Verify `{ "username", "password" }` (username or email) against Logto |
| `POST /ext/webhook` | Logto webhook receiver |

`/ext/auth/*` and `/ext/webhook/*` require `X-API-Key: <API_KEY>` (or
`Authorization: Bearer <API_KEY>`) when `API_KEY` is set. When `LOGTO_WEBHOOK_SECRET` is
set, webhooks must carry a valid `logto-signature-sha-256` HMAC.

```bash
curl -X POST https://ext.example.com/ext/auth/login \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"username": "test@example.com", "password": "password123"}'
# 200 {"success":true,"message":"Login successful","userId":"..."}
# 400 missing/invalid body · 401 invalid credentials or API key
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `LOGTO_ENDPOINT` | yes | Logto endpoint for the Management API, e.g. `https://auth.example.com` |
| `LOGTO_M2M_APP_ID` / `LOGTO_M2M_APP_SECRET` | yes | Machine-to-machine app with Management API access |
| `LOGTO_M2M_RESOURCE` | no | Management API resource. Default `https://default.logto.app/api` (self-hosted); Logto Cloud: `https://<tenant>.logto.app/api` |
| `LOGTO_SPA_ENDPOINT` / `LOGTO_SPA_APP_ID` | yes | Logto endpoint and SPA app used by the account center |
| `APP_URL` | yes | Public base URL of this service (sign-in redirect is `${APP_URL}/user/callback`) |
| `API_KEY` | no | Protects `/ext/auth` and `/ext/webhook` |
| `LOGTO_WEBHOOK_SECRET` | no | Logto webhook signing key |
| `PORT` | no | Default `3000` |
| `LOG_LEVEL` | no | `debug` / `info` / `warn` / `error`, default `info` |

**M2M app:** Logto Console → Applications → Create → Machine-to-machine → assign the
*Logto Management API* role. **SPA app:** Create → Single page app, add
`${APP_URL}/user/callback` as a redirect URI and `${APP_URL}/user` as a post sign-out URI.

## Deploy

### Docker

Run the generic lode image with [`lode.toml`](lode.toml):

```bash
curl -fsSL https://github.com/zzci/logto-ext/releases/latest/download/lode.toml -o lode.toml
docker run -d --name logto-ext -p 3000:3000 \
  -v logto-ext:/srv/lode \
  -v "$PWD/lode.toml:/srv/lode/lode.toml:ro" \
  --env-file .env \
  docker.io/bkhq/lode:latest
```

On first start lode downloads bun and the latest release into the `/srv/lode` volume,
then checks for new releases every 5 minutes and applies them (rolling back if a version
fails to come up). Edit `lode.toml` to change the update policy, pin a version or enforce
signatures.

```bash
docker exec logto-ext lode-cli status     # current / available version
docker exec logto-ext lode-cli update     # update now
docker exec logto-ext lode-cli rollback   # back to the previous version
```

### Bare metal

```bash
curl -fsSL https://github.com/bkhq/lode/releases/latest/download/lode-linux-x64.tar.gz \
  | sudo tar -xz -C /usr/local/bin lode lode-cli
sudo mkdir -p /srv/lode && sudo chown "$(id -un)" /srv/lode
curl -fsSL https://github.com/zzci/logto-ext/releases/latest/download/lode.toml -o /srv/lode/lode.toml
# fill in the [env] section (or export the variables), then:
lode --dir /srv/lode
```

lode fetches bun itself if it is not on `PATH`. Note that a `.env` file is not read under
lode — set configuration in the environment or in `lode.toml` `[env]`.

## Development

```bash
bun run install:all
cp .env.example .env
bun dev            # API on :3010 (hot reload) + Vite on :3000 (proxies /ext and /user/config.json)
bun run typecheck
```

## Release

```bash
gh release create v1.2.0 --generate-notes
```

[`release.yml`](.github/workflows/release.yml) runs on publish: it typechecks, runs
`bun run package` (builds the SPA, bundles the server into a single `index.js`, packs
`dist/logto-ext.tar.gz`) and uploads the asset with `checksums.txt` and `lode.toml`. If the
`LODE_SIGNING_KEY` secret is set (from `lode-cli keygen`), the asset is signed and a
`.sig` sidecar is uploaded; add the printed `trusted_keys` entry to `lode.toml` and set
`require_signature = "enforce"`.
