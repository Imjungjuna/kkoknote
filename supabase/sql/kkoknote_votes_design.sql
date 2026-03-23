-- KkokNote: Server-side vote abuse prevention design (draft)
--
-- 목표
-- - upvote 중복/남용 방지를 위해 anon 클라이언트가 직접 `feedbacks`를 UPDATE 하지 못하게 하고,
--   `votes`(feedback_votes) insert만 허용합니다.
-- - (중복 차단) unique 제약으로 동일 `user_identifier`의 동일 `feedback` 중복 투표를 거부합니다.
-- - (증분 반영) votes insert 시 트리거로 `feedbacks.upvotes`를 1 증가시킵니다.
--
-- 주의
-- - 이 파일은 "추후 적용"용 초안입니다. 현재 MVP는 front-only로 `feedbacks.upvotes`를 직접 업데이트합니다.
-- - 실제 적용 시에는:
--   1) votes 테이블/트리거/정책을 추가
--   2) `feedbacks`에 있던 anon UPDATE 정책을 제거/강화
--   3) 위젯 vote 로직을 `feedback_votes insert`로 전환
--   순서로 반영하세요.

-- =========================
-- 1) votes 테이블 (feedback_votes)
-- =========================

create table if not exists public.feedback_votes (
  project_id uuid not null references public.projects(id) on delete cascade,
  feedback_id uuid not null references public.feedbacks(id) on delete cascade,
  user_identifier text not null,
  created_at timestamptz not null default now(),

  -- 중복 투표 원천 차단
  -- (anon 클라이언트는 user_identifier를 임의로 보낼 수 있으나,
  -- 동일 device/user_identifier 기준으로는 근본 차단됩니다.)
  primary key (project_id, feedback_id, user_identifier)
);

alter table public.feedback_votes enable row level security;

create index if not exists feedback_votes_feedback_id_idx
  on public.feedback_votes(feedback_id);

create index if not exists feedback_votes_user_identifier_idx
  on public.feedback_votes(user_identifier);

-- =========================
-- 2) RLS 정책: Origin 기반 anon insert만 허용
-- =========================
--
-- front-only MVP와 동일하게 Origin(=요청 헤더 origin)과 projects.domain을 매칭합니다.

drop policy if exists "feedback_votes_insert_widget_by_origin" on public.feedback_votes;
create policy "feedback_votes_insert_widget_by_origin"
  on public.feedback_votes
  for insert
  to anon
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.domain = (current_setting('request.headers', true)::json->>'origin')
    )
    and user_identifier is not null
    and length(user_identifier) > 0
  );

-- (선택) 위젯이 자신이 투표했는지 확인해야 한다면 read 정책을 추가하세요.
-- 현재 MVP에서는 client-localstorage가 중복 차단을 담당합니다.
--
-- drop policy if exists "feedback_votes_select_widget_by_origin" on public.feedback_votes;
-- create policy "feedback_votes_select_widget_by_origin"
--   on public.feedback_votes for select
--   to anon
--   using (
--     exists (
--       select 1 from public.projects p
--       where p.id = project_id
--         and p.domain = (current_setting('request.headers', true)::json->>'origin')
--     )
--   );

-- =========================
-- 3) votes insert -> feedbacks upvotes increment 트리거
-- =========================
--
-- 핵심: anon이 직접 `feedbacks`를 UPDATE하지 않게 하기 위한 방안입니다.
-- votes insert만 허용하고, `feedbacks.upvotes` 증분은 트리거가 수행합니다.

create or replace function public.increment_feedback_upvotes()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.feedbacks
  set upvotes = upvotes + 1,
      updated_at = now()
  where id = new.feedback_id;

  return new;
end;
$$;

drop trigger if exists on_feedback_vote_insert on public.feedback_votes;
create trigger on_feedback_vote_insert
after insert on public.feedback_votes
for each row
execute function public.increment_feedback_upvotes();

-- =========================
-- 4) feedbacks UPDATE 정책 강화(추후 적용 시)
-- =========================
--
-- 현재 `supabase/sql/kkoknote_schema.sql`에는 anon의 `feedbacks` UPDATE를 허용하는 정책이 존재합니다.
-- 서버 측 강화 적용 시 아래 정책을 제거하고, anon이 직접 feedbacks를 update 못하게 해야 합니다.
--
-- 예시:
--   drop policy if exists "feedbacks_update_widget_by_origin" on public.feedbacks;
--
-- 그리고 authenticated(admin)의 status update 정책은 유지합니다.
-- upvotes 컬럼 변경은 오직 트리거로만 일어나도록 만드는 것이 안전합니다.

-- =========================
-- 5) (선택) rate limiting (서버 측)
-- =========================
--
-- 프론트에서 1분당 5회 제한을 하더라도,
-- 악의적 사용자는 프론트 우회가 가능하므로 서버 측 rate limiting을 권장합니다.
--
-- 방법(예시):
-- - private.rate_limits(ip/user_identifier, request_at) 테이블 + 정책/함수로 reject
-- - 또는 Postgres function을 만들어 RPC로 처리하도록 설계
--
-- 본 문서에서는 "design draft"이므로 실제 구현은 후속 마이그레이션으로 분리합니다.

