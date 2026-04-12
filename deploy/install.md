# Recispy install steps (Ubuntu + Caddy + Postgres)

## 1. System user

```bash
sudo useradd --system --home /srv/recispy --shell /usr/sbin/nologin recispy
sudo mkdir -p /srv/recispy /etc/recispy
sudo chown -R recispy:recispy /srv/recispy /etc/recispy
sudo chmod 750 /etc/recispy
```

## 2. Postgres

Run `deploy/bootstrap.sql` as the postgres superuser, replacing `<PASSWORD>` first:

```bash
sudo -u postgres psql -f deploy/bootstrap.sql
```

## 3. Environment file

Write `/etc/recispy/recispy.env` (mode 600, owned by recispy):

```
DATABASE_URL=postgres://recispy:<PASSWORD>@127.0.0.1:5432/recispy
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
JWT_SECRET=<32+ random bytes>
PORT=8730
NODE_ENV=production
LOG_LEVEL=info
```

Generate `JWT_SECRET` with `openssl rand -base64 48`.

## 4. Build and copy

On your dev machine:

```bash
(cd web && npm run build)
(cd server && npm run build)
```

Then copy to the box:

```bash
rsync -av web/dist/  user@host:/srv/recispy/dist/
rsync -av server/dist/  user@host:/srv/recispy/server/
```

## 5. Migrations

```bash
cd /srv/recispy/server
DATABASE_URL='...' /usr/bin/node ./node_modules/drizzle-kit/bin.cjs migrate \
  --config=/srv/recispy/server/drizzle.config.js
```

(If `drizzle.config.js` doesn't ship in dist, run migrations from your dev machine pointed at the production DB instead.)

## 6. systemd

```bash
sudo cp deploy/recispy.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now recispy
sudo systemctl status recispy
```

## 7. Caddy

Append the contents of `deploy/Caddyfile.example` to `/etc/caddy/Caddyfile` (or include it from a snippet directory). Then reload:

```bash
sudo systemctl reload caddy
```

## 8. Allowlist your account

Sign in once with Google so the user row is created, then:

```bash
sudo -u postgres psql -d recispy -c "UPDATE users SET is_allowed = true WHERE email = 'you@example.com';"
```

Refresh the app — you should now be able to read and write recipes.
