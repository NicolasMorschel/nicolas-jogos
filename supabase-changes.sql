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
