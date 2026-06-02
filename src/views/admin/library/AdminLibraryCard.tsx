import type { Game, GameRestriction, LibraryItem } from '../../../types';
import { activeBanForGame, activeWarningsForGame, restrictionStatusText, restrictionTypeLabel } from '../../../domain/restrictions';

export function AdminLibraryCard({ item, game, restrictions, selectedRestrictionGameId, onSelectModerationGame, onRemoveGame }: {
  item: LibraryItem;
  game: Game;
  restrictions: GameRestriction[];
  selectedRestrictionGameId: string;
  onSelectModerationGame: (game: Game) => void;
  onRemoveGame: (gameId: number) => void;
}) {
  const activeBan = activeBanForGame(restrictions, game.id);
  const warnings = activeWarningsForGame(restrictions, game.id);
  const selectedForModeration = Number(selectedRestrictionGameId) === Number(game.id);

  return (
    <div
      className={`card admin-lib-item admin-lib-item-selectable row g-3 align-items-center ${selectedForModeration ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelectModerationGame(game)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectModerationGame(game);
        }
      }}
    >
      <div className="col-12 col-md">
        <strong>{game.title}</strong>
        <div className="admin-user-meta">{game.franchise} • {item.source === 'admin_grant' ? 'Adicionado por admin' : 'Comprado'}</div>
        {(activeBan || warnings.length > 0) && (
          <div className="restriction-inline-list">
            {activeBan && <span className="restriction-pill ban">{restrictionTypeLabel(activeBan.restriction_type)} • {restrictionStatusText(activeBan)}</span>}
            {warnings.map(warning => <span className="restriction-pill warning" key={warning.id}>Aviso ativo</span>)}
          </div>
        )}
      </div>
      <div className="col-12 col-md-auto">
        <div className="admin-item-actions d-grid d-sm-flex justify-content-sm-end">
          <span className="admin-user-meta admin-select-hint">{selectedForModeration ? 'Selecionado' : 'Clique para punir'}</span>
          {item.source === 'admin_grant'
            ? <button className="btn btn-outline-light" type="button" onClick={event => {
              event.stopPropagation();
              onRemoveGame(game.id);
            }}>Remover</button>
            : <span className="admin-user-meta">Comprado: não removível</span>}
        </div>
      </div>
    </div>
  );
}
