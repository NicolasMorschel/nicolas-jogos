import { state } from './state.js';

export const $ = (id) => document.getElementById(id);
export const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const isAdmin = () => state.profile?.role === 'admin';
export const isLoggedIn = () => !!state.session?.user;
export const getGame = (id) => state.games.find(g => Number(g.id) === Number(id));

export function coverStyle(title) {
  const map = {
    'God of War':'linear-gradient(135deg,#2f0f10,#8a3f2e)',
    'Red Dead Redemption':'linear-gradient(135deg,#390303,#b22914)',
    'The Last of Us':'linear-gradient(135deg,#17201a,#4f5a41)',
    'Resident Evil':'linear-gradient(135deg,#130c19,#6f2a45)',
    'Assassin’s Creed':'linear-gradient(135deg,#161616,#8f4545)',
    'Call of Duty':'linear-gradient(135deg,#121923,#45566f)',
    'EA Sports FC':'linear-gradient(135deg,#0b3f2e,#42c07f)',
    'The Witcher':'linear-gradient(135deg,#152029,#5f6f7c)',
    'GTA':'linear-gradient(135deg,#0f1824,#45556e)',
    'Cyberpunk':'linear-gradient(135deg,#281a0b,#8f6b1f)'
  };
  return map[title] || 'linear-gradient(135deg,#13203a,#4669aa)';
}

export function coverMarkup(game, large = false) {
  const bg = coverStyle(game.franchise);
  return `<div class="cover-art ${large ? 'cover-large' : ''}" style="background:${bg}"><span>${game.franchise}</span><strong>${game.title}</strong></div>`;
}

export function detectCardBrand(number) {
  const clean = String(number || '').replace(/\D/g, '');
  if (/^4/.test(clean)) return 'Visa';
  if (/^(5[1-5])/.test(clean)) return 'Mastercard';
  if (/^(34|37)/.test(clean)) return 'Amex';
  if (/^(4011|4312|4389)/.test(clean)) return 'Elo';
  return 'Cartão';
}

export function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

export function openModal(id){ $(id)?.classList.add('show'); }
export function closeModal(id){ $(id)?.classList.remove('show'); }

export function showLoader(text='Carregando...', done=900){
  const loader = $('appLoader');
  const bar = $('loaderBar');
  if (!loader || !bar) return;
  $('loaderText').textContent = text;
  loader.classList.remove('hidden');
  bar.style.width = '0%';
  setTimeout(()=> bar.style.width='100%', 20);
  if (done) setTimeout(()=> loader.classList.add('hidden'), done);
}

export function hideLoader(){ $('appLoader')?.classList.add('hidden'); }

export function showPurchaseSuccess() {
  $('purchaseSuccess')?.classList.remove('hidden');
}
export function hidePurchaseSuccess() {
  $('purchaseSuccess')?.classList.add('hidden');
}
