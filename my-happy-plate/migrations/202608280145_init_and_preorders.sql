-- My Happy Plate · migration 202608280145
-- Extract this folder to its own GitHub repo when ready.
-- Postgres / Supabase ready.

create extension if not exists "pgcrypto";

create type public.availability as enum (
  'available', 'almost', 'sold', 'coming', 'hidden'
);

create type public.truck_status as enum (
  'open', 'closed', 'soon', 'sold_out', 'moving'
);

create type public.order_status as enum (
  'new', 'confirmed', 'cooking', 'ready', 'picked_up', 'canceled'
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order int not null default 0,
  active boolean not null default true
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price numeric(8,2) not null,
  photo_url text,
  availability public.availability not null default 'available',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.dinner_specials (
  id uuid primary key default gen_random_uuid(),
  special_date date not null default current_date,
  name text not null,
  description text,
  main_dish text,
  sides text[] not null default '{}',
  bread text,
  dessert text,
  price numeric(8,2) not null,
  qty int not null default 0,
  sold int not null default 0,
  availability public.availability not null default 'available',
  start_at timestamptz,
  end_at timestamptz,
  published boolean not null default true
);

create table public.truck_days (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  status public.truck_status not null default 'open',
  label text,
  address text,
  hours text,
  map_query text
);

-- Pre-orders: hold a plate for pickup at the truck. Pay at pickup for now.
create table public.preorders (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  customer_name text not null,
  phone text not null,
  note text,
  pickup_at timestamptz not null,
  subtotal numeric(8,2) not null,
  status public.order_status not null default 'new',
  pay_method text not null default 'pay_at_pickup',
  created_at timestamptz not null default now()
);

create table public.preorder_items (
  id uuid primary key default gen_random_uuid(),
  preorder_id uuid not null references public.preorders(id) on delete cascade,
  item_id text,
  name text not null,
  qty int not null check (qty > 0),
  unit_price numeric(8,2) not null
);

create index preorders_pickup_idx on public.preorders (pickup_at);
create index preorders_status_idx on public.preorders (status);

alter table public.preorders enable row level security;
alter table public.preorder_items enable row level security;
-- Public can insert their own preorder; kitchen role reads/updates all.
-- Policies land in a later migration once auth roles exist.
