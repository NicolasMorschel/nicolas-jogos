import type { FormEvent } from 'react';
import type { ChatMessage, CommunityChannel, CommunityServer, CommunityVoicePresence, Profile, PublicProfile } from '../../types';
import { formatShortDate } from '../../utils';
import { HeadphoneIcon, MessageIcon, MicIcon, ProfileDot } from './SocialPrimitives';

type VoiceCallPanelProps = {
  channel: CommunityChannel;
  server?: CommunityServer;
  profile: Profile;
  profileById: Map<string, PublicProfile>;
  presences: CommunityVoicePresence[];
  expanded: boolean;
  muted: boolean;
  deafened: boolean;
  isRecording: boolean;
  canModerateVoice: boolean;
  messages: ChatMessage[];
  voiceText: string;
  setVoiceText: (value: string) => void;
  onToggleExpanded: () => void;
  onToggleMuted: () => void;
  onToggleDeafened: () => void;
  onSubmitMessage: (event: FormEvent<HTMLFormElement>) => void;
  onLeave: () => void;
  onKickMember: (channelId: number, targetUserId: string) => Promise<void> | void;
};

export function VoiceCallPanel({
  channel,
  server,
  profile,
  profileById,
  presences,
  expanded,
  muted,
  deafened,
  isRecording,
  canModerateVoice,
  messages,
  voiceText,
  setVoiceText,
  onToggleExpanded,
  onToggleMuted,
  onToggleDeafened,
  onSubmitMessage,
  onLeave,
  onKickMember
}: VoiceCallPanelProps) {
  return (
    <section className={`voice-call-panel ${expanded ? 'expanded' : ''}`}>
      <div className="d-flex align-items-center gap-3 min-w-0">
        <div className="voice-call-icon">
          <HeadphoneIcon />
        </div>
        <div className="min-w-0">
          <span className="kicker">{server?.name || 'Comunidade'}</span>
          <strong className="d-block text-truncate">Call: {channel.name}</strong>
        </div>
      </div>

      <div className="voice-live-members">
        {presences.slice(0, expanded ? presences.length : 5).map(presence => {
          const member = profileById.get(presence.user_id);
          const speaking = isRecording && presence.user_id === profile.id && !muted;
          return (
            <div className={`voice-member-avatar ${speaking ? 'speaking' : ''}`} key={presence.user_id} title={member?.name || 'Usuario'}>
              <ProfileDot profile={member} speaking={speaking} />
              <MicIcon />
              {speaking && <i />}
              {canModerateVoice && presence.user_id !== profile.id && (
                <span
                  className="voice-kick-control"
                  role="button"
                  tabIndex={0}
                  title="Remover da call"
                  onClick={event => {
                    event.stopPropagation();
                    onKickMember(channel.id, presence.user_id);
                  }}
                  onKeyDown={event => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    onKickMember(channel.id, presence.user_id);
                  }}
                >
                  X
                </span>
              )}
            </div>
          );
        })}
        {!presences.length && <span className="soft-empty">Ninguem na call</span>}
      </div>

      <div className="btn-group voice-call-actions">
        <button className={`btn social-user-control ${muted ? 'muted' : ''}`} type="button" onClick={onToggleMuted} aria-label={muted ? 'Desmutar microfone' : 'Mutar microfone'}>
          <MicIcon />
        </button>
        <button className={`btn social-user-control ${deafened ? 'muted' : ''}`} type="button" onClick={onToggleDeafened} aria-label={deafened ? 'Ativar audio' : 'Abafar audio'}>
          <HeadphoneIcon />
        </button>
        <button className={`btn social-user-control ${expanded ? 'active' : ''}`} type="button" onClick={onToggleExpanded} aria-label="Abrir chat da voz">
          <MessageIcon />
        </button>
        <button className="btn btn-outline-light" type="button" onClick={onLeave}>Sair</button>
      </div>

      {expanded && (
        <div className="voice-call-chat">
          <div className="voice-call-chat-feed">
            <div className="d-flex justify-content-between align-items-center gap-2">
              <strong>Chat da voz</strong>
              <span>{messages.length} mensagem(ns)</span>
            </div>
            <div className="voice-call-chat-messages">
              {messages.map(message => {
                const sender = profileById.get(message.sender_id);
                return (
                  <div className="voice-call-message" key={message.id}>
                    <ProfileDot profile={sender} />
                    <div>
                      <strong>{sender?.name || 'Usuario'}</strong>
                      <p>{message.body || message.attachment_name || 'Midia enviada'}</p>
                    </div>
                    <time>{formatShortDate(message.created_at)}</time>
                  </div>
                );
              })}
              {!messages.length && <span className="soft-empty">Sem mensagens nesse canal de voz ainda.</span>}
            </div>
          </div>
          <form className="voice-call-chat-form" onSubmit={onSubmitMessage}>
            <input className="form-control" value={voiceText} onChange={event => setVoiceText(event.target.value)} placeholder="Mensagem da call" />
            <button className="btn btn-primary" type="submit" disabled={!voiceText.trim()}>Enviar</button>
          </form>
        </div>
      )}
    </section>
  );
}
