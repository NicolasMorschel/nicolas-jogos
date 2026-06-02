import type { AuthState, Profile, SocialTarget } from '../../types';
import * as api from '../../services';

export function useChatActions({
  auth,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  async function sendChatMessage(target: SocialTarget, body: string, file?: File | null, replyToMessageId?: number | null) {
    if (!auth.user) return showToast('Faz login para usar o chat.');
    if (!body.trim() && !file) return showToast('Escreve uma mensagem ou anexa uma mídia.');
    let attachmentUrl = '';
    let attachmentType: ReturnType<typeof api.attachmentTypeFromMime> | undefined;
    let attachmentName = '';

    if (file) {
      const uploadRes = await api.uploadChatMedia(auth.user.id, file);
      if (uploadRes.error || !uploadRes.data) return showToast(uploadRes.error?.message || 'Não foi possível enviar a mídia.');
      attachmentUrl = uploadRes.data.url;
      attachmentType = uploadRes.data.type;
      attachmentName = uploadRes.data.name;
    }

    const { error } = await api.sendChatMessage({
      senderId: auth.user.id,
      target,
      body,
      attachmentUrl,
      attachmentType,
      attachmentName,
      replyToMessageId
    });
    if (error) return showToast(error.message);
    await refreshAll();
  }

  async function deleteChatMessage(messageId: number) {
    if (!auth.user) return showToast('Faz login para apagar mensagens.');
    const { error } = await api.deleteChatMessage(messageId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Mensagem apagada.');
  }

  async function reactToChatMessage(messageId: number, emoji: string) {
    if (!auth.user) return showToast('Faz login para reagir.');
    const { error } = await api.addMessageReaction(messageId, auth.user.id, emoji);
    if (error) return showToast(socialMetaErrorMessage(error.message));
    await refreshAll();
  }

  async function pinChatMessage(messageId: number) {
    if (!auth.user) return showToast('Faz login para fixar mensagens.');
    const { error } = await api.pinChatMessage(messageId, auth.user.id);
    if (error) return showToast(socialMetaErrorMessage(error.message));
    await refreshAll();
    showToast('Mensagem fixada.');
  }

  async function unpinChatMessage(messageId: number) {
    if (!auth.user) return showToast('Faz login para desafixar mensagens.');
    const { error } = await api.unpinChatMessage(messageId);
    if (error) return showToast(socialMetaErrorMessage(error.message));
    await refreshAll();
    showToast('Mensagem desafixada.');
  }

  async function reportChatMessage(messageId: number) {
    if (!auth.user) return showToast('Faz login para denunciar mensagens.');
    const { error } = await api.reportChatMessage(messageId, auth.user.id, 'Denuncia enviada pelo menu da mensagem.');
    if (error) return showToast(socialMetaErrorMessage(error.message));
    await refreshAll();
    showToast('Denuncia enviada para analise.');
  }

  return {
    sendChatMessage,
    deleteChatMessage,
    reactToChatMessage,
    pinChatMessage,
    unpinChatMessage,
    reportChatMessage
  };
}

function socialMetaErrorMessage(message: string) {
  if (message.toLowerCase().includes('schema cache') || message.toLowerCase().includes('does not exist')) {
    return 'Essa acao precisa da atualizacao nova do banco. A SQL ja fica no projeto para aplicar no Supabase.';
  }

  return message;
}
