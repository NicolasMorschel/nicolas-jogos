import type { CommunityChannel, Profile } from '../../types';
import { GearIcon, HeadphoneIcon, MessageIcon, MicIcon, ProfileDot } from './SocialPrimitives';

type UserVoiceDockProps = {
  profile: Profile;
  activeVoiceChannel?: CommunityChannel;
  muted: boolean;
  deafened: boolean;
  voiceChatOpen: boolean;
  onToggleMuted: () => void;
  onToggleDeafened: () => void;
  onToggleVoiceChat: () => void;
  onLeaveVoice: () => void;
  onOpenSettings?: () => void;
};

export function UserVoiceDock({
  profile,
  activeVoiceChannel,
  muted,
  deafened,
  voiceChatOpen,
  onToggleMuted,
  onToggleDeafened,
  onToggleVoiceChat,
  onLeaveVoice,
  onOpenSettings
}: UserVoiceDockProps) {
  return (
    <div className="social-user-dock mt-auto">
      <div className="d-flex align-items-center gap-2 min-w-0">
        <ProfileDot profile={profile} />
        <div className="min-w-0">
          <strong className="text-truncate d-block">{profile.name || 'Usuario'}</strong>
          <span className="text-truncate d-block">{activeVoiceChannel ? `Em ${activeVoiceChannel.name}` : 'Invisivel'}</span>
        </div>
      </div>

      <div className="btn-group social-user-controls">
        <button
          aria-label={muted ? 'Desmutar microfone' : 'Mutar microfone'}
          aria-pressed={muted}
          className={`btn social-user-control ${muted ? 'muted' : ''}`}
          title={muted ? 'Desmutar' : 'Mutar'}
          type="button"
          onClick={onToggleMuted}
        >
          <MicIcon />
        </button>
        <button
          aria-label={deafened ? 'Ativar audio' : 'Abafar audio'}
          aria-pressed={deafened}
          className={`btn social-user-control ${deafened ? 'muted' : ''}`}
          title={deafened ? 'Ativar audio' : 'Abafar audio'}
          type="button"
          onClick={onToggleDeafened}
        >
          <HeadphoneIcon />
        </button>
        <button
          aria-label="Chat da voz"
          aria-pressed={voiceChatOpen}
          className={`btn social-user-control ${voiceChatOpen ? 'active' : ''}`}
          disabled={!activeVoiceChannel}
          title="Chat da voz"
          type="button"
          onClick={onToggleVoiceChat}
        >
          <MessageIcon />
        </button>
        <button
          aria-label="Configuracoes"
          className="btn social-user-control"
          title="Configuracoes"
          type="button"
          onClick={onOpenSettings}
        >
          <GearIcon />
        </button>
      </div>

      {activeVoiceChannel && (
        <button className="btn btn-sm btn-outline-light social-user-leave" type="button" onClick={onLeaveVoice}>
          Sair
        </button>
      )}
    </div>
  );
}
