import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';

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

export type MessageActionMenuHandle = {
  openAt: (x: number, y: number) => void;
  close: () => void;
};

const QUICK_REACTIONS = ['😈', '🥺', '🥳', '😵'];
const MENU_WIDTH = 260;
const MENU_HEIGHT = 280;
const MENU_MARGIN = 12;

export const MessageActionMenu = forwardRef<MessageActionMenuHandle, MessageActionMenuProps>(function MessageActionMenu({
  canDelete,
  pinned,
  onReact,
  onReply,
  onForward,
  onPin,
  onCopy,
  onDelete,
  onReport
}: MessageActionMenuProps, ref) {
  const [open, setOpen] = useState(false);
  const [contextPosition, setContextPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useImperativeHandle(ref, () => ({
    openAt(x, y) {
      setContextPosition(clampMenuPosition(x, y));
      setOpen(true);
    },
    close() {
      setOpen(false);
    }
  }), []);

  useEffect(() => {
    if (!open) return;

    function closeFromOutside(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }

    function closeFromKeyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', closeFromOutside);
    document.addEventListener('keydown', closeFromKeyboard);
    return () => {
      document.removeEventListener('pointerdown', closeFromOutside);
      document.removeEventListener('keydown', closeFromKeyboard);
    };
  }, [open]);

  function run(action: () => void) {
    action();
    setOpen(false);
    buttonRef.current?.focus();
  }

  const menuStyle: CSSProperties | undefined = contextPosition
    ? { left: contextPosition.x, top: contextPosition.y }
    : undefined;

  return (
    <div className="dropdown message-action-wrap">
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-label="Acoes da mensagem"
        className="btn btn-sm btn-outline-light message-action-trigger"
        type="button"
        onClick={() => {
          setContextPosition(null);
          setOpen(value => !value);
        }}
      >
        ...
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`dropdown-menu dropdown-menu-dark show message-action-menu shadow-lg ${contextPosition ? 'context-menu' : ''}`}
          style={menuStyle}
          onContextMenu={event => event.preventDefault()}
        >
          <div className="message-reaction-strip px-2 pb-2">
            {QUICK_REACTIONS.map(emoji => (
              <button className="btn btn-sm btn-dark" key={emoji} type="button" onClick={() => run(() => onReact(emoji))}>
                {emoji}
              </button>
            ))}
          </div>
          <button className="dropdown-item d-flex justify-content-between align-items-center" type="button" onClick={() => run(onReply)}>
            <span>Responder</span>
            <b>↩</b>
          </button>
          <button className="dropdown-item d-flex justify-content-between align-items-center" type="button" onClick={() => run(onForward)}>
            <span>Encaminhar</span>
            <b>↪</b>
          </button>
          <button className="dropdown-item d-flex justify-content-between align-items-center" type="button" onClick={() => run(onPin)}>
            <span>{pinned ? 'Desafixar' : 'Fixar mensagem'}</span>
            <b>📌</b>
          </button>
          <button className="dropdown-item d-flex justify-content-between align-items-center" type="button" onClick={() => run(onCopy)}>
            <span>Copiar texto</span>
            <b>⧉</b>
          </button>
          {canDelete && (
            <button className="dropdown-item d-flex justify-content-between align-items-center text-danger" type="button" onClick={() => run(onDelete)}>
              <span>Excluir mensagem</span>
              <b>🗑</b>
            </button>
          )}
          <button className="dropdown-item d-flex justify-content-between align-items-center text-danger" type="button" onClick={() => run(onReport)}>
            <span>Denunciar mensagem</span>
            <b>⚑</b>
          </button>
        </div>
      )}
    </div>
  );
});

function clampMenuPosition(x: number, y: number) {
  if (typeof window === 'undefined') return { x, y };
  const maxX = Math.max(MENU_MARGIN, window.innerWidth - MENU_WIDTH - MENU_MARGIN);
  const maxY = Math.max(MENU_MARGIN, window.innerHeight - MENU_HEIGHT - MENU_MARGIN);
  return {
    x: Math.min(Math.max(MENU_MARGIN, x), maxX),
    y: Math.min(Math.max(MENU_MARGIN, y), maxY)
  };
}
