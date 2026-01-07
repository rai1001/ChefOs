begin;

select plan(5);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  (select count(*) from public.event_attachments),
  1::bigint,
  'Org1 ve sus adjuntos'
);

select lives_ok($$insert into public.ocr_jobs (org_id, attachment_id, status, provider) values ('00000000-0000-0000-0000-000000000001','78000000-0000-0000-0000-000000000001','queued','mock') on conflict do nothing$$, 'Org1 puede crear job propio');

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select throws_like(
$$insert into public.ocr_jobs (org_id, attachment_id, status, provider) values ('00000000-0000-0000-0000-000000000002','78000000-0000-0000-0000-000000000001','queued','mock')$$,
  '%not found%',
  'Org2 no puede crear job sobre adjunto de org1'
);

select is(
  (select count(*) from public.event_attachments),
  0::bigint,
  'Org2 no ve adjuntos de org1'
);

select is(
  (select count(*) from public.event_service_menu_sections),
  0::bigint,
  'Org2 no ve secciones OCR de org1'
);

select * from finish();

rollback;
