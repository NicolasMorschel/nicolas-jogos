import type { CommunityChannel, CommunityServer, PublicProfile } from '../../types';
import { ProfileDot } from './SocialPrimitives';
import type { SocialSettingsTab } from './socialTypes';

type SocialChatHeaderProps = {
  title: string;
  subtitle: string;
  selectedServer?: CommunityServer;
  selectedChannel?: CommunityChannel;
  roomProfile?: PublicProfile;
  canManageServer: boolean;
  settingsOpen: boolean;
  openSettings: (tab?: SocialSettingsTab) => void;
  closeSettings: () => void;
  openProfile: () => void;
};

export function SocialChatHeader({
  title,
  subtitle,
  selectedServer,
  roomProfile,
  canManageServer,
  settingsOpen,
  openSettings,
  closeSettings,
  openProfile
}: SocialChatHeaderProps) {
  return (
    <header className="social-chat-header d-flex align-items-center justify-content-between gap-3 px-3 px-lg-4 py-3">
      <div className="d-flex align-items-center gap-3 min-w-0">
        {roomProfile && <ProfileDot profile={roomProfile} />}
        <div className="min-w-0">
          <span className="kicker">{subtitle}</span>
          <h1 className="h4 mb-0 text-truncate">{selectedServer ? '# ' : ''}{title}</h1>
        </div>
      </div>
      <div className="btn-group flex-shrink-0">
        {roomProfile && <button className="btn btn-outline-light" type="button" onClick={openProfile}>Perfil</button>}
        {selectedServer && canManageServer && (
          <button className="btn btn-outline-light" type="button" onClick={() => settingsOpen ? closeSettings() : openSettings('overview')}>
            {settingsOpen ? 'Voltar ao chat' : 'Configuracoes'}
          </button>
        )}
      </div>
    </header>
  );
}
