import type { CommunityChannel, CommunityServer, CommunityVoicePresence, Profile, PublicProfile } from '../../types';
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
  onToggleExpanded: () => void;
  onToggleMuted: () => void;
  onToggleDeafened: () => void;
  onLeave: () => void;
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
  onToggleExpanded,
  onToggleMuted,
  onToggleDeafened,
  onLeave
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
            <button className={`voice-member-avatar ${speaking ? 'speaking' : ''}`} key={presence.user_id} title={member?.name || 'Usuario'} type="button">
              <ProfileDot profile={member} speaking={speaking} />
              <MicIcon />
              {speaking && <i />}
            </button>
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
        <button className="btn ghost-btn" type="button" onClick={onLeave}>Sair</button>
      </div>

      {expanded && (
        <div className="voice-call-chat">
          <strong>Chat rapido da call</strong>
          <span>Continua no chat principal. Este painel serve para acompanhar quem esta na voz.</span>
        </div>
      )}
    </section>
  );
}
