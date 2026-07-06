# Malizia — Premium Home Decor Store

A static, responsive e-commerce front-end (HTML/CSS/JS) for a home decor
brand, backed by Supabase (Auth, Database, Storage). Works out of the box in
**demo mode** with sample products, and switches to your live database as
soon as you add your Supabase credentials.

## Structure

```
malizia/
├── index.html          Storefront homepage (product grid)
├── product.html         Product detail view
├── cart.html             Simple session-based cart
├── login.html            Customer + Admin sign-in (tabbed)
├── set-password.html     First-time password setup after Google sign-in
├── reset-password.html   "Forgot password" landing page
├── admin.html             Secret admin dashboard
├── schema.sql             Supabase tables, RLS policies, storage bucket
├── css/styles.css         All styling (design tokens at the top)
└── js/
    ├── supabase-client.js  Supabase client init — put your keys here
    ├── demo-data.js        Sample products used until Supabase is wired up
    ├── cart.js              Cart logic (sessionStorage)
    ├── app.js               Homepage grid logic
    ├── product.js            Product detail logic
    ├── login.js               Auth logic
    └── admin.js                Admin dashboard logic
```

## Important: about the admin login

The original spec asked for a hardcoded shortcut (email `Malizia` / password
`123`) baked directly into the JavaScript. **That was left out on purpose** —
any string sitting in client-side JS is visible to anyone via "View Page
Source", and the `admin.html` URL itself would be reachable by typing it
directly, no password needed, since nothing was actually checking on the
server side.

Instead, this build uses a secure equivalent that gives you the same
"secret door" feeling, done safely:

- Admins sign in through **real Supabase Auth** (Admin tab on the login page).
- After sign-in, the app checks a private `admins` table to confirm that
  user is allowed in — the URL `admin.html` is not itself secret; the data
  behind it is what's protected.
- The actual security boundary is a **Row Level Security (RLS) policy** on
  the `products` table in Supabase — enforced by the database itself, so it
  can't be bypassed by editing front-end code.

You can still make the admin login feel like "your own secret code" — just
pick a real email/password combo only you know when you create the account,
rather than a guessable one hardcoded in the page.

## Setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New project.

### 2. Run the schema
Open **SQL Editor** in your Supabase dashboard, paste the contents of
`schema.sql`, and run it. This creates:
- `products` table (public read, admin-only write)
- `admins` table (membership list, no passwords stored)
- `customers_passwords` table (bookkeeping only — real passwords live in
  Supabase Auth's own encrypted storage)
- `product-images` storage bucket (public read, admin-only upload)

### 3. Enable Google login
**Authentication → Providers → Google** — add your Google OAuth client ID
and secret (from Google Cloud Console).

### 4. Create your admin account
Sign up once with the email/password you want to use as admin (via the
Admin tab's login form — Supabase will reject it until the user exists, so
create the user first under **Authentication → Users → Add user**, or sign
up via `login.html`'s customer form with that email once). Then copy that
user's ID and run:

```sql
insert into public.admins (user_id) values ('paste-the-user-id-here');
```

### 5. Connect the front-end
Open `js/supabase-client.js` and fill in:

```js
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

Both values are in **Project Settings → API** in your Supabase dashboard.
The anon key is safe to expose in the browser — RLS policies are what
actually protect your data.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In [Vercel](https://vercel.com), **New Project → Import** that repo.
3. Framework preset: **Other** (it's static HTML — no build step needed).
4. Deploy. That's it — Vercel will serve the files directly.

## Orders (checkout with phone number)

`cart.html` now has a checkout form asking for **full name + phone number**
(no account required — this matches how most Cash-on-Delivery stores in
Morocco work). Submitting it creates a row in the `orders` table.

`admin.html` shows a **"📞 الطلبات الجديدة"** panel listing every order with
a clickable `tel:` link next to the phone number, so an admin can call the
customer directly from their phone to confirm the order. Marking an order
"تم الاتصال" (called) updates its status.

RLS policies (in `schema.sql`) let anyone create an order (so guests can
check out), but only accounts listed in `admins` can read the list or see
phone numbers — customers' phone numbers are not publicly exposed.

## Notes on the "AI" features

- **Background removal**: simulated client-side (corner-color flood-fill to
  transparency) so the admin flow works with zero API keys. Swap
  `simulateBackgroundRemoval()` in `js/admin.js` for a call to a real
  background-removal API (e.g. remove.bg) when you're ready — ideally from
  a Supabase Edge Function so the API key never sits in browser code.
- **Description generator**: template-based Arabic copy generator in
  `js/admin.js` (`generateDescription()`). Swap it for a real LLM call
  (e.g. the Anthropic API) from a server-side function for genuinely
  unique, on-brand copy per product.
