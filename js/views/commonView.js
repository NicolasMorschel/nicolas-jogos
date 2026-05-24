import { state } from '../state.js';
import { $, isAdmin } from '../utils.js';
import { renderCartPage } from './cartView.js';
import { renderCheckout } from './checkoutView.js';
import { renderLibrary } from './libraryView.js';
import { renderAdmin } from './adminView.js';

const VIEW_STORAGE_KEY = 'nicolasJogos.currentView';
const VALID_VIEWS = new Set(['storeView', 'libraryView', 'cartView', 'checkoutView', 'adminView']);
const CUSTOMER_ONLY_VIEWS = new Set(['libraryView', 'cartView', 'checkoutView']);

function resolveViewId(viewId) {
  if (!VALID_VIEWS.has(viewId)) return 'storeView';
  if (viewId === 'adminView' && !isAdmin()) return 'storeView';
  if (isAdmin() && CUSTOMER_ONLY_VIEWS.has(viewId)) return 'adminView';
  return viewId;
}

function saveCurrentView(viewId) {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, viewId);
  } catch (err) {
    console.warn('Nao foi possivel salvar a tela atual.', err);
  }
}

export function restorePersistedView() {
  let savedView = 'storeView';

  try {
    savedView = localStorage.getItem(VIEW_STORAGE_KEY) || 'storeView';
  } catch (err) {
    console.warn('Nao foi possivel ler a tela salva.', err);
  }

  switchView(savedView, 'Abrindo tela...', { showLoader: false });
}

export function switchView(viewId, loadingText='Abrindo tela...', options = {}) {
  const { showLoader = true, save = true } = options;
  const targetView = resolveViewId(viewId);

  const loaderText = $('loaderText');
  const loader = $('appLoader');
  const bar = $('loaderBar');
  if (showLoader && loader && loaderText && bar) {
    loaderText.textContent = loadingText;
    loader.classList.remove('hidden');
    bar.style.width = '0%';
    setTimeout(()=> bar.style.width='100%', 20);
    setTimeout(()=> loader.classList.add('hidden'), 500);
  }
  state.currentView = targetView;
  if (save) saveCurrentView(targetView);

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(targetView)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.viewLink === targetView));
  if (targetView === 'libraryView') renderLibrary();
  if (targetView === 'cartView') renderCartPage();
  if (targetView === 'checkoutView') renderCheckout();
  if (targetView === 'adminView') renderAdmin();
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
