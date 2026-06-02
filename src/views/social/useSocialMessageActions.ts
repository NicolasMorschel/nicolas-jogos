import type { ChatMessage } from '../../types';

type SocialMessageActionsArgs = {
  pinnedMessageIds: Set<number>;
  onReactMessage: (messageId: number, emoji: string) => Promise<void> | void;
  onPinMessage: (messageId: number) => Promise<void> | void;
  onUnpinMessage: (messageId: number) => Promise<void> | void;
  onReportMessage: (messageId: number) => Promise<void> | void;
};

export function useSocialMessageActions({
  pinnedMessageIds,
  onReactMessage,
  onPinMessage,
  onUnpinMessage,
  onReportMessage
}: SocialMessageActionsArgs) {
  async function reactToMessage(messageId: number, emoji: string) {
    await onReactMessage(messageId, emoji);
  }

  async function togglePinnedMessage(messageId: number) {
    if (pinnedMessageIds.has(messageId)) {
      await onUnpinMessage(messageId);
      return;
    }

    await onPinMessage(messageId);
  }

  async function copyMessageText(message: ChatMessage) {
    const text = message.body || message.attachment_url;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.warn('Nao foi possivel copiar a mensagem.');
    }
  }

  async function reportMessage(message: ChatMessage) {
    await onReportMessage(message.id);
  }

  return {
    reactToMessage,
    togglePinnedMessage,
    copyMessageText,
    reportMessage
  };
}
