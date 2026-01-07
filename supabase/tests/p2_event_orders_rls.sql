begin;

select plan(4);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is((select count(*) from public.menu_item_aliases), 1::bigint, 'Org1 ve alias');

select throws_like(
$$insert into public.menu_item_aliases (org_id, alias_text, normalized, supplier_item_id) values ('00000000-0000-0000-0000-000000000002','alias','alias','40000000-0000-0000-0000-000000000001')$$,
  '%org mismatch%',
  'No permite alias con supplier_item de otra org'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select is((select count(*) from public.event_purchase_orders), 0::bigint, 'Org2 no ve pedidos de Org1');
select is((select count(*) from public.menu_item_aliases), 0::bigint, 'Org2 no ve alias de Org1');

select * from finish();

rollback;
