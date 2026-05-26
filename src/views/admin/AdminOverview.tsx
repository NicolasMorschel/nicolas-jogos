import type { AdminTab } from '../../types';
import { adminTabs } from '../../config/app';
import type { AdminViewProps } from './types';

export function AdminKpis({ allUsers, games }: Pick<AdminViewProps, 'allUsers' | 'games'>) {
  const libraryTotal = allUsers.reduce((sum, user) => sum + Number(user.library_count || 0), 0);

  return (
    <div className="admin-kpis row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
      <AdminKpi label="Usuários" value={allUsers.filter(user => user.role === 'user').length} />
      <AdminKpi label="Admins" value={allUsers.filter(user => user.role === 'admin').length} />
      <AdminKpi label="Jogos no catálogo" value={games.length} />
      <AdminKpi label="Itens em bibliotecas" value={libraryTotal} />
    </div>
  );
}

export function AdminTabs({ adminTab, setAdminTab }: { adminTab: AdminTab; setAdminTab: (tab: AdminTab) => void }) {
  return (
    <div className="admin-tabs">
      {adminTabs.map(tab => (
        <button key={tab} className={`btn admin-tab-btn ${adminTab === tab ? 'active' : ''}`} onClick={() => setAdminTab(tab)}>
          {tab === 'users' ? 'Usuários' : tab === 'library' ? 'Biblioteca' : tab === 'catalog' ? 'Catálogo' : 'Home'}
        </button>
      ))}
    </div>
  );
}

function AdminKpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="col">
      <article className="admin-kpi h-100"><span>{label}</span><strong>{value}</strong></article>
    </div>
  );
}
