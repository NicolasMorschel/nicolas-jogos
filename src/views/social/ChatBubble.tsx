import { useRef, type MouseEvent } from 'react';
import type { ChatMessage, ChatMessageReaction, PublicProfile } from '../../types';
import { formatShortDate } from '../../utils';
import { AudioPlayer } from './AudioPlayer';
import { MessageActionMenu, type MessageActionMenuHandle } from './MessageActionMenu';
import { ProfileDot } from './SocialPrimitives';

type ChatBubbleProps = {
  message: ChatMessage;
  mine: boolean;
  sender?: PublicProfile;
  replyTo?: ChatMessage;
  replySender?: PublicProfile;
  canDelete: boolean;
  pinned: boolean;
  reactions: ChatMessageReaction[];
  onReact: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onPin: () => void;
  onCopy: () => void;
  onReport: () => void;
  onDelete: (messageId: number) => Promise<void> | void;
  onOpenProfile: (profileId: string) => void;
};

export function ChatBubble({
  message,
  mine,
  sender,
  replyTo,
  replySender,
  canDelete,
  pinned,
  reactions,
  onReact,
  onReply,
  onForward,
  onPin,
  onCopy,
  onReport,
  onDelete,
  onOpenProfile
}: ChatBubbleProps) {
  const visibleBody = message.attachment_url && message.body.trim().toLowerCase() === 'anexo' ? '' : message.body;
  const groupedReactions = groupMessageReactions(reactions);
  const actionMenuRef = useRef<MessageActionMenuHandle | null>(null);

  function openContextMenu(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    actionMenuRef.current?.openAt(event.clientX, event.clientY);
  }

  return (
    <article className={`chat-bubble-pro d-flex gap-2 ${mine ? 'mine' : ''}`}>
      {!mine && <button className="profile-dot-button" type="button" onClick={() => sender && onOpenProfile(sender.id)}><ProfileDot profile={sender} /></button>}
      <div className="chat-message-card" onContextMenu={openContextMenu}>
        {!mine && <button className="chat-sender-name" type="button" onClick={() => sender && onOpenProfile(sender.id)}>{sender?.name || 'Usuario'}</button>}
        {pinned && <span className="pinned-message-label">Fixada</span>}
        {replyTo && (
          <div className="message-reply-card">
            <span>{replySender?.name || 'Usuario'}</span>
            <small>{replyTo.body || replyTo.attachment_name || 'Midia enviada'}</small>
          </div>
        )}
        {visibleBody && <p>{visibleBody}</p>}
        {message.attachment_url && <AttachmentPreview message={message} />}
        {groupedReactions.length > 0 && (
          <div className="message-reactions-row">
            {groupedReactions.map(reaction => <span key={reaction.emoji}>{reaction.emoji} {reaction.count}</span>)}
          </div>
        )}
        <footer>
          <span>{formatShortDate(message.created_at)}</span>
          <MessageActionMenu
            ref={actionMenuRef}
            canDelete={canDelete}
            pinned={pinned}
            onReact={onReact}
            onReply={onReply}
            onForward={onForward}
            onPin={onPin}
            onCopy={onCopy}
            onReport={onReport}
            onDelete={() => onDelete(message.id)}
          />
        </footer>
      </div>
    </article>
  );
}

function AttachmentPreview({ message }: { message: ChatMessage }) {
  if (message.attachment_type === 'image') return <img className="chat-media-preview" src={message.attachment_url} alt={message.attachment_name || 'Imagem enviada'} />;
  if (message.attachment_type === 'video') return <video className="chat-media-preview" src={message.attachment_url} controls />;
  if (message.attachment_type === 'audio') return <AudioPlayer src={message.attachment_url} />;
  return <a className="chat-file-link" href={message.attachment_url} target="_blank" rel="noreferrer">{message.attachment_name || 'Abrir anexo'}</a>;
}

function groupMessageReactions(reactions: ChatMessageReaction[]) {
  return Array.from(
    reactions.reduce((map, reaction) => {
      map.set(reaction.emoji, (map.get(reaction.emoji) || 0) + 1);
      return map;
    }, new Map<string, number>())
  ).map(([emoji, count]) => ({ emoji, count }));
}
