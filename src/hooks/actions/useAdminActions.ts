import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { AdminTab, AdminUser, AuthState, Game, GameForm, Genre, LibraryItem, Profile } from '../../types';
import * as api from '../../services';
import { emptyGameForm } from '../../config/app';
import { gamePayloadFromForm, syncDiscountForm } from '../../domain/gameForm';
import { formatMoney, hasGameDiscount } from '../../utils';

export function useAdminActions({
  auth,
  selectedAdminUserId,
  setSelectedAdminUserId,
  setAdminTab,
  adminLibraryItems,
  setAdminLibraryItems,
  addGameId,
  gameForm,
  setGameForm,
  editingGameId,
  setEditingGameId,
  savingGame,
  setSavingGame,
  carouselForm,
  promoForm,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  selectedAdminUserId: string;
  setSelectedAdminUserId: Dispatch<SetStateAction<string>>;
  setAdminTab: (tab: AdminTab) => void;
  adminLibraryItems: LibraryItem[];
  setAdminLibraryItems: Dispatch<SetStateAction<LibraryItem[]>>;
  addGameId: string;
  gameForm: GameForm;
  setGameForm: Dispatch<SetStateAction<GameForm>>;
  editingGameId: number | null;
  setEditingGameId: Dispatch<SetStateAction<number | null>>;
  savingGame: boolean;
  setSavingGame: Dispatch<SetStateAction<boolean>>;
  carouselForm: string[];
  promoForm: { title: string; text: string };
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  async function selectAdminUser(userId: string) {
    setSelectedAdminUserId(userId);
    setAdminTab('library');
    const { data, error } = await api.fetchUserLibrary(userId);
    if (error) return showToast(error.message);
    setAdminLibraryItems(data || []);
    showToast('Usuário carregado para gestão.');
  }

  async function toggleUserStatus(user: AdminUser) {
    const nextStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const { error } = await api.updateUserStatus(user.id, nextStatus);
    if (error) return showToast(error.message);
    if (auth.user) {
      await api.addAdminLog({
        admin_id: auth.user.id,
        action: nextStatus === 'blocked' ? 'block_user' : 'activate_user',
        target_user_id: user.id,
        details: { status: nextStatus }
      });
    }
    await refreshAll();
    showToast(nextStatus === 'blocked' ? 'Conta bloqueada.' : 'Conta reativada.');
  }

  async function toggleUserRole(user: AdminUser) {
    if (user.id === auth.user?.id) return showToast('Você não pode alterar o próprio tipo de conta.');
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const label = nextRole === 'admin' ? 'promover este usuário para admin' : 'rebaixar este admin para usuário';
    if (!window.confirm(`Tem certeza que deseja ${label}?`)) return;

    const { error } = await api.updateUserRole(user.id, nextRole);
    if (error) return showToast(error.message);
    if (auth.user) {
      await api.addAdminLog({
        admin_id: auth.user.id,
        action: nextRole === 'admin' ? 'promote_user_to_admin' : 'demote_admin_to_user',
        target_user_id: user.id,
        details: { role: nextRole }
      });
    }
    await refreshAll();
    showToast(nextRole === 'admin' ? 'Usuário promovido para admin.' : 'Admin rebaixado para usuário.');
  }

  async function adminAddGame() {
    const gameId = Number(addGameId);
    if (!selectedAdminUserId || !gameId) return showToast('Seleciona um usuário e um jogo.');
    const { error } = await api.adminAddLibrary(selectedAdminUserId, gameId);
    if (error) return showToast(error.message);
    if (auth.user) {
      await api.addAdminLog({
        admin_id: auth.user.id,
        action: 'add_game',
        target_user_id: selectedAdminUserId,
        target_game_id: gameId
      });
    }
    await selectAdminUser(selectedAdminUserId);
    await refreshAll();
    showToast('Jogo adicionado na biblioteca.');
  }

  async function adminRemoveGame(gameId: number) {
    const item = adminLibraryItems.find(row => Number(row.game_id) === Number(gameId));
    if (item?.source !== 'admin_grant') return showToast('Jogo comprado não pode ser removido por aqui.');
    const { error } = await api.adminRemoveLibrary(selectedAdminUserId, gameId);
    if (error) return showToast(error.message);
    if (auth.user) {
      await api.addAdminLog({
        admin_id: auth.user.id,
        action: 'remove_game',
        target_user_id: selectedAdminUserId,
        target_game_id: gameId
      });
    }
    await selectAdminUser(selectedAdminUserId);
    await refreshAll();
    showToast('Jogo removido da biblioteca.');
  }

  function startEditGame(game: Game) {
    const discounted = hasGameDiscount(game);
    setEditingGameId(Number(game.id));
    setGameForm({
      title: game.title || '',
      franchise: game.franchise || '',
      genre: (game.genre || 'acao-aventura') as Genre,
      price: formatMoney(Number(game.price || 0)),
      oldPrice: discounted ? formatMoney(Number(game.old_price || game.price || 0)) : '',
      discount: discounted ? String(Number(game.discount || 0)) : '',
      hasDiscount: discounted,
      featured: !!game.featured,
      tags: Array.isArray(game.tags) ? game.tags.join(', ') : '',
      description: game.description || ''
    });
    showToast('Jogo carregado para edição.');
  }

  function resetGameForm() {
    setEditingGameId(null);
    setGameForm(emptyGameForm);
  }

  async function submitGameForm(event: FormEvent) {
    event.preventDefault();
    if (savingGame) return;
    setSavingGame(true);
    try {
      const payload = gamePayloadFromForm(gameForm);
      if (editingGameId !== null) {
        const { error } = await api.updateGame(editingGameId, payload);
        if (error) return showToast(error.message);
        showToast('Jogo atualizado com sucesso.');
      } else {
        const { error } = await api.createGame(payload);
        if (error) return showToast(error.message);
        showToast('Jogo salvo no banco.');
      }
      resetGameForm();
      await refreshAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao salvar jogo.');
    } finally {
      setSavingGame(false);
    }
  }

  async function deleteCatalogGame(game: Game) {
    if (!window.confirm(`Remover "${game.title}" do catálogo?`)) return;
    const relRes = await api.deleteGameRelations(Number(game.id));
    if (relRes.error) return showToast(relRes.error.message);
    const { error } = await api.deleteGame(Number(game.id));
    if (error) return showToast(error.message);
    if (auth.user) {
      await api.addAdminLog({
        admin_id: auth.user.id,
        action: 'delete_catalog_game',
        target_game_id: Number(game.id),
        details: { title: game.title }
      });
    }
    if (editingGameId === Number(game.id)) resetGameForm();
    await refreshAll();
    showToast('Jogo removido do catálogo.');
  }

  async function saveCarousel() {
    const ids = carouselForm.map(Number).filter(Boolean);
    const { error } = await api.saveStoreSetting('carousel', ids);
    if (error) return showToast(error.message);
    if (auth.user) {
      await api.addAdminLog({ admin_id: auth.user.id, action: 'save_carousel', details: { carousel: ids } });
    }
    await refreshAll();
    showToast('Carrossel atualizado.');
  }

  async function savePromo() {
    const titleRes = await api.saveStoreSetting('promo_title', promoForm.title.trim());
    if (titleRes.error) return showToast(titleRes.error.message);
    const textRes = await api.saveStoreSetting('promo_text', promoForm.text.trim());
    if (textRes.error) return showToast(textRes.error.message);
    if (auth.user) {
      await api.addAdminLog({ admin_id: auth.user.id, action: 'save_promo', details: promoForm });
    }
    await refreshAll();
    showToast('Oferta atualizada.');
  }

  function updateGameForm(next: Partial<GameForm>, source?: 'toggle' | 'price' | 'old' | 'discount') {
    setGameForm(current => {
      const merged = { ...current, ...next };
      return source ? syncDiscountForm(merged, source) : merged;
    });
  }

  return {
    selectAdminUser,
    toggleUserStatus,
    toggleUserRole,
    adminAddGame,
    adminRemoveGame,
    startEditGame,
    resetGameForm,
    submitGameForm,
    deleteCatalogGame,
    saveCarousel,
    savePromo,
    updateGameForm
  };
}
