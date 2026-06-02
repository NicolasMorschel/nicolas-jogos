import { FormInput, FormSelect } from '../../components/forms';
import type { AdminViewProps } from './types';

export function AdminUsersSection(props: Pick<
  AdminViewProps,
  | 'users'
  | 'adminSearchTerm'
  | 'setAdminSearchTerm'
  | 'adminTypeFilter'
  | 'setAdminTypeFilter'
  | 'adminStatusFilter'
  | 'setAdminStatusFilter'
  | 'selectedUserId'
  | 'onSelectUser'
>) {
  return (
    <section className="card page-panel admin-card">
      <div className="admin-card-head">
        <div>
          <span className="kicker">Usuários</span>
          <h3>Usuários da loja</h3>
          <p className="admin-help">Busca, filtro, bloqueio, biblioteca e privilégios baseados em role.</p>
        </div>
      </div>
      <div className="admin-toolbar row g-2">
        <div className="col-12 col-lg">
          <FormInput value={props.adminSearchTerm} onChange={event => props.setAdminSearchTerm(event.target.value)} placeholder="Buscar por nome ou e-mail" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <FormSelect value={props.adminTypeFilter} onChange={event => props.setAdminTypeFilter(event.target.value)}>
            <option value="all">Todos os tipos</option>
            <option value="user">Usuário</option>
            <option value="admin">Admin</option>
          </FormSelect>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <FormSelect value={props.adminStatusFilter} onChange={event => props.setAdminStatusFilter(event.target.value)}>
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="blocked">Bloqueado</option>
          </FormSelect>
        </div>
      </div>

      <div className="admin-mobile-users d-lg-none">
        {props.users.length ? props.users.map(user => (
          <button key={user.id} className={`btn card admin-mobile-user-card ${props.selectedUserId === user.id ? 'active' : ''}`} onClick={() => props.onSelectUser(user.id)}>
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
        <table className="table table-hover align-middle mb-0 admin-users-table-desktop">
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
                    className="btn btn-primary"
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
  );
}
