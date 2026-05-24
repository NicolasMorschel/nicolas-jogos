import { state } from './state.js';
import { $, showToast, openModal, closeModal, hidePurchaseSuccess } from './utils.js';
import * as authModel from './models/authModel.js';
import * as storeModel from './models/storeModel.js';
import * as userDataModel from './models/userDataModel.js';
import { updateHeaderStatus, switchView, restorePersistedView } from './views/commonView.js';
import { renderHero, renderFranchises, renderGames, goHero, updateHeroPosition } from './views/storeView.js';
import { renderCartPage } from './views/cartView.js';
import { renderLibrary } from './views/libraryView.js';
import { renderCheckout, updatePaymentUI } from './views/checkoutView.js';
import { renderAdmin, setAdminTab, restoreAdminTab } from './views/adminView.js';
import * as authController from './controllers/authController.js';
import * as storeController from './controllers/storeController.js';
import * as checkoutController from './controllers/checkoutController.js';
import * as adminController from './controllers/adminController.js';

export async function refreshAll() {
  const { data, error } = await authModel.getSession();
  if (error) throw error;
  state.session = data.session;
  state.profile = null;

  if (state.session?.user) {
    const profileRes = await userDataModel.fetchProfile(state.session.user.id);
    if (profileRes.error) throw profileRes.error;
    state.profile = profileRes.data || null;
  }

  const gamesRes = await storeModel.fetchGames();
  if (gamesRes.error) throw gamesRes.error;
  state.games = gamesRes.data || [];

  const settingsRes = await storeModel.fetchStoreSettings();
  if (settingsRes.error) throw settingsRes.error;
  const map = {};
  (settingsRes.data || []).forEach(row => { map[row.key] = row.value; });
  state.storeConfig.carousel = Array.isArray(map.carousel) ? map.carousel : [1,2,3];
  state.storeConfig.promo_title = map.promo_title || 'Franquias famosas em destaque';
  state.storeConfig.promo_text = map.promo_text || 'Banco online, login real e painel admin com Supabase.';

  state.cartIds = [];
  state.favoriteIds = [];
  state.libraryIds = [];
  state.savedCards = [];
  if (state.session?.user) {
    const res = await userDataModel.fetchUserData(state.session.user.id);
    if (res.cartRes.error) throw res.cartRes.error;
    if (res.favRes.error) throw res.favRes.error;
    if (res.libRes.error) throw res.libRes.error;
    if (res.cardsRes.error) throw res.cardsRes.error;
    state.cartIds = (res.cartRes.data || []).map(x => x.game_id);
    state.favoriteIds = (res.favRes.data || []).map(x => x.game_id);
    state.libraryIds = (res.libRes.data || []).map(x => x.game_id);
    state.savedCards = res.cardsRes.data || [];
  }

  if (state.profile?.role === 'admin') {
    await adminController.loadAdminUsers();
  } else {
    state.adminUsers = [];
    state.currentAdminUserLibraryIds = [];
    state.currentAdminUserLibraryItems = [];
  }

  renderAll();
}

function renderAll() {
  updateHeaderStatus();
  renderHero();
  renderFranchises();
  renderGames();
  renderCartPage();
  renderCheckout();
  renderLibrary();
  if (state.profile?.role === 'admin') renderAdmin();
}

function setupStrength() {
  $('registerPassword').addEventListener('input', () => {
    const val = $('registerPassword').value;
    let score = 0;
    if (val.length >= 6) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const widths = ['0%','25%','50%','75%','100%'];
    const texts = ['Muito fraca','Fraca','Média','Forte','Muito forte'];
    const colors = ['var(--red)','var(--red)','var(--yellow)','var(--primary)','var(--green)'];
    $('strengthBar').style.width = widths[score];
    $('strengthBar').style.background = colors[score];
    $('strengthText').textContent = val ? `Segurança da senha: ${texts[score]}` : 'Digite uma senha para analisar.';
  });
}
function maskInputs() {
  $('cardNumber').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 ').slice(0,19).trim(); });
  $('cardDate').addEventListener('input', e => { let v = e.target.value.replace(/\D/g,'').slice(0,4); if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2); e.target.value = v; });
  $('cardCvv').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g,'').slice(0,3); });
}
function setupForms() {
  setupStrength();
  maskInputs();
  updatePaymentUI();
}

function bindEvents() {
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
  window.addEventListener('click', e => document.querySelectorAll('.modal').forEach(modal => { if (e.target === modal) modal.classList.remove('show'); }));

  document.querySelectorAll('[data-view-link]').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    const view = btn.dataset.viewLink;
    if ((view === 'libraryView' || view === 'cartView' || view === 'checkoutView') && state.profile?.role === 'admin') return showToast('Administrador não usa essa área.');
    if (view === 'adminView' && state.profile?.role !== 'admin') return showToast('Somente admin.');
    switchView(view, 'Abrindo tela...');
  }));

  document.querySelectorAll('[data-side-filter]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-side-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.quickFilter = btn.dataset.sideFilter;
    renderGames();
  }));
  document.querySelectorAll('[data-genre-quick]').forEach(btn => btn.addEventListener('click', () => {
    $('genreFilter').value = btn.dataset.genreQuick;
    renderGames();
  }));

  $('searchInput').addEventListener('input', renderGames);
  $('genreFilter').addEventListener('change', renderGames);
  $('sortFilter').addEventListener('change', renderGames);
  $('openLogin').addEventListener('click', ()=>openModal('loginModal'));
  $('openRegister').addEventListener('click', ()=>openModal('registerModal'));
  $('loginSubmit').addEventListener('click', authController.loginSubmit);
  $('registerSubmit').addEventListener('click', authController.registerSubmit);
  $('logoutBtn').addEventListener('click', authController.logout);
  $('clearCart').addEventListener('click', storeController.clearCart);
  $('finishPurchase').addEventListener('click', checkoutController.finishPurchase);
  $('goCatalogBtn').addEventListener('click', ()=>document.getElementById('catalogBlock').scrollIntoView({behavior:'smooth'}));
  $('modalFavoriteBtn').addEventListener('click', ()=> state.selectedGameId && storeController.toggleFavorite(state.selectedGameId));
  $('modalAddCart').addEventListener('click', ()=> {
    if (state.profile?.role === 'admin') { closeModal('gameModal'); switchView('adminView','Abrindo painel administrativo...'); }
    else if (state.selectedGameId) storeController.addToCart(state.selectedGameId);
  });
  $('prevHero').addEventListener('click', () => {
    const total = $('heroDots').children.length || 1;
    state.currentSlide = (state.currentSlide - 1 + total) % total;
    updateHeroPosition();
  });
  $('nextHero').addEventListener('click', () => {
    const total = $('heroDots').children.length || 1;
    state.currentSlide = (state.currentSlide + 1) % total;
    updateHeroPosition();
  });

  $('adminUserSearch').addEventListener('input', async e => { state.adminSearchTerm = e.target.value; renderAdmin(); });
  $('adminTypeFilter').addEventListener('change', async e => { state.adminTypeFilter = e.target.value; renderAdmin(); });
  $('adminStatusFilter').addEventListener('change', async e => { state.adminStatusFilter = e.target.value; renderAdmin(); });
  $('adminAddGameBtn').addEventListener('click', adminController.adminAddGame);
  $('saveCarouselBtn').addEventListener('click', adminController.saveCarousel);
  $('savePromoBtn').addEventListener('click', adminController.savePromo);
  $('adminGameSubmitBtn').addEventListener('click', adminController.submitAdminGameForm);
  $('adminCancelEditBtn').addEventListener('click', adminController.resetAdminGameForm);
  $('adminGameHasDiscount')?.addEventListener('change', () => adminController.syncDiscountFields('toggle'));
  $('adminGamePrice')?.addEventListener('input', () => adminController.syncDiscountFields('price'));
  $('adminGameOldPrice')?.addEventListener('input', () => adminController.syncDiscountFields('old'));
  $('adminGameDiscount')?.addEventListener('input', () => adminController.syncDiscountFields('discount'));
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => setAdminTab(btn.dataset.adminTab));
  });

  document.querySelectorAll('.payment-method').forEach(btn => btn.addEventListener('click', () => {
    state.paymentMethod = btn.dataset.payment;
    state.selectedSavedCardId = null;
    updatePaymentUI();
  }));
  $('installmentsSelect')?.addEventListener('change', renderCheckout);
  $('closePurchaseSuccess')?.addEventListener('click', () => {
    hidePurchaseSuccess();
    switchView('libraryView', 'Abrindo biblioteca...');
  });
}

window.App = {
  openGame: storeController.openGame,
  addToCart: storeController.addToCart,
  removeFromCart: storeController.removeFromCart,
  clearCart: storeController.clearCart,
  toggleFavorite: storeController.toggleFavorite,
  goHero,
  switchView,
  showToast,
  selectAdminUser: adminController.selectAdminUser,
  toggleUserStatus: adminController.toggleUserStatus,
  toggleUserRole: adminController.toggleUserRole,
  adminRemoveGame: adminController.adminRemoveGame,
  startEditGame: adminController.startEditGame,
  deleteCatalogGame: adminController.deleteCatalogGame,
  setAdminTab
};

async function bootstrap() {
  try {
    bindEvents();
    hidePurchaseSuccess();
    setupForms();
    restoreAdminTab();

    await refreshAll();
    restorePersistedView();

    authModel.onAuthStateChange(async () => { 
      await refreshAll();
      restorePersistedView();
    });

    document.getElementById('appLoader')?.classList.add('hidden');

  } catch (err) {
    console.error(err);
    showToast(err.message || 'Erro ao iniciar.');
    $('loaderText').textContent = 'Erro ao iniciar. Abre o console.';
  }
}
document.addEventListener('DOMContentLoaded', bootstrap);
