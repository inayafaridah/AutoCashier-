-- AutoCashier master product RPC helper
-- Run this once in Supabase Dashboard -> SQL Editor
-- It creates a function that inserts products without relying on PostgREST table schema introspection.

create or replace function public.create_product_record(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_product public.products%rowtype;
begin
  insert into public.products (
    sku,
    name,
    category_id,
    base_price,
    cost_price,
    unit,
    tax_rate,
    description,
    default_image_url,
    is_active,
    created_by
  ) values (
    payload ->> 'sku',
    payload ->> 'name',
    nullif(payload ->> 'category_id', '')::uuid,
    (payload ->> 'base_price')::numeric,
    nullif(payload ->> 'cost_price', '')::numeric,
    coalesce(nullif(payload ->> 'unit', ''), 'pcs'),
    coalesce(nullif(payload ->> 'tax_rate', '')::numeric, 0),
    nullif(payload ->> 'description', ''),
    nullif(payload ->> 'default_image_url', ''),
    coalesce((payload ->> 'is_active')::boolean, true),
    nullif(payload ->> 'created_by', '')::uuid
  )
  returning * into inserted_product;

  return to_jsonb(inserted_product);
end;
$$;

comment on function public.create_product_record(jsonb) is 'Insert a product record from JSON payload for backend master product flow.';
