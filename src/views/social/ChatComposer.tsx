import type { FormEvent, MutableRefObject } from 'react';
import type { ChatMessage } from '../../types';
import { AudioPlayer } from './AudioPlayer';

type ChatComposerProps = {
  targetId: string | number;
  chatText: string;
  setChatText: (value: string) => void;
  selectedFile: File | null;
  selectedFileUrl: string;
  setFileWithPreview: (file: File | null) => void;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  isRecording: boolean;
  isPreparingRecording: boolean;
  recordingError: string;
  replyToMessage: ChatMessage | null;
  replySenderName: string;
  onCancelReply: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  canWrite: boolean;
  submitChat: (event: FormEvent<HTMLFormElement>) => void;
};

export function MessageComposer({
  targetId,
  chatText,
  setChatText,
  selectedFile,
  selectedFileUrl,
  setFileWithPreview,
  fileInputRef,
  isRecording,
  isPreparingRecording,
  recordingError,
  replyToMessage,
  replySenderName,
  onCancelReply,
  startRecording,
  stopRecording,
  canWrite,
  submitChat
}: ChatComposerProps) {
  const hasTextOrFile = !!chatText.trim() || !!selectedFile;

  return (
    <form className="social-composer px-2 px-lg-3 py-3" onSubmit={submitChat}>
      {selectedFile && (
        <div className="composer-preview mb-2">
          <div>
            <strong>{selectedFile.type.startsWith('audio/') ? 'Audio pronto' : selectedFile.name}</strong>
            <span>{selectedFile.type.startsWith('audio/') ? 'Escuta antes de enviar.' : 'Arquivo anexado a proxima mensagem.'}</span>
          </div>
          {selectedFile.type.startsWith('audio/') && selectedFileUrl && <AudioPlayer src={selectedFileUrl} compact />}
          <button className="btn btn-outline-light btn-sm" type="button" onClick={() => setFileWithPreview(null)}>Remover</button>
        </div>
      )}

      {(isPreparingRecording || isRecording) && (
        <div className="recording-strip mb-2">
          <span className="recording-dot" />
          {isPreparingRecording ? 'Pedindo permissao do microfone...' : 'Gravando audio. Clique no microfone para finalizar e ouvir.'}
        </div>
      )}

      {recordingError && <div className="recording-error mb-2">{recordingError}</div>}

      {replyToMessage && (
        <div className="reply-preview d-flex align-items-center justify-content-between gap-2 mb-2">
          <span className="text-truncate">
            Respondendo <strong>{replySenderName}</strong>: {replyToMessage.body || replyToMessage.attachment_name || 'anexo'}
          </span>
          <button className="btn btn-sm btn-outline-light" type="button" onClick={onCancelReply}>Cancelar</button>
        </div>
      )}

      <div className="input-group social-composer-bar">
        <button className="btn social-icon-btn" type="button" onClick={() => fileInputRef.current?.click()} disabled={!targetId || !canWrite} aria-label="Enviar midia">
          +
        </button>
        <input ref={fileInputRef} className="d-none" accept="image/*,video/*,audio/*" type="file" onChange={event => setFileWithPreview(event.target.files?.[0] || null)} />
        <input className="form-control" value={chatText} onChange={event => setChatText(event.target.value)} placeholder={!targetId ? 'Escolhe uma conversa' : canWrite ? 'Digite uma mensagem' : 'Entre na comunidade para conversar'} disabled={!targetId || !canWrite} />
        <button className="btn social-icon-btn d-none d-md-inline-flex" type="button" aria-label="Figurinhas">:)</button>
        <button className={`btn social-icon-btn mic ${isRecording ? 'recording' : ''}`} type="button" onClick={isRecording ? stopRecording : startRecording} disabled={isPreparingRecording || !targetId || !canWrite} aria-label={isRecording ? 'Finalizar audio' : 'Gravar audio'}>
          {isPreparingRecording ? <span className="spinner-border spinner-border-sm" /> : <span className="mic-symbol" aria-hidden="true" />}
        </button>
        <button className="btn btn-primary social-send-btn" type="submit" disabled={!targetId || !canWrite || !hasTextOrFile}>Enviar</button>
      </div>
    </form>
  );
}
