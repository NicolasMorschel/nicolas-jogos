import type { CSSProperties } from 'react';
import type { Game, GamePlayStats, GameRestriction, ProfileComment, PublicProfile } from '../../types';
import { restrictionStatusText, restrictionTypeLabel } from '../../domain/restrictions';
import { coverStyle, formatPlayTime, formatShortDate, genreLabel } from '../../utils';
import { ProfileAvatar } from './ProfileAvatar';

export function ProfileOverviewPanel({ playedGames, totalMinutes, onOpenGame }: {
  playedGames: Array<{ game: Game; stats?: GamePlayStats }>;
  totalMinutes: number;
  onOpenGame: (gameId: number) => void;
}) {
  const recentGames = playedGames
    .filter(({ stats }) => stats?.last_played_at)
    .slice(0, 6);
  const topGame = recentGames[0] || playedGames[0];

  return (
    <section className="card page-panel profile-showcase">
      <span className="kicker">Jogos recentes</span>
      <h2>{topGame ? topGame.game.title : 'Nada jogado ainda'}</h2>
      <p>{topGame ? `Atividade recente e tempo registrado. Total geral: ${formatPlayTime(totalMinutes)}.` : 'Quando voce clicar em Jogar na biblioteca, o perfil registra tempo e sessoes.'}</p>
      <PlayedGameList games={recentGames.length ? recentGames : playedGames.slice(0, 6)} onOpenGame={onOpenGame} />
    </section>
  );
}

export function ProfileCollectionPanel({ title, subtitle, games, onOpenGame }: {
  title: string;
  subtitle: string;
  games: Game[];
  onOpenGame: (gameId: number) => void;
}) {
  return (
    <section className="card page-panel profile-card">
      <span className="kicker">{title}</span>
      <h2>{title}</h2>
      <p className="muted-note">{subtitle}</p>
      <div className="profile-library-grid">
        {games.map(game => (
          <button className="profile-library-card" key={game.id} type="button" onClick={() => onOpenGame(game.id)}>
            <div style={{ '--cover': coverStyle(game.franchise) } as CSSProperties} />
            <strong>{game.title}</strong>
            <span>{game.franchise} • {genreLabel(game.genre)}</span>
          </button>
        ))}
        {!games.length && <div className="admin-empty-state">Nada para mostrar aqui ainda.</div>}
      </div>
    </section>
  );
}

export function ProfileFriendsPanel({ friends, onOpenProfile }: {
  friends: PublicProfile[];
  onOpenProfile: (profileId: string) => void;
}) {
  return (
    <section className="card page-panel profile-card">
      <span className="kicker">Amigos</span>
      <h2>Lista de amigos</h2>
      <div className="profile-friends-grid">
        {friends.map(friend => (
          <button className="profile-friend-card" key={friend.id} type="button" onClick={() => onOpenProfile(friend.id)}>
            <ProfileAvatar profile={friend} small />
            <span>
              <strong>{friend.name || 'Usuario'}</strong>
              <small>{friend.bio || 'Sem bio'}</small>
            </span>
          </button>
        ))}
        {!friends.length && <div className="admin-empty-state">Nenhum amigo ainda.</div>}
      </div>
    </section>
  );
}

export function ProfileRestrictionsPanel({ restrictions, gamesById }: {
  restrictions: GameRestriction[];
  gamesById: Map<number, Game>;
}) {
  return (
    <section className="card page-panel profile-card">
      <span className="kicker">Moderacao</span>
      <h2>Restricoes no seu perfil</h2>
      <p className="muted-note">Avisos e bans ativos aparecem aqui para voce saber exatamente o que esta acontecendo.</p>
      <div className="d-grid gap-2">
        {restrictions.map(restriction => (
          <article className="profile-restriction-card" key={restriction.id}>
            <div>
              <strong>{gamesById.get(Number(restriction.game_id))?.title || 'Jogo removido'}</strong>
              <span>{restrictionTypeLabel(restriction.restriction_type)} • {restrictionStatusText(restriction)}</span>
            </div>
            <p>{restriction.reason || 'Sem motivo informado.'}</p>
          </article>
        ))}
        {!restrictions.length && <div className="admin-empty-state">Nenhuma restricao ativa no momento.</div>}
      </div>
    </section>
  );
}

export function ProfileCommentsPanel({ comments, commentText, profileById, currentUserId, onCommentTextChange, onSubmit, onDelete }: {
  comments: ProfileComment[];
  commentText: string;
  profileById: Map<string, PublicProfile>;
  currentUserId: string;
  onCommentTextChange: (value: string) => void;
  onSubmit: () => void;
  onDelete: (commentId: number) => void;
}) {
  return (
    <section className="card page-panel profile-card">
      <span className="kicker">Comentarios</span>
      <h2>Recados no perfil</h2>
      <div className="profile-comment-form">
        <textarea className="form-control input" value={commentText} onChange={event => onCommentTextChange(event.target.value)} placeholder="Escreva um comentario no perfil..." maxLength={500} />
        <button className="btn btn-primary" type="button" onClick={onSubmit}>Comentar</button>
      </div>
      <div className="profile-comments-list">
        {comments.map(comment => {
          const author = profileById.get(comment.author_id);
          return (
            <article className="profile-comment" key={comment.id}>
              <ProfileAvatar profile={author || { name: 'Usuario', avatar_url: '' }} small />
              <div>
                <strong>{author?.name || 'Usuario'}</strong>
                <p>{comment.body}</p>
                <time>{formatShortDate(comment.created_at)}</time>
              </div>
              {comment.author_id === currentUserId && <button className="btn btn-sm btn-outline-light" type="button" onClick={() => onDelete(comment.id)}>Excluir</button>}
            </article>
          );
        })}
        {!comments.length && <div className="admin-empty-state">Nenhum comentario ainda.</div>}
      </div>
    </section>
  );
}

function PlayedGameList({ games, onOpenGame }: {
  games: Array<{ game: Game; stats?: GamePlayStats }>;
  onOpenGame: (gameId: number) => void;
}) {
  return (
    <div className="played-games-list">
      {games.map(({ game, stats }) => (
        <button className="played-game-row clickable-row" key={game.id} type="button" onClick={() => onOpenGame(game.id)}>
          <div className="played-game-cover" style={{ '--cover': coverStyle(game.franchise) } as CSSProperties} />
          <div>
            <strong>{game.title}</strong>
            <span>{genreLabel(game.genre)} • {formatShortDate(stats?.last_played_at)}</span>
          </div>
          <b>{formatPlayTime(stats?.minutes_played || 0)}</b>
        </button>
      ))}
      {!games.length && <div className="admin-empty-state">Nada jogado ainda.</div>}
    </div>
  );
}
