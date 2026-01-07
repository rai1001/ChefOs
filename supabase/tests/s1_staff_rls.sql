begin;

select plan(4);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is((select count(*) from public.staff_members), 5::bigint, 'Org1 ve staff seed');

select throws_like(
  $$insert into public.staff_members (org_id, home_hotel_id, full_name, role, employment_type) values ('00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','Staff Cruce','cocinero','fijo')$$,
  '%org mismatch%',
  'No permite home_hotel de otra org'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*) from public.staff_members), 0::bigint, 'Org2 no ve staff de Org1');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select throws_like(
  $$insert into public.staff_members (org_id, full_name, role, employment_type) values ('00000000-0000-0000-0000-000000000001','Juan Chef','cocinero','fijo')$$,
  '%duplicate%',
  'Unique por nombre en org'
);

select * from finish();

rollback;
