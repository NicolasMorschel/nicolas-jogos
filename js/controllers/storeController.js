import { state } from '../state.js';
import { $, isAdmin, isLoggedIn, showToast, openModal } from '../utils.js';
import * as userDataModel from '../models/userDataModel.js';
import { refreshAll } from '../app.js';
import { switchView } from '../views/commonView.js';
import { renderGameModal, goHero } from '../views/storeView.js';

export async function toggleFavorite(id) {
  if (isAdmin()) return showToast('Administrador não usa favoritos.');
  if (!isLoggedIn()) return showToast('Faz login antes de favoritar.');
  const exists = state.favoriteIds.includes(id);
  const res = exists ? await userDataModel.deleteFavorite(state.session.user.id, id) : await userDataModel.insertFavorite(state.session.user.id, id);
  if (res.error) return showToast(res.error.message);
  await refreshAll();
}

export async function addToCart(id) {
  if (isAdmin()) return showToast('Administrador não compra jogos.');
  if (!isLoggedIn()) return showToast('Faz login antes de comprar.');
  if (state.cartIds.includes(id)) return showToast('Esse jogo já está no carrinho.');
  const { error } = await userDataModel.insertCart(state.session.user.id, id);
  if (error) return showToast(error.message);
  await refreshAll();
  showToast('Jogo adicionado ao carrinho.');
}

export async function removeFromCart(id) {
  const { error } = await userDataModel.deleteCart(state.session.user.id, id);
  if (error) return showToast(error.message);
  await refreshAll();
}

export async function clearCart() {
  if (!isLoggedIn()) return showToast('Faz login antes de limpar o carrinho.');
  const { error } = await userDataModel.clearCart(state.session.user.id);
  if (error) return showToast(error.message);
  await refreshAll();
  showToast('Carrinho limpo.');
}

export function openGame(id) {
  state.selectedGameId = id;
  renderGameModal();
  openModal('gameModal');
}

export { goHero, switchView };
