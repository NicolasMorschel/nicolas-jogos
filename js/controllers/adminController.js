import { state } from '../state.js';
import { $, showToast } from '../utils.js';
import * as adminModel from '../models/adminModel.js';
import * as storeModel from '../models/storeModel.js';
import { refreshAll } from '../app.js';
import { renderAdmin, renderAdminUserDetails } from '../views/adminView.js';
import { switchView } from '../views/commonView.js';

let editingGameId = null;
let savingGame = false;

function makeTimeoutSignal(ms = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function patchPendingGame(tempId, patch) {
  state.games = state.games.map(game => (
    Number(game.id) === Number(tempId) ? { ...game, ...patch } : game
  ));
  renderAdmin();
}

function replacePendingGame(tempId, savedGame) {
  state.games = state.games
    .map(game => Number(game.id) === Number(tempId) ? savedGame : game)
    .sort((a, b) => Number(a.id) - Number(b.id));
  renderAdmin();
}

async function reconcilePendingGame(tempId, payload) {
  const { data, error } = await adminModel.findGameByTitle(payload.title);
  if (!error && data) {
    replacePendingGame(tempId, data);
    showToast('Jogo confirmado no banco.');
    return true;
  }

  return false;
}

async function persistCreatedGame(tempId, payload) {
  const slowTimer = setTimeout(() => {
    patchPendingGame(tempId, { syncMessage: 'Demorando para confirmar...' });
  }, 8000);
  const timeout = makeTimeoutSignal();

  try {
    const { data, error } = await adminModel.createGame(payload, timeout.signal);
    if (error) throw error;

    if (data) {
      replacePendingGame(tempId, data);
      showToast('Jogo salvo no banco.');
    }
  } catch (err) {
    const reconciled = err?.name === 'AbortError'
      ? await reconcilePendingGame(tempId, payload)
      : false;

    if (!reconciled) {
      patchPendingGame(tempId, {
        pendingSync: false,
        syncError: true,
        syncMessage: err?.name === 'AbortError'
          ? 'Não consegui confirmar no banco.'
          : (err.message || 'Erro ao salvar jogo.')
      });
      showToast(err?.name === 'AbortError' ? 'O cadastro demorou demais. Tenta de novo.' : (err.message || 'Erro ao salvar jogo.'));
    }
  } finally {
    clearTimeout(slowTimer);
    timeout.clear();
  }
}

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
  e?.preventDefault();
  if (savingGame) return;
  const submitBtn = $('adminGameSubmitBtn');
  const wasEditingGameId = editingGameId;

  try {
    savingGame = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Salvando...';
    }
    const payload = buildGamePayloadFromForm();

    if (wasEditingGameId !== null) {
      const previousGames = [...state.games];
      state.games = state.games.map(game => Number(game.id) === Number(wasEditingGameId) ? { ...game, ...payload } : game);
      resetAdminGameForm();
      renderAdmin();
      showToast('Alteração enviada.');

      const { data, error } = await adminModel.updateGame(wasEditingGameId, payload);
      if (error) {
        state.games = previousGames;
        renderAdmin();
        return showToast(error.message);
      }

      state.games = state.games.map(game => Number(game.id) === Number(wasEditingGameId) ? (data || game) : game);
      renderAdmin();

      showToast('Jogo atualizado com sucesso.');
      return;
    }

    const tempId = -Date.now();
    const optimisticGame = {
      id: tempId,
      ...payload,
      pendingSync: true,
      syncError: false,
      syncMessage: 'Sincronizando...',
      syncPayload: payload
    };
    state.games = [...state.games, optimisticGame].sort((a, b) => Number(a.id) - Number(b.id));
    resetAdminGameForm();
    renderAdmin();
    showToast('Jogo enviado. Pode cadastrar o próximo.');

    persistCreatedGame(tempId, payload);
  } catch (err) {
    console.error(err);
    const message = err.message || 'Erro ao salvar jogo.';
    if (wasEditingGameId === null) {
      state.games = state.games.filter(game => Number(game.id) >= 0);
      renderAdmin();
    }
    showToast(message);
  } finally {
    savingGame = false;
    if ($('adminGameSubmitBtn')) {
      $('adminGameSubmitBtn').disabled = false;
      syncAdminGameForm();
    }
  }
}

export function retryPendingGame(tempId) {
  const game = state.games.find(item => Number(item.id) === Number(tempId));
  if (!game?.syncPayload) return showToast('Não encontrei os dados desse cadastro.');

  patchPendingGame(tempId, {
    pendingSync: true,
    syncError: false,
    syncMessage: 'Sincronizando...'
  });
  persistCreatedGame(tempId, game.syncPayload);
}

export function discardPendingGame(tempId) {
  state.games = state.games.filter(game => Number(game.id) !== Number(tempId));
  renderAdmin();
  showToast('Cadastro pendente removido da tela.');
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
  state.adminTab = 'library';
  const { data, error } = await adminModel.fetchUserLibrary(id);
  if (error) return showToast(error.message);
  state.currentAdminUserLibraryItems = data || [];
  state.currentAdminUserLibraryIds = state.currentAdminUserLibraryItems.map(x => x.game_id);
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

export async function toggleUserRole(id, currentRole) {
  if (id === state.session?.user?.id) {
    return showToast('Você não pode alterar o próprio tipo de conta.');
  }

  const nextRole = currentRole === 'admin' ? 'user' : 'admin';
  const label = nextRole === 'admin' ? 'promover este usuário para admin' : 'rebaixar este admin para usuário';
  const ok = window.confirm(`Tem certeza que deseja ${label}?`);
  if (!ok) return;

  const { error } = await adminModel.updateUserRole(id, nextRole);
  if (error) return showToast(error.message);

  await adminModel.addAdminLog({
    admin_id: state.session.user.id,
    action: nextRole === 'admin' ? 'promote_user_to_admin' : 'demote_admin_to_user',
    target_user_id: id,
    details: { role: nextRole }
  });

  await refreshAll();
  renderAdmin();
  syncAdminGameForm();
  showToast(nextRole === 'admin' ? 'Usuário promovido para admin.' : 'Admin rebaixado para usuário.');
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
  const item = state.currentAdminUserLibraryItems.find(row => Number(row.game_id) === Number(gameId));
  if (item?.source !== 'admin_grant') {
    return showToast('Jogo comprado não pode ser removido por aqui.');
  }

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
