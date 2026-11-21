# BizPath on Supabase

`schema.sql` is the whole backend: tables, indexes, triggers, row-level security
and the timed-preview / subscription rules.

## Apply it

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste all of `schema.sql` → **Run**. Safe to run again later.
3. Check **Table Editor**: you should see 13 tables.

## Then give the API layer its keys

The app never uses an anon key from the browser. All reads/writes go through a
Base44 backend function that holds the project URL and the **service_role** key
as secrets, resolves the signed-in user to a `profiles` row, and sets the
`app.user_id` Postgres setting for that transaction — so every RLS rule and
every access check in this schema applies to the right person.

Secrets to add (Settings → Secrets in the builder):

| Secret | Where to find it |
| --- | --- |
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key (never ship this to a browser) |

## How access works

- `blueprints.preview_seconds` (default 600) is the free preview length per blueprint.
- `start_blueprint_preview(blueprint_id)` starts the one-time window for the signed-in user.
- `blueprint_access(blueprint_id)` returns `free | anonymous | subscriber | purchased | preview | expired`.
- `get_blueprint_full(blueprint_id)` raises `access_denied:<reason>` unless access is granted — so the gated columns never leave the database.
- `subscriptions` (+ `subscription_plans`) decide subscriber access; `expire_subscriptions()` closes lapsed ones.
- A paid purchase flips `buyer_count`, stamps the invoice number and opens a project tracker via triggers.

## Prices to review before launch

`subscription_plans` seeds two plans at ₹1,499 / month and ₹14,990 / year.
Change them in the table (or in section 8 of `schema.sql`) to your real pricing.
