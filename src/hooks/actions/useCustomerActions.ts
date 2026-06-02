import type { Dispatch, SetStateAction } from 'react';
import type { AuthState, CardForm, PaymentMethod, Profile, SavedCard } from '../../types';
import * as api from '../../services';
import { detectCardBrand } from '../../utils';

export function useCustomerActions({
  auth,
  isAdmin,
  isLoggedIn,
  cartIds,
  favoriteIds,
  libraryIds,
  cardForm,
  setCardForm,
  paymentMethod,
  installments,
  checkoutTotal,
  savedCards,
  setLoading,
  setLoaderText,
  setSelectedSavedCardId,
  setPurchaseSuccess,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  isAdmin: boolean;
  isLoggedIn: boolean;
  cartIds: number[];
  favoriteIds: number[];
  libraryIds: number[];
  cardForm: CardForm;
  setCardForm: Dispatch<SetStateAction<CardForm>>;
  paymentMethod: PaymentMethod;
  installments: number;
  checkoutTotal: number;
  savedCards: SavedCard[];
  setLoading: Dispatch<SetStateAction<boolean>>;
  setLoaderText: Dispatch<SetStateAction<string>>;
  setSelectedSavedCardId: Dispatch<SetStateAction<number | null>>;
  setPurchaseSuccess: Dispatch<SetStateAction<boolean>>;
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  async function toggleFavorite(gameId: number) {
    if (isAdmin) return showToast('Administrador não usa favoritos.');
    if (!isLoggedIn || !auth.user) return showToast('Faz login antes de favoritar.');
    const exists = favoriteIds.includes(gameId);
    const result = exists ? await api.deleteFavorite(auth.user.id, gameId) : await api.insertFavorite(auth.user.id, gameId);
    if (result.error) return showToast(result.error.message);
    await refreshAll();
  }

  async function addToCart(gameId: number) {
    if (isAdmin) return showToast('Administrador não compra jogos.');
    if (!isLoggedIn || !auth.user) return showToast('Faz login antes de comprar.');
    if (libraryIds.includes(gameId)) return showToast('Esse jogo ja esta na tua biblioteca.');
    if (cartIds.includes(gameId)) return showToast('Esse jogo já está no carrinho.');
    const { error } = await api.insertCart(auth.user.id, gameId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Jogo adicionado ao carrinho.');
  }

  async function removeFromCart(gameId: number) {
    if (!auth.user) return showToast('Faz login antes de remover do carrinho.');
    const { error } = await api.deleteCart(auth.user.id, gameId);
    if (error) return showToast(error.message);
    await refreshAll();
  }

  async function moveCartItemToFavorites(gameId: number) {
    if (!auth.user) return showToast('Faz login antes de salvar para depois.');
    if (!favoriteIds.includes(gameId)) {
      const favoriteRes = await api.insertFavorite(auth.user.id, gameId);
      if (favoriteRes.error) return showToast(favoriteRes.error.message);
    }
    const cartRes = await api.deleteCart(auth.user.id, gameId);
    if (cartRes.error) return showToast(cartRes.error.message);
    await refreshAll();
    showToast('Jogo salvo nos favoritos.');
  }

  async function clearCart() {
    if (!auth.user) return showToast('Faz login antes de limpar o carrinho.');
    const { error } = await api.clearCart(auth.user.id);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Carrinho limpo.');
  }

  async function finishPurchase() {
    if (!auth.user || !auth.profile) return showToast('Faz login antes de comprar.');
    if (auth.profile.role === 'admin') return showToast('Administrador não finaliza compras.');
    if (!cartIds.length) return showToast('Teu carrinho está vazio.');

    const cleanNumber = cardForm.number.replace(/\s/g, '').replace(/•/g, '').replace(/\D/g, '');
    const usingSavedMasked = cardForm.number.includes('•');

    if (paymentMethod === 'debito' || paymentMethod === 'credito') {
      if (!cardForm.name.trim()) return showToast('Preenche o nome no cartão.');
      if (!usingSavedMasked && cleanNumber.length < 16) return showToast('Número do cartão inválido.');
      if (cardForm.date.length < 5) return showToast('Validade inválida.');
      if (cardForm.cvv.length < 3) return showToast('CVV inválido.');
    }

    setLoading(true);
    setLoaderText(paymentMethod === 'pix' ? 'Gerando cobrança Pix...' : 'Processando pagamento...');

    const purchaseRes = await api.createPurchase({
      user_id: auth.user.id,
      payment_method: paymentMethod,
      installments: paymentMethod === 'credito' ? installments : 1,
      total: checkoutTotal
    });
    if (purchaseRes.error) {
      setLoading(false);
      return showToast(purchaseRes.error.message);
    }

    const libraryRows = cartIds.map(game_id => ({ user_id: auth.user!.id, game_id, source: 'purchase' as const }));
    const libraryRes = await api.upsertLibrary(libraryRows);
    if (libraryRes.error) {
      setLoading(false);
      return showToast(libraryRes.error.message);
    }

    const itemsRes = await api.createPurchaseItems(cartIds.map(game_id => ({ purchase_id: purchaseRes.data.id, game_id })));
    if (itemsRes.error) {
      setLoading(false);
      return showToast(itemsRes.error.message);
    }

    if ((paymentMethod === 'debito' || paymentMethod === 'credito') && cardForm.save && !usingSavedMasked) {
      const last4 = cleanNumber.slice(-4);
      const exists = savedCards.some(card => card.last4 === last4 && card.holder_name === cardForm.name.trim());
      if (!exists) {
        const saveRes = await api.saveCard({
          user_id: auth.user.id,
          brand: detectCardBrand(cleanNumber),
          last4,
          holder_name: cardForm.name.trim()
        });
        if (saveRes.error) {
          setLoading(false);
          return showToast(saveRes.error.message);
        }
      }
    }

    const clearRes = await api.clearCart(auth.user.id);
    if (clearRes.error) {
      setLoading(false);
      return showToast(clearRes.error.message);
    }

    setSelectedSavedCardId(null);
    setCardForm({ name: '', number: '', date: '', cvv: '', save: false });
    await refreshAll();
    setLoading(false);
    setPurchaseSuccess(true);
    showToast(paymentMethod === 'pix' ? 'Pagamento Pix confirmado.' : 'Compra aprovada.');
  }

  return { toggleFavorite, addToCart, moveCartItemToFavorites, removeFromCart, clearCart, finishPurchase };
}
