create table public.racing_members (
 email text primary key check (email=lower(email)),
 name text not null,
 role text not null check(role in ('admin','seller')),
 active integer not null default 1 check(active in(0,1))
);
create table public.racing_events (
 id text primary key,
 name text not null,
 date date not null,
 status text not null default 'open' check(status in('open','closed')),
 posted integer not null default 0 check(posted in(0,1))
);
create table public.racing_sales (
 id text primary key,
 event_id text not null references public.racing_events(id),
 seller text not null references public.racing_members(email),
 created timestamptz not null,
 payment text not null check(payment in('Pix','Dinheiro','Crédito','Débito','Outro')),
 items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items)>0),
 discount bigint not null check(discount>=0),
 total bigint not null check(total>=0),
 notes text not null default '',
 cancelled integer not null default 0 check(cancelled in(0,1))
);
create index racing_sales_event_id_idx on public.racing_sales(event_id);
create index racing_sales_seller_idx on public.racing_sales(seller);
alter table public.racing_members enable row level security;
alter table public.racing_events enable row level security;
alter table public.racing_sales enable row level security;
revoke all on table public.racing_members,public.racing_events,public.racing_sales from anon,authenticated;
grant usage on schema public to service_role;
grant select,insert,update,delete on table public.racing_members,public.racing_events,public.racing_sales to service_role;
comment on table public.racing_members is 'Access only through racing-api Edge Function after verified Auth identity and membership authorization. No direct anonymous or authenticated grants.';
