import type { Game, GameRestriction, LibraryItem } from '../../../types';
import { activeBanForGame, activeWarningsForGame, restrictionTypeLabel } from '../../../domain/restrictions';

export function AdminLibraryTable({ rows, restrictions, selectedRestrictionGameId, onSelectModerationGame, onRemoveGame }: {
  rows: Array<{ item: LibraryItem; game: Game }>;
  restrictions: GameRestriction[];
  selectedRestrictionGameId: string;
  onSelectModerationGame: (game: Game) => void;
  onRemoveGame: (gameId: number) => void;
}) {
  return (
    <div className="admin-table-wrap admin-library-table-wrap">
      <table className="table align-middle mb-0 admin-users-table-desktop">
        <thead>
          <tr>
            <th>Jogo</th>
            <th>Franquia</th>
            <th>Origem</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map(({ item, game }) => {
            const activeBan = activeBanForGame(restrictions, game.id);
            const warnings = activeWarningsForGame(restrictions, game.id);
            const selected = Number(selectedRestrictionGameId) === Number(game.id);
            const status = activeBan ? restrictionTypeLabel(activeBan.restriction_type) : warnings.length ? 'Aviso ativo' : 'Sem restrição';

            return (
              <tr key={item.game_id} className={selected ? 'active' : ''} onClick={() => onSelectModerationGame(game)}>
                <td><strong>{game.title}</strong><div className="admin-user-meta">{String(game.genre).replace('-', ' ')}</div></td>
                <td>{game.franchise}</td>
                <td>{item.source === 'admin_grant' ? 'Admin' : 'Compra'}</td>
                <td>{status}</td>
                <td className="admin-cell-actions">
                  {item.source === 'admin_grant'
                    ? <button className="btn btn-outline-light" type="button" onClick={event => {
                      event.stopPropagation();
                      onRemoveGame(game.id);
                    }}>Remover</button>
                    : <span className="admin-user-meta">Não removível</span>}
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={5} className="admin-empty-state">Nenhum jogo nessa conta.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
