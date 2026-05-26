import { useRef, useState } from 'react';

type MessageActionMenuProps = {
  canDelete: boolean;
  pinned: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onPin: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onReport: () => void;
};

const QUICK_REACTIONS = ['😈', '🥺', '🥳', '😵'];

export function MessageActionMenu({
  canDelete,
  pinned,
  onReact,
  onReply,
  onForward,
  onPin,
  onCopy,
  onDelete,
  onReport
}: MessageActionMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  function run(action: () => void) {
    action();
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div className="message-action-wrap">
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-label="Acoes da mensagem"
        className="btn message-action-trigger"
        type="button"
        onClick={() => setOpen(value => !value)}
      >
        ⋯
      </button>

      {open && (
        <div className="message-action-menu shadow-lg">
          <div className="message-reaction-strip">
            {QUICK_REACTIONS.map(emoji => (
              <button key={emoji} type="button" onClick={() => run(() => onReact(emoji))}>
                {emoji}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => run(onReply)}>
            <span>Responder</span>
            <b>↩</b>
          </button>
          <button type="button" onClick={() => run(onForward)}>
            <span>Encaminhar</span>
            <b>↪</b>
          </button>
          <button type="button" onClick={() => run(onPin)}>
            <span>{pinned ? 'Desafixar' : 'Fixar mensagem'}</span>
            <b>📌</b>
          </button>
          <button type="button" onClick={() => run(onCopy)}>
            <span>Copiar texto</span>
            <b>⧉</b>
          </button>
          {canDelete && (
            <button className="danger" type="button" onClick={() => run(onDelete)}>
              <span>Excluir mensagem</span>
              <b>🗑</b>
            </button>
          )}
          <button className="danger" type="button" onClick={() => run(onReport)}>
            <span>Denunciar mensagem</span>
            <b>⚑</b>
          </button>
        </div>
      )}
    </div>
  );
}
