import type { Dispatch, SetStateAction } from 'react';
import type { AdminTab, AdminUser, AuthState, GameForm, GameRestriction, GameRestrictionForm, LibraryItem, Profile } from '../../types';
import * as api from '../../services';
import { expiresAtForDuration, restrictionTypeLabel } from '../../domain/restrictions';
import { useAdminCatalogActions } from './admin/useAdminCatalogActions';
import { useAdminStoreSettingsActions } from './admin/useAdminStoreSettingsActions';

export function useAdminActions({
  auth,
  selectedAdminUserId,
  setSelectedAdminUserId,
  setAdminTab,
  adminLibraryItems,
  setAdminLibraryItems,
  setAdminGameRestrictions,
  addGameId,
  restrictionForm,
  setRestrictionForm,
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
  setAdminGameRestrictions: Dispatch<SetStateAction<GameRestriction[]>>;
  addGameId: string;
  restrictionForm: GameRestrictionForm;
  setRestrictionForm: Dispatch<SetStateAction<GameRestrictionForm>>;
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
  const catalogActions = useAdminCatalogActions({
    auth,
    gameForm,
    setGameForm,
    editingGameId,
    setEditingGameId,
    savingGame,
    setSavingGame,
    refreshAll,
    showToast
  });
  const storeSettingsActions = useAdminStoreSettingsActions({
    auth,
    carouselForm,
    promoForm,
    refreshAll,
    showToast
  });

  async function selectAdminUser(userId: string) {
    setSelectedAdminUserId(userId);
    setAdminTab('library');
    const [libraryRes, restrictionsRes] = await Promise.all([
      api.fetchUserLibrary(userId),
      api.fetchUserGameRestrictions(userId)
    ]);
    if (libraryRes.error) return showToast(libraryRes.error.message);
    if (restrictionsRes.error) return showToast(restrictionsRes.error.message);
    setAdminLibraryItems(libraryRes.data || []);
    setAdminGameRestrictions(restrictionsRes.data || []);
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

  async function applyGameRestriction() {
    const gameId = Number(restrictionForm.gameId);
    const reason = restrictionForm.reason.trim();

    if (!selectedAdminUserId) return showToast('Seleciona um usuário antes de moderar jogo.');
    if (!gameId) return showToast('Seleciona um jogo para aplicar a restrição.');
    if (!reason) return showToast('Escreve o motivo da restrição.');

    const restrictionType = restrictionForm.type;
    const expiresAt = restrictionType === 'temporary_ban'
      ? expiresAtForDuration(restrictionForm.duration)
      : null;

    if (restrictionType !== 'warning') {
      const revokeRes = await api.revokeActiveGameBans(selectedAdminUserId, gameId, auth.user?.id || null);
      if (revokeRes.error) return showToast(revokeRes.error.message);
    }

    const { error } = await api.createGameRestriction({
      user_id: selectedAdminUserId,
      game_id: gameId,
      restriction_type: restrictionType,
      reason,
      expires_at: expiresAt,
      created_by: auth.user?.id || null
    });
    if (error) return showToast(error.message);

    if (auth.user) {
      await api.addAdminLog({
        admin_id: auth.user.id,
        action: `game_${restrictionType}`,
        target_user_id: selectedAdminUserId,
        target_game_id: gameId,
        details: { reason, expires_at: expiresAt }
      });
    }

    setRestrictionForm(current => ({ ...current, reason: '' }));
    await selectAdminUser(selectedAdminUserId);
    showToast(`${restrictionTypeLabel(restrictionType)} aplicado ao jogo.`);
  }

  async function revokeGameRestriction(restriction: GameRestriction) {
    const { error } = await api.revokeGameRestriction(restriction.id, auth.user?.id || null);
    if (error) return showToast(error.message);
    if (auth.user) {
      await api.addAdminLog({
        admin_id: auth.user.id,
        action: 'revoke_game_restriction',
        target_user_id: restriction.user_id,
        target_game_id: Number(restriction.game_id),
        details: { restriction_id: restriction.id, type: restriction.restriction_type }
      });
    }
    await selectAdminUser(restriction.user_id);
    showToast('Restrição revogada.');
  }

  return {
    selectAdminUser,
    toggleUserStatus,
    toggleUserRole,
    adminAddGame,
    adminRemoveGame,
    applyGameRestriction,
    revokeGameRestriction,
    ...catalogActions,
    ...storeSettingsActions
  };
}
