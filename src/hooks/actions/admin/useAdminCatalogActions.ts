import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { AuthState, Game, GameForm, Genre, Profile } from '../../../types';
import * as api from '../../../services';
import { emptyGameForm } from '../../../config/app';
import { gamePayloadFromForm, syncDiscountForm } from '../../../domain/gameForm';
import { formatMoney, hasGameDiscount } from '../../../utils';

export function useAdminCatalogActions({
  auth,
  gameForm,
  setGameForm,
  editingGameId,
  setEditingGameId,
  savingGame,
  setSavingGame,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  gameForm: GameForm;
  setGameForm: Dispatch<SetStateAction<GameForm>>;
  editingGameId: number | null;
  setEditingGameId: Dispatch<SetStateAction<number | null>>;
  savingGame: boolean;
  setSavingGame: Dispatch<SetStateAction<boolean>>;
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
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

  function updateGameForm(next: Partial<GameForm>, source?: 'toggle' | 'price' | 'old' | 'discount') {
    setGameForm(current => {
      const merged = { ...current, ...next };
      return source ? syncDiscountForm(merged, source) : merged;
    });
  }

  return {
    startEditGame,
    resetGameForm,
    submitGameForm,
    deleteCatalogGame,
    updateGameForm
  };
}
