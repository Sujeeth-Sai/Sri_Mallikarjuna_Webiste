-- Run this once in Supabase SQL Editor after creating your first Auth user.
-- It blocks anonymous API access and permits authenticated users of this app.

begin;

alter table public.products enable row level security;
alter table public.contacts enable row level security;
alter table public.stock_transactions enable row level security;
alter table public.expenses enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "authenticated_products" on public.products;
drop policy if exists "authenticated_contacts" on public.contacts;
drop policy if exists "authenticated_stock_transactions" on public.stock_transactions;
drop policy if exists "authenticated_expenses" on public.expenses;
drop policy if exists "authenticated_employees" on public.employees;
drop policy if exists "authenticated_attendance" on public.attendance;

create policy "authenticated_products" on public.products for all to authenticated using (true) with check (true);
create policy "authenticated_contacts" on public.contacts for all to authenticated using (true) with check (true);
create policy "authenticated_stock_transactions" on public.stock_transactions for all to authenticated using (true) with check (true);
create policy "authenticated_expenses" on public.expenses for all to authenticated using (true) with check (true);
create policy "authenticated_employees" on public.employees for all to authenticated using (true) with check (true);
create policy "authenticated_attendance" on public.attendance for all to authenticated using (true) with check (true);

commit;
