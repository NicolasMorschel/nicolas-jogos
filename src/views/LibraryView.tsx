import type { CSSProperties, ReactNode } from 'react';
import type { Game, GamePlayStats, GameRestriction, LibraryDisplayMode } from '../types';
import { activeBanForGame, activeWarningsForGame, restrictionStatusText, restrictionTypeLabel } from '../domain/restrictions';
import { coverStyle, formatPlayTime, formatShortDate } from '../utils';

export function LibraryView({ games, profileName, isAdmin, isBlocked, gameRestrictions, playStats, mode, setMode, onStore, onPlayGame, onBlockedPlay }: {
  games: Game[];
  profileName?: string;
  isAdmin: boolean;
  isBlocked: boolean;
  gameRestrictions: GameRestriction[];
  playStats: GamePlayStats[];
  mode: LibraryDisplayMode;
  setMode: (mode: LibraryDisplayMode) => void;
  onStore: () => void;
  onPlayGame: (gameId: number) => void;
  onBlockedPlay: (message?: string) => void;
}) {
  const sortedGames = [...games].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  const playStatsByGame = new Map(playStats.map(stats => [Number(stats.game_id), stats]));
  let content: ReactNode = <EmptyLibraryMessage>Faz login para abrir tua biblioteca.</EmptyLibraryMessage>;
  if (profileName && isAdmin) {
    content = <EmptyLibraryMessage>Administrador não possui biblioteca de compra. Usa a área Admin para gerir bibliotecas dos usuários.</EmptyLibraryMessage>;
  }
  if (profileName && !isAdmin && !games.length) {
    content = <EmptyLibraryMessage>Ainda não tem jogos na tua biblioteca.</EmptyLibraryMessage>;
  }
  if (profileName && !isAdmin && sortedGames.length) {
    content = mode === 'cards'
      ? sortedGames.map(game => (
        <div className="col" key={game.id}>
          <LibraryGameCard game={game} playStats={playStatsByGame.get(game.id)} isBlocked={isBlocked} restrictions={gameRestrictions} onPlayGame={onPlayGame} onBlockedPlay={onBlockedPlay} />
        </div>
      ))
      : <LibraryTable games={sortedGames} playStatsByGame={playStatsByGame} isBlocked={isBlocked} restrictions={gameRestrictions} onPlayGame={onPlayGame} onBlockedPlay={onBlockedPlay} />;
  }

  return (
    <section className="view active">
      <div className="container-xxl page-shell">
        <div className="page-header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3">
          <div>
            <span className="kicker">Área do usuário</span>
            <h1>Biblioteca</h1>
            <p>Jogos comprados em ordem alfabética, com visual em cards ou tabela.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <div className="library-mode-toggle" role="group" aria-label="Modo da biblioteca">
              <button className={`btn ${mode === 'cards' ? 'active' : ''}`} onClick={() => setMode('cards')}>Cards</button>
              <button className={`btn ${mode === 'table' ? 'active' : ''}`} onClick={() => setMode('table')}>Tabela</button>
            </div>
            <button className="btn ghost-btn" onClick={onStore}>Voltar para loja</button>
          </div>
        </div>
        <div className="page-panel library-panel">
          {mode === 'cards' ? <div className="library-grid row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">{content}</div> : content}
        </div>
      </div>
    </section>
  );
}

function libraryBlockState(game: Game, isBlocked: boolean, restrictions: GameRestriction[]) {
  const activeBan = activeBanForGame(restrictions, game.id);
  const warnings = activeWarningsForGame(restrictions, game.id);
  const playBlocked = isBlocked || !!activeBan;
  const blockedLabel = isBlocked ? 'Conta bloqueada' : 'Jogo bloqueado';
  const blockedMessage = activeBan
    ? `${restrictionTypeLabel(activeBan.restriction_type)} neste jogo: ${restrictionStatusText(activeBan)}.`
    : 'Conta bloqueada. Você pode comprar jogos, mas não pode jogar agora.';

  return { activeBan, warnings, playBlocked, blockedLabel, blockedMessage };
}

function LibraryGameCard({ game, playStats, isBlocked, restrictions, onPlayGame, onBlockedPlay }: {
  game: Game;
  playStats?: GamePlayStats;
  isBlocked: boolean;
  restrictions: GameRestriction[];
  onPlayGame: (gameId: number) => void;
  onBlockedPlay: (message?: string) => void;
}) {
  const { activeBan, warnings, playBlocked, blockedLabel, blockedMessage } = libraryBlockState(game, isBlocked, restrictions);

  return (
    <article className="library-card h-100">
      <div className="library-cover" style={{ '--cover': coverStyle(game.franchise) } as CSSProperties} />
      <div className="library-body">
        <h3>{game.title}</h3>
        <p>{game.description}</p>
        {warnings.length > 0 && !activeBan && <p className="warning-play-note">Aviso ativo neste jogo: se repetir, pode virar ban.</p>}
        {isBlocked && <p className="blocked-play-note">Conta bloqueada: compra liberada, jogo bloqueado.</p>}
        {activeBan && (
          <p className="blocked-play-note">
            {restrictionTypeLabel(activeBan.restriction_type)}: {restrictionStatusText(activeBan)}.
            {activeBan.reason ? ` Motivo: ${activeBan.reason}` : ''}
          </p>
        )}
        <div className="library-play-meta">
          <span>{formatPlayTime(playStats?.minutes_played || 0)}</span>
          <span>{formatShortDate(playStats?.last_played_at)}</span>
        </div>
        <button className={`btn ${playBlocked ? 'ghost-btn' : 'primary-btn'} full`} onClick={playBlocked ? () => onBlockedPlay(blockedMessage) : () => onPlayGame(game.id)}>
          {playBlocked ? blockedLabel : 'Jogar'}
        </button>
      </div>
    </article>
  );
}

function LibraryTable({ games, playStatsByGame, isBlocked, restrictions, onPlayGame, onBlockedPlay }: {
  games: Game[];
  playStatsByGame: Map<number, GamePlayStats>;
  isBlocked: boolean;
  restrictions: GameRestriction[];
  onPlayGame: (gameId: number) => void;
  onBlockedPlay: (message?: string) => void;
}) {
  return (
    <div className="library-table-wrap">
      <table className="table align-middle mb-0 library-table">
        <thead>
          <tr>
            <th>Jogo</th>
            <th>Franquia</th>
            <th>Gênero</th>
            <th>Tempo</th>
            <th>Última vez</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => {
            const { activeBan, warnings, playBlocked, blockedLabel, blockedMessage } = libraryBlockState(game, isBlocked, restrictions);
            const status = activeBan ? restrictionTypeLabel(activeBan.restriction_type) : warnings.length ? 'Com aviso' : 'Liberado';
            const stats = playStatsByGame.get(game.id);

            return (
              <tr key={game.id}>
                <td><strong>{game.title}</strong><div className="admin-user-meta">{game.description}</div></td>
                <td>{game.franchise}</td>
                <td>{String(game.genre).replace('-', ' ')}</td>
                <td>{formatPlayTime(stats?.minutes_played || 0)}</td>
                <td>{formatShortDate(stats?.last_played_at)}</td>
                <td><span className={`library-status ${playBlocked ? 'blocked' : warnings.length ? 'warning' : 'ready'}`}>{status}</span></td>
                <td>
                  <button className={`btn ${playBlocked ? 'ghost-btn' : 'primary-btn'}`} onClick={playBlocked ? () => onBlockedPlay(blockedMessage) : () => onPlayGame(game.id)}>
                    {playBlocked ? blockedLabel : 'Jogar'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyLibraryMessage({ children }: { children: ReactNode }) {
  return (
    <div className="col-12">
      <div className="page-panel">{children}</div>
    </div>
  );
}
