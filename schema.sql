-- ==========================================================================
-- MALIZIA — Supabase schema (fixed order)
-- ==========================================================================

-- 1. TABLES FIRST (so later policies can reference each other safely) ------

create table if not exists public.admins (
  user_id uuid references auth.users not null primary key,
  created_at timestamp with time zone default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric not null check (price >= 0),
  image_url text not null,
  ai_description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.customers_passwords (
  id uuid references auth.users not null primary key,
  custom_password text not null default 'set',
  updated_at timestamp with time zone default now()
);


-- 2. ROW LEVEL SECURITY ------------------------------------------------------

alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.customers_passwords enable row level security;


-- 3. POLICIES: ADMINS ---------------------------------------------------------
drop policy if exists "Users can check their own admin status" on public.admins;
create policy "Users can check their own admin status"
on public.admins for select
to authenticated
using ( auth.uid() = user_id );


-- 4. POLICIES: PRODUCTS ---------------------------------------------------------
drop policy if exists "Public can view products" on public.products;
create policy "Public can view products"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products for insert
to authenticated
with check ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products for update
to authenticated
using ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products for delete
to authenticated
using ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );


-- 5. POLICIES: CUSTOMERS_PASSWORDS ----------------------------------------------------
drop policy if exists "Users manage their own password record" on public.customers_passwords;
create policy "Users manage their own password record"
on public.customers_passwords for all
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );


-- 6. STORAGE BUCKET FOR PRODUCT IMAGES -------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects for select
to anon, authenticated
using ( bucket_id = 'product-images' );

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (select 1 from public.admins a where a.user_id = auth.uid())
);

-- 7. ORDERS (customer checkout requests, admin calls to confirm) -------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  items jsonb not null,
  total numeric not null,
  status text not null default 'جديد',
  created_at timestamp with time zone default now()
);

alter table public.orders enable row level security;

-- Anyone (including guests) can place an order — this is the checkout form.
drop policy if exists "Anyone can create an order" on public.orders;
create policy "Anyone can create an order"
on public.orders for insert
to anon, authenticated
with check (true);

-- Only admins can see the incoming orders / phone numbers.
drop policy if exists "Admins can view orders" on public.orders;
create policy "Admins can view orders"
on public.orders for select
to authenticated
using ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );

-- Only admins can update order status (e.g. mark as "called" / "confirmed").
drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
to authenticated
using ( exists (select 1 from public.admins a where a.user_id = auth.uid()) );
-- 1. Run this whole file in the SQL Editor.
-- 2. Enable Google as an Auth provider: Authentication → Providers → Google.
-- 3. Create your admin account, copy that user's id, then run:
--    insert into public.admins (user_id) values ('paste-user-id-here');
-- 4. Copy your Project URL + anon public key into js/supabase-client.js.
-- ==========================================================================
