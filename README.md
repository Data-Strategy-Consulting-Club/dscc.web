[![CI](https://github.com/Data-Strategy-Consulting-Club/dscc.web/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/Data-Strategy-Consulting-Club/dscc.web/actions/workflows/ci.yml) [![CI](https://github.com/Data-Strategy-Consulting-Club/dscc.web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Data-Strategy-Consulting-Club/dscc.web/actions/workflows/ci.yml)

# DSCC Web

The official web platform for the **Data Strategy & Consulting Club (DSCC)**. Built with Ruby on Rails 8, Hotwire, Tailwind CSS, GSAP, and SQLite.

---

## Features & Architecture

### 1. Public Portal
- **Interactive Landing Page**: Modern, responsive layout with dynamic overview sections, animated Vanta 3D topology background, service descriptions, projects showcase, and client/partner endorsements.
- **Dynamic Physics Gallery (`/gallery`)**: Draggable, physics-driven photo cards powered by **GSAP** and **InertiaPlugin** with boundary constraints, watermark avoidance, and ActiveStorage image optimization.
- **Contact Form**: Direct client and student inquiry capture with validation and asynchronous email notification capability.

### 2. Admin Content Management System (`/admin`)
- **Visual Content Editing**: Manage site text, headings, and descriptions for all sections through an intuitive administration dashboard.
- **Live Gallery Manager**: Upload, preview, sort, and remove gallery images with real-time UI updates powered by **Hotwire Turbo Streams**.
- **Session Security**: Rate-limited authentication with secure cookie sessions and configurable credentials via environment variables or encrypted Rails credentials.

---

## Technology Stack

- **Backend**: Ruby 4.0.5, Ruby on Rails 8.1.3
- **Database & Storage**: SQLite 3 with Solid Cache, Solid Queue (background jobs), and Solid Cable (WebSockets)
- **Asset Pipeline**: Propshaft, jsbundling-rails with Bun, Tailwind CSS v4, Flowbite
- **Animations & Interactivity**: GSAP (GreenSock), Stimulus, Turbo
- **Web Server & Accelerator**: Puma 8, Thruster (HTTP/2, asset compression, X-Sendfile)
- **Deployment**: Docker, Railway, Kamal-ready

---

## Local Development Setup

### Prerequisites
- **Ruby**: 4.0.5 (managed via `mise` or `rbenv` / `asdf`)
- **JavaScript Runtime**: [Bun](https://bun.sh/) (`bun --version`)
- **System Libraries**: `libvips`, `sqlite3`

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Data-Strategy-Consulting-Club/dscc.web.git
   cd dscc.web
   ```

2. **Run the automated setup:**
   ```bash
   bin/setup
   ```
   *(Installs Ruby gems, installs npm/bun packages, prepares the SQLite database, and clears old tempfiles.)*

3. **Start the development server:**
   ```bash
   bin/dev
   ```
   Open your browser at `http://localhost:3000`.

4. **Run tests and security checks:**
   ```bash
   bin/rails test          # Unit and integration tests
   bin/rails test:system   # Headless Chrome system tests
   bin/ci                  # Full local CI pipeline (lint, security audit, tests)
   ```

---

## Deployment Guide (Railway)

This application includes a production-ready multi-stage `Dockerfile` and automated entrypoint script configured for platforms like **Railway**.

### Step 1: Deploy from GitHub
1. Log in to [Railway](https://railway.com/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Data-Strategy-Consulting-Club/dscc.web`.

### Step 2: Configure Persistent Storage (Required)
SQLite databases and uploaded ActiveStorage images are stored in `/rails/storage`. To ensure data persists across redeployments:
1. In your Railway service dashboard, navigate to the **Volumes** tab.
2. Click **Add Volume** / **Mount Volume**.
3. Set the **Mount Path** to:
   ```text
   /rails/storage
   ```
4. Save the volume configuration.

### Step 3: Set Environment Variables
Navigate to your service's **Variables** tab and configure the required settings (detailed reference below).

### Step 4: Run Initial Database Seed (First-Time Only)
To populate the default website copy and initial layout:
1. In the Railway dashboard, open the **Deployments** tab on your active deployment.
2. Open the **Exec / CLI** console.
3. Run:
   ```bash
   ./bin/rails db:seed
   ```

### Step 5: Configure Domain & Health Check
- **Health Check Path**: `/up` (under Settings → Healthcheck)
- **Domain**: Under Settings → Networking, click **Generate Domain** or attach a custom domain.

---

## Environment Variables Reference

| Variable Name | Required | Purpose | How to Find / Generate Value |
|---|:---:|---|---|
| `RAILS_MASTER_KEY` | **Yes** | Master key used to decrypt Rails credentials on startup. | Found locally in `config/master.key`. If creating a new key, generate one using `bin/rails secret` or initialize via `bin/rails credentials:edit`. *(Never commit to Git)*. |
| `SOLID_QUEUE_IN_PUMA` | **Yes** | Enables the Solid Queue background worker thread inside the Puma process so background jobs run without a separate worker service. | Set value to `true`. |
| `ADMIN_USERNAME` | Optional | Custom administrator username for logging into `/admin`. | Set to your desired admin username. If omitted, falls back to the username in `config/credentials.yml.enc`. |
| `ADMIN_PASSWORD` | Optional | Custom administrator password for logging into `/admin`. | Set to a strong, unique password. If omitted, falls back to the password in `config/credentials.yml.enc`. |
| `RAILS_ENV` | Optional | Specifies the Rails execution environment. | Defaults to `production` in Docker. |
| `RAILS_LOG_LEVEL` | Optional | Log verbosity (`debug`, `info`, `warn`, `error`). | Defaults to `info`. Set to `debug` when diagnosing issues. |
| `PORT` | Auto | Port number the web server listens on. | Automatically provided by Railway (or defaults to `80`/`3000`). |

---

## Security & Best Practices

- **Master Key Security**: `config/master.key` and all `.env*` files are strictly ignored by `.gitignore` and must never be pushed to version control.
- **Rate Limiting**: The `/admin/login` endpoint includes rate limiting to prevent brute-force attacks.
- **Production Container Security**: The container entrypoint automatically configures `/rails/storage` permissions and steps down to an unprivileged non-root user (`rails:rails`) before starting the web server.

---

## License

This project is maintained by the **Data Strategy & Consulting Club**. All rights reserved.
