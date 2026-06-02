import type { AuthState, Friendship, Profile } from '../../types';
import * as api from '../../services';

export function useFriendActions({
  auth,
  friendships,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  friendships: Friendship[];
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  async function requestFriend(targetId: string) {
    if (!auth.user) return showToast('Faz login para adicionar amigos.');
    if (targetId === auth.user.id) return showToast('Você já está no próprio perfil.');
    const existing = friendships.find(friendship =>
      (friendship.requester_id === auth.user?.id && friendship.addressee_id === targetId)
      || (friendship.addressee_id === auth.user?.id && friendship.requester_id === targetId)
    );
    if (existing?.status === 'rejected') {
      const retryRes = await api.updateFriendshipStatus(existing.id, 'pending');
      if (retryRes.error) return showToast(retryRes.error.message);
      await refreshAll();
      return showToast('Solicitação de amizade reenviada.');
    }
    const { error } = await api.requestFriendship(auth.user.id, targetId);
    if (error) return showToast(error.code === '23505' ? 'Já existe uma solicitação ou amizade com esse usuário.' : error.message);
    await refreshAll();
    showToast('Solicitação de amizade enviada.');
  }

  async function updateFriendship(friendship: Friendship, status: Friendship['status']) {
    const { error } = await api.updateFriendshipStatus(friendship.id, status);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast(status === 'accepted' ? 'Amizade aceita.' : 'Solicitação atualizada.');
  }

  return { requestFriend, updateFriendship };
}
