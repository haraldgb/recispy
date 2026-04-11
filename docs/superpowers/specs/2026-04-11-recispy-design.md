# Recispy — Design Spec

**Date:** 2026-04-11
**Status:** Approved for implementation planning

## 1. Goal

A mobile-first progressive web app where the user pastes a recipe URL (or fallback raw text), an AI extracts a structured recipe, the user previews/edits it, then browses and cooks it later — checking off ingredients and steps as they go. Single-user in practice (allowlist-gated), Google Sign-In for auth, hosted on the user's existing Ubuntu box behind Caddy at `recispy.mapmemo.app`.

## 2. Architecture

- **Frontend:** Vue 3 + TypeScript SPA, built with Vite, Vue Router, Pinia for state. Built to static files served by Caddy.
- **Backend:** Hono on Node.js 22 LTS, single systemd unit, listening on `127.0.0.1:<PORT>`. Drizzle ORM → Postgres.
- **DB:** Fresh `recispy` Postgres database on the existing instance, owned by a fresh `recispy` role with least privilege.
- **Reverse proxy:** Caddy serves the built SPA from `/srv/recispy/dist/` and reverse-proxies `/api/*` to the Hono port. Caddy handles HTTPS automatically.
- **Same-origin** (frontend and API both at `recispy.mapmemo.app`) → cookie auth with `SameSite=Lax`, no CORS needed.

```
Browser ──HTTPS──▶ Caddy (recispy.mapmemo.app)
                    │
                    ├── /         → /srv/recispy/dist/  (SPA fallback to index.html)
                    └── /api/*    → 127.0.0.1:<PORT>     (Hono / systemd: recispy.service)
                                        │
                                        ├── Postgres (local socket, db=recispy)
                                        └── Anthropic API (server-side, key in env)
```

## 3. Data Model

Drizzle schema → Postgres tables. All `id` columns are `bigserial` primary keys unless noted. Timestamps are `timestamptz`.

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `google_sub` | text UNIQUE NOT NULL | Google's stable user identifier (the `sub` claim) |
| `email` | text NOT NULL | |
| `name` | text | |
| `picture_url` | text | |
| `is_allowed` | boolean NOT NULL DEFAULT false | Allowlist gate |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |

### `recipes`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `user_id` | bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE | |
| `title` | text NOT NULL | |
| `time_minutes` | integer NOT NULL | Total time |
| `difficulty` | text NOT NULL CHECK (difficulty IN ('easy','medium','hard')) | |
| `servings` | integer NOT NULL | Base servings the ingredients are written for |
| `calories_total` | integer | Nullable. For the whole recipe at base servings |
| `protein_grams_total` | integer | Nullable. For the whole recipe at base servings |
| `image_url` | text | Nullable. Original image URL from the source page (referenced, not downloaded) |
| `source_url` | text | Nullable. Null if pasted as text |
| `recipe_notes` | text | Nullable. Notes that came with the original recipe |
| `favorite` | boolean NOT NULL DEFAULT false | |
| `price_tier` | smallint NOT NULL CHECK (price_tier BETWEEN 1 AND 5) | 1 = cheapest, 5 = priciest |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz NOT NULL DEFAULT now() | Maintained by trigger or app code |

### `ingredients`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `recipe_id` | bigint NOT NULL REFERENCES recipes(id) ON DELETE CASCADE | |
| `position` | integer NOT NULL | Display order |
| `quantity` | numeric | Nullable so "salt to taste" works |
| `unit` | text | Nullable. Free-text (`g`, `tbsp`, `cloves`). No conversion logic |
| `name` | text NOT NULL | |
| `note` | text | Nullable. e.g. "(finely chopped)" |

### `method_steps`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `recipe_id` | bigint NOT NULL REFERENCES recipes(id) ON DELETE CASCADE | |
| `position` | integer NOT NULL | Display order |
| `text` | text NOT NULL | One row per step |

### `utensils`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `recipe_id` | bigint NOT NULL REFERENCES recipes(id) ON DELETE CASCADE | |
| `name` | text NOT NULL | AI-generated best guess. **No `position` column** — utensils are an unordered set |

### `user_notes`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `recipe_id` | bigint NOT NULL REFERENCES recipes(id) ON DELETE CASCADE | |
| `text` | text NOT NULL | |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |

### Indexes
- `recipes(user_id, created_at DESC)` — primary list query
- `recipes(user_id, favorite)` — favorites filter
- All child tables: index on their `recipe_id` FK
- `users(google_sub)` is already unique-indexed

## 4. AI Extraction Flow

### Provider
**Anthropic Claude Haiku 4.5** (`claude-haiku-4-5-20251001`). Server-side only. Key in `ANTHROPIC_API_KEY` env var, never exposed to the client.

### Structured output strategy
Anthropic's API doesn't have OpenAI's `response_format: json_schema`, but it supports **tool use**, which can be used to enforce output shape. We define a single tool `save_recipe` with a JSON schema for the recipe shape, and use `tool_choice: { type: "tool", name: "save_recipe" }` to force Claude to call it. The tool's `input` becomes our parsed recipe payload.

The schema includes all the fields the model is responsible for filling: `title`, `time_minutes`, `difficulty`, `servings`, `calories_total`, `protein_grams_total`, `price_tier`, `image_url` (if present in the source), `recipe_notes`, `ingredients[]`, `method_steps[]`, `utensils[]`. The model must return all required fields; nullable fields are explicitly typed as nullable in the schema.

### Flow
1. Client calls `POST /api/recipes/extract` with body `{ url: string }` or `{ text: string }`.
2. **If URL:** backend `fetch`es the URL with a real-browser User-Agent header. On non-2xx, return 422 with code `fetch_failed`.
3. Run `@mozilla/readability` (with `jsdom`) on the HTML → cleaned article text + title + image. If `text` was supplied directly, skip steps 2–3 and use the text as-is.
4. Build the prompt: a system message describing the task ("Extract a structured recipe from the following text. Use the `save_recipe` tool to return your answer.") plus the cleaned text as the user message.
5. Call Anthropic `messages.create` with `model: claude-haiku-4-5-20251001`, the `save_recipe` tool, and `tool_choice` forcing the tool. Set `max_tokens` to a generous bound (e.g. 4096).
6. Parse the tool input from the response. Validate it against the JSON schema server-side as a defensive check (Zod). On schema mismatch, return 422 with code `extraction_invalid`.
7. Return the parsed recipe to the client. **Nothing is persisted yet.** Include `source_url` (the URL the user pasted) so the client can submit it back unchanged.
8. Client renders the **preview screen**, which is an editable form. The user can correct any field (title, time, difficulty, servings, ingredients, steps, utensils, notes, etc.).
9. On **Save** → client `POST`s the (possibly edited) payload to `/api/recipes`. Backend wraps the parent + child inserts in a single Postgres transaction.
10. On **Discard** → client just drops state, no server call.

### Failure UX
Any failure in steps 2–6 surfaces an inline error message in the Add sheet with a "Paste text instead" button that switches the sheet to text-input mode. No retries are attempted automatically.

### Token accounting
Claude Haiku 4.5 is cheap enough for a personal app that we don't need a quota system. The `ANTHROPIC_API_KEY` should have a hard monthly budget cap set in the Anthropic console as a defensive measure.

## 5. Auth Flow

### Token exchange
1. Frontend loads Google Identity Services (`https://accounts.google.com/gsi/client`) and renders the official sign-in button on `/login`. The button gives us a Google ID token (JWT signed by Google).
2. Frontend `POST`s the ID token to `/api/auth/google`.
3. Backend verifies the ID token's signature against Google's JWKS using `google-auth-library`. On verification, it extracts `sub`, `email`, `name`, `picture` from the verified claims.
4. Backend upserts the `users` row keyed by `google_sub`. New users default to `is_allowed=false`.
5. Backend issues its own JWT (signed with `JWT_SECRET` from env, using `jose`), payload `{ user_id, exp }`, expiry 7 days.
6. Backend sets the JWT as an httpOnly cookie named `recispy_session`, attributes `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`.
7. Backend returns `{ user: { id, email, name, picture_url, is_allowed } }`.

### Session middleware
Every `/api/*` route except `/api/auth/google` and `/api/auth/logout` runs through a middleware that:
1. Reads the `recispy_session` cookie.
2. Verifies the JWT signature and expiry. On failure → 401.
3. Loads the user from the DB. If not found → 401.
4. If `is_allowed=false` → 403 with code `not_allowlisted`.
5. Attaches `user` to the request context.

### Logout
`POST /api/auth/logout` clears the cookie (`Set-Cookie: recispy_session=; Max-Age=0; ...`). No server-side session state to invalidate.

### Allowlist
Manual flip: `UPDATE users SET is_allowed=true WHERE email='you@…';`. Documented in the README. Non-allowlisted users can sign in (so the row gets created) but every `/api/*` call after that returns 403, and the frontend shows a "You're not allowlisted yet" screen.

## 6. UI Structure (Vue)

### Routes (Vue Router)
- `/login` — Google Sign-In button. Redirects to `/` if `auth.user` is set.
- `/` — Recipe list (home). Always rendered. Top app bar (app name + sort menu icon + avatar). FAB bottom-right.
- `/r/:id` — Same `/` rendered underneath, with the **recipe detail bottom sheet** open on top. Closing the sheet navigates to `/`. Refreshing this URL re-opens the sheet (deep-linkable).

### Bottom sheets (components, not routes)
- **Add Recipe sheet** — opened by FAB. Tabs: **URL** (single text input + Submit) / **Paste text** (textarea + Submit). Loading state during extraction. On success → preview state (editable form, Save / Discard buttons).
- **Recipe detail sheet** — content order:
  0. Title
  1. Stats row: time / difficulty badge / calories / protein / price tier / favorite heart toggle / **multiplier numeric input** (default 1, ephemeral, resets every time the sheet opens)
  2. **Utensils** — collapsible, default collapsed, "Tap to expand"
  3. **Ingredients** — list with checkboxes. Quantities scale by the multiplier (computed display, source unchanged)
  4. **Method** — list with checkboxes
  5. **Recipe notes** — read-only block (only rendered if non-null)
  6. **User notes** — list, newest first, with an "Add note" button at the bottom. Tapping the button opens a small modal with a textarea + "Submit note"
  7. Trash icon at the bottom of the sheet → confirm modal → delete (returns to `/`)
- **Account menu** — small dropdown from the avatar in the top bar: email + Logout button.

### Sort menu
Triggered from the sort icon in the top app bar. Options:
- Date added (default)
- Alphabetical (A → Z)
- Duration
- Difficulty
- Price tier
- Protein-to-calorie ratio (computed: `protein_grams_total / calories_total`, recipes with null values sort last)
- Favorites first

Each option toggles ASC/DESC on second tap. Sort preference persists in localStorage.

### Pinia stores
- **`auth`** — current user, `login(idToken)`, `logout()`, `fetchMe()`.
- **`recipes`** — list cache, current sort field+direction, `fetchAll()`, `extract({url|text})`, `save(payload)`, `delete(id)`, `toggleFavorite(id)`, `addNote(id, text)`.

### Per-recipe checkbox state
Lives in `localStorage` under a versioned key like `recispy.checks.v1.<recipe_id>`. Value shape:
```json
{
  "ingredients": [true, false, true, ...],
  "method": [false, false, ...],
  "updated_at": "<iso timestamp>"
}
```
On read, if `updated_at` is more than 24 hours old, the entry is discarded (auto-clear). No server roundtrip, no cross-device sync.

## 7. API Surface

All endpoints return JSON. Success envelopes are bare data; errors use `{ error: { code, message } }`.

| Method | Path | Auth | Body / Params | Returns |
|---|---|---|---|---|
| `POST` | `/api/auth/google` | none | `{ id_token }` | `{ user }` + sets cookie |
| `POST` | `/api/auth/logout` | none | — | `{}` + clears cookie |
| `GET` | `/api/me` | session | — | `{ user }` or 401 |
| `GET` | `/api/recipes` | allowlist | — | `{ recipes: [...] }` (full payload incl. children) |
| `GET` | `/api/recipes/:id` | allowlist | — | `{ recipe }` (with all children) |
| `POST` | `/api/recipes/extract` | allowlist | `{ url }` or `{ text }` | `{ recipe }` (parsed, **not** saved) |
| `POST` | `/api/recipes` | allowlist | full recipe payload | `{ recipe }` (newly inserted with id) |
| `DELETE` | `/api/recipes/:id` | allowlist | — | `{}` |
| `PATCH` | `/api/recipes/:id/favorite` | allowlist | `{ favorite: bool }` | `{ recipe }` |
| `POST` | `/api/recipes/:id/notes` | allowlist | `{ text }` | `{ note }` |

**List sorting** is done client-side (the list is small — single user, probably <500 recipes). The backend always returns by `created_at DESC`.

**Allowlist gate** wraps all endpoints except `/api/auth/google` and `/api/auth/logout`.

## 8. Error Handling

- All API errors are JSON: `{ error: { code: "snake_case_code", message: "human-readable" } }`.
- HTTP codes used: 400 (invalid input), 401 (no/invalid session), 403 (not allowlisted), 404 (not found), 422 (semantic failure: extraction failed, fetch failed), 500 (unexpected).
- Backend logs every request as structured JSON via `pino`, with a generated request ID. Errors include the stack.
- Frontend shows toast notifications for unexpected errors, inline messages for known failure modes (extraction failed, save failed, not allowlisted).
- **No retries** anywhere — failures surface to the user immediately.
- Vue templates only use `{{ }}` interpolation (auto-escaped). No `v-html` for any AI/scraped content. XSS contained.

## 9. Testing

### Backend (Vitest)
- **Unit tests:**
  - Auth middleware: valid token / expired token / missing cookie / not allowlisted.
  - Recipe save transaction: parent + children inserted atomically; rollback on child error.
  - Extraction prompt builder: produces the correct system message and tool schema.
  - Zod validators: accept valid recipe payloads, reject invalid ones.
- **Integration tests** against a real Postgres:
  - A dedicated `recispy_test` database is created on the dev machine. Each test suite truncates all tables in `beforeEach` and runs migrations once in `globalSetup`.
  - Each route is hit end-to-end with the auth middleware in a "test mode" that accepts a header-injected test user instead of verifying a cookie.
  - The extraction route uses the real handler with the Anthropic client stubbed to return a fixed tool-use response.
- **No live Anthropic calls** in tests. The Anthropic client is injected so it can be replaced with a stub.

### Frontend (Vitest + Vue Test Utils)
- Pinia store unit tests: `recipes` store actions, `auth` store actions, sort comparator.
- Component smoke tests for: `RecipeListItem`, `AddRecipeSheet` (URL submit happy path with mocked store), `RecipeDetailSheet` (renders all sections, multiplier scales quantities, checkboxes toggle).
- Per-recipe checkbox `localStorage` helper: stores, reads, expires after 24h.

### Manual test checklist (in README)
Golden flows to walk through after deployment:
1. Login with Google
2. Verify 403 screen until allowlisted (then `UPDATE` and refresh)
3. Add recipe by URL — preview, edit a field, save
4. Add recipe by paste — preview, save
5. Add recipe with a deliberately broken URL — see fetch_failed, recover via paste
6. List view — sort by each option, toggle direction
7. Open a recipe — multiplier scales quantities, utensils expand/collapse, checkboxes toggle and persist across reload (within 24h)
8. Add a user note via modal
9. Toggle favorite, sort by favorites
10. Delete a recipe
11. Logout — verify cookie cleared, redirected to login

E2E (Playwright) is **out of scope** for this one-shot.

## 10. Deployment

### Filesystem layout
```
/srv/recispy/
  ├── dist/             # Frontend build output (Caddy serves this)
  └── server/
      ├── index.js      # Bundled backend entry
      └── node_modules/

/etc/recispy/
  └── recispy.env       # mode 600, owned by recispy:recispy

/etc/systemd/system/
  └── recispy.service
```

### Environment variables (`/etc/recispy/recispy.env`)
- `DATABASE_URL=postgres://recispy:<password>@127.0.0.1:5432/recispy`
- `ANTHROPIC_API_KEY=sk-ant-…`
- `GOOGLE_CLIENT_ID=…apps.googleusercontent.com`
- `JWT_SECRET=<32+ random bytes, base64>`
- `PORT=8730` (or whatever — Caddy will proxy to it)
- `NODE_ENV=production`
- `LOG_LEVEL=info`

### systemd unit (`recispy.service`)
```ini
[Unit]
Description=Recispy backend
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=recispy
Group=recispy
EnvironmentFile=/etc/recispy/recispy.env
ExecStart=/usr/bin/node /srv/recispy/server/index.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=

[Install]
WantedBy=multi-user.target
```

### Caddyfile snippet
```caddy
recispy.mapmemo.app {
  encode gzip zstd

  handle /api/* {
    reverse_proxy 127.0.0.1:8730
  }

  handle {
    root * /srv/recispy/dist
    try_files {path} /index.html
    file_server
  }
}
```

### Postgres bootstrap
```sql
CREATE ROLE recispy WITH LOGIN PASSWORD '<generated>';
CREATE DATABASE recispy OWNER recispy;
\c recispy
GRANT ALL ON SCHEMA public TO recispy;
```
Migrations are generated and applied with **Drizzle Kit** (`drizzle-kit generate` + `drizzle-kit migrate`). The deploy README documents the bootstrap and the per-deploy steps (build frontend, build backend, copy artifacts, run migrations, restart systemd).

### Linux user
Dedicated `recispy` system user:
```
sudo useradd --system --home /srv/recispy --shell /usr/sbin/nologin recispy
```
Owns `/srv/recispy/` and `/etc/recispy/`. systemd unit runs as this user.

## 11. Tooling Choices

| Concern | Pick | Rationale |
|---|---|---|
| Build tool (frontend) | **Vite** | Default for Vue 3 + TS |
| Framework (frontend) | **Vue 3 + TypeScript** | User requirement |
| State (frontend) | **Pinia** | Vue's official store |
| Router (frontend) | **Vue Router** | Two routes for deep-linking |
| HTTP server (backend) | **Hono** + `@hono/node-server` | User pick (Q4) |
| Runtime (backend) | **Node.js 22 LTS** | Stable LTS, native fetch |
| ORM (backend) | **Drizzle ORM** + drizzle-kit | User pick (Q3) |
| DB | **Postgres** (existing) | User requirement |
| AI client | **`@anthropic-ai/sdk`** | Switched from OpenAI |
| Model | **`claude-haiku-4-5-20251001`** | User pick |
| HTML extraction | **`@mozilla/readability` + `jsdom`** | Best free article extractor |
| Auth verification | **`google-auth-library`** | Official, verifies JWKS |
| JWT issuing/verifying | **`jose`** | Modern, ESM, no vulnerabilities |
| Schema validation | **Zod** | Defensive validation of model output and request bodies |
| Logging | **pino** | Fast structured logging |
| Tests | **Vitest** (both sides) | Same tool both sides; fast |
| Lint + format | **Biome** | Single tool, fast, less config than ESLint+Prettier |

## 12. Out of Scope

Explicitly **not** building (YAGNI — speak up if any of these are actually needed):

- Tags, categories, folders
- Full-text search
- Ratings (separate from favorites)
- Image upload to your server (only the source URL is referenced)
- Unit conversion (metric ↔ imperial)
- Offline writes / sync queue / conflict resolution
- E2E tests (Playwright)
- Multi-user sharing or collaboration
- Recipe editing after save (only editable in the preview screen)
- Soft-deletes / undo
- Sort persistence across devices (localStorage only)
- Checkbox sync across devices (localStorage only)
- Push notifications
- API key UI (key is in the server's env, not user-facing)
