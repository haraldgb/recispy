# Recispy

A mobile-first PWA for storing recipes. Paste a URL, an AI extracts the recipe, browse and cook.

Personal-use, single-user (allowlist-gated). Vue 3 + Hono + Postgres + Anthropic Claude Haiku 4.5.

See `docs/superpowers/specs/2026-04-11-recispy-design.md` for the design and `docs/superpowers/plans/2026-04-11-recispy.md` for the implementation history.

## Layout

- `server/` — Hono backend
- `web/` — Vue 3 frontend
- `deploy/` — systemd + Caddyfile + bootstrap SQL

## Local development

### Prerequisites

- Node 22 LTS, npm
- Postgres 14+ running locally
- A Google OAuth client ID (https://console.cloud.google.com/apis/credentials)
- An Anthropic API key with a hard monthly budget cap

### Setup

```bash
# Postgres role and databases
sudo -u postgres psql -f deploy/bootstrap.sql   # edit <PASSWORD> first

# Backend
cd server
cp .env.example .env                             # fill in real values
npm install
npm run db:generate                              # if you've changed schema.ts
npm run db:migrate                               # apply migrations
npm run dev                                      # http://localhost:8730

# Frontend (in another shell)
cd web
cp .env.example .env                             # set VITE_GOOGLE_CLIENT_ID
npm install
npm run dev                                      # http://localhost:5173, proxies /api to backend
```

After signing in once, allowlist yourself:

```bash
psql -d recispy -c "UPDATE users SET is_allowed = true WHERE email = 'you@example.com';"
```

## Tests

```bash
cd server && npm test
cd web && npm test
```

## Production deploy

See `deploy/install.md`.

## Manual smoke test (post-deploy)

Walk through these in order before declaring done:

1. Visit `https://recispy.mapmemo.app` — login screen renders
2. Sign in with Google — allowlist screen appears (403 banner)
3. Allowlist yourself in Postgres, refresh — empty recipe list appears
4. Tap **+** → **URL** tab → paste a real recipe URL → **Extract**
   - Preview appears with title, ingredients, method, utensils
5. Edit a field in the preview, then **Save** → list updates
6. Tap **+** → **Paste text** tab → paste raw recipe text → **Extract** → **Save**
7. Try a deliberately broken URL — fetch_failed error, falls back to paste tab
8. Sort menu — try every option, verify ASC/DESC toggle works
9. Open a recipe — verify:
   - Multiplier scales ingredient quantities
   - Utensils collapse/expand
   - Ingredient and method checkboxes toggle
   - Reload the page → checkboxes still set (within 24h window)
10. Tap **Add note** → submit → note appears at top
11. Tap heart → favorite toggles, sort by favorites moves it
12. Tap trash → confirm → recipe gone, returns to list
13. Account menu → Log out → back at login

## Icons

The placeholder PNG icons in `web/public/icons/` are SVGs renamed to `.png`. Replace with real PNGs at 192×192 and 512×512 before showing this to anyone.
