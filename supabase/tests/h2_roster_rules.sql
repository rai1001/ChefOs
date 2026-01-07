begin;

select plan(5);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select results_eq($$select count(*) from public.scheduling_rules$$, ARRAY[1::bigint], 'Org1 ve scheduling_rules');

-- time off bloquea
select throws_like(
  $$insert into public.staff_assignments (org_id, shift_id, staff_member_id)
    values (
      '00000000-0000-0000-0000-000000000001',
      (select id from public.shifts where hotel_id='20000000-0000-0000-0000-000000000001' and shift_date='2026-01-07' and shift_type='mañana' limit 1),
      'a0000000-0000-0000-0000-000000000002'
    )$$,
  '%time off%',
  'Bloquea asignacion en vacaciones'
);

-- tarde -> mañana bloquea
insert into public.staff_assignments (org_id, shift_id, staff_member_id)
values (
  '00000000-0000-0000-0000-000000000001',
  (select id from public.shifts where shift_date='2026-01-05' and shift_type='tarde' limit 1),
  'a0000000-0000-0000-0000-000000000003'
);
select throws_like(
  $$insert into public.staff_assignments (org_id, shift_id, staff_member_id)
    values (
      '00000000-0000-0000-0000-000000000001',
      (select id from public.shifts where shift_date='2026-01-06' and shift_type='mañana' limit 1),
      'a0000000-0000-0000-0000-000000000003'
    )$$,
  '%tarde->mañana%',
  'Bloquea tarde a mañana'
);

-- un turno por dia
select throws_like(
  $$insert into public.staff_assignments (org_id, shift_id, staff_member_id)
    values (
      '00000000-0000-0000-0000-000000000001',
      (select id from public.shifts where shift_date='2026-01-05' and shift_type='mañana' limit 1),
      'a0000000-0000-0000-0000-000000000003'
    )$$,
  '%already assigned%',
  'Bloquea doble turno mismo dia'
);

-- Org2 no ve
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*) from public.scheduling_rules), 0::bigint, 'Org2 no ve reglas de Org1');

select * from finish();

rollback;
