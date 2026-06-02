import type { AdminUser, Game, GameRestriction, LibraryItem } from '../../../types';
import { AdminLibraryCard } from './AdminLibraryCard';
import { AdminLibraryTable } from './AdminLibraryTable';

export function SelectedUserPanel({ user, currentUserId, items, games, restrictions, selectedRestrictionGameId, mode, setMode, onSelectModerationGame, onToggleStatus, onToggleRole, onRemoveGame }: {
  user: AdminUser;
  currentUserId: string;
  items: LibraryItem[];
  games: Game[];
  restrictions: GameRestriction[];
  selectedRestrictionGameId: string;
  mode: 'cards' | 'table';
  setMode: (mode: 'cards' | 'table') => void;
  onSelectModerationGame: (game: Game) => void;
  onToggleStatus: () => void;
  onToggleRole: () => void;
  onRemoveGame: (gameId: number) => void;
}) {
  const rows = items
    .map(item => ({ item, game: games.find(game => Number(game.id) === Number(item.game_id)) }))
    .filter(row => row.game)
    .sort((a, b) => a.game!.title.localeCompare(b.game!.title, 'pt-BR')) as Array<{ item: LibraryItem; game: Game }>;

  return (
    <>
      <div className="card selected-user-box">
        <strong>{user.name || 'Sem nome'}</strong><br />
        <span className="admin-user-meta">{user.email} • {user.role === 'admin' ? 'Conta administrativa' : 'Usuário comum'}</span>
        <div className="selected-user-grid row row-cols-1 row-cols-sm-3 g-2">
          <div className="col"><div className="selected-user-stat h-100"><span>Tipo da conta</span><strong>{user.role === 'admin' ? 'Admin' : 'Usuário'}</strong></div></div>
          <div className="col"><div className="selected-user-stat h-100"><span>Total de jogos</span><strong>{user.library_count || 0}</strong></div></div>
          <div className="col"><div className="selected-user-stat h-100"><span>Status</span><strong>{user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}</strong></div></div>
        </div>
        <div className="selected-user-actions">
          {user.role === 'user'
            ? <button className="btn btn-outline-light" type="button" onClick={onToggleStatus}>{user.status === 'blocked' ? 'Reativar conta' : 'Bloquear conta'}</button>
            : <span className="admin-user-meta">Conta administrativa protegida contra bloqueio.</span>}
          {user.id === currentUserId
            ? <span className="admin-user-meta">Você não pode alterar o próprio tipo de conta.</span>
            : <button className="btn btn-primary" type="button" onClick={onToggleRole}>{user.role === 'admin' ? 'Rebaixar para usuário' : 'Promover para admin'}</button>}
        </div>
      </div>

      <div className="admin-library-mode-row">
        <span className="admin-user-meta">Biblioteca em ordem alfabética</span>
        <div className="btn-group library-mode-toggle" role="group" aria-label="Modo da biblioteca do usuário">
          <button className={`btn ${mode === 'cards' ? 'btn-primary' : 'btn-outline-light'}`} type="button" onClick={() => setMode('cards')}>Cards</button>
          <button className={`btn ${mode === 'table' ? 'btn-primary' : 'btn-outline-light'}`} type="button" onClick={() => setMode('table')}>Tabela</button>
        </div>
      </div>

      {mode === 'cards' ? (
        <div className="admin-library-list">
          {rows.length ? rows.map(row => (
            <AdminLibraryCard
              key={row.item.game_id}
              item={row.item}
              game={row.game}
              restrictions={restrictions}
              selectedRestrictionGameId={selectedRestrictionGameId}
              onSelectModerationGame={onSelectModerationGame}
              onRemoveGame={onRemoveGame}
            />
          )) : <div className="card admin-lib-item">Nenhum jogo nessa conta.</div>}
        </div>
      ) : (
        <AdminLibraryTable
          rows={rows}
          restrictions={restrictions}
          selectedRestrictionGameId={selectedRestrictionGameId}
          onSelectModerationGame={onSelectModerationGame}
          onRemoveGame={onRemoveGame}
        />
      )}
    </>
  );
}
