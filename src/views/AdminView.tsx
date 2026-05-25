import type { FormEvent } from 'react';
import type { AdminTab, AdminUser, Game, GameForm, Genre, LibraryItem } from '../types';
import { adminTabs } from '../config/app';
import { brl, genreLabel, genres } from '../utils';

export function AdminView(props: {
  games: Game[];
  users: AdminUser[];
  allUsers: AdminUser[];
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  adminSearchTerm: string;
  setAdminSearchTerm: (value: string) => void;
  adminTypeFilter: string;
  setAdminTypeFilter: (value: string) => void;
  adminStatusFilter: string;
  setAdminStatusFilter: (value: string) => void;
  selectedUser: AdminUser | null;
  selectedUserId: string;
  adminLibraryItems: LibraryItem[];
  addGameId: string;
  setAddGameId: (value: string) => void;
  gameForm: GameForm;
  updateGameForm: (next: Partial<GameForm>, source?: 'toggle' | 'price' | 'old' | 'discount') => void;
  editingGameId: number | null;
  savingGame: boolean;
  resetGameForm: () => void;
  submitGameForm: (event: FormEvent) => void;
  carouselForm: string[];
  setCarouselForm: (value: string[]) => void;
  promoForm: { title: string; text: string };
  setPromoForm: (value: { title: string; text: string }) => void;
  onStore: () => void;
  onSelectUser: (id: string) => void;
  onToggleStatus: (user: AdminUser) => void;
  onToggleRole: (user: AdminUser) => void;
  onAddGame: () => void;
  onRemoveGame: (gameId: number) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (game: Game) => void;
  onSaveCarousel: () => void;
  onSavePromo: () => void;
  currentUserId: string;
}) {
  const libraryTotal = props.allUsers.reduce((sum, user) => sum + Number(user.library_count || 0), 0);

  return (
    <section className="view active">
      <div className="container page-shell">
        <div className="page-header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3">
          <div>
            <span className="kicker">Painel interno</span>
            <h1>Dashboard administrativo</h1>
            <p>Admin gere usuários, jogos, bibliotecas, carrossel e oferta principal. Admin não compra nem favorita.</p>
          </div>
          <button className="btn ghost-btn" onClick={props.onStore}>Voltar para loja</button>
        </div>

        <div className="admin-kpis row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
          <AdminKpi label="Usuários" value={props.allUsers.filter(user => user.role === 'user').length} />
          <AdminKpi label="Admins" value={props.allUsers.filter(user => user.role === 'admin').length} />
          <AdminKpi label="Jogos no catálogo" value={props.games.length} />
          <AdminKpi label="Itens em bibliotecas" value={libraryTotal} />
        </div>

        <div className="admin-tabs">
          {adminTabs.map(tab => (
            <button key={tab} className={`btn admin-tab-btn ${props.adminTab === tab ? 'active' : ''}`} onClick={() => props.setAdminTab(tab)}>
              {tab === 'users' ? 'Usuários' : tab === 'library' ? 'Biblioteca' : tab === 'catalog' ? 'Catálogo' : 'Home'}
            </button>
          ))}
        </div>

        {props.adminTab === 'users' && (
          <section className="page-panel admin-card">
            <div className="admin-card-head">
              <div>
                <span className="kicker">Usuários</span>
                <h3>Usuários da loja</h3>
                <p className="admin-help">Busca, filtro, bloqueio, biblioteca e privilégios baseados em role.</p>
              </div>
            </div>
            <div className="admin-toolbar row g-2">
              <div className="col-12 col-lg">
                <input className="form-control input" value={props.adminSearchTerm} onChange={event => props.setAdminSearchTerm(event.target.value)} placeholder="Buscar por nome ou e-mail" />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <select className="form-select input" value={props.adminTypeFilter} onChange={event => props.setAdminTypeFilter(event.target.value)}>
                  <option value="all">Todos os tipos</option>
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <select className="form-select input" value={props.adminStatusFilter} onChange={event => props.setAdminStatusFilter(event.target.value)}>
                  <option value="all">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
            </div>

            <div className="admin-mobile-users d-lg-none">
              {props.users.length ? props.users.map(user => (
                <button key={user.id} className={`btn admin-mobile-user-card ${props.selectedUserId === user.id ? 'active' : ''}`} onClick={() => props.onSelectUser(user.id)}>
                  <span>
                    <strong>{user.name || 'Sem nome'}</strong>
                    <small>{user.email}</small>
                  </span>
                  <span className="d-flex flex-wrap gap-2">
                    <span className={`admin-role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>{user.role === 'admin' ? 'Admin' : 'Usuário'}</span>
                    <span className={`admin-status-badge ${user.status === 'blocked' ? 'blocked' : 'active'}`}>{user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}</span>
                  </span>
                  <span className="admin-user-meta">{user.library_count || 0} jogo(s) na conta</span>
                </button>
              )) : <div className="admin-empty-state">Nenhum usuário encontrado.</div>}
            </div>

            <div className="admin-table-wrap d-none d-lg-block">
              <table className="admin-users-table-desktop">
                <colgroup>
                  <col className="admin-col-user" />
                  <col className="admin-col-role" />
                  <col className="admin-col-count" />
                  <col className="admin-col-status" />
                  <col className="admin-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Tipo</th>
                    <th>Total de jogos</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {props.users.length ? props.users.map(user => (
                    <tr
                      key={user.id}
                      className={props.selectedUserId === user.id ? 'active' : ''}
                      onClick={() => props.onSelectUser(user.id)}
                      tabIndex={0}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') props.onSelectUser(user.id);
                      }}
                    >
                      <td>
                        <div className="admin-user-main">
                          <strong>{user.name || 'Sem nome'}</strong>
                          <div className="admin-user-meta">{user.email}</div>
                        </div>
                      </td>
                      <td className="admin-cell-center"><span className={`admin-role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>{user.role === 'admin' ? 'Admin' : 'Usuário'}</span></td>
                      <td className="admin-cell-count"><strong>{user.library_count || 0}</strong><div className="admin-user-meta">na conta</div></td>
                      <td className="admin-cell-center"><span className={`admin-status-badge ${user.status === 'blocked' ? 'blocked' : 'active'}`}>{user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}</span></td>
                      <td className="admin-cell-actions">
                        <button
                          type="button"
                          className="btn primary-btn"
                          onClick={event => {
                            event.stopPropagation();
                            props.onSelectUser(user.id);
                          }}
                        >
                          Abrir biblioteca
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="admin-empty-state">Nenhum usuário encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {props.adminTab === 'library' && (
          <section className="page-panel admin-card">
            <div className="admin-card-head">
              <div>
                <span className="kicker">Biblioteca</span>
                <h3>Gestão do usuário selecionado</h3>
              </div>
            </div>
            {!props.selectedUser ? (
              <div className="selected-user-box">Seleciona um usuário na tabela para gerir a biblioteca.</div>
            ) : (
              <SelectedUserPanel
                user={props.selectedUser}
                currentUserId={props.currentUserId}
                items={props.adminLibraryItems}
                games={props.games}
                onToggleStatus={() => props.onToggleStatus(props.selectedUser!)}
                onToggleRole={() => props.onToggleRole(props.selectedUser!)}
                onRemoveGame={props.onRemoveGame}
              />
            )}
            <div className="admin-form-row row g-2 align-items-end">
              <div className="col-12 col-lg">
                <select className="form-select input" value={props.addGameId} onChange={event => props.setAddGameId(event.target.value)} disabled={!props.selectedUser}>
                  <option value="">Seleciona um jogo</option>
                  {props.games.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
                </select>
              </div>
              <div className="col-12 col-lg-auto">
                <button className="btn primary-btn w-100" disabled={!props.selectedUser} onClick={props.onAddGame}>Adicionar jogo</button>
              </div>
            </div>
          </section>
        )}

        {props.adminTab === 'catalog' && (
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
                  <input className="form-control input" value={props.gameForm.title} onChange={event => props.updateGameForm({ title: event.target.value })} placeholder="Título do jogo" />
                  <input className="form-control input" value={props.gameForm.franchise} onChange={event => props.updateGameForm({ franchise: event.target.value })} placeholder="Franquia" />
                  <select className="form-select input" value={props.gameForm.genre} onChange={event => props.updateGameForm({ genre: event.target.value as Genre })}>
                    {genres.map(genre => <option key={genre.value} value={genre.value}>{genre.label}</option>)}
                  </select>
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <input className="form-control input" type="number" step="0.01" value={props.gameForm.price} onChange={event => props.updateGameForm({ price: event.target.value }, 'price')} placeholder="Preço atual" />
                    </div>
                    <div className="col-12 col-md-6">
                      <input className="form-control input" type="number" step="0.01" value={props.gameForm.oldPrice} onChange={event => props.updateGameForm({ oldPrice: event.target.value }, 'old')} placeholder="Preço antigo" disabled={!props.gameForm.hasDiscount} />
                    </div>
                  </div>
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-6">
                      <input className="form-control input" type="number" min="0" max="100" step="1" value={props.gameForm.discount} onChange={event => props.updateGameForm({ discount: event.target.value }, 'discount')} placeholder="Desconto (%)" disabled={!props.gameForm.hasDiscount} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="save-card-label">
                        <input type="checkbox" checked={props.gameForm.hasDiscount} onChange={event => props.updateGameForm({ hasDiscount: event.target.checked }, 'toggle')} />
                        Aplicar desconto
                      </label>
                    </div>
                  </div>
                  <label className="save-card-label">
                    <input type="checkbox" checked={props.gameForm.featured} onChange={event => props.updateGameForm({ featured: event.target.checked })} />
                    Marcar como destaque
                  </label>
                  <input className="form-control input" value={props.gameForm.tags} onChange={event => props.updateGameForm({ tags: event.target.value })} placeholder="Tags separadas por vírgula" />
                  <textarea className="form-control input textarea" value={props.gameForm.description} onChange={event => props.updateGameForm({ description: event.target.value })} placeholder="Descrição do jogo" />
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
        )}

        {props.adminTab === 'home' && (
          <div className="admin-bottom-grid row g-3">
            <div className="col-12 col-xl-6">
              <section className="page-panel admin-card h-100">
                <div className="admin-card-head">
                  <div>
                    <span className="kicker">Home</span>
                    <h3>Carrossel principal</h3>
                  </div>
                </div>
                <div className="admin-form-grid row row-cols-1 row-cols-md-3 g-2">
                  {[0, 1, 2].map(index => (
                    <div className="col" key={index}>
                      <select className="form-select input" value={props.carouselForm[index] || ''} onChange={event => {
                        const next = [...props.carouselForm];
                        next[index] = event.target.value;
                        props.setCarouselForm(next);
                      }}>
                        {props.games.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <button className="btn primary-btn mt-3" onClick={props.onSaveCarousel}>Salvar carrossel</button>
              </section>
            </div>
            <div className="col-12 col-xl-6">
              <section className="page-panel admin-card h-100">
                <div className="admin-card-head">
                  <div>
                    <span className="kicker">Comunicação</span>
                    <h3>Oferta principal</h3>
                  </div>
                </div>
                <div className="form-grid">
                  <input className="form-control input" value={props.promoForm.title} onChange={event => props.setPromoForm({ ...props.promoForm, title: event.target.value })} placeholder="Título da oferta" />
                  <textarea className="form-control input textarea" value={props.promoForm.text} onChange={event => props.setPromoForm({ ...props.promoForm, text: event.target.value })} placeholder="Texto da oferta" />
                  <button className="btn primary-btn" onClick={props.onSavePromo}>Salvar oferta</button>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AdminKpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="col">
      <article className="admin-kpi h-100"><span>{label}</span><strong>{value}</strong></article>
    </div>
  );
}

function SelectedUserPanel({ user, currentUserId, items, games, onToggleStatus, onToggleRole, onRemoveGame }: {
  user: AdminUser;
  currentUserId: string;
  items: LibraryItem[];
  games: Game[];
  onToggleStatus: () => void;
  onToggleRole: () => void;
  onRemoveGame: (gameId: number) => void;
}) {
  const rows = items.map(item => ({ item, game: games.find(game => Number(game.id) === Number(item.game_id)) })).filter(row => row.game);

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
            ? <button className="btn ghost-btn" onClick={onToggleStatus}>{user.status === 'blocked' ? 'Reativar conta' : 'Bloquear conta'}</button>
            : <span className="admin-user-meta">Conta administrativa protegida contra bloqueio.</span>}
          {user.id === currentUserId
            ? <span className="admin-user-meta">Você não pode alterar o próprio tipo de conta.</span>
            : <button className="btn primary-btn" onClick={onToggleRole}>{user.role === 'admin' ? 'Rebaixar para usuário' : 'Promover para admin'}</button>}
        </div>
      </div>
      <div className="admin-library-list">
        {rows.length ? rows.map(({ item, game }) => (
          <div className="admin-lib-item row g-3 align-items-center" key={item.game_id}>
            <div className="col-12 col-md">
              <strong>{game!.title}</strong>
              <div className="admin-user-meta">{game!.franchise} • {item.source === 'admin_grant' ? 'Adicionado por admin' : 'Comprado'}</div>
            </div>
            <div className="col-12 col-md-auto">
              <div className="admin-item-actions d-grid d-sm-flex justify-content-sm-end">
                {item.source === 'admin_grant'
                  ? <button className="btn ghost-btn" onClick={() => onRemoveGame(game!.id)}>Remover</button>
                  : <span className="admin-user-meta">Não removível</span>}
              </div>
            </div>
          </div>
        )) : <div className="admin-lib-item">Nenhum jogo nessa conta.</div>}
      </div>
    </>
  );
}
