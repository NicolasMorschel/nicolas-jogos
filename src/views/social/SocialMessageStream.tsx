import type { ChatMessage, ChatMessageReaction, CommunityServer, Profile, PublicProfile } from '../../types';
import { ChatBubble } from './ChatBubble';

export function SocialMessageStream({
  selectedServer,
  isSelectedServerMember,
  messages,
  profile,
  profileById,
  messageById,
  reactionsByMessageId,
  pinnedMessageIds,
  onJoinServerByInvite,
  onReact,
  onReply,
  onForward,
  onPin,
  onCopy,
  onReport,
  onDelete,
  onOpenProfile
}: {
  selectedServer?: CommunityServer;
  isSelectedServerMember: boolean;
  messages: ChatMessage[];
  profile: Profile;
  profileById: Map<string, PublicProfile>;
  messageById: Map<number, ChatMessage>;
  reactionsByMessageId: Map<number, ChatMessageReaction[]>;
  pinnedMessageIds: Set<number>;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
  onReact: (messageId: number, emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onPin: (messageId: number) => void;
  onCopy: (message: ChatMessage) => void;
  onReport: (message: ChatMessage) => void;
  onDelete: (messageId: number) => Promise<void> | void;
  onOpenProfile: (profileId: string) => void;
}) {
  return (
    <div className="social-message-stream flex-grow-1">
      {selectedServer && !isSelectedServerMember && (
        <div className="server-join-banner">
          <div>
            <strong>Comunidade publica</strong>
            <span>Entre para conversar, participar da voz e aparecer na lista de membros.</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => onJoinServerByInvite(selectedServer.invite_code || String(selectedServer.id))}>Entrar</button>
        </div>
      )}

      {messages.map(message => (
        <ChatBubble
          key={message.id}
          message={message}
          mine={message.sender_id === profile.id}
          sender={profileById.get(message.sender_id)}
          replyTo={message.reply_to_message_id ? messageById.get(message.reply_to_message_id) : undefined}
          replySender={message.reply_to_message_id ? profileById.get(messageById.get(message.reply_to_message_id)?.sender_id || '') : undefined}
          canDelete={message.sender_id === profile.id || profile.role === 'admin' || !!(selectedServer && selectedServer.owner_id === profile.id)}
          pinned={pinnedMessageIds.has(message.id)}
          reactions={reactionsByMessageId.get(message.id) || []}
          onReact={emoji => onReact(message.id, emoji)}
          onReply={() => onReply(message)}
          onForward={() => onForward(message)}
          onPin={() => onPin(message.id)}
          onCopy={() => onCopy(message)}
          onReport={() => onReport(message)}
          onDelete={onDelete}
          onOpenProfile={onOpenProfile}
        />
      ))}

      {!messages.length && (
        <div className="social-empty-chat">
          <strong>Nenhuma mensagem ainda</strong>
          <span>Comeca com uma mensagem, uma midia ou uma nota de voz.</span>
        </div>
      )}
    </div>
  );
}
