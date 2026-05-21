import { state } from '../state.js';
import { $, showToast, showLoader, hideLoader, detectCardBrand, showPurchaseSuccess } from '../utils.js';
import * as userDataModel from '../models/userDataModel.js';
import { getCheckoutTotalWithPayment } from '../views/checkoutView.js';
import { refreshAll } from '../app.js';

export async function finishPurchase() {
  if (!state.profile) return showToast('Faz login antes de comprar.');
  if (state.profile.role === 'admin') return showToast('Administrador não finaliza compras.');
  if (!state.cartIds.length) return showToast('Teu carrinho está vazio.');

  const name = $('cardName').value.trim();
  const rawNumber = $('cardNumber').value.replace(/\s/g,'');
  const number = rawNumber.replace(/•/g,'').replace(/\D/g,'');
  const date = $('cardDate').value.trim();
  const cvv = $('cardCvv').value.trim();
  const installments = Number($('installmentsSelect')?.value || 1);
  const usingSavedMasked = rawNumber.includes('••••');

  if (state.paymentMethod === 'debito' || state.paymentMethod === 'credito') {
    if (!name) return showToast('Preenche o nome no cartão.');
    if (!usingSavedMasked && number.length < 16) return showToast('Número do cartão inválido.');
    if (date.length < 5) return showToast('Validade inválida.');
    if (cvv.length < 3) return showToast('CVV inválido.');
  }

  showLoader(state.paymentMethod === 'pix' ? 'Gerando cobrança Pix...' : 'Processando pagamento...', 0);

  const total = getCheckoutTotalWithPayment();
  const { data: purchaseRow, error: purchaseError } = await userDataModel.createPurchase({
    user_id: state.session.user.id,
    payment_method: state.paymentMethod,
    installments: state.paymentMethod === 'credito' ? installments : 1,
    total
  });
  if (purchaseError) {
    hideLoader();
    return showToast(purchaseError.message);
  }

  const rows = state.cartIds.map(game_id => ({ user_id: state.session.user.id, game_id, source: 'purchase' }));
  const { error: libError } = await userDataModel.upsertLibrary(rows);
  if (libError) {
    hideLoader();
    return showToast(libError.message);
  }

  const { error: purchaseItemsError } = await userDataModel.createPurchaseItems(
    state.cartIds.map(game_id => ({ purchase_id: purchaseRow.id, game_id }))
  );
  if (purchaseItemsError) {
    hideLoader();
    return showToast(purchaseItemsError.message);
  }

  if ((state.paymentMethod === 'debito' || state.paymentMethod === 'credito') && $('saveCardCheckbox')?.checked && !usingSavedMasked) {
    const last4 = number.slice(-4);
    const brand = detectCardBrand(number);
    const exists = state.savedCards.some(c => c.last4 === last4 && c.holder_name === name);
    if (!exists) {
      const { error: saveCardError } = await userDataModel.saveCard({
        user_id: state.session.user.id,
        brand,
        last4,
        holder_name: name
      });
      if (saveCardError) {
        hideLoader();
        return showToast(saveCardError.message);
      }
    }
  }

  const { error: clearError } = await userDataModel.clearCart(state.session.user.id);
  if (clearError) {
    hideLoader();
    return showToast(clearError.message);
  }

  state.selectedSavedCardId = null;
  await refreshAll();
  hideLoader();
  showPurchaseSuccess();
  showToast(state.paymentMethod === 'pix' ? 'Pagamento Pix confirmado.' : 'Compra aprovada.');
}
