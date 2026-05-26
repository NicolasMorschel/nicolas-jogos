-- Applied in Supabase: prevent_duplicate_game_titles
-- Keeps the catalog from receiving duplicate games with the same title.

create unique index if not exists games_title_unique_idx
on public.games (lower(btrim(title)));

create or replace function public.admin_create_game(game_payload jsonb)
returns public.games
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  new_game public.games;
  clean_title text := btrim(game_payload->>'title');
  clean_franchise text := btrim(game_payload->>'franchise');
  clean_genre text := btrim(game_payload->>'genre');
  clean_description text := btrim(game_payload->>'description');
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Somente admin pode cadastrar jogos.';
  end if;

  if clean_title = '' then
    raise exception 'Preenche o título do jogo.';
  end if;

  if exists (
    select 1
    from public.games
    where lower(btrim(title)) = lower(clean_title)
  ) then
    raise exception 'Já existe um jogo com esse título.';
  end if;

  insert into public.games (
    title,
    franchise,
    genre,
    price,
    old_price,
    discount,
    featured,
    description,
    tags
  )
  values (
    clean_title,
    clean_franchise,
    clean_genre,
    (game_payload->>'price')::numeric,
    (game_payload->>'old_price')::numeric,
    coalesce((game_payload->>'discount')::int, 0),
    coalesce((game_payload->>'featured')::boolean, false),
    clean_description,
    coalesce(
      array(select btrim(jsonb_array_elements_text(game_payload->'tags'))),
      '{}'::text[]
    )
  )
  returning * into new_game;

  return new_game;
end;
$$;

-- Applied in Supabase: add_game_restrictions
-- Adds per-game moderation: warning, temporary ban and permanent ban.

create table if not exists public.game_restrictions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id bigint not null references public.games(id) on delete cascade,
  restriction_type text not null check (restriction_type in ('warning', 'temporary_ban', 'permanent_ban')),
  reason text not null default '',
  starts_at timestamptz not null default now(),
  expires_at timestamptz null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  revoked_by uuid null references public.profiles(id) on delete set null,
  revoked_reason text null,
  check (
    (restriction_type = 'temporary_ban' and expires_at is not null and expires_at > starts_at)
    or (restriction_type in ('warning', 'permanent_ban') and expires_at is null)
  )
);

create index if not exists game_restrictions_user_game_idx
on public.game_restrictions (user_id, game_id, created_at desc);

create index if not exists game_restrictions_active_lookup_idx
on public.game_restrictions (user_id, game_id, restriction_type, revoked_at, expires_at);

alter table public.game_restrictions enable row level security;

drop policy if exists "game restrictions select own or admin" on public.game_restrictions;
create policy "game restrictions select own or admin"
on public.game_restrictions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "game restrictions admin insert" on public.game_restrictions;
create policy "game restrictions admin insert"
on public.game_restrictions
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "game restrictions admin update" on public.game_restrictions;
create policy "game restrictions admin update"
on public.game_restrictions
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select, insert, update on public.game_restrictions to authenticated;
grant usage, select on sequence public.game_restrictions_id_seq to authenticated;

-- Applied in Supabase: add_social_profiles_and_reports
-- Adds profile bio/avatar, friend requests and user reports.

alter table public.profiles
add column if not exists avatar_url text not null default '',
add column if not exists bio text not null default '';

create table if not exists public.friendships (
  id bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unique_pair_idx
on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists public.user_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

alter table public.friendships enable row level security;
alter table public.user_reports enable row level security;

drop policy if exists "profiles social active read" on public.profiles;
create policy "profiles social active read"
on public.profiles
for select
to authenticated
using (status = 'active');

drop policy if exists "friendships select participant or admin" on public.friendships;
create policy "friendships select participant or admin"
on public.friendships
for select
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "friendships insert own request" on public.friendships;
create policy "friendships insert own request"
on public.friendships
for insert
to authenticated
with check (requester_id = auth.uid() and requester_id <> addressee_id and status = 'pending');

drop policy if exists "friendships update participant or admin" on public.friendships;
create policy "friendships update participant or admin"
on public.friendships
for update
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin(auth.uid()))
with check (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "reports select owner or admin" on public.user_reports;
create policy "reports select owner or admin"
on public.user_reports
for select
to authenticated
using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "reports insert own" on public.user_reports;
create policy "reports insert own"
on public.user_reports
for insert
to authenticated
with check (reporter_id = auth.uid() and reporter_id <> reported_user_id);

create or replace function public.update_own_profile(
  next_name text,
  next_bio text,
  next_avatar_url text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Precisa estar logado.';
  end if;

  update public.profiles
  set
    name = left(coalesce(btrim(next_name), ''), 80),
    bio = left(coalesce(btrim(next_bio), ''), 500),
    avatar_url = left(coalesce(btrim(next_avatar_url), ''), 1000)
  where id = auth.uid()
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Perfil não encontrado.';
  end if;

  return updated_profile;
end;
$$;

grant select on public.profiles to authenticated;
grant select, insert, update on public.friendships to authenticated;
grant select, insert on public.user_reports to authenticated;
grant usage, select on sequence public.friendships_id_seq to authenticated;
grant usage, select on sequence public.user_reports_id_seq to authenticated;
grant execute on function public.update_own_profile(text, text, text) to authenticated;

-- Applied in Supabase: add_profile_banner_play_stats_and_chat
-- Adds Steam-like profile banner, game play stats and friend chat.

alter table public.profiles
add column if not exists banner_url text not null default '';

create table if not exists public.game_play_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id bigint not null references public.games(id) on delete cascade,
  minutes_played integer not null default 0 check (minutes_played >= 0),
  launch_count integer not null default 0 check (launch_count >= 0),
  last_played_at timestamptz null,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists game_play_stats_user_minutes_idx
on public.game_play_stats (user_id, minutes_played desc, last_played_at desc);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz null,
  check (sender_id <> receiver_id),
  check (char_length(btrim(body)) between 1 and 1000)
);

create index if not exists chat_messages_conversation_idx
on public.chat_messages (least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at);

create index if not exists chat_messages_receiver_unread_idx
on public.chat_messages (receiver_id, read_at, created_at desc);

alter table public.game_play_stats enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "game play stats select own or admin" on public.game_play_stats;
create policy "game play stats select own or admin"
on public.game_play_stats
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "game play stats insert own" on public.game_play_stats;
create policy "game play stats insert own"
on public.game_play_stats
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "game play stats update own" on public.game_play_stats;
create policy "game play stats update own"
on public.game_play_stats
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "chat messages select participant" on public.chat_messages;
create policy "chat messages select participant"
on public.chat_messages
for select
to authenticated
using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "chat messages insert friends" on public.chat_messages;
create policy "chat messages insert friends"
on public.chat_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and sender_id <> receiver_id
  and exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = sender_id and f.addressee_id = receiver_id)
        or (f.requester_id = receiver_id and f.addressee_id = sender_id)
      )
  )
);

-- =========================
-- SOCIAL: CONVITES, VISIBILIDADE E EXCLUSOES
-- =========================

create extension if not exists pgcrypto;

alter table public.community_servers
  add column if not exists visibility text not null default 'private';

alter table public.community_servers
  add column if not exists invite_code text;

update public.community_servers
set invite_code = encode(gen_random_bytes(6), 'hex')
where invite_code is null or btrim(invite_code) = '';

alter table public.community_servers
  alter column invite_code set default encode(gen_random_bytes(6), 'hex');

alter table public.community_servers
  alter column invite_code set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'community_servers_visibility_check') then
    alter table public.community_servers
      add constraint community_servers_visibility_check
      check (visibility in ('private', 'public'));
  end if;
end $$;

create unique index if not exists community_servers_invite_code_key
on public.community_servers (invite_code);

create or replace function public.join_community_by_invite(invite text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  target_server_id bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id
    into target_server_id
  from public.community_servers
  where invite_code = btrim(invite)
     or (visibility = 'public' and id::text = btrim(invite))
  limit 1;

  if target_server_id is null then
    raise exception 'invalid invite';
  end if;

  insert into public.community_server_members (server_id, user_id)
  values (target_server_id, auth.uid())
  on conflict do nothing;

  return target_server_id;
end;
$$;

revoke execute on function public.join_community_by_invite(text) from public;
grant execute on function public.join_community_by_invite(text) to authenticated;

drop policy if exists "servers select member" on public.community_servers;
create policy "servers select member"
on public.community_servers
for select
to authenticated
using (
  visibility = 'public'
  or owner_id = auth.uid()
  or public.is_community_server_member(id, auth.uid())
  or public.is_admin(auth.uid())
);

drop policy if exists "server members insert owner" on public.community_server_members;
create policy "server members insert owner"
on public.community_server_members
for insert
to authenticated
with check (
  (user_id = auth.uid() and exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and s.visibility = 'public'
  ))
  or exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and (s.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists "servers delete owner" on public.community_servers;
create policy "servers delete owner"
on public.community_servers
for delete
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "channels select server member" on public.community_channels;
create policy "channels select server member"
on public.community_channels
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_community_server_member(server_id, auth.uid())
  or exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and s.visibility = 'public'
  )
);

drop policy if exists "channels update server owner" on public.community_channels;
create policy "channels update server owner"
on public.community_channels
for update
to authenticated
using (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and (s.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
)
with check (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and (s.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists "channels delete server owner" on public.community_channels;
create policy "channels delete server owner"
on public.community_channels
for delete
to authenticated
using (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and (s.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists "roles delete server owner" on public.community_roles;
create policy "roles delete server owner"
on public.community_roles
for delete
to authenticated
using (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and (s.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists "member roles delete server owner" on public.community_member_roles;
create policy "member roles delete server owner"
on public.community_member_roles
for delete
to authenticated
using (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and (s.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists "chat messages delete allowed" on public.chat_messages;
create policy "chat messages delete allowed"
on public.chat_messages
for delete
to authenticated
using (
  sender_id = auth.uid()
  or public.is_admin(auth.uid())
  or (
    conversation_type = 'server_channel'
    and exists (
      select 1
      from public.community_channels c
      join public.community_servers s on s.id = c.server_id
      where c.id = server_channel_id
        and s.owner_id = auth.uid()
    )
  )
  or (
    conversation_type = 'group'
    and exists (
      select 1
      from public.chat_groups g
      where g.id = group_id
        and g.owner_id = auth.uid()
    )
  )
);

grant all on public.community_servers to authenticated;
grant all on public.community_channels to authenticated;
grant all on public.community_roles to authenticated;
grant all on public.community_member_roles to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;

drop policy if exists "chat messages receiver mark read" on public.chat_messages;
create policy "chat messages receiver mark read"
on public.chat_messages
for update
to authenticated
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());

create or replace function public.update_own_profile(
  next_name text,
  next_bio text,
  next_avatar_url text,
  next_banner_url text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Precisa estar logado.';
  end if;

  update public.profiles
  set
    name = left(coalesce(btrim(next_name), ''), 80),
    bio = left(coalesce(btrim(next_bio), ''), 500),
    avatar_url = left(coalesce(btrim(next_avatar_url), ''), 1000),
    banner_url = left(coalesce(btrim(next_banner_url), ''), 1000)
  where id = auth.uid()
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Perfil não encontrado.';
  end if;

  return updated_profile;
end;
$$;

grant select on public.profiles to authenticated;
grant select, insert, update on public.game_play_stats to authenticated;
grant select, insert, update on public.chat_messages to authenticated;
grant usage, select on sequence public.chat_messages_id_seq to authenticated;
grant execute on function public.update_own_profile(text, text, text, text) to authenticated;

-- =========================
-- SOCIAL HUB: CHAT, GRUPOS, COMUNIDADES E MIDIA
-- =========================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', true, 52428800, array['image/*', 'video/*', 'audio/*'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat media public read" on storage.objects;

drop policy if exists "chat media upload own folder" on storage.objects;
create policy "chat media upload own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "chat media update own folder" on storage.objects;
create policy "chat media update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "chat media delete own folder" on storage.objects;
create policy "chat media delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create table if not exists public.chat_groups (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_group_members (
  group_id bigint not null references public.chat_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.community_servers (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.community_server_members (
  server_id bigint not null references public.community_servers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (server_id, user_id)
);

create table if not exists public.community_roles (
  id bigint generated always as identity primary key,
  server_id bigint not null references public.community_servers(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  color text not null default '#7aa2ff',
  position int not null default 1,
  can_manage_server boolean not null default false,
  can_manage_channels boolean not null default false,
  can_manage_roles boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_member_roles (
  server_id bigint not null references public.community_servers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id bigint not null references public.community_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (server_id, user_id, role_id)
);

create table if not exists public.community_channels (
  id bigint generated always as identity primary key,
  server_id bigint not null references public.community_servers(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  channel_type text not null default 'text' check (channel_type in ('text', 'voice')),
  position int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.community_voice_presence (
  channel_id bigint not null references public.community_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

alter table public.chat_messages alter column receiver_id drop not null;
alter table public.chat_messages add column if not exists conversation_type text not null default 'direct';
alter table public.chat_messages add column if not exists group_id bigint references public.chat_groups(id) on delete cascade;
alter table public.chat_messages add column if not exists server_channel_id bigint references public.community_channels(id) on delete cascade;
alter table public.chat_messages add column if not exists attachment_url text not null default '';
alter table public.chat_messages add column if not exists attachment_type text not null default 'none';
alter table public.chat_messages add column if not exists attachment_name text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chat_messages_conversation_type_check') then
    alter table public.chat_messages
    add constraint chat_messages_conversation_type_check
    check (conversation_type in ('direct', 'group', 'server_channel'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'chat_messages_attachment_type_check') then
    alter table public.chat_messages
    add constraint chat_messages_attachment_type_check
    check (attachment_type in ('none', 'image', 'video', 'audio', 'file'));
  end if;
end $$;

create index if not exists chat_groups_owner_idx on public.chat_groups (owner_id, created_at desc);
create index if not exists chat_group_members_user_idx on public.chat_group_members (user_id, group_id);
create index if not exists community_server_members_user_idx on public.community_server_members (user_id, server_id);
create index if not exists community_channels_server_idx on public.community_channels (server_id, position, id);
create index if not exists chat_messages_group_idx on public.chat_messages (group_id, created_at);
create index if not exists chat_messages_channel_idx on public.chat_messages (server_channel_id, created_at);

create or replace function public.is_chat_group_member(group_id_input bigint, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_group_members cgm
    where cgm.group_id = group_id_input
      and cgm.user_id = uid
  );
$$;

create or replace function public.is_community_server_member(server_id_input bigint, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_server_members csm
    where csm.server_id = server_id_input
      and csm.user_id = uid
  );
$$;

revoke execute on function public.is_chat_group_member(bigint, uuid) from public;
revoke execute on function public.is_community_server_member(bigint, uuid) from public;
grant execute on function public.is_chat_group_member(bigint, uuid) to authenticated;
grant execute on function public.is_community_server_member(bigint, uuid) to authenticated;

alter table public.chat_groups enable row level security;
alter table public.chat_group_members enable row level security;
alter table public.community_servers enable row level security;
alter table public.community_server_members enable row level security;
alter table public.community_roles enable row level security;
alter table public.community_member_roles enable row level security;
alter table public.community_channels enable row level security;
alter table public.community_voice_presence enable row level security;

grant all on public.chat_groups to authenticated;
grant all on public.chat_group_members to authenticated;
grant all on public.community_servers to authenticated;
grant all on public.community_server_members to authenticated;
grant all on public.community_roles to authenticated;
grant all on public.community_member_roles to authenticated;
grant all on public.community_channels to authenticated;
grant all on public.community_voice_presence to authenticated;
grant usage, select on sequence public.chat_groups_id_seq to authenticated;
grant usage, select on sequence public.community_servers_id_seq to authenticated;
grant usage, select on sequence public.community_roles_id_seq to authenticated;
grant usage, select on sequence public.community_channels_id_seq to authenticated;

drop policy if exists "chat groups select member" on public.chat_groups;
create policy "chat groups select member"
on public.chat_groups
for select
to authenticated
using (owner_id = auth.uid() or public.is_chat_group_member(id, auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "chat groups insert owner" on public.chat_groups;
create policy "chat groups insert owner"
on public.chat_groups
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "chat groups update owner" on public.chat_groups;
create policy "chat groups update owner"
on public.chat_groups
for update
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "chat group members select member" on public.chat_group_members;
create policy "chat group members select member"
on public.chat_group_members
for select
to authenticated
using (user_id = auth.uid() or public.is_chat_group_member(group_id, auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "chat group members insert owner" on public.chat_group_members;
create policy "chat group members insert owner"
on public.chat_group_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.chat_groups g
    where g.id = group_id
      and g.owner_id = auth.uid()
  )
);

drop policy if exists "servers select member" on public.community_servers;
create policy "servers select member"
on public.community_servers
for select
to authenticated
using (owner_id = auth.uid() or public.is_community_server_member(id, auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "servers insert owner" on public.community_servers;
create policy "servers insert owner"
on public.community_servers
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "servers update owner" on public.community_servers;
create policy "servers update owner"
on public.community_servers
for update
to authenticated
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "server members select member" on public.community_server_members;
create policy "server members select member"
on public.community_server_members
for select
to authenticated
using (user_id = auth.uid() or public.is_community_server_member(server_id, auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "server members insert owner" on public.community_server_members;
create policy "server members insert owner"
on public.community_server_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "roles select server member" on public.community_roles;
create policy "roles select server member"
on public.community_roles
for select
to authenticated
using (public.is_community_server_member(server_id, auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "roles insert server owner" on public.community_roles;
create policy "roles insert server owner"
on public.community_roles
for insert
to authenticated
with check (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "roles update server owner" on public.community_roles;
create policy "roles update server owner"
on public.community_roles
for update
to authenticated
using (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "member roles select server member" on public.community_member_roles;
create policy "member roles select server member"
on public.community_member_roles
for select
to authenticated
using (public.is_community_server_member(server_id, auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "member roles insert server owner" on public.community_member_roles;
create policy "member roles insert server owner"
on public.community_member_roles
for insert
to authenticated
with check (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "channels select server member" on public.community_channels;
create policy "channels select server member"
on public.community_channels
for select
to authenticated
using (public.is_community_server_member(server_id, auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "channels insert server owner" on public.community_channels;
create policy "channels insert server owner"
on public.community_channels
for insert
to authenticated
with check (
  exists (
    select 1 from public.community_servers s
    where s.id = server_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "voice presence select server member" on public.community_voice_presence;
create policy "voice presence select server member"
on public.community_voice_presence
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.community_channels c
    where c.id = channel_id
      and public.is_community_server_member(c.server_id, auth.uid())
  )
);

drop policy if exists "voice presence insert self" on public.community_voice_presence;
create policy "voice presence insert self"
on public.community_voice_presence
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.community_channels c
    where c.id = channel_id
      and public.is_community_server_member(c.server_id, auth.uid())
  )
);

drop policy if exists "voice presence delete self" on public.community_voice_presence;
create policy "voice presence delete self"
on public.community_voice_presence
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "chat messages select participant" on public.chat_messages;
create policy "chat messages select participant"
on public.chat_messages
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    conversation_type = 'direct'
    and (sender_id = auth.uid() or receiver_id = auth.uid())
  )
  or (
    conversation_type = 'group'
    and public.is_chat_group_member(group_id, auth.uid())
  )
  or (
    conversation_type = 'server_channel'
    and exists (
      select 1
      from public.community_channels c
      where c.id = server_channel_id
        and public.is_community_server_member(c.server_id, auth.uid())
    )
  )
);

drop policy if exists "chat messages insert friends" on public.chat_messages;
create policy "chat messages insert friends"
on public.chat_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and (
    (
      conversation_type = 'direct'
      and receiver_id is not null
      and sender_id <> receiver_id
      and group_id is null
      and server_channel_id is null
      and exists (
        select 1
        from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = sender_id and f.addressee_id = receiver_id)
            or (f.requester_id = receiver_id and f.addressee_id = sender_id)
          )
      )
    )
    or (
      conversation_type = 'group'
      and group_id is not null
      and receiver_id is null
      and server_channel_id is null
      and public.is_chat_group_member(group_id, auth.uid())
    )
    or (
      conversation_type = 'server_channel'
      and server_channel_id is not null
      and receiver_id is null
      and group_id is null
      and exists (
        select 1
        from public.community_channels c
        where c.id = server_channel_id
          and public.is_community_server_member(c.server_id, auth.uid())
      )
    )
  )
);
