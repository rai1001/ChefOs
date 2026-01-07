begin;

select plan(6);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select ok((select count(*) from public.shifts) >= 21, 'Org1 ve los turnos seed');

select throws_like(
  $$insert into public.shifts (org_id, hotel_id, shift_date, shift_type, starts_at, ends_at) values ('00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','2026-02-01','desayuno','07:00','15:00')$$,
  '%org mismatch%',
  'No permite hotel de otra org en shift'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
insert into public.staff_members (id, org_id, full_name, role, employment_type, active)
values ('a0000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000002', 'Staff Sur', 'cocinero', 'fijo', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select throws_like(
  $$insert into public.staff_assignments (org_id, shift_id, staff_member_id)
    values (
      '00000000-0000-0000-0000-000000000001',
      (select id from public.shifts where org_id='00000000-0000-0000-0000-000000000001' limit 1),
      'a0000000-0000-0000-0000-000000000099'
    )$$,
  '%org mismatch%',
  'No permite staff de otra org'
);

-- Doble asignacion en mismo dia/hotel
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select throws_like(
  $$insert into public.staff_assignments (org_id, shift_id, staff_member_id) values ('00000000-0000-0000-0000-000000000001',(select id from public.shifts where hotel_id='20000000-0000-0000-0000-000000000001' and shift_date='2026-01-07' and shift_type in ('desayuno','mañana') limit 1),'a0000000-0000-0000-0000-000000000002')$$,
  '%time off%',
  'Bloquea asignacion en dia de descanso'
);
insert into public.staff_assignments (org_id, shift_id, staff_member_id)
values (
  '00000000-0000-0000-0000-000000000001',
  (select id from public.shifts where hotel_id='20000000-0000-0000-0000-000000000001' and shift_date='2026-01-08' and shift_type in ('desayuno','mañana') limit 1),
  'a0000000-0000-0000-0000-000000000003'
);
select throws_like(
  $$insert into public.staff_assignments (org_id, shift_id, staff_member_id) values ('00000000-0000-0000-0000-000000000001',(select id from public.shifts where hotel_id='20000000-0000-0000-0000-000000000001' and shift_date='2026-01-08' and shift_type in ('bar_tarde','tarde') limit 1),'a0000000-0000-0000-0000-000000000003')$$,
  '%already assigned%',
  'Bloquea doble turno mismo dia'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*) from public.shifts), 0::bigint, 'Org2 no ve turnos de Org1');

select * from finish();

rollback;
