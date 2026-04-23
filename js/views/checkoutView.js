import { state } from '../state.js';
import { $, brl, getGame } from '../utils.js';

export function getBaseCheckoutTotal() {
  return state.cartIds.reduce((s,id)=>s + Number(getGame(id)?.price || 0), 0) + (state.cartIds.length ? 4.9 : 0);
}
export function getInstallmentsMultiplier(installments) {
  const i = Number(installments || 1);
  return i <= 1 ? 1 : 1 + (i * 0.02);
}
export function getCheckoutTotalWithPayment() {
  const base = getBaseCheckoutTotal();
  if (state.paymentMethod !== 'credito') return base;
  return base * getInstallmentsMultiplier($('installmentsSelect')?.value || 1);
}
export function updatePaymentUI() {
  document.querySelectorAll('.payment-method').forEach(btn => btn.classList.toggle('active', btn.dataset.payment === state.paymentMethod));
  const showCard = state.paymentMethod === 'debito' || state.paymentMethod === 'credito';
  $('pixBox')?.classList.toggle('hidden', state.paymentMethod !== 'pix');
  $('cardFormBox')?.classList.toggle('hidden', !showCard);
  $('savedCardsBox')?.classList.toggle('hidden', !showCard);
  $('installmentsBox')?.classList.toggle('hidden', state.paymentMethod !== 'credito');
  renderSavedCards();
  renderCheckout();
}
export function renderSavedCards() {
  const box = $('savedCardsBox');
  if (!box) return;
  if (!(state.paymentMethod === 'debito' || state.paymentMethod === 'credito')) {
    box.innerHTML = '';
    return;
  }
  if (!state.savedCards.length) {
    box.innerHTML = '<p class="helper">Nenhum cartão salvo ainda.</p>';
    return;
  }
  box.innerHTML = '<p class="helper">Cartões salvos</p>' + state.savedCards.map(card => `
    <button type="button" class="saved-card-item ${state.selectedSavedCardId === card.id ? 'active' : ''}" data-id="${card.id}">
      <span>${card.brand}</span>
      <strong>•••• ${card.last4}</strong>
      <small>${card.holder_name}</small>
    </button>
  `).join('');
  box.querySelectorAll('.saved-card-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedSavedCardId = Number(btn.dataset.id);
      const card = state.savedCards.find(c => Number(c.id) === state.selectedSavedCardId);
      if (card) {
        $('cardName').value = card.holder_name || '';
        $('cardNumber').value = `•••• •••• •••• ${card.last4}`;
        $('cardDate').value = '';
        $('cardCvv').value = '';
      }
      renderSavedCards();
    });
  });
}
export function renderCheckout() {
  $('checkoutItems').innerHTML = state.cartIds.map(id => {
    const g = getGame(id);
    return `<div class="checkout-line"><span>${g.title}</span><strong>${brl(g.price)}</strong></div>`;
  }).join('') || '<div class="checkout-line"><span>Nenhum item no pedido</span><strong>R$ 0,00</strong></div>';
  const total = getCheckoutTotalWithPayment();
  $('checkoutTotal').textContent = brl(total);
  const hint = $('installmentsHint');
  if (hint) {
    const installments = Number($('installmentsSelect')?.value || 1);
    if (state.paymentMethod !== 'credito') hint.textContent = 'Pagamento à vista';
    else if (installments === 1) hint.textContent = '1x sem juros';
    else hint.textContent = `${installments}x de ${brl(total / installments)} com juros`;
  }
}
