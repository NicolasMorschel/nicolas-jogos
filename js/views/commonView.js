import { state } from '../state.js';
import { $, isAdmin } from '../utils.js';
import { renderCartPage } from './cartView.js';
import { renderCheckout } from './checkoutView.js';
import { renderLibrary } from './libraryView.js';
import { renderAdmin } from './adminView.js';

export function switchView(viewId, loadingText='Abrindo tela...') {
  const loaderText = $('loaderText');
  const loader = $('appLoader');
  const bar = $('loaderBar');
  if (loader && loaderText && bar) {
    loaderText.textContent = loadingText;
    loader.classList.remove('hidden');
    bar.style.width = '0%';
    setTimeout(()=> bar.style.width='100%', 20);
    setTimeout(()=> loader.classList.add('hidden'), 500);
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(viewId)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.viewLink === viewId));
  if (viewId === 'libraryView') renderLibrary();
  if (viewId === 'cartView') renderCartPage();
  if (viewId === 'checkoutView') renderCheckout();
  if (viewId === 'adminView') renderAdmin();
}

export function updateHeaderStatus() {
  const adminMode = isAdmin();
  $('sessionStatus').textContent = state.profile ? state.profile.name : 'Visitante';
  $('sessionRole').textContent = state.profile ? (adminMode ? 'Administrador' : 'Usuário') : 'Usuário';
  $('favCount').textContent = adminMode ? '—' : state.favoriteIds.length;
  $('libraryCount').textContent = state.profile && !adminMode ? state.libraryIds.length : 0;
  $('cartCountTop').textContent = adminMode ? '—' : state.cartIds.length;
  $('adminNavBtn').classList.toggle('hidden', !adminMode);
  $('openLogin').classList.toggle('hidden', !!state.profile);
  $('openRegister').classList.toggle('hidden', !!state.profile);
  $('logoutBtn').classList.toggle('hidden', !state.profile);

  ['libraryView','cartView','checkoutView'].forEach(id => {
    document.querySelectorAll(`[data-view-link="${id}"]`).forEach(el => el.classList.toggle('hidden', adminMode));
  });
  document.querySelectorAll('[data-side-filter="favorites"]').forEach(el => el.classList.toggle('hidden', adminMode));
}
