# Steinberg Swiss Finance — Online Banking Demo

A **static JavaScript demo** of an online-banking web app, built by porting the
user-facing behavior of the bundled PHP / Laravel bank script
(`../bank/bank`) and skinning it with the bundled Webflow **Banca** HTML
template (`../index`, `../about-us`, `../assets.website-files.com`, …).

> **Demonstration — no real money, accounts, or cards.**
> Steinberg Swiss Finance is a fictional institution. Every person, account,
> card, balance and transaction in this app is invented seed data that lives
> only in your browser.

---

## Quick start

```bash
npm install
npm run dev        # local development → open http://localhost:5173/
npm run build      # static export into dist/
npm run preview    # serve the production build → http://localhost:4173/
```

The production build (`npm run build`) produces **one self-contained
`dist/index.html`** (all JS, CSS, fonts and images inlined). You can simply
double-click that file to open the demo in your browser — no server needed.

> Do **not** double-click the project's source `index.html` in the app root:
> it references `/src/main.jsx`, which only exists when the Vite dev server is
> running (`npm run dev`). Likewise, the `index/index.html` file in the parent
> workspace folder is the original Webflow template, not this app.

Deploy target: **GitHub Pages** (or any static host). The build uses relative
paths and hash-based routing, so it works from a project sub-path without
server rewrites.

```bash
npm run deploy     # builds and publishes dist/ to the gh-pages branch
```

A GitHub Actions workflow (`.github/workflows/deploy.yml`) also publishes the
`dist/` folder to Pages on every push to `main`.

## Demo sign-in hints

Every password is `demo1234` (public, obviously-fake demo credentials):

| Role | Email |
| --- | --- |
| Customer — Emma Keller (richest ledger) | `emma@steinberg-demo.example` |
| Customer — Luca Müller | `luca@steinberg-demo.example` |
| Customer — Sofia Rossi | `sofia@steinberg-demo.example` |
| Admin — Felicitas Steinberg | `admin@steinberg-demo.example` |

Emma has a **seeded pending transfer** (`#15`, CHF 500 to Luca) waiting in the
admin console under **Pending transfers**, so the approval flow can be
exercised immediately. New customer transfers post instantly by default
(PHP `send_money_action` default); switch the policy on **Admin → Settings** to
make new transfers land in the approval queue.

## How the demo works

- **One React + Vite app.** Public marketing pages, the customer portal and the
  admin console are routes in the same app and share one design system derived
  from the template (Manrope type, `#f20823` primary, `#0a1023` ink,
  `#d8dce7` lines, pill buttons, red header, light footer).
- **Client-side demo state.** `src/data/seed.js` is the seed JSON. Edits are
  persisted to `localStorage` only. The **Reset demo** button in the app header
  restores the seed data and clears the session.
- **Shared banking rules.** All validation and ledger mutations live in
  `src/lib/banking.js` (used by every page), so amount rules, insufficient
  funds, own-account checks and fee calculation are not re-implemented
  per screen. These client-side checks are **not security** — see below.
- **Role separation in the demo.** `RequireRole` mirrors the PHP
  `admin` / `customer` middleware groups: a customer session cannot open admin
  routes and an admin session cannot open the customer portal.
- **Banner.** Every screen shows *“Demonstration — no real money, accounts, or
  cards.”*

## PHP behavior that was ported

| PHP screen / flow | JS equivalent | Notes |
| --- | --- | --- |
| Public home, about, services, FAQ (theme) | `/`, `/about`, `/rates` | Marketing layout from the Webflow template; the PHP theme’s Bootstrap pages were replaced by the template skin per spec |
| Public contact + `send_message` | `/contact` | Message is stored in the local demo store only; nothing is emailed |
| Login (`Auth\LoginController`) | `/signin` | Demo credentials checked against seed users; inactive customers are blocked |
| Register (`Auth\RegisterController`) | `/register` | Ported rules: name ≤191, unique email, phone required/unique, password min 6 + confirmation, agree checkbox; next account number comes from settings and is incremented |
| Customer dashboard (`DashboardController@index`) | `/app` | Account number, per-currency balances, recent 10 transactions, cards, updates/notices |
| Send money (`Customer\TransferController@send_money`) | `/app/transfer` | Ported rules: recipient by email or account number (customer, not self), numeric amount min 1.00, percentage/fixed fee from settings, `balance < amount + charge` → “Insufficient balance !”, instant vs approval mode (`send_money_action`), debit amount = amount + charge with fee column, credit leg with `parent_id` |
| Balances (`DashboardController` SQL) | `balanceFor()` in `banking.js` | `SUM(cr where status=2) − SUM(dr where status != 0)` — pending debits already reduce balance, pending credits appear only after approval |
| Transaction details | `/app/transactions/:id` | Shows the paired debit/credit leg |
| Transaction report (`Customer\ReportController`) | `/app/statements` | Date range + status + type filters, print view and CSV export. PHP’s server-side dompdf PDF is replaced by browser print/CSV (see gaps) |
| Profile view/edit + change password (`ProfileController`) | `/app/profile` | Ported rules incl. unique email and old-password check |
| Support tickets (`SupportTicketController`) | `/app/tickets`, `/app/tickets/:id` | Statuses 0 pending / 1 active / 2 closed; create, list by status, reply, close; no reply on closed tickets; attachments stubbed |
| Admin dashboard (`DashboardController` admin branch) | `/admin` | Active/inactive customers, recent transactions, demo liabilities per currency |
| Admin users (`UserController`) | `/admin/users` | List/filter, create/edit/delete with ported rules (unique name/email/username/account number, required branch & status, password min 6) |
| Admin transactions (`TransactionController`) | `/admin/transactions` | Full ledger with filters |
| Admin accounts (derived, as in the PHP data model) | `/admin/accounts` | One account number per customer + per-currency balances |
| Pending internal transfers (`InternalTransferRequestController`) | `/admin/pending-transfers` | Approve → both legs completed; reject → both legs rejected; delete → pair removed |
| Notices | `/admin/notices` | Maps the PHP News/email-template concept to an in-app notice board shown on customer dashboards |
| Settings (`UtilityController@settings`, `transactions_fee`) | `/admin/settings` | Site title, company name, contact info, currency position, date/time format, time zone, allow sign-up, email verification flag, next account number, transfer/exchange fees, transfer action, OTP flags |

## Stubbed (kept visible, but no real side effects)

| PHP feature | Why stubbed in the demo |
| --- | --- |
| OTP / two-factor email codes | No mail server on a static host. The settings flag exists but no code is ever sent. |
| Email verification, forgot/reset password | Requires email delivery. |
| Contact form emails, ticket attachments, KYC document uploads, profile picture upload | No server-side upload/storage; the demo notes this in each screen. |
| Mobile (SMS) verification | Requires Twilio-style provider credentials. |
| PDF statement generation | dompdf is server-side PHP; the demo offers print + CSV instead. |
| Email/SMS template editors, database backup, cache clear, logo upload | Server-only admin utilities; intentionally absent. |
| Payment gateways (PayPal, Stripe, Razorpay, Paystack, Flutterwave, Blockchain), deposits, withdrawals, gift cards | Require real payment processors and secrets. |
| Wire transfer (external) | Requires live core-banking routing; the internal-transfer flow is the retained money-moving flow. |
| Exchange money | FX conversion demo; not retained in the customer nav (fee settings kept for parity). |
| Loans, fixed deposits, payment requests | Out of scope for this demo port; listed for completeness. |

## Impossible on a static host (do not add to GitHub Pages)

- Running PHP / WordPress / Laravel — Pages serves static files only.
- Secure authentication. Client-side role checks are UI/demo behavior, not
  security; anyone can read the JavaScript. A real deployment needs a
  **separate server** with server-side auth, hashed passwords (bcrypt, as the
  PHP app does), and authorization on **every** request.
- Storing secrets. This repository contains **no API keys, database URLs,
  SMTP credentials, gateway keys, or admin backdoors**. Never add any.
- Sending email/SMS, processing payments, KYC, or connecting to a live core
  banking system.

## Important security note

This is a **demonstration**, not a bank. It must not be deployed as a
production bank, and authenticated banking must not be hosted on GitHub
Pages. The demo stores plain-text demo passwords and all data in
`localStorage`; the shared validation modules exist so behavior is identical
across screens, not to secure anything. If a real backend is added later it
must be a separate server (not GitHub Pages) that re-implements every rule in
`src/lib/banking.js` server-side.

## Project layout

```
src/
  data/seed.js          fictional seed JSON (users, ledger, cards, tickets…)
  lib/banking.js        shared validation + ledger operations (PHP ports)
  lib/store.jsx         seed → localStorage → React context; session; reset
  lib/format.js         money/date/PAN formatting driven by settings
  components/           design-system UI + public/app/admin shells
  pages/public/         home, about, rates, contact, sign-in, register
  pages/customer/       dashboard, accounts, transactions, transfer,
                        beneficiaries, cards, statements, profile, tickets
  pages/admin/          dashboard, users, accounts, transactions,
                        pending transfers, notices, settings
  styles/design.css     template-derived design system (Manrope, #f20823…)
```

## Verification

A 30-step headless smoke test was run against the production build (public
routes, sign-in for both roles, role separation, transfer with fee, own-account
and insufficient-balance rejection, ledger updates, admin approval of the
seeded pending transfer, reset control, registration). All checks passed.
