import { state } from '../state.js';
import { $, getGame } from '../utils.js';

export function filteredAdminUsers() {
  return state.adminUsers.filter(u => {
    const term = state.adminSearchTerm.toLowerCase().trim();
    const hit = !term || `${u.name} ${u.email}`.toLowerCase().includes(term);
    const typeOk = state.adminTypeFilter === 'all' || u.role === state.adminTypeFilter;
    const statusOk = state.adminStatusFilter === 'all' || u.status === state.adminStatusFilter;
    return hit && typeOk && statusOk;
  });
}

function renderAdminCatalogList() {
  const wrap = $('adminCatalogGamesList');
  if (!wrap) return;

  wrap.innerHTML = state.games.map(game => `
    <div class="admin-lib-item">
      <div>
        <strong>${game.title}</strong>
        <div class="admin-user-meta">
          ${game.franchise} • ${String(game.genre || '').replace('-', ' ')} •
          R$ ${Number(game.price || 0).toFixed(2)} •
          ${game.featured ? 'Destaque' : 'Normal'}
        </div>
      </div>
      <div class="stack-actions">
        <button class="ghost-btn" onclick="window.App.startEditGame(${game.id})">Editar</button>
        <button class="ghost-btn" onclick="window.App.deleteCatalogGame(${game.id})">Remover</button>
      </div>
    </div>
  `).join('') || '<div class="admin-lib-item">Nenhum jogo cadastrado no catálogo.</div>';
}

export function renderAdmin() {
  const onlyUsers = state.adminUsers.filter(u => u.role === 'user');

  $('adminKpis').innerHTML = `
    <article class="admin-kpi"><span>Usuários</span><strong>${onlyUsers.length}</strong></article>
    <article class="admin-kpi"><span>Admins</span><strong>${state.adminUsers.filter(u => u.role === 'admin').length}</strong></article>
    <article class="admin-kpi"><span>Jogos no catálogo</span><strong>${state.games.length}</strong></article>
    <article class="admin-kpi"><span>Itens em bibliotecas</span><strong>${state.adminUsers.reduce((s,u) => s + Number(u.library_count || 0), 0)}</strong></article>`;

  $('adminUsersList').innerHTML = filteredAdminUsers().map(u => `
    <button class="admin-user-row ${state.selectedAdminUserId === u.id ? 'active' : ''}" onclick="window.App.selectAdminUser('${u.id}')">
      <div class="admin-user-main">
        <strong>${u.name || 'Sem nome'}</strong>
        <div class="admin-user-meta">${u.email}</div>
      </div>
      <div><span class="admin-role-badge user">${u.role === 'admin' ? 'Admin' : 'Usuário'}</span></div>
      <div><strong>${u.library_count || 0}</strong><div class="admin-user-meta">na conta</div></div>
      <div><span class="admin-status-badge active">${u.status === 'blocked' ? 'Bloqueado' : 'Ativo'}</span></div>
      <div class="admin-actions">
        <span class="ghost-btn">Selecionar</span>
        <span class="primary-btn">Gerenciar</span>
      </div>
    </button>
  `).join('') || '<div class="page-panel">Nenhum usuário encontrado.</div>';

  const options = state.games.map(g => `<option value="${g.id}">${g.title}</option>`).join('');
  $('adminAddGameSelect').innerHTML = `<option value="">Seleciona um jogo</option>${options}`;
  $('carouselSelect1').innerHTML = options;
  $('carouselSelect2').innerHTML = options;
  $('carouselSelect3').innerHTML = options;

  $('carouselSelect1').value = state.storeConfig.carousel?.[0] || state.games[0]?.id || '';
  $('carouselSelect2').value = state.storeConfig.carousel?.[1] || state.games[1]?.id || '';
  $('carouselSelect3').value = state.storeConfig.carousel?.[2] || state.games[2]?.id || '';

  $('adminPromoTitle').value = state.storeConfig.promo_title || '';
  $('adminPromoText').value = state.storeConfig.promo_text || '';

  renderAdminUserDetails();
  renderAdminCatalogList();
}

export function renderAdminUserDetails() {
  const user = state.adminUsers.find(u => u.id === state.selectedAdminUserId);

  if (!user) {
    $('adminCurrentUser').textContent = 'Seleciona um usuário na tabela para gerir a biblioteca.';
    $('adminLibraryList').innerHTML = '';
    $('adminAddGameBtn').disabled = true;
    $('adminAddGameSelect').disabled = true;
    return;
  }

  $('adminAddGameBtn').disabled = false;
  $('adminAddGameSelect').disabled = false;

  $('adminCurrentUser').innerHTML = `
    <strong>${user.name || 'Sem nome'}</strong><br>
    <span class="admin-user-meta">${user.email} • ${user.role === 'admin' ? 'Conta administrativa' : 'Usuário comum'}</span>
    <div class="selected-user-grid">
      <div class="selected-user-stat"><span>Tipo da conta</span><strong>${user.role === 'admin' ? 'Admin' : 'Usuário'}</strong></div>
      <div class="selected-user-stat"><span>Total de jogos</span><strong>${user.library_count || 0}</strong></div>
      <div class="selected-user-stat"><span>Status</span><strong>${user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}</strong></div>
    </div>
    <div class="selected-user-actions">
      ${user.role === 'user'
        ? `<button class="ghost-btn" onclick="window.App.toggleUserStatus('${user.id}','${user.status}')">${user.status === 'blocked' ? 'Reativar conta' : 'Bloquear conta'}</button>`
        : `<span class="admin-user-meta">Conta administrativa protegida.</span>`}
    </div>`;

  const validLibraryGames = state.currentAdminUserLibraryIds
    .map(id => getGame(id))
    .filter(Boolean);

  $('adminLibraryList').innerHTML = !validLibraryGames.length
    ? '<div class="admin-lib-item">Nenhum jogo nessa conta.</div>'
    : validLibraryGames.map(g => `
        <div class="admin-lib-item">
          <div>
            <strong>${g.title}</strong>
            <div class="admin-user-meta">${g.franchise}</div>
          </div>
          <button class="ghost-btn" onclick="window.App.adminRemoveGame(${g.id})">Remover</button>
        </div>
      `).join('');
}