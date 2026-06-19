# Admin Content Management System

## Data Model

### `SiteContent` table

| Column | Type | Notes |
|---|---|---|
| `section` | string | not null, section identifier (e.g. "navbar", "overview") |
| `key` | string | not null, unique within section (e.g. "h1", "logo_image") |
| `content` | text | HTML content (sanitized on output) |
| `position` | integer | ordering within section |

Index: `[section, key]` unique.

**Attachment:** ActiveStorage `has_one_attached :file` for images.

---

## Content Map

### `sections` — shared between nav link + section h2

| Key | Default |
|---|---|
| `overview_label` | Overview |
| `who_we_are_label` | Who We Are |
| `services_label` | Our Services |
| `reals_label` | 3 Reals |
| `trusted_by_label` | Trusted by |

### `navbar`

| Key | Default | Type |
|---|---|---|
| `logo_image` | — | image upload |
| `contact_button` | Contact Us | text |

### `overview`

| Key | Default |
|---|---|
| `h1` | Data Strategy<br>Consulting Club |
| `tagline` | A student-led consulting club using data and strategy to solve<br>real-world business challenges. |
| `sidebar` | Turning data into decisions and ideas into measurable impact. We help organizations solve real business challenges through analytics, AI, and strategy. |

### `who_we_are`

| Key | Default | Type |
|---|---|---|
| `image` | — | image upload (skeleton SVG fallback) |
| `body` | We are a community of students passionate about... | HTML text |

### `our_services`

| Key | Default |
|---|---|
| `header` | We help organizations unlock value from their data... |
| `card1_heading` | Analytics & Decision Intelligence |
| `card1_desc` | Define strategy, optimize operations... |
| `card1_features` | Foresight, Not Guesswork\nAI-Powered Predictive Models\nDecision Dashboards & Reporting\nRisk & Opportunity Detection\nDelivered AI Intelligence Asset |
| `card1_footer` | Focused on unlocking business insights... |
| `card2_heading` | Automation & AI Integration |
| `card2_desc` | Design plans to transform core processes... |
| `card2_features` | Reduced Manual Effort\nProcess Mapping & Optimization\nAI Service & Architecture Design\nCRM / ERP Integration\nCost-Optimized Deployment |
| `card2_footer` | Focused on automating workflows... |
| `card3_heading` | Data Strategy & Transformation |
| `card3_desc` | Design plans to modernize data practices... |
| `card3_features` | Data Strategy & Roadmap\nCentralized Data Foundation\nHistorical Data Standardization\nETL / ELT Pipeline Development\nData Governance & Security |
| `card3_footer` | Focused on delivering data solutions... |

### `three_reals`

| Key | Default | Type |
|---|---|---|
| `heading` | 3 Reals | text |
| `description` | Real client, real growth, and real — the three pillars that define our hands-on approach to data strategy consulting. | HTML text |
| `client_heading` | Real Client | text |
| `client_image` | — | image upload (skeleton SVG fallback) |
| `growth_heading` | Real Growth | text |
| `growth_image` | — | image upload (skeleton SVG fallback) |
| `connection_heading` | Real Connection | text |
| `connection_image` | — | image upload (skeleton SVG fallback) |

### `trusted_by`

| Key | Default | Type |
|---|---|---|
| `image_0` .. `image_N` | — | image upload (dynamic add/delete, skeleton SVG fallback) |

### `contact_us`

| Key | Default | Notes |
|---|---|---|
| `heading` | Contact Us | text |
| `description` | Have a question or want to work with us? We'd love to hear from you. | HTML text |
| `get_in_touch` | Get in Touch | text |
| `help_text` | Whether you're a student looking to join... | HTML text |
| `email_label` | Email | text |
| `email_value` | hello@dscc.org | shared: page display + mailer FROM + mailer TO |
| `phone_label` | Phone | text |
| `phone_value` | +1 (555) 000-0000 | text |
| `name_label` | Name | text |
| `name_placeholder` | Your name | text |
| `email_field_label` | Email | text |
| `email_placeholder` | your@email.com | text |
| `org_label` | Organization | text |
| `org_placeholder` | Company or school | text |
| `phone_field_label` | Phone | text |
| `phone_placeholder` | +1 (555) 000-0000 | text |
| `message_label` | Message | text |
| `message_placeholder` | Tell us about your project or question... | text |
| `submit_text` | Send Message | text |

---

## Image Handling

- No uploaded image → render skeleton SVG with `animate-pulse` (current placeholder)
- Uploaded image → render `<%= image_tag %>` via ActiveStorage
- Trusted By: images stored as `SiteContent` records with keys `image_0`, `image_1`, etc.
- Admin can add new image slots (creates a new `SiteContent` record) or delete existing ones

## HTML Support

- All text fields support HTML via `sanitize` on output
- Allowed tags: `strong`, `em`, `span`, `br`, `a`, `b`, `i`, `u`, `p`
- Allowed attributes: `class`, `href`
- Users can embed `<span class="text-fg-brand font-bold">` etc. for highlighted text

---

## Implementation

1. **Model** — `bin/rails g model SiteContent section:string key:string content:text position:integer`
2. **ActiveStorage** — `bin/rails active_storage:install` (if not already)
3. **Routes** — `namespace :admin { resource :content, only: [:show, :update] }` + `post "admin/content/add_image"`, `post "admin/content/remove_image"`
4. **Controller** — `Admin::ContentController`:
   - `show`: loads all content grouped by `section`, ordered by `position`
   - `update`: saves text params + image attachments
   - `add_image`: creates new `SiteContent` for `trusted_by` image slot
   - `remove_image`: deletes a `SiteContent` record and its attached file
5. **Admin view** — `/admin` with collapsible section cards:
   - Text: `<textarea>` for HTML fields, `<input>` for plain text
   - Images: file upload with preview; skeleton shown when empty
   - Trusted By: "Add image" button, delete checkbox per image
6. **Seeder** — `db/seeds.rb` inserts all default values
7. **Helper** — in `ApplicationHelper`:
   - `sc(section, key)`: returns `sanitize`d content
   - `sc_image(section, key)`: returns `image_tag` or skeleton SVG
8. **Update views** — replace hardcoded strings in `app/views/layouts/application.html.erb` and `app/views/page/index.html.erb`
9. **Update mailer** — `ContactMailer` reads `email_value` from `SiteContent` instead of hardcoded string
10. **Verify** — `bin/rubocop`, `bin/rails tailwindcss:build`, `bin/rails test`
