import {
  AdminKpis,
  AdminTabs
} from './admin/AdminOverview';
import { AdminCatalogSection } from './admin/AdminCatalogSection';
import { AdminHomeSection } from './admin/AdminHomeSection';
import { AdminLibrarySection } from './admin/AdminLibrarySection';
import { AdminUsersSection } from './admin/AdminUsersSection';
import type { AdminViewProps } from './admin/types';

export function AdminView(props: AdminViewProps) {
  return (
    <section className="view active">
      <div className="container-xxl page-shell">
        <div className="page-header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3">
          <div>
            <span className="kicker">Painel interno</span>
            <h1>Dashboard administrativo</h1>
            <p>Admin gere usuários, jogos, bibliotecas, carrossel e oferta principal. Admin não compra nem favorita.</p>
          </div>
          <button className="btn btn-outline-light" onClick={props.onStore}>Voltar para loja</button>
        </div>

        <AdminKpis allUsers={props.allUsers} games={props.games} />
        <AdminTabs adminTab={props.adminTab} setAdminTab={props.setAdminTab} />

        {props.adminTab === 'users' && <AdminUsersSection {...props} />}
        {props.adminTab === 'library' && <AdminLibrarySection {...props} />}
        {props.adminTab === 'catalog' && <AdminCatalogSection {...props} />}
        {props.adminTab === 'home' && <AdminHomeSection {...props} />}
      </div>
    </section>
  );
}
