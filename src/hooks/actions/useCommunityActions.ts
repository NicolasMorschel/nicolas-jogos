import type { AuthState, CommunityChannelType, Profile } from '../../types';
import * as api from '../../services';

export function useCommunityActions({
  auth,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  async function createChatGroup(name: string, memberIds: string[]) {
    if (!auth.user) return showToast('Faz login para criar grupos.');
    if (!name.trim()) return showToast('Da um nome para o grupo.');
    if (!memberIds.length) return showToast('Escolhe pelo menos um amigo.');
    const { error } = await api.createChatGroup(auth.user.id, name, memberIds);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Grupo criado.');
  }

  async function createCommunityServer(name: string, description: string) {
    if (!auth.user) return showToast('Faz login para criar uma comunidade.');
    if (!name.trim()) return showToast('Da um nome para a comunidade.');
    const { error } = await api.createCommunityServer(auth.user.id, name, description);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Comunidade criada com canal geral e voz principal.');
  }

  async function addCommunityMember(serverId: number, userId: string) {
    const { error } = await api.addServerMember(serverId, userId);
    if (error) return showToast(error.code === '23505' ? 'Esse usuario ja esta na comunidade.' : error.message);
    await refreshAll();
    showToast('Membro adicionado.');
  }

  async function joinCommunityByInvite(invite: string) {
    if (!auth.user) return showToast('Faz login para entrar na comunidade.');
    if (!invite.trim()) return showToast('Cole um convite valido.');
    const { error } = await api.joinCommunityByInvite(invite.trim());
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Voce entrou na comunidade.');
  }

  async function updateCommunityVisibility(serverId: number, visibility: 'private' | 'public') {
    const { error } = await api.updateCommunityServerVisibility(serverId, visibility);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast(visibility === 'public' ? 'Comunidade agora esta publica.' : 'Comunidade agora esta privada.');
  }

  async function deleteCommunityServer(serverId: number) {
    const { error } = await api.deleteCommunityServer(serverId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Comunidade excluida.');
  }

  async function createCommunityChannel(serverId: number, name: string, type: CommunityChannelType) {
    if (!name.trim()) return showToast('Nome do canal vazio.');
    const { error } = await api.createCommunityChannel(serverId, name, type);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast(type === 'voice' ? 'Canal de voz criado.' : 'Canal de texto criado.');
  }

  async function deleteCommunityChannel(channelId: number) {
    const { error } = await api.deleteCommunityChannel(channelId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Canal excluido.');
  }

  async function createCommunityRole(serverId: number, name: string, color: string) {
    if (!name.trim()) return showToast('Nome do cargo vazio.');
    const { error } = await api.createCommunityRole(serverId, name, color);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Cargo criado.');
  }

  async function deleteCommunityRole(roleId: number) {
    const { error } = await api.deleteCommunityRole(roleId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Cargo excluido.');
  }

  async function updateCommunityRoleVoicePermission(roleId: number, canModerateVoice: boolean) {
    const { error } = await api.updateCommunityRoleVoicePermission(roleId, canModerateVoice);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast(canModerateVoice ? 'Cargo pode moderar calls.' : 'Permissao de call removida do cargo.');
  }

  async function assignCommunityRole(serverId: number, userId: string, roleId: number) {
    const { error } = await api.assignCommunityRole(serverId, userId, roleId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Cargo aplicado.');
  }

  async function joinVoiceChannel(channelId: number) {
    if (!auth.user) return showToast('Faz login para entrar no canal.');
    const { error } = await api.joinVoiceChannel(channelId, auth.user.id);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Voce entrou no canal de voz.');
  }

  async function leaveVoiceChannel(channelId: number) {
    if (!auth.user) return showToast('Faz login para sair do canal.');
    const { error } = await api.leaveVoiceChannel(channelId, auth.user.id);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Voce saiu do canal de voz.');
  }

  async function kickVoiceMember(channelId: number, targetUserId: string) {
    if (!auth.user) return showToast('Faz login para moderar a call.');
    if (auth.user.id === targetUserId) return showToast('Use Sair para deixar a call.');
    const { error } = await api.kickVoiceMember(channelId, targetUserId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Usuario removido da call.');
  }

  return {
    createChatGroup,
    createCommunityServer,
    addCommunityMember,
    joinCommunityByInvite,
    updateCommunityVisibility,
    deleteCommunityServer,
    createCommunityChannel,
    deleteCommunityChannel,
    createCommunityRole,
    deleteCommunityRole,
    updateCommunityRoleVoicePermission,
    assignCommunityRole,
    joinVoiceChannel,
    leaveVoiceChannel,
    kickVoiceMember
  };
}
