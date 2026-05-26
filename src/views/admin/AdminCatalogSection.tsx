import type { Genre } from '../../types';
import { CheckboxField, FormInput, FormSelect, FormTextarea } from '../../components/forms';
import { brl, genreLabel, genres } from '../../utils';
import type { AdminViewProps } from './types';

export function AdminCatalogSection(props: Pick<
  AdminViewProps,
  | 'games'
  | 'gameForm'
  | 'updateGameForm'
  | 'editingGameId'
  | 'savingGame'
  | 'resetGameForm'
  | 'submitGameForm'
  | 'onEditGame'
  | 'onDeleteGame'
>) {
  return (
    <div className="admin-bottom-grid row g-3">
      <div className="col-12 col-xl-6">
        <section className="page-panel admin-card h-100">
          <div className="admin-card-head">
            <div>
              <span className="kicker">Catálogo</span>
              <h3>{props.editingGameId !== null ? 'Editar jogo do catálogo' : 'Adicionar jogo ao catálogo'}</h3>
              <p className="admin-help">{props.editingGameId !== null ? `Editando jogo ID ${props.editingGameId}` : 'Preenche os dados para cadastrar um novo jogo.'}</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={props.submitGameForm}>
            <FormInput value={props.gameForm.title} onChange={event => props.updateGameForm({ title: event.target.value })} placeholder="Título do jogo" />
            <FormInput value={props.gameForm.franchise} onChange={event => props.updateGameForm({ franchise: event.target.value })} placeholder="Franquia" />
            <FormSelect value={props.gameForm.genre} onChange={event => props.updateGameForm({ genre: event.target.value as Genre })}>
              {genres.map(genre => <option key={genre.value} value={genre.value}>{genre.label}</option>)}
            </FormSelect>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <FormInput type="number" step="0.01" value={props.gameForm.price} onChange={event => props.updateGameForm({ price: event.target.value }, 'price')} placeholder="Preço atual" />
              </div>
              <div className="col-12 col-md-6">
                <FormInput type="number" step="0.01" value={props.gameForm.oldPrice} onChange={event => props.updateGameForm({ oldPrice: event.target.value }, 'old')} placeholder="Preço antigo" disabled={!props.gameForm.hasDiscount} />
              </div>
            </div>
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-6">
                <FormInput type="number" min="0" max="100" step="1" value={props.gameForm.discount} onChange={event => props.updateGameForm({ discount: event.target.value }, 'discount')} placeholder="Desconto (%)" disabled={!props.gameForm.hasDiscount} />
              </div>
              <div className="col-12 col-md-6">
                <CheckboxField checked={props.gameForm.hasDiscount} onChange={checked => props.updateGameForm({ hasDiscount: checked }, 'toggle')}>
                  Aplicar desconto
                </CheckboxField>
              </div>
            </div>
            <CheckboxField checked={props.gameForm.featured} onChange={checked => props.updateGameForm({ featured: checked })}>
              Marcar como destaque
            </CheckboxField>
            <FormInput value={props.gameForm.tags} onChange={event => props.updateGameForm({ tags: event.target.value })} placeholder="Tags separadas por vírgula" />
            <FormTextarea value={props.gameForm.description} onChange={event => props.updateGameForm({ description: event.target.value })} placeholder="Descrição do jogo" />
            <div className="stack-actions">
              <button className="btn primary-btn" disabled={props.savingGame}>{props.savingGame ? 'Salvando...' : props.editingGameId !== null ? 'Salvar alterações' : 'Adicionar jogo'}</button>
              {props.editingGameId !== null && <button className="btn ghost-btn" type="button" onClick={props.resetGameForm}>Cancelar edição</button>}
            </div>
          </form>
        </section>
      </div>
      <div className="col-12 col-xl-6">
        <section className="page-panel admin-card h-100">
          <div className="admin-card-head">
            <div>
              <span className="kicker">Catálogo</span>
              <h3>Jogos cadastrados</h3>
              <p className="admin-help">Edita ou remove qualquer jogo da loja.</p>
            </div>
          </div>
          <div className="admin-library-list">
            {props.games.length ? props.games.map(game => (
              <div className="admin-lib-item row g-3 align-items-center" key={game.id}>
                <div className="col-12 col-md">
                  <strong>{game.title}</strong>
                  <div className="admin-user-meta">{game.franchise} • {genreLabel(game.genre)} • {brl(game.price)} • {game.featured ? 'Destaque' : 'Normal'}</div>
                </div>
                <div className="col-12 col-md-auto">
                  <div className="admin-item-actions d-grid d-sm-flex justify-content-sm-end">
                    <button className="btn ghost-btn" onClick={() => props.onEditGame(game)}>Editar</button>
                    <button className="btn ghost-btn" onClick={() => props.onDeleteGame(game)}>Remover</button>
                  </div>
                </div>
              </div>
            )) : <div className="admin-lib-item">Nenhum jogo cadastrado no catálogo.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
