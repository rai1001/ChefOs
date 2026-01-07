begin;

select plan(4);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Usuario A (org1) crea y lee su nota
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select lives_ok(
  $$insert into public.dashboard_notes (org_id, user_id, week_start, content) values ('00000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','2026-01-05','Nota demo')$$,
  'Usuario miembro puede crear su nota'
);
select is(
  (select count(*) from public.dashboard_notes where org_id = '00000000-0000-0000-0000-000000000001'),
  1::bigint,
  'Nota visible para su autor'
);

-- Usuario B (org2) no puede ver notas de org1
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is(
  (select count(*) from public.dashboard_notes where org_id = '00000000-0000-0000-0000-000000000001'),
  0::bigint,
  'Org2 no ve notas de Org1'
);

-- Usuario A no puede escribir notas para otro usuario
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select throws_like(
  $$insert into public.dashboard_notes (org_id, user_id, week_start, content) values ('00000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','2026-01-05','No deberia')$$,
  '%row-level%',
  'No puede escribir nota para otro usuario aunque sea misma org'
);

select * from finish();

rollback;
