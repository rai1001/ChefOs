begin;

select plan(5);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  (select count(*) from public.event_service_notes),
  1::bigint,
  'Org1 ve notas de su servicio'
);

select throws_like(
$$insert into public.event_service_added_items (id, org_id, event_service_id, name, unit, qty_per_pax_seated, qty_per_pax_standing, rounding_rule) values ('77000000-0000-0000-0000-000000000099','00000000-0000-0000-0000-000000000001','73000000-0000-0000-0000-000000000099','Extra','ud',1,1,'ceil_unit')$$,
  '%event service not found%',
  'No permite agregar item a servicio de otra org'
);

select throws_like(
$$insert into public.event_service_excluded_items (id, org_id, event_service_id, template_item_id) values ('77000000-0000-0000-0000-000000000098','00000000-0000-0000-0000-000000000001','73000000-0000-0000-0000-000000000001','75000000-0000-0000-0000-000000000099')$$,
  '%template item%',
  'No permite excluir item de plantilla de otra org'
);

select throws_like(
$$insert into public.event_service_replaced_items (id, org_id, event_service_id, template_item_id, name, unit, qty_per_pax_seated, qty_per_pax_standing, rounding_rule) values ('77000000-0000-0000-0000-000000000097','00000000-0000-0000-0000-000000000001','73000000-0000-0000-0000-000000000001','75000000-0000-0000-0000-000000000001','Nuevo','ud',1,1,'ceil_unit')$$,
  '%duplicate key value%',
  'No permite duplicar reemplazo para mismo item'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select is(
  (select count(*) from public.event_service_notes),
  0::bigint,
  'Org2 no ve notas de org1'
);

select * from finish();

rollback;
