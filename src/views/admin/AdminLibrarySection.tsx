import { useRef, type RefObject } from 'react';
import type { AdminUser, Game, GameRestriction, GameRestrictionForm, LibraryItem } from '../../types';
import { FormSelect, FormTextarea } from '../../components/forms';
import {
  activeBanForGame,
  activeWarningsForGame,
  isRestrictionActive,
  restrictionDurationLabel,
  restrictionStatusText,
  restrictionTypeLabel
} from '../../domain/restrictions';
import type { AdminViewProps } from './types';

export function AdminLibrarySection(props: Pick<
  AdminViewProps,
  | 'selectedUser'
  | 'currentUserId'
  | 'adminLibraryItems'
  | 'adminGameRestrictions'
  | 'adminLibraryMode'
  | 'setAdminLibraryMode'
  | 'games'
  | 'setAdminTab'
  | 'onToggleStatus'
  | 'onToggleRole'
  | 'onRemoveGame'
  | 'addGameId'
  | 'setAddGameId'
  | 'onAddGame'
  | 'restrictionForm'
  | 'setRestrictionForm'
  | 'onApplyGameRestriction'
  | 'onRevokeGameRestriction'
>) {
  const moderationPanelRef = useRef<HTMLDivElement>(null);

  const updateRestrictionForm = (next: Partial<GameRestrictionForm>) => {
    props.setRestrictionForm(current => ({ ...current, ...next }));
  };
  const selectGameForModeration = (game: Game) => {
    updateRestrictionForm({ gameId: String(game.id) });
    window.setTimeout(() => {
      moderationPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <section className="page-panel admin-card">
      <div className="admin-card-head">
        <div>
          <span className="kicker">Biblioteca</span>
          <h3>Gestão do usuário selecionado</h3>
        </div>
      </div>

      {!props.selectedUser ? (
        <div className="selected-user-box admin-empty-selection">
          <strong>Nenhum usuário selecionado</strong>
          <p>Abre a aba Usuários e escolhe uma conta para liberar jogos, bloquear conta ou aplicar ban por jogo.</p>
          <button className="btn primary-btn" type="button" onClick={() => props.setAdminTab('users')}>
            Escolher usuário
          </button>
        </div>
      ) : (
        <>
          <SelectedUserPanel
            user={props.selectedUser}
            currentUserId={props.currentUserId}
            items={props.adminLibraryItems}
            games={props.games}
            restrictions={props.adminGameRestrictions}
            selectedRestrictionGameId={props.restrictionForm.gameId}
            mode={props.adminLibraryMode}
            setMode={props.setAdminLibraryMode}
            onSelectModerationGame={selectGameForModeration}
            onToggleStatus={() => props.onToggleStatus(props.selectedUser!)}
            onToggleRole={() => props.onToggleRole(props.selectedUser!)}
            onRemoveGame={props.onRemoveGame}
          />

          <div className="admin-form-row row g-2 align-items-end">
            <div className="col-12 col-lg">
              <FormSelect value={props.addGameId} onChange={event => props.setAddGameId(event.target.value)}>
                <option value="">Seleciona um jogo para adicionar na biblioteca</option>
                {props.games.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
              </FormSelect>
            </div>
            <div className="col-12 col-lg-auto">
              <button className="btn primary-btn w-100" type="button" onClick={props.onAddGame}>Adicionar jogo</button>
            </div>
          </div>

          <ModerationPanel
            panelRef={moderationPanelRef}
            games={props.games}
            restrictions={props.adminGameRestrictions}
            form={props.restrictionForm}
            updateForm={updateRestrictionForm}
            onApply={props.onApplyGameRestriction}
            onRevoke={props.onRevokeGameRestriction}
          />
        </>
      )}
    </section>
  );
}

function SelectedUserPanel({ user, currentUserId, items, games, restrictions, selectedRestrictionGameId, mode, setMode, onSelectModerationGame, onToggleStatus, onToggleRole, onRemoveGame }: {
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
    .sort((a, b) => a.game!.title.localeCompare(b.game!.title, 'pt-BR'));

  return (
    <>
      <div className="selected-user-box">
        <strong>{user.name || 'Sem nome'}</strong><br />
        <span className="admin-user-meta">{user.email} • {user.role === 'admin' ? 'Conta administrativa' : 'Usuário comum'}</span>
        <div className="selected-user-grid row row-cols-1 row-cols-sm-3 g-2">
          <div className="col"><div className="selected-user-stat h-100"><span>Tipo da conta</span><strong>{user.role === 'admin' ? 'Admin' : 'Usuário'}</strong></div></div>
          <div className="col"><div className="selected-user-stat h-100"><span>Total de jogos</span><strong>{user.library_count || 0}</strong></div></div>
          <div className="col"><div className="selected-user-stat h-100"><span>Status</span><strong>{user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}</strong></div></div>
        </div>
        <div className="selected-user-actions">
          {user.role === 'user'
            ? <button className="btn ghost-btn" type="button" onClick={onToggleStatus}>{user.status === 'blocked' ? 'Reativar conta' : 'Bloquear conta'}</button>
            : <span className="admin-user-meta">Conta administrativa protegida contra bloqueio.</span>}
          {user.id === currentUserId
            ? <span className="admin-user-meta">Você não pode alterar o próprio tipo de conta.</span>
            : <button className="btn primary-btn" type="button" onClick={onToggleRole}>{user.role === 'admin' ? 'Rebaixar para usuário' : 'Promover para admin'}</button>}
        </div>
      </div>

      <div className="admin-library-mode-row">
        <span className="admin-user-meta">Biblioteca em ordem alfabética</span>
        <div className="library-mode-toggle">
          <button className={`btn ${mode === 'cards' ? 'active' : ''}`} type="button" onClick={() => setMode('cards')}>Cards</button>
          <button className={`btn ${mode === 'table' ? 'active' : ''}`} type="button" onClick={() => setMode('table')}>Tabela</button>
        </div>
      </div>

      {mode === 'cards' ? (
        <div className="admin-library-list">
          {rows.length ? rows.map(row => (
            <AdminLibraryCard
              key={row.item.game_id}
              item={row.item}
              game={row.game!}
              restrictions={restrictions}
              selectedRestrictionGameId={selectedRestrictionGameId}
              onSelectModerationGame={onSelectModerationGame}
              onRemoveGame={onRemoveGame}
            />
          )) : <div className="admin-lib-item">Nenhum jogo nessa conta.</div>}
        </div>
      ) : (
        <AdminLibraryTable
          rows={rows as Array<{ item: LibraryItem; game: Game }>}
          restrictions={restrictions}
          selectedRestrictionGameId={selectedRestrictionGameId}
          onSelectModerationGame={onSelectModerationGame}
          onRemoveGame={onRemoveGame}
        />
      )}
    </>
  );
}

function AdminLibraryCard({ item, game, restrictions, selectedRestrictionGameId, onSelectModerationGame, onRemoveGame }: {
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
      className={`admin-lib-item admin-lib-item-selectable row g-3 align-items-center ${selectedForModeration ? 'selected' : ''}`}
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
            ? <button className="btn ghost-btn" type="button" onClick={event => {
              event.stopPropagation();
              onRemoveGame(game.id);
            }}>Remover</button>
            : <span className="admin-user-meta">Comprado: não removível</span>}
        </div>
      </div>
    </div>
  );
}

function AdminLibraryTable({ rows, restrictions, selectedRestrictionGameId, onSelectModerationGame, onRemoveGame }: {
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
                    ? <button className="btn ghost-btn" type="button" onClick={event => {
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

function ModerationPanel({ panelRef, games, restrictions, form, updateForm, onApply, onRevoke }: {
  panelRef: RefObject<HTMLDivElement | null>;
  games: Game[];
  restrictions: GameRestriction[];
  form: GameRestrictionForm;
  updateForm: (next: Partial<GameRestrictionForm>) => void;
  onApply: () => void;
  onRevoke: (restriction: GameRestriction) => void;
}) {
  const gameById = new Map(games.map(game => [Number(game.id), game]));
  const selectedGameId = Number(form.gameId);
  const selectedGame = selectedGameId ? gameById.get(selectedGameId) : null;
  const activeRestrictions = restrictions
    .filter(isRestrictionActive)
    .filter(restriction => !selectedGameId || Number(restriction.game_id) === selectedGameId);

  return (
    <div className="restriction-panel" ref={panelRef}>
      <div className="restriction-panel-head">
        <div>
          <span className="kicker">Moderação por jogo</span>
          <h4>Avisos e bans do jogo</h4>
          <p>Aviso só registra a ocorrência. Ban temporário ou permanente bloqueia o botão Jogar para esse jogo.</p>
        </div>
      </div>

      <div className={`restriction-selected-game ${selectedGame ? 'active' : ''}`}>
        {selectedGame ? (
          <>
            <span>Jogo selecionado</span>
            <strong>{selectedGame.title}</strong>
            <small>{selectedGame.franchise}</small>
          </>
        ) : (
          <>
            <span>Nenhum jogo selecionado</span>
            <strong>Clique em um jogo da biblioteca</strong>
            <small>Ou escolha manualmente no campo abaixo.</small>
          </>
        )}
      </div>

      <div className="row g-2">
        <div className="col-12 col-lg-5">
          <FormSelect value={form.gameId} onChange={event => updateForm({ gameId: event.target.value })}>
            <option value="">Seleciona o jogo</option>
            {games.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
          </FormSelect>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <FormSelect value={form.type} onChange={event => updateForm({ type: event.target.value as GameRestrictionForm['type'] })}>
            <option value="warning">Aviso</option>
            <option value="temporary_ban">Ban temporário</option>
            <option value="permanent_ban">Ban permanente</option>
          </FormSelect>
        </div>
        {form.type === 'temporary_ban' && (
          <div className="col-12 col-sm-6 col-lg-2">
            <FormSelect value={form.duration} onChange={event => updateForm({ duration: event.target.value as GameRestrictionForm['duration'] })}>
              <option value="24h">{restrictionDurationLabel('24h')}</option>
              <option value="7d">{restrictionDurationLabel('7d')}</option>
              <option value="30d">{restrictionDurationLabel('30d')}</option>
            </FormSelect>
          </div>
        )}
        <div className="col-12">
          <FormTextarea
            value={form.reason}
            onChange={event => updateForm({ reason: event.target.value })}
            placeholder="Motivo: exemplo, comportamento ofensivo durante partida online"
          />
        </div>
        <div className="col-12 col-lg-auto">
          <button className="btn primary-btn w-100" type="button" onClick={onApply}>Aplicar restrição</button>
        </div>
      </div>

      <div className="restriction-list">
        {activeRestrictions.length ? activeRestrictions.map(restriction => {
          const game = gameById.get(Number(restriction.game_id));

          return (
            <div className="restriction-item" key={restriction.id}>
              <div>
                <strong>{game?.title || `Jogo #${restriction.game_id}`}</strong>
                <div className="admin-user-meta">{restrictionTypeLabel(restriction.restriction_type)} • {restrictionStatusText(restriction)}</div>
                <p>{restriction.reason}</p>
              </div>
              <button className="btn ghost-btn" type="button" onClick={() => onRevoke(restriction)}>Revogar</button>
            </div>
          );
        }) : <div className="admin-empty-state">{selectedGame ? 'Nenhuma restrição ativa nesse jogo.' : 'Nenhuma restrição ativa para esse usuário.'}</div>}
      </div>
    </div>
  );
}
