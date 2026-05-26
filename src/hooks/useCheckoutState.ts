import { useCallback, useState } from 'react';
import type { CardForm, Game, PaymentMethod } from '../types';
import { emptyCardForm } from '../config/app';

export function useCheckoutState(cartGames: Game[]) {
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>('pix');
  const [installments, setInstallments] = useState(1);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<number | null>(null);
  const [cardForm, setCardForm] = useState<CardForm>(emptyCardForm);

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setPaymentMethodState(method);
    setSelectedSavedCardId(null);
  }, []);

  const cartSubtotal = cartGames.reduce((sum, game) => sum + Number(game.price || 0), 0);
  const cartFee = cartGames.length ? 4.9 : 0;
  const baseCheckoutTotal = cartSubtotal + cartFee;
  const checkoutTotal = paymentMethod === 'credito'
    ? baseCheckoutTotal * (installments <= 1 ? 1 : 1 + installments * 0.02)
    : baseCheckoutTotal;

  return {
    paymentMethod,
    setPaymentMethod,
    installments,
    setInstallments,
    selectedSavedCardId,
    setSelectedSavedCardId,
    cardForm,
    setCardForm,
    cartSubtotal,
    cartFee,
    checkoutTotal
  };
}
