import type { RefObject } from 'react';
import type { Game, GameRestriction, GameRestrictionForm } from '../../../types';
import { FormSelect, FormTextarea } from '../../../components/forms';
import { isRestrictionActive, restrictionDurationLabel, restrictionStatusText, restrictionTypeLabel } from '../../../domain/restrictions';

export function ModerationPanel({ panelRef, games, restrictions, form, updateForm, onApply, onRevoke }: {
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
    <div className="card restriction-panel" ref={panelRef}>
      <div className="restriction-panel-head">
        <div>
          <span className="kicker">Moderação por jogo</span>
          <h4>Avisos e bans do jogo</h4>
          <p>Aviso só registra a ocorrência. Ban temporário ou permanente bloqueia o botão Jogar para esse jogo.</p>
        </div>
      </div>

      <div className={`card restriction-selected-game ${selectedGame ? 'active' : ''}`}>
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
          <button className="btn btn-primary w-100" type="button" onClick={onApply}>Aplicar restrição</button>
        </div>
      </div>

      <div className="restriction-list">
        {activeRestrictions.length ? activeRestrictions.map(restriction => {
          const game = gameById.get(Number(restriction.game_id));

          return (
            <div className="card restriction-item d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between" key={restriction.id}>
              <div>
                <strong>{game?.title || `Jogo #${restriction.game_id}`}</strong>
                <div className="admin-user-meta">{restrictionTypeLabel(restriction.restriction_type)} • {restrictionStatusText(restriction)}</div>
                <p>{restriction.reason}</p>
              </div>
              <button className="btn btn-outline-light" type="button" onClick={() => onRevoke(restriction)}>Revogar</button>
            </div>
          );
        }) : <div className="admin-empty-state">{selectedGame ? 'Nenhuma restrição ativa nesse jogo.' : 'Nenhuma restrição ativa para esse usuário.'}</div>}
      </div>
    </div>
  );
}
