# AGENTS.md — dscc

Rails 8.1.3 app (SQLite, Propshaft, Import Maps, Hotwire, Tailwind). Ruby 4.0.5. Zero-ops deploy via Kamal.

## Quick start

```sh
bin/setup            # bundle install + db:prepare, then bin/dev
bin/dev              # foreman: web (puma :3000) + tailwindcss:watch
bin/rails server     # web only (no CSS watcher)
```

## Commands

| What | How |
|---|---|
| Run all tests | `bin/rails test` |
| Run system tests | `bin/rails test:system` |
| Run a single test file | `bin/rails test test/controllers/page_controller_test.rb` |
| Lint | `bin/rubocop` |
| Security audits | `bin/brakeman --no-pager` · `bin/bundler-audit` · `npm audit --omit=dev` |
| Full local CI | `bin/ci` (setup → rubocop → security audits → tests → seed replant) |
| Dev server | `bin/dev` (foreman: web + CSS) |
| Console | `bin/rails console` |
| Generate | `bin/rails generate` (standard Rails generators; RuboCop autocorrect after generate is optional — see `config/environments/development.rb:77`) |

CI runs in order: `brakeman` → `bundler-audit` → `npm audit` → `rubocop` → `test` → `system-test` (GitHub Actions, parallel jobs).

## Architecture

- **SQLite everywhere** — one file per env (development/test/production) in `storage/`. Solid Queue, Cache, and Cable each get their own SQLite db in production.
- **No JS build step** — Import Maps + Stimulus controllers in `app/javascript/controllers/`.
- **Tailwind** — CSS built via `rails tailwindcss:watch` (dev) or `assets:precompile`.
- **Deploy** — Kamal to `192.168.0.1` (config in `config/deploy.yml`, secrets in `.kamal/secrets`).
- **Health check** — `GET /up` (rails/health#show).
- **No models yet** — only `PageController` with root route. No migrations exist.

## Testing quirks

- Rails default minitest with `ActiveSupport::TestCase`, parallel workers, fixture loading.
- Test command in CI: `bin/rails db:test:prepare test` (prepares DB then runs suite).
- System tests use Capybara + Selenium. Screenshots saved to `tmp/screenshots` on failure.

## Environment

- `bin/dev` sets `RUBY_DEBUG_OPEN=true` and `RUBY_DEBUG_LAZY=true` for `debug` gem.
- `.env*` files are gitignored.
- `RAILS_MASTER_KEY` lives in `config/master.key` (not committed).
