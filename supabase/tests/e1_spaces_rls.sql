begin;

select plan(5);

-- preparar datos cruzados como service_role
set local role service_role;
insert into public.spaces (id, org_id, hotel_id, name)
values ('70000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'Sala Sur X')
on conflict (id) do nothing;

-- usuario org1
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  (select count(*) from public.spaces),
  3::bigint,
  'Miembro org1 ve solo sus 3 salones'
);

select throws_like(
$$insert into public.space_bookings (id, org_id, event_id, space_id, starts_at, ends_at) values ('72000000-0000-0000-0000-00000000bbbb','00000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-00000000aaaa','2026-01-10T13:00:00Z','2026-01-10T14:00:00Z')$$,
  '%space not found%',
  'No permite reservar un espacio de otra org'
);

select is(
  public.space_booking_overlaps('70000000-0000-0000-0000-000000000001', '2026-01-10T10:00:00Z'::timestamptz, '2026-01-10T10:30:00Z'::timestamptz, null),
  true,
  'Funci¢n overlaps detecta solape en Sala A'
);

-- usuario org2
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is(
  (select count(*) from public.spaces),
  1::bigint,
  'Miembro org2 solo ve su espacio'
);

select is(
  (select count(*) from public.events),
  0::bigint,
  'Miembro org2 no ve eventos de org1'
);

select * from finish();

rollback;
