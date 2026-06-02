import { useRef } from 'react';
import type { Game, GameRestrictionForm } from '../../types';
import { FormSelect } from '../../components/forms';
import type { AdminViewProps } from './types';
import { ModerationPanel } from './library/ModerationPanel';
import { SelectedUserPanel } from './library/SelectedUserPanel';

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
    <section className="card page-panel admin-card">
      <div className="admin-card-head">
        <div>
          <span className="kicker">Biblioteca</span>
          <h3>Gestão do usuário selecionado</h3>
        </div>
      </div>

      {!props.selectedUser ? (
        <div className="card selected-user-box admin-empty-selection">
          <strong>Nenhum usuário selecionado</strong>
          <p>Abre a aba Usuários e escolhe uma conta para liberar jogos, bloquear conta ou aplicar ban por jogo.</p>
          <button className="btn btn-primary w-100" type="button" onClick={() => props.setAdminTab('users')}>
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
              <button className="btn btn-primary w-100" type="button" onClick={props.onAddGame}>Adicionar jogo</button>
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
