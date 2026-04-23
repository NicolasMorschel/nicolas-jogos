import { state } from '../state.js';
import { $, showToast } from '../utils.js';
import * as adminModel from '../models/adminModel.js';
import * as storeModel from '../models/storeModel.js';
import { refreshAll } from '../app.js';
import { renderAdmin, renderAdminUserDetails } from '../views/adminView.js';
import { switchView } from '../views/commonView.js';

let editingGameId = null;

function normalizeTags(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

function buildGamePayloadFromForm() {
  const title = $('adminGameTitle').value.trim();
  const franchise = $('adminGameFranchise').value.trim();
  const genre = $('adminGameGenre').value;
  const description = $('adminGameDescription').value.trim();
  const tags = normalizeTags($('adminGameTags').value);
  const price = Number(String($('adminGamePrice').value).replace(',', '.'));
  const oldPriceRaw = $('adminGameOldPrice').value.trim();
  const discountRaw = $('adminGameDiscount').value.trim();

  if (!title) throw new Error('Preenche o título do jogo.');
  if (!franchise) throw new Error('Preenche a franquia.');
  if (!genre) throw new Error('Seleciona um gênero.');
  if (!description) throw new Error('Preenche a descrição.');
  if (!Number.isFinite(price) || price < 0) throw new Error('Preço inválido.');

  const old_price = oldPriceRaw === '' ? price : Number(String(oldPriceRaw).replace(',', '.'));
  if (!Number.isFinite(old_price) || old_price < 0) throw new Error('Preço antigo inválido.');

  let discount = discountRaw === '' ? null : Number(discountRaw);
  if (discount !== null && (!Number.isFinite(discount) || discount < 0)) {
    throw new Error('Desconto inválido.');
  }

  if (discount === null) {
    if (old_price > price && old_price > 0) {
      discount = Math.round((1 - price / old_price) * 100);
    } else {
      discount = 0;
    }
  }

  if (old_price <= price && discount > 0) {
    throw new Error('Para usar desconto, o preço antigo precisa ser maior que o atual.');
  }

  return {
    title,
    franchise,
    genre,
    description,
    tags,
    price,
    old_price,
    discount,
    featured: $('adminGameFeatured').checked
  };
}

export function syncAdminGameForm() {
  if (!$('adminGameForm')) return;

  const isEditing = editingGameId !== null;
  $('adminGameFormTitle').textContent = isEditing ? 'Editar jogo do catálogo' : 'Adicionar jogo ao catálogo';
  $('adminGameSubmitBtn').textContent = isEditing ? 'Salvar alterações' : 'Adicionar jogo';
  $('adminCancelEditBtn').classList.toggle('hidden', !isEditing);

  if (isEditing) {
    $('adminGameEditingInfo').textContent = `Editando jogo ID ${editingGameId}`;
  } else {
    $('adminGameEditingInfo').textContent = 'Preenche os dados para cadastrar um novo jogo.';
  }
}

export function resetAdminGameForm() {
  editingGameId = null;

  if ($('adminGameForm')) $('adminGameForm').reset();
  if ($('adminGameGenre')) $('adminGameGenre').value = 'acao-aventura';
  if ($('adminGameDiscount')) $('adminGameDiscount').value = '';
  if ($('adminGameFeatured')) $('adminGameFeatured').checked = false;

  syncAdminGameForm();
}

export function startEditGame(gameId) {
  const game = state.games.find(g => Number(g.id) === Number(gameId));
  if (!game) return showToast('Jogo não encontrado.');

  editingGameId = Number(game.id);

  $('adminGameTitle').value = game.title || '';
  $('adminGameFranchise').value = game.franchise || '';
  $('adminGameGenre').value = game.genre || 'acao-aventura';
  $('adminGamePrice').value = Number(game.price ?? 0);
  $('adminGameOldPrice').value = Number(game.old_price ?? game.price ?? 0);
  $('adminGameDiscount').value = Number(game.discount ?? 0);
  $('adminGameTags').value = Array.isArray(game.tags) ? game.tags.join(', ') : '';
  $('adminGameDescription').value = game.description || '';
  $('adminGameFeatured').checked = !!game.featured;

  syncAdminGameForm();
  $('adminGameTitle').focus();
  showToast('Jogo carregado para edição.');
}

export async function submitAdminGameForm(e) {
  e.preventDefault();

  try {
    const payload = buildGamePayloadFromForm();

    if (editingGameId !== null) {
      const { error } = await adminModel.updateGame(editingGameId, payload);
      if (error) return showToast(error.message);

      await adminModel.addAdminLog({
        admin_id: state.session.user.id,
        action: 'update_catalog_game',
        target_game_id: editingGameId,
        details: payload
      });

      await refreshAll();
      resetAdminGameForm();
      renderAdmin();
      showToast('Jogo atualizado com sucesso.');
      return;
    }

    const { data, error } = await adminModel.createGame(payload);
    if (error) return showToast(error.message);

    await adminModel.addAdminLog({
      admin_id: state.session.user.id,
      action: 'create_catalog_game',
      target_game_id: data?.id || null,
      details: payload
    });

    await refreshAll();
    resetAdminGameForm();
    renderAdmin();
    showToast('Jogo adicionado no catálogo.');
  } catch (err) {
    showToast(err.message || 'Erro ao salvar jogo.');
  }
}

export async function deleteCatalogGame(gameId) {
  const game = state.games.find(g => Number(g.id) === Number(gameId));
  if (!game) return showToast('Jogo não encontrado.');

  const ok = window.confirm(`Remover "${game.title}" do catálogo?`);
  if (!ok) return;

  const relRes = await adminModel.deleteGameRelations(gameId);
  if (relRes.error) return showToast(relRes.error.message);

  const { error } = await adminModel.deleteGame(gameId);
  if (error) return showToast(error.message);

  await adminModel.addAdminLog({
    admin_id: state.session.user.id,
    action: 'delete_catalog_game',
    target_game_id: gameId,
    details: { title: game.title }
  });

  if (editingGameId === Number(gameId)) {
    resetAdminGameForm();
  }

  if (state.currentAdminUserLibraryIds.includes(Number(gameId))) {
    state.currentAdminUserLibraryIds = state.currentAdminUserLibraryIds.filter(id => Number(id) !== Number(gameId));
  }

  await refreshAll();
  renderAdmin();
  showToast('Jogo removido do catálogo.');
}

export async function loadAdminUsers() {
  const { data, error } = await adminModel.fetchAdminUsers();
  if (error) return showToast(error.message);
  state.adminUsers = data || [];
}

export async function selectAdminUser(id) {
  state.selectedAdminUserId = id;
  const { data, error } = await adminModel.fetchUserLibrary(id);
  if (error) return showToast(error.message);
  state.currentAdminUserLibraryIds = (data || []).map(x => x.game_id);
  renderAdmin();
  renderAdminUserDetails();
  syncAdminGameForm();
  showToast('Usuário carregado para gestão.');
}

export async function toggleUserStatus(id, currentStatus) {
  const nextStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
  const { error } = await adminModel.updateUserStatus(id, nextStatus);
  if (error) return showToast(error.message);

  await adminModel.addAdminLog({
    admin_id: state.session.user.id,
    action: nextStatus === 'blocked' ? 'block_user' : 'activate_user',
    target_user_id: id,
    details: { status: nextStatus }
  });

  await refreshAll();
  renderAdmin();
  syncAdminGameForm();
  showToast(nextStatus === 'blocked' ? 'Conta bloqueada.' : 'Conta reativada.');
}

export async function adminAddGame() {
  const gameId = Number($('adminAddGameSelect').value);
  if (!state.selectedAdminUserId || !gameId) return showToast('Seleciona um usuário e um jogo.');

  const { error } = await adminModel.adminAddLibrary(state.selectedAdminUserId, gameId);
  if (error) return showToast(error.message);

  await adminModel.addAdminLog({
    admin_id: state.session.user.id,
    action: 'add_game',
    target_user_id: state.selectedAdminUserId,
    target_game_id: gameId
  });

  await selectAdminUser(state.selectedAdminUserId);
  showToast('Jogo adicionado na biblioteca.');
}

export async function adminRemoveGame(gameId) {
  const { error } = await adminModel.adminRemoveLibrary(state.selectedAdminUserId, gameId);
  if (error) return showToast(error.message);

  await adminModel.addAdminLog({
    admin_id: state.session.user.id,
    action: 'remove_game',
    target_user_id: state.selectedAdminUserId,
    target_game_id: gameId
  });

  await selectAdminUser(state.selectedAdminUserId);
  showToast('Jogo removido da biblioteca.');
}

export async function saveCarousel() {
  const ids = [
    Number($('carouselSelect1').value),
    Number($('carouselSelect2').value),
    Number($('carouselSelect3').value)
  ];

  const { error } = await storeModel.saveStoreSetting('carousel', ids);
  if (error) return showToast(error.message);

  await adminModel.addAdminLog({
    admin_id: state.session.user.id,
    action: 'save_carousel',
    details: { carousel: ids }
  });

  await refreshAll();
  renderAdmin();
  syncAdminGameForm();
  showToast('Carrossel atualizado.');
}

export async function savePromo() {
  const title = $('adminPromoTitle').value.trim();
  const text = $('adminPromoText').value.trim();

  const r1 = await storeModel.saveStoreSetting('promo_title', title);
  if (r1.error) return showToast(r1.error.message);

  const r2 = await storeModel.saveStoreSetting('promo_text', text);
  if (r2.error) return showToast(r2.error.message);

  await adminModel.addAdminLog({
    admin_id: state.session.user.id,
    action: 'save_promo',
    details: { title, text }
  });

  await refreshAll();
  renderAdmin();
  syncAdminGameForm();
  showToast('Oferta atualizada.');
}

export async function openAdmin() {
  await loadAdminUsers();
  renderAdmin();
  syncAdminGameForm();
  switchView('adminView', 'Abrindo painel administrativo...');
}