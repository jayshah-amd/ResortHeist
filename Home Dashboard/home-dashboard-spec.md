# Hearth & Home — Home Management Dashboard
### Product & Technical Specification · v1.0

> **Working name:** "Hearth & Home" (rename freely — it appears only in the header, the app manifest, and the page title).
> **Owners / only users:** Jay and Joice.
> **Status:** Ready to build. Pet care is fully generic (pets and routines are added inside the app). Later-version features are listed in §15 and must NOT be built in v1, but the data model should not block them.

---

## 0. How to use this document (instructions for the AI model building it)

You are building a small, private, self-hosted web app for a two-person household. Read the whole spec before writing code. Then:

1. Propose a file/folder structure and confirm the tech stack in §3 (only deviate with a stated reason).
2. Build in the phases of §14, in order. At the end of each phase, list which acceptance checks (§14) pass and stop for review.
3. Treat §9 (Design System) as binding — the cozy, illustrated, pastel feel is a core requirement, not polish to add later.
4. Never add features from §15 (Roadmap) unless asked. Never add analytics, telemetry, external CDNs, or third-party calls (fonts and icons are self-hosted).
5. When something is ambiguous, pick the simplest option that fits the principles in §1 and note the assumption in a `DECISIONS.md` file.

---

## 1. Vision & principles

A warm, storybook-style "home base" that helps Jay and Joice run their household together: shared to-dos and chores, store-by-store shopping lists, open loops that need closing, pet care, and bills — on their phones and laptops, from anywhere, visible to no one else.

**Principles**
1. **Cozy over clinical.** It should feel like opening a picture book, not a project-management tool. Soft colours, illustrations, gentle motion, friendly copy.
2. **Capture in seconds.** Getting a thought out of your head must take one tap and a few words.
3. **Gentle, never naggy.** At most one nudge per thing. No streaks, no scores, no guilt.
4. **Together, with room for "me".** Everything is shared by default; each person also has a private space.
5. **Private by design.** Lives on the home server; reachable only by two allow-listed people; no outside services except push delivery.
6. **Light on hardware.** Must run comfortably on a low-power mini PC alongside other Docker apps.

**Non-goals for v1:** multi-household support, more than two users, native mobile apps, bank connections, AI/LLM features, public sharing.

---

## 2. Users & access model

| | Jay | Joice |
|---|---|---|
| Personal colour | **Coral** `#F08A7E` | **Deep teal** `#4E9C96` |
| Default avatar | Initial "J" on coral circle (replaceable with photo/illustration) | Initial "J" on teal circle (replaceable) |

- Exactly two users, seeded from environment variables (`USER_1_EMAIL`, `USER_1_NAME`, `USER_1_COLOR`, same for `USER_2_*`). No sign-up screen.
- **Ownership values** for assignable things: `jay`, `joice`, `both`, or `unassigned` (shared pool).
- **Visibility values:** `shared` (default, both see it) or `private` (only the creator sees it — "My Space").
- Private items must be filtered **on the server** in every query, digest, push, search, and count — never only hidden in the UI.
- Either user can edit or delete any shared item. Every create/complete/edit stores `by_user_id` and timestamp.

---

## 3. Technical architecture

### 3.1 Environment (existing)
- Low-power mini PC running Docker; most apps are containers.
- Public access to apps goes through a **Cloudflare Tunnel** to a personal domain.
- Tailscale is used for admin access to the server.

### 3.2 Recommended stack (lightweight)
| Concern | Choice | Why |
|---|---|---|
| App framework | **SvelteKit** (Node adapter), TypeScript | Small runtime footprint, SSR + client, simple single service |
| Database | **SQLite** (WAL mode) via **Drizzle ORM** | Single file, trivial backups, no extra container |
| Real-time sync | **Server-Sent Events (SSE)** | One-way push of changes; lighter than WebSockets |
| Push notifications | **Web Push (VAPID)** via `web-push` | Works on installed PWAs (Android + iOS 16.4+) |
| Scheduler | In-process cron (e.g. `node-cron` / `croner`) in timezone `America/New_York` | Digest, nudges, reminders |
| Styling | Plain CSS with custom properties (design tokens) or Tailwind configured with the tokens in §9 | Theming + auto dark mode |
| Animation | CSS transitions + small JS (e.g. Svelte transitions); `canvas-confetti`-style sparkle kept tiny | Delight without weight |
| Images | Uploaded photos stored on a mounted volume, resized to ≤1600 px + 400 px thumbnail (`sharp`) | Receipts, pets, products |
| Container | One Docker image, `docker-compose.yml`, volumes `/data/db`, `/data/uploads`, `/backups` | Fits existing setup |

Target: idle RAM < 150 MB, image < 300 MB, cold start < 3 s.

### 3.3 Installable app (PWA)
- Web app manifest (name, icons in all sizes, `display: standalone`, theme colour `#FFFDF8` light / `#2B3245` dark), service worker for offline shell + push.
- Offline: app shell and last-loaded data viewable offline; **shopping-list check-offs queue offline** and sync when back online (stores often have poor signal).
- iOS: push only works once added to Home Screen — show a one-time friendly "Add me to your Home Screen" card with instructions on iPhone.

### 3.4 Access & authentication (Cloudflare Access)
- The app is published through the existing Cloudflare Tunnel **with a Cloudflare Access application in front of it**, policy = allow only Jay's and Joice's email addresses (one-time email PIN or Google login). Session duration: 30 days.
- The app **does not have its own passwords.** On every request it:
  1. Reads the `Cf-Access-Jwt-Assertion` header.
  2. Verifies the JWT signature against `https://<TEAM>.cloudflareaccess.com/cdn-cgi/access/certs` (cache keys), and checks `aud` = the Access application AUD tag (env `CF_ACCESS_AUD`) and `iss`.
  3. Maps the verified `email` claim to one of the two users. Any other email → 403 page.
- Rejects requests without a valid JWT (defence in depth, in case the tunnel is misconfigured).
- **Dev mode:** `AUTH_MODE=dev` with `DEV_USER=jay|joice` bypasses Access for local development only; refuse to start in dev mode if `NODE_ENV=production`.
- PWA gotcha: configure the manifest link with `crossorigin="use-credentials"` (or an Access bypass rule for `/manifest.webmanifest` and `/icons/*`) so installation works behind Access.
- Optional fallback: the app also listens on the LAN/Tailscale address for admin use, still requiring dev-style user selection behind an env flag `ALLOW_TAILNET=true` (default false).

### 3.5 Backups
- Nightly at 03:00: SQLite online backup (`.backup` API) to `/backups/db-YYYY-MM-DD.sqlite`, plus rsync of `/data/uploads` to `/backups/uploads/`. `/backups` is a volume the user maps to another drive/NAS.
- Keep 14 daily + 8 weekly copies. Log success/failure; show "Last backup: today 3:00 AM ✓" in Settings and a gentle warning card on Home if the last success is > 48 h old.
- Settings → "Export everything" downloads a ZIP (JSON of all tables + uploads).

### 3.6 Configuration (env)
`TZ=America/New_York`, `PUBLIC_URL`, `CF_ACCESS_AUD`, `CF_TEAM_DOMAIN`, `USER_1_*`, `USER_2_*`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `WEATHER_LAT`, `WEATHER_LON` (optional), `AUTH_MODE`, `BACKUP_DIR`.

### 3.7 Weather (optional)
Home greeting may show current temperature/condition from **Open-Meteo** (no API key), fetched server-side every 30 min and cached. If disabled or failing, the greeting simply omits it. This is the only outbound call besides push delivery.

---

## 4. Information architecture & navigation

**Phone (primary):** bottom tab bar with 5 tabs, each tinted with its area colour when active:

| Tab | Icon idea | Area colour | Contains |
|---|---|---|---|
| **Home** | little house | Cloud/coral | Daily overview (§5) |
| **Lists** | notepad | Meadow + Peach | Sub-tabs: **To-dos · Chores · Shopping** |
| **Loops** | ribbon/loop of string | Lavender | Open loops (§7) |
| **Pets** | paw | Sky | Pet profiles & care (§8) |
| **More** | three dots in a cloud | Cloud | Bills, Corkboard, Weekly Check-in, Closed-loop jar, Settings |

- A floating round **"+" Quick Capture** button (coral, 56 px, soft shadow) sits above the tab bar on every screen (§6.1).
- **Space switcher:** a pill toggle in the top header — **🏡 Our Home | 🌙 My Space**. My Space shows only the current user's private items across all areas and tints the header with their personal colour. Creating an item while in My Space defaults it to private.

**Laptop/desktop (≥ 1024 px):** left sidebar with the same sections (icons + labels, illustrations at the top), Home becomes a 3-column card grid; Lists show To-dos, Chores and Shopping side-by-side when wide enough. Quick Capture becomes a search-bar-style input at the top ("What's on your mind?") plus keyboard shortcut `N`.

**Tablet / mid-width:** 2-column grid, sidebar collapsed to icons.

---

## 5. Home screen

Personalised to whoever is signed in. Order on phone (top → bottom):

1. **Greeting header** — watercolour sky illustration that changes with time of day (morning/afternoon/evening/night). "Good morning, Jay ☀️ 12°". Space switcher pill. Small avatar of the other person with a tiny dot if they've been active in the last 10 minutes.
2. **Today** card (meadow tint) — everything due today or overdue for this user (assigned to them or `both`, plus unassigned shared chores): chores, to-dos, pet routines, manual bills due. Each row: check circle, title, owner dot, area icon. Overdue rows sit at the top with a warmer peach background (no red). Empty state: illustration + "Nothing due today. Go do something lovely."
3. **Pet strip** (sky tint) — horizontal row of round pet portraits; under each, today's routine chips (e.g. "🍽 AM ✓  🍽 PM ○  💊 ○"). Tap a chip to log it. Hidden if no pets added.
4. **Open loops** card (lavender) — the 3 loops that most need attention (nudge date reached first, then oldest without a next step). Copy is gentle: "Still open: Fence quote — next step: call Mike's Fencing". "See all (12)".
5. **Shopping** card (peach) — per store: "Walmart · 8 items", "Costco · 3 items", plus last 3 items added and by whom. "Running low?" suggestions count from staples (§6.4).
6. **Bills this week** card (cloud with coral accents) — bills due in the next 7 days; manual ones carry a small coral "pay manually" badge.
7. **Corkboard** — the latest pinned note(s) from either person, rendered as a slightly rotated sticky note in Patrick Hand font, in the author's colour tint. Tap to write one back.
8. **Weekly recap** (only shown Sunday–Monday) — "This week we closed 23 things together 🌱" with a two-colour split bar (coral/teal), no numbers per person unless tapped. No rankings, no streaks.

Desktop grid: column 1 = Today + Pet strip; column 2 = Loops + Bills; column 3 = Shopping + Corkboard (+ Recap).

---

## 6. Lists

### 6.1 Quick Capture (the "+" button) & rule-based smart parsing

Tapping "+" opens a bottom sheet with a single text field (autofocused, keyboard up), and below it **live preview chips** showing what the parser understood, e.g. `🛒 Costco` `👤 Jay` `🔁 every Sunday` `📅 Fri`. Each chip is tappable to change or remove. A type selector row (**To-do · Chore · Shopping · Loop · Note**) is pre-selected by the parser and can be overridden. "Add" saves; "Add & another" keeps the sheet open.

**Parsing is rule-based (no AI), case-insensitive, and must never lose words** — anything not recognised stays in the title.

| Token type | Recognised patterns | Effect |
|---|---|---|
| Loop marker | leading `?` or `loop:` | type = Loop |
| Note marker | leading `note:` or `📌` | type = Corkboard note |
| Store | configured store names & aliases (`walmart`, `wally`, `costco`), optionally preceded by `for`, `at`, `@` | type = Shopping, assign store(s) |
| Shopping verb | leading `buy`, `get`, `pick up` (with no recurrence) | type = Shopping (default store = last used) |
| Person | bare `jay`, `joice`, `me`, `both`, or `@jay` (a name preceded by `for`/`to`/`from` stays in the title, e.g. "gift for joice") | owner |
| Recurrence | `daily`, `every day`, `weekly`, `every <weekday>`, `every N days/weeks/months`, `monthly`, `every other <weekday>` | type = Chore, set repeat rule |
| Date | `today`, `tonight`, `tomorrow`, weekday names, `next week`, `this weekend`, `oct 25`, `10/25`, `in 3 days` | due date |
| Time | `at 7`, `at 7pm`, `7:30am` | due time |
| Quantity (shopping) | `2`, `x2`, `2 lbs`, `3 kg`, `a dozen` attached to an item | quantity/unit |
| List splitting (shopping only) | commas and `and` | multiple items |
| Privacy | `private`, `just me`, or created while in My Space | visibility = private |

**Examples (must pass as tests):**
| Input | Result |
|---|---|
| `eggs, milk and 2 lbs chicken for costco` | 3 shopping items on Costco; chicken qty 2 lb |
| `vacuum every sunday jay` | Chore "Vacuum", owned by Jay, repeats weekly Sunday |
| `? fence quote` | Loop "Fence quote", state Captured |
| `call vet tomorrow at 10 joice` | To-do "Call vet", due tomorrow 10:00, owner Joice |
| `buy paper towels` | Shopping item on last-used store |
| `birthday gift for joice private` (by Jay) | To-do "Birthday gift for Joice", private, owner Jay ("for joice" stays in the title) |
| `note: pizza tonight?` | Corkboard note |

### 6.2 To-dos (one-off tasks)
- Fields: title, notes, due date/time (optional), owner (`jay`/`joice`/`both`/unassigned), visibility, optional list name (e.g. "House", "Errands" — simple tags with emoji), attachments, created_by, done_at, done_by.
- Views: grouped by **Overdue · Today · Upcoming · Someday** (no date). Filter chips: Mine · Joice's/Jay's · Both · All.
- Completing: tap the circle → circle fills with the owner's colour, a tiny bounce + 3-sparkle burst, the row fades and slides into a collapsible "Done today" section. Undo toast for 5 s.
- Swipe actions (phone): right = complete, left = snooze (Tomorrow / This weekend / Next week / Pick date).

### 6.3 Chores (recurring)
Every chore has:
- **Ownership type**
  - `owned` → always the same person.
  - `rotating` → alternates between Jay and Joice. **Rotation mode chosen per chore:**
    - `fixed` — the assignee flips on a schedule (every N occurrences or every week), regardless of who did it.
    - `after_completion` — whoever completed it last, it's now the other person's turn.
  - `shared` → unassigned pool; whoever does it taps it and the completion is recorded in their colour.
- **Repeat rule** (one of):
  - `schedule` — calendar-based (daily, weekly on certain weekdays, every N weeks, monthly on day X / "first Saturday").
  - `after_done` — "every N days after it was last done" (e.g. clean fridge ~30 days); next due = completion date + N.
- Optional: room/area tag (Kitchen, Bathroom, Yard…, user-editable with emoji), due time, notes, "skip this time" action, pause.
- Completion history kept per chore (who, when) for the weekly recap and for rotation logic.
- **Overdue behaviour:** card shifts to a warm peach tint and moves to the top of Today; the assignee (or both, for shared) gets **exactly one push** per occurrence (§11). No further nudges.
- Chores screen layout: "Today & overdue" section, then "This week", then "Later", each row showing a small rotation icon (🔁 with next person's dot) when rotating. Tapping opens a detail sheet with history ("Last done by Joice, 3 days ago").

### 6.4 Shopping
- **Stores:** start with **Walmart** and **Costco** (Settings can add/rename/reorder/archive stores, each with an emoji/logo colour). Each store is a peach sub-tab; an "All" tab shows everything grouped by store.
- **Item fields:** name, quantity + unit, note ("the organic one"), optional product photo, section, store(s) (one or many), added_by, checked_at, checked_by, visibility.
- **Multi-store items:** an item can be tagged for several stores and appears on each; checking it off at any store marks it bought everywhere.
- **Sections:** each store has its own ordered sections (defaults: Produce, Bakery, Meat & Seafood, Dairy & Eggs, Frozen, Pantry, Snacks, Drinks, Household, Personal Care, Pharmacy, Pets, Other). The app remembers the section last used for an item name and auto-files it. Sections can be reordered per store by drag-and-drop.
- **Live together-shopping:** changes from the other person appear within ~1 s via SSE with a soft highlight and their colour dot ("Joice added yogurt").
- **Checking off:** item gets a hand-drawn-style strike, moves to an "In the cart" section at the bottom. **"Finish trip"** button clears checked items and records the purchase (feeds staples + price history).
- **Price notes:** when checking off, an optional slim prompt "Price? $__ for __ (unit)" appears inline (dismissable; can be turned off in Settings). The app stores price, quantity, unit, and computes **unit price**. Item detail shows last price at each store and a small "🏷 cheaper at Costco ($0.21/egg vs $0.27)" badge when both are known.
- **Staples memory:** any item bought ≥ 3 times becomes a staple automatically (can also mark manually / un-mark). Average interval = mean of last up-to-5 purchase gaps. When `days since last purchase > 1.2 × average` and it's not already on a list, it appears in a **"Running low?"** strip at the top of the store tab: "Eggs — usually every ~9 days, it's been 11" with **Add** / **Not yet** (snooze until next expected date) / **Stop suggesting**.
- **Quick re-add:** typing in the add field autocompletes from item history with last quantity/note/store.

---

## 7. Open loops

**Concept (show this in an onboarding card):** An open loop is anything started, promised, or nagging at you that isn't finished yet — a decision to make, a return to send back, a form to fill in, a project to finish. Each one takes up a little mental space until it's closed or captured somewhere you trust. This is that place.

### 7.1 Loop fields
| Field | Notes |
|---|---|
| Title | "Fence quote" |
| Type | `general`, `decision`, `errand`, `paperwork`, `project` (icon + template, below) |
| State | `captured` → `next_step` → `waiting` → `closed` (or `dropped`) |
| Next step | Free text, e.g. "Call Mike's Fencing" (empty = still needs thinking) |
| Waiting on | Person/company text, plus "since" date |
| Nudge me after | Date it resurfaces on Home/digest |
| Owner | `jay` / `joice` / `both` |
| Visibility | shared / private |
| Log | Timestamped quick notes ("Oct 12 — left voicemail"), author colour |
| Attachments | Photos/PDFs |
| Closed info | closed_at, closed_by, optional one-line "how it ended" |

State is derived/suggested automatically: adding a next step moves Captured → Next step; filling "Waiting on" moves to Waiting; user can override.

### 7.2 Type templates
- **Decision** 🤔 — extra fields: options/pros & cons list (two simple columns), "decide by" date. Close action is "We decided: ___".
- **Errand / return** 📦 — store/place, return-by deadline (counts down in the card, peach when ≤ 3 days), receipt/label photo.
- **Paperwork / admin** 📄 — due date, attachments, reference number field.
- **Project** 🌱 — ordered sub-tasks with checkboxes; a small illustrated plant on the card grows through 5 stages as the progress % rises.
- **General** 🎀 — base fields only.

### 7.3 Loops screen
- Lavender header with illustration (a ball of yarn/string). Segmented control: **Needs a next step · Ready to do · Waiting · All**.
- Cards look like soft paper tags with a little string; show type icon, title, next step, waiting-on with "for 9 days", owner dot, nudge date.
- Closing a loop: tap "Close loop" → the tag untwists and floats up with sparkles → it's added to the **Closed-loop jar** (More → Jar), an illustrated glass jar that visibly fills with little glowing dots per closed loop this month/year; tap to browse history.
- "Drop it" is a first-class, guilt-free action ("Let it go 🍃").

### 7.4 Weekly Check-in (Sunday evening)
- Push to both at **Sunday 7:00 PM** (time configurable): "Cozy check-in time ☕ — 6 loops, 2 overdue chores".
- Guided full-screen flow, one card at a time, designed to be done together on one device (both names shown) in ~10 minutes:
  1. **Welcome** — recap of the week (closed together count + split bar).
  2. **Loops** — each open shared loop one at a time with four big buttons: **Do it** (becomes a to-do with date) · **Schedule** (set nudge date) · **Waiting** (set waiting-on) · **Drop it**. Plus "Closed already ✓".
  3. **Overdue & skipped chores** — reassign, reschedule, or skip.
  4. **Bills next 2 weeks** — confirm manual payments planned and who pays.
  5. **Pets** — upcoming vaccines/vet/med refills in the next 30 days.
  6. **Shopping** — review "Running low?" suggestions.
  7. **Next week** — any new loops or to-dos to capture (Quick Capture inline).
  8. **Done** — illustration of a cozy evening + "See you next Sunday."
- Progress shown as a row of little stepping stones. Can be paused and resumed. Private items are excluded.

---

## 8. Pet care (generic — pets are added inside the app)

The app must not assume any particular pets. Users add any number of pets and configure their routines.

### 8.1 Pet profile
- Name, species (Dog, Cat, Bird, Fish, Rabbit, Reptile, Small mammal, Other + custom text), breed, sex, birthday/adoption date (shows age), colour/markings, photo (circular crop), optional **illustrated portrait** (upload an image; see §9.7), microchip number, insurance provider/policy, vet clinic name/phone/address, diet notes, allergies, behaviour/care notes, emergency notes, active/archived (in-memoriam archive shown gently with a little star).
- **Weight log** — date + weight, with a tiny soft line chart.
- **Documents** — vaccination certificates, adoption papers, insurance PDFs.

### 8.2 Care routines (user-defined per pet)
- Routine types with icons: Feeding 🍽, Medication 💊, Walk 🦮, Litter 🧹, Grooming ✂️, Flea/tick/worming 🛡, Water/tank 🫧, Play, Custom.
- Each routine: title ("Breakfast", "Thyroid pill"), dose/amount text, schedule (times per day e.g. 7:30 & 18:00; or every N days/weeks/months e.g. flea treatment every 30 days), assigned to `jay`/`joice`/`both`/whoever, **alert on/off**, start/end date (for a course of meds), refill reminder (optional: quantity remaining + per-dose count → "refill in ~5 days").
- **Logging:** tap the routine chip on Home or the pet page → logged with who + time, chip fills with their colour. **Double-feed protection:** if a feeding/med occurrence is already logged, the chip shows "Fed by Joice at 7:32" and tapping asks "Log again?".
- Missed alert-enabled routines → see §11.

### 8.3 Health records
- **Vaccines/preventatives:** name, date given, next due date (auto-computed from an interval if provided), clinic, certificate attachment. Due within 30 days → shows on Home and weekly check-in; due within 7 days → in daily digest.
- **Vet visits:** date, reason, clinic, notes, cost (optional, feeds future budgeting), attachments, follow-up date (creates a to-do).
- **Upcoming appointments** appear in Today/digest on their date.

### 8.4 Pets screen
- Sky-blue header with illustration. Phone: horizontal pet carousel of large round portraits at top; selected pet below with tabs **Today · Routines · Health · Profile**.
- Today tab: timeline of the pet's routines for today (logged and pending), weight trend mini-card, next vet/vaccine due.
- Empty state (no pets yet): illustration of an empty cozy pet bed + "Add your first pet" button.

---

## 9. Design system — "Storybook Pastel"

The look: a gentle illustrated picture book (Studio-Ghibli-adjacent warmth, not copied). Soft watercolour illustrations, rounded bubbly cards, each area living in its own pastel "world", playful but calm motion.

### 9.1 Colour tokens — Light mode
| Token | Name | Hex | Use |
|---|---|---|---|
| `--bg` | Cloud | `#FFFDF8` | App background |
| `--card` | Paper white | `#FFFFFF` | Cards (with area-tint header strip) |
| `--ink` | Storybook ink | `#3E4A5C` | Primary text, icons |
| `--ink-soft` | Soft ink | `#6B7689` | Secondary text |
| `--line` | Mist | `#E8E4EE` | Dividers, borders |
| `--chores` | Meadow | `#CFE6C4` | Chores & to-dos area tint |
| `--shopping` | Peach | `#F6D2BC` | Shopping area tint, overdue tint |
| `--loops` | Lavender | `#DCD3F0` | Open loops area tint |
| `--pets` | Sky | `#DCEBF5` | Pets area tint |
| `--accent` | Coral | `#F08A7E` | Primary buttons, "+" button, highlights |
| `--jay` | Coral | `#F08A7E` | Jay's dots, fills, completions |
| `--joice` | Deep teal | `#4E9C96` | Joice's dots, fills, completions |
| `--both` | Split | coral/teal half-circle | Items owned by both |
| `--success` | Meadow deep | `#7FB77E` | Completion confirmations |
| `--warn` | Honey | `#F2C46D` | Due soon (never harsh red) |

Area deep shades (for icons/text on tints): Meadow deep `#5E9A5A`, Peach deep `#D98A5F`, Lavender deep `#8A7BC4`, Sky deep `#5E95BE`.

### 9.2 Colour tokens — Night mode (automatic)
Follows the device setting via `prefers-color-scheme`, with a manual override in Settings (Auto / Light / Night).
| Token | Hex |
|---|---|
| `--bg` Midnight blue | `#2B3245` |
| `--card` Dusk | `#353D52` |
| `--ink` Cloud | `#FFFDF8` |
| `--ink-soft` | `#C3C9D6` |
| `--line` | `#454E66` |
| Area tints | Same hues at ~25% opacity over `--card` (soft glows), area deep shades lightened 15% for icons |
| `--accent` / `--jay` | `#F59A8F` |
| `--joice` | `#6BB8B2` |
Illustrations switch to night variants where available (stars, moon, lamplight); otherwise apply a gentle dim overlay.

### 9.3 Accessibility rules
- Body text on any background must meet WCAG AA (4.5:1). Pastels are **backgrounds only**; text on pastels uses `--ink`. Coral buttons use `--ink` or white text only if contrast passes (use ink `#3E4A5C` on coral).
- Owner is never conveyed by colour alone: dots include the person's initial on hover/long-press and in screen-reader labels.
- Respect `prefers-reduced-motion` (replace bounces/sparkles with simple fades).
- Tap targets ≥ 44 px.

### 9.4 Typography (self-hosted, no Google Fonts CDN)
| Role | Font | Size (phone) | Weight |
|---|---|---|---|
| Display / greeting | **Quicksand** | 28 px | 700 |
| Section titles | Quicksand | 20 px | 600 |
| Card titles | Quicksand | 17 px | 600 |
| Body | **Nunito** | 16 px | 400/600 |
| Small/meta | Nunito | 13 px | 600, `--ink-soft` |
| Handwritten notes | **Patrick Hand** | 18 px | 400 (Corkboard, empty-state captions) |

### 9.5 Shape, depth, spacing
- Card radius **20 px**; buttons & chips fully rounded (pill); bottom sheets 28 px top radius.
- Shadows soft and tinted, never grey: `0 6px 20px rgba(62,74,92,0.08)`; floating "+" `0 8px 24px rgba(240,138,126,0.35)`.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Card padding 16 (phone) / 24 (desktop).
- Cards have a 6 px area-tint strip or a full soft tint background for the area's primary cards.
- Optional subtle paper/watercolour grain texture on `--bg` (≤ 4% opacity, small tiled WebP).

### 9.6 Components
- **Check circle:** 24 px outline circle in `--ink-soft`; on complete fills with owner colour, white check draws in (200 ms), bounce scale 1 → 1.15 → 1, 3–5 tiny sparkle stars burst (400 ms).
- **Owner dot:** 10 px circle in person colour (half/half for both); avatar chip variant with initial.
- **Area chip / tag:** pill, area tint background, deep shade text, emoji/icon left.
- **Bottom sheet:** used for Quick Capture, item details, pickers; drag handle; backdrop blur.
- **Toast:** rounded pill at bottom above tab bar, illustration icon, "Undo".
- **Sticky note (Corkboard):** square, 2–3° random rotation, author colour tint, Patrick Hand, little pushpin.
- **Loop tag card:** paper-tag shape with hole + string line.
- **Progress plant:** 5-stage SVG (seed → sprout → leaves → bud → flower).
- **Closed-loop jar:** SVG jar filling with glowing dots (lavender/coral/teal by closer).
- **Empty states:** every list has an illustration + warm one-liner (see §9.8).
- **Skeleton loaders:** soft shimmering pastel blobs, not grey bars.

### 9.7 Illustrations (create once; consistent watercolour storybook style)
Deliver as optimised WebP/SVG, light + night variants where noted. Suggested generation prompt base: *"Soft watercolour storybook illustration, gentle Ghibli-inspired cozy style, pastel palette of cloud white #FFFDF8, meadow green #CFE6C4, peach #F6D2BC, lavender #DCD3F0, sky blue #DCEBF5 and coral #F08A7E accents, simple shapes, lots of white space, no text."*

| # | Illustration | Where |
|---|---|---|
| 1–4 | Sky headers: morning, afternoon, evening, night | Home greeting |
| 5 | Little house in a meadow | Home empty state / onboarding |
| 6 | Notepad with flowers | Lists header |
| 7 | Market basket with produce | Shopping header & empty list |
| 8 | Ball of lavender yarn / tag on a string | Loops header |
| 9 | Glass jar of fireflies | Closed-loop jar |
| 10 | Cozy pet bed (empty) | Pets empty state |
| 11 | Generic sleeping cat & dog on a windowsill | Pets header (until custom portraits) |
| 12 | Birds on a wire | To-dos empty state |
| 13 | Watering can & sprout | Chores empty state |
| 14 | Teacup & candle, evening | Weekly check-in start/end |
| 15 | Envelope with a leaf | Bills header |
| 16 | Corkboard with pins | Corkboard header |
| 17 | Moon & stars over the house | Night-mode Home header |
| 18 | Plant growth stages ×5 | Project progress |

Custom pet portraits: the pet profile accepts any uploaded image as "illustrated portrait" (users may generate one from a photo with an image tool); otherwise the photo is shown in a soft circular frame with a pastel ring.

### 9.8 Voice & copy
Warm, short, a little playful; never scolding. Use "we/us/our home".
- Empty To-dos: "Birds on a wire, nothing to do. 🕊"
- Empty Shopping: "The basket's empty — the fridge must be happy."
- Empty Loops: "No loose ends. Breathe easy."
- Overdue: "This one's been waiting a bit" (not "OVERDUE").
- Closing a loop: "Loop closed ✨ one less thing to carry."
- Dropping: "Let it go 🍃"

### 9.9 Motion
Durations 150–400 ms, easing `cubic-bezier(.2,.8,.2,1)`. Page transitions: gentle cross-fade + 8 px slide. List insertions slide/fade in; deletions collapse. Header illustrations have a very slow (20–40 s) drift of clouds/stars. All motion disabled under reduced-motion.

---

## 10. Bills & subscriptions (v1 scope)
- **Fields:** name, category (Housing, Utilities, Insurance, Phone/Internet, Subscriptions, Transport, Health, Pets, Other — editable with emoji), amount, frequency (weekly, monthly, quarterly, yearly, custom N months), next due date, **autopay yes/no**, **who pays** (`jay`/`joice`/`both`/joint) and **paying account** (free text, e.g. "Joint chequing", "Jay's Visa"), notes, active/cancelled, visibility.
- **Mark paid** (manual bills): logs paid date + by; advances next due date.
- **Bills screen** (More → Bills): month view list grouped by due week; manual bills carry a coral "pay manually" badge; autopay bills show a small soft "auto ✓".
- **Monthly totals:** total recurring spend normalised to a month (yearly ÷ 12, etc.), shown as a soft pastel **donut chart by category**, plus small breakdowns: by payer and autopay vs manual.
- **Reminders:** **manual (non-autopay) bills send a push 3 days before due** to the payer (both if `both`/joint). Autopay bills never push. All bills due within 7 days show on Home; within 3 days in the digest.

---

## 11. Notifications

All times `America/New_York`. Quiet hours **22:00–07:00** (non-urgent pushes are held until 07:00; pet routines with alerts are exempt). Each user can toggle every category in Settings. Pushes are personalised per recipient and never reveal the other person's private items.

| # | Notification | Recipient | When | Example |
|---|---|---|---|---|
| N1 | **Morning digest** | Each user | Daily **9:00 AM** | "Today: 3 chores, Rex's evening pill, 1 loop to nudge. Costco list has 12 items." Tap → Today view. Skipped if there is genuinely nothing (configurable). |
| N2 | **Chore overdue nudge** | Assignee (both for shared/both) | **Once** per occurrence, at the next nudge window (default **6:00 PM**) after it becomes overdue | "The bins are still waiting 🗑" |
| N3 | **Pet routine alert** (only routines with alert on) | Assignee(s) | At the scheduled time; if not logged within 60 min, **one** follow-up to both | "Time for Luna's thyroid pill 💊" |
| N4 | **Manual bill reminder** | Payer(s) | **3 days before** due, 9:00 AM | "Hydro bill ($84) due Thursday — pay manually" |
| N5 | **Weekly check-in** | Both | **Sunday 7:00 PM** | "Cozy check-in time ☕" |
| N6 | **Vaccine / vet due** | Both | 7 days before, in the digest (no separate push) | — |
| N7 | **Loop nudge date reached** | Owner(s) | In the digest that day (no separate push) | — |
| N8 | **Backup failing** | Jay | Once, when last success > 48 h | — |

- No push for shopping-list edits (live updates in-app only).
- Notification tap deep-links to the relevant item.
- Settings → Notifications: per-category toggles, digest time, nudge window time, check-in day/time, quiet hours, "Send test notification".

---

## 12. Corkboard & More

- **Corkboard:** short notes between the two of you ("Pizza tonight? 🍕", "Plumber coming Tue 10am"). Fields: text (≤ 280 chars), author, optional emoji/sticker, pinned-until date (default 3 days), reactions (❤️ 👍 😂 ✅). Latest shows on Home; full board in More.
- **More menu:** Bills · Corkboard · Weekly Check-in (start anytime) · Closed-loop Jar · Settings.
- **Settings:** profile (name, colour, avatar), stores & sections, chore areas/rooms, bill categories, notifications (§11), appearance (Auto/Light/Night, reduce motion, price prompt on/off), install-app help, backups status & export, about.

---

## 13. Data model (SQLite)

All tables include `id` (ULID text), `created_at`, `updated_at`, `created_by` (user id) unless noted. "Owner" columns use enum `jay|joice|both|unassigned` mapped to user ids. `visibility` enum `shared|private`. Soft-delete via `deleted_at` where useful (undo).

```
users(id, email UNIQUE, name, color, avatar_path, settings_json)
push_subscriptions(id, user_id, endpoint UNIQUE, p256dh, auth, user_agent, last_success_at)

task_lists(id, name, emoji, sort, visibility, owner_user_id)
tasks(id, title, notes, list_id?, due_date?, due_time?, owner, visibility, done_at?, done_by?, snoozed_until?, deleted_at?)

rooms(id, name, emoji, sort)
chores(id, title, notes, room_id?, ownership_type[owned|rotating|shared], owner_user_id?,
       rotation_mode[fixed|after_completion]?, rotation_every_n?, current_assignee_user_id?,
       repeat_type[schedule|after_done], rrule?, interval_days?, due_time?, next_due_date,
       paused, visibility, last_nudged_occurrence?)
chore_completions(id, chore_id, user_id, occurrence_date, completed_at, skipped BOOL)

stores(id, name, emoji, color, sort, archived)
store_sections(id, store_id, name, sort)
shopping_items(id, name, qty?, unit?, note?, photo_path?, visibility, checked_at?, checked_by?, trip_id?, deleted_at?)
shopping_item_stores(item_id, store_id, section_id?)        -- many-to-many
item_memory(name_normalized PK, last_section_by_store_json, last_qty, last_unit, last_note)
trips(id, store_id, user_id, finished_at)
purchases(id, name_normalized, store_id, trip_id, qty?, unit?, price?, unit_price?, purchased_at, user_id)
staples(name_normalized PK, display_name, is_auto, avg_interval_days, last_purchased_at, snoozed_until?, suppressed BOOL)

loops(id, title, type[general|decision|errand|paperwork|project], state[captured|next_step|waiting|closed|dropped],
      next_step?, waiting_on?, waiting_since?, nudge_after?, decide_by?, return_by?, due_date?, place?, reference_no?,
      owner, visibility, closed_at?, closed_by?, close_note?)
loop_log(id, loop_id, user_id, text, created_at)
loop_options(id, loop_id, label, pros, cons, sort)          -- decisions
loop_subtasks(id, loop_id, title, done_at?, done_by?, sort) -- projects

pets(id, name, species, species_custom?, breed?, sex?, birthday?, adoption_date?, markings?, photo_path?, portrait_path?,
     microchip?, insurance_provider?, insurance_policy?, vet_name?, vet_phone?, vet_address?, diet_notes?, allergies?,
     care_notes?, emergency_notes?, archived)
pet_routines(id, pet_id, type, title, dose?, schedule_json, owner, alert BOOL, start_date?, end_date?,
             supply_remaining?, per_dose?, refill_alert_days?, active)
pet_routine_logs(id, routine_id, occurrence_at, logged_at, user_id, note?)
pet_weights(id, pet_id, date, weight, unit)
pet_vaccines(id, pet_id, name, given_on?, interval_months?, next_due?, clinic?)
pet_vet_visits(id, pet_id, date, reason, clinic?, notes?, cost?, follow_up_date?)

bill_categories(id, name, emoji, sort)
bills(id, name, category_id, amount, currency, frequency, custom_months?, next_due_date, autopay BOOL,
      payer, paying_account?, notes?, active, visibility)
bill_payments(id, bill_id, paid_on, amount, user_id)

notes(id, text, emoji?, pinned_until, author_user_id)       -- corkboard
note_reactions(note_id, user_id, emoji)

attachments(id, parent_type, parent_id, path, thumb_path, mime, size, original_name)
activity(id, user_id, verb, entity_type, entity_id, summary, created_at)   -- recap + SSE feed
notification_log(id, user_id, kind, entity_id?, sent_at, status)           -- guarantees "once only"
backup_log(id, started_at, finished_at, ok, message)
```

**API:** server routes/actions per resource (`/api/tasks`, `/api/chores/:id/complete`, `/api/shopping/items`, `/api/loops/:id/state`, …), JSON, validated with Zod. `GET /api/events` = SSE stream of `{entity, id, action, by}` filtered by visibility per user.

---

## 14. Build phases & acceptance checks

**Phase 0 — Foundation**
- Docker image + compose, SQLite migrations, seed two users from env, Cloudflare Access JWT auth + dev mode, design tokens, fonts, light/night auto-switch, app shell with tab bar/sidebar, PWA manifest + service worker, SSE plumbing, nightly backup job.
- ✅ Unknown email → 403. ✅ Valid Access JWT maps to correct user. ✅ Theme follows OS setting. ✅ Installs to iPhone/Android home screen. ✅ Backup file appears in `/backups`.

**Phase 1 — Lists & Quick Capture**
- To-dos, Chores (all ownership/rotation/repeat combinations), Shopping (stores, sections, multi-store, live sync, finish trip, price notes, staples), Quick Capture with parser + preview chips, My Space privacy.
- ✅ All §6.1 parser examples pass as unit tests. ✅ Rotating `after_completion` chore alternates correctly over 4 completions. ✅ `after_done` chore next due = completion + N. ✅ Item checked on Walmart disappears from Costco too. ✅ Second phone sees an added item within 2 s. ✅ Staple suggestion appears after 3 purchases and the 1.2× threshold. ✅ Private item never appears in the other user's API responses, SSE, or counts.

**Phase 2 — Home, Open Loops & Weekly Check-in**
- Home cards, loops with all types/templates/states, closed-loop jar, corkboard, weekly recap, check-in flow.
- ✅ Loop auto-moves state when next step/waiting-on filled. ✅ Project plant advances with sub-tasks. ✅ Check-in can be paused/resumed and excludes private items.

**Phase 3 — Pets**
- Pet profiles, routines, logging with double-log protection, weights, vaccines, vet visits, Home pet strip.
- ✅ Adding a pet with 2 feedings + 1 med shows 3 chips on Home. ✅ Second log of same occurrence asks for confirmation. ✅ Vaccine next-due computes from interval.

**Phase 4 — Bills**
- Bills CRUD, mark paid, monthly normalised totals, donut by category, payer & autopay breakdown.
- ✅ Yearly $120 bill contributes $10/month. ✅ Marking paid advances due date by frequency.

**Phase 5 — Notifications**
- Web push subscription management, scheduler, N1–N8, quiet hours, settings, test push, deep links, `notification_log` idempotency.
- ✅ Overdue chore triggers exactly one push per occurrence even across restarts. ✅ Autopay bill never pushes; manual pushes 3 days prior. ✅ Digest at 9:00 local time contains only the recipient's visible items.

**Phase 6 — Polish**
- All illustrations (§9.7) + night variants, empty states, animations, reduced-motion, accessibility pass, performance check on the mini PC, export ZIP.
- ✅ Lighthouse PWA + accessibility ≥ 90. ✅ Idle RAM < 150 MB.

---

## 15. Roadmap (NOT in v1 — design so these fit later)
1. **Appliances & home upkeep** — appliance records (model, serial, purchase date, receipt, manual PDF, warranty expiry alerts, service history) and maintenance schedules (HVAC filter every 90 days, dryer vent yearly) — likely reusing the chore engine.
2. **Home info vault** — Wi-Fi & guest Wi-Fi, shut-off valve/breaker locations, contractor contacts, paint colours.
3. **Bank CSV import** — import statements, auto-categorise with rules, monthly category budgets.
4. **Subscription renewal & free-trial alerts.**
5. **Meal planning** — weekly dinner plan feeding ingredients to shopping lists.
6. **Local AI parsing** — optional Ollama-backed parser for looser phrasing (only if hardware allows).
7. **Seasonal accents** — light seasonal/holiday decorations over the pastel theme (e.g., falling leaves in October, Diwali lamps).
8. **Shared calendar view** — chores, loops, bills, pet events on one month calendar; optional ICS feed.
9. **Wall/kitchen display mode.**

---

## 16. Open questions (fill in later; do not block v1)
- App name and logo.
- Pet details (entered in-app — nothing needed in code).
- Exact weekly check-in time if not 7 PM Sunday; digest skip-when-empty preference.
- Which drive/NAS path maps to `/backups`.
- Currency display (assumed CAD/`$`, configurable).
