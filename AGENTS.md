# AGENTS.md — dscc

Rails 8.1.3 app (Ruby 4.0.5, SQLite 3, Propshaft, jsbundling-rails + Bun, Hotwire, Tailwind CSS v4). Deployment via Railway & Docker.

## Quick Start

```sh
bin/setup            # bundle install + npm/bun install + db:prepare
bin/dev              # foreman: web (puma :3000) + js:watch + tailwindcss:watch
bin/rails server     # web only (no JS/CSS watcher)
```

## Key Commands

| What | Command |
|---|---|
| Run all unit & integration tests | `bin/rails test` |
| Run system tests (headless Chrome) | `bin/rails test:system` |
| Run single test file | `bin/rails test test/controllers/admin/content_controller_test.rb` |
| Lint Ruby style | `bin/rubocop` |
| Security audits | `bin/brakeman --no-pager` · `bin/bundler-audit` · `npm audit --omit=dev` |
| Full local CI | `bin/ci` (setup → rubocop → security audits → tests → seed replant) |
| Replant database seeds | `bin/rails db:seed:replant` |
| JavaScript build | `bun bun.config.js` (or `bin/rails javascript:build`) |
| CSS build | `bin/rails tailwindcss:build` |
| Build & test Docker image | `docker build -t dscc .` |

## Architecture & Conventions

- **Models & Database**:
  - `SiteContent` (`section:string`, `key:string`, `content:text`): Stores dynamic copy and active storage image attachments (`has_one_attached :file`).
  - View helper `sc(section, key)` in `ApplicationHelper` retrieves content with safe fallbacks.
  - Active Record SQLite database in `storage/` (`development.sqlite3`, `test.sqlite3`, `production.sqlite3`).
  - Production uses Solid Cache, Solid Queue, and Solid Cable in dedicated SQLite databases.
- **Frontend & Assets**:
  - **JavaScript**: Bundled via `jsbundling-rails` using **Bun** (`bun.config.js`) into `app/assets/builds/application.js`.
  - **Controllers**: Stimulus controllers in `app/javascript/controllers/` (e.g. `gallery_draggable_controller.js` for physics-based GSAP gallery).
  - **CSS**: Tailwind CSS v4 via `tailwindcss-rails` + Flowbite components.
- **Admin System (`/admin`)**:
  - `Admin::SessionsController`: Handles login/logout with IP rate limiting. Supports `ENV["ADMIN_USERNAME"]` / `ENV["ADMIN_PASSWORD"]` with fallback to `credentials.yml.enc` and test fallbacks.
  - `Admin::ContentController`: Allows live copy editing and Turbo Stream-powered gallery image management (add/remove images).
- **Production & Deployment**:
  - Multi-stage [`Dockerfile`](file:///home/tlee/Projects/dscc/Dockerfile) includes Bun, Libvips, jemalloc, Thruster, and `gosu`.
  - Persistent volume MUST be mounted at `/rails/storage` to preserve SQLite databases and uploaded ActiveStorage assets.
  - Entrypoint [`bin/docker-entrypoint`](file:///home/tlee/Projects/dscc/bin/docker-entrypoint) automatically ensures `/rails/storage` directory exists, fixes root mount permissions (`chown -R rails:rails`), and drops to non-root `rails` user via `gosu`.
  - Health check endpoint: `GET /up` (`rails/health#show`).

## Testing & CI Notes

- Tests run using default Rails Minitest (`ActiveSupport::TestCase` & `ActionDispatch::IntegrationTest`).
- System tests use `ActionDispatch::SystemTestCase` with headless Chrome (`test/application_system_test_case.rb`).
- Tests do not require `RAILS_MASTER_KEY` (admin controllers provide safe test fallbacks).
- GitHub Actions CI runs parallel jobs (`scan_ruby`, `scan_js`, `lint`, `test`, `system-test`).
- Local CI can be verified anytime with `bin/ci`.

## Environment Variables

- `RAILS_MASTER_KEY`: Decrypts `config/credentials.yml.enc` in production (kept in local `config/master.key`, never committed).
- `SOLID_QUEUE_IN_PUMA=true`: Runs Solid Queue worker thread inside Puma for single-service deployments.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: Optional production admin credentials overrides.
- `.env*` files are gitignored.
