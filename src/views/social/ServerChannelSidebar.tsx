import type {
  CommunityChannel,
  CommunityServer,
  CommunityVoicePresence,
  Profile,
  PublicProfile,
  SocialTarget
} from '../../types';
import { ChannelSection } from './ChannelSection';
import { UserVoiceDock } from './UserVoiceDock';
import type { SocialSettingsTab } from './socialTypes';

export function ServerChannelSidebar({
  profile,
  server,
  textChannels,
  voiceChannels,
  target,
  isMember,
  canManage,
  profileById,
  voicePresence,
  activeVoiceChannel,
  muted,
  deafened,
  voiceChatOpen,
  isRecording,
  setTarget,
  openSettings,
  onJoinServerByInvite,
  onJoinVoiceChannel,
  onToggleMuted,
  onToggleDeafened,
  onToggleVoiceChat,
  onLeaveVoice
}: {
  profile: Profile;
  server: CommunityServer;
  textChannels: CommunityChannel[];
  voiceChannels: CommunityChannel[];
  target: SocialTarget;
  isMember: boolean;
  canManage: boolean;
  profileById: Map<string, PublicProfile>;
  voicePresence: CommunityVoicePresence[];
  activeVoiceChannel?: CommunityChannel;
  muted: boolean;
  deafened: boolean;
  voiceChatOpen: boolean;
  isRecording: boolean;
  setTarget: (target: SocialTarget) => void;
  openSettings: (tab?: SocialSettingsTab) => void;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
  onJoinVoiceChannel: (channelId: number) => Promise<void> | void;
  onToggleMuted: () => void;
  onToggleDeafened: () => void;
  onToggleVoiceChat: () => void;
  onLeaveVoice: () => void;
}) {
  return (
    <>
      <div className="p-3 border-bottom border-dark-subtle">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <div className="min-w-0">
            <div className="kicker">Comunidade</div>
            <h2 className="h5 mb-0 text-truncate">{server.name}</h2>
          </div>
          {canManage && (
            <button className="btn btn-sm btn-outline-light" type="button" onClick={() => openSettings('overview')}>
              Config.
            </button>
          )}
        </div>
        {!isMember && (
          <div className="server-public-note mt-3">
            <span>Publico</span>
            <button className="btn btn-sm btn-primary" type="button" onClick={() => onJoinServerByInvite(server.invite_code || String(server.id))}>Entrar</button>
          </div>
        )}
      </div>

      <div className="flex-grow-1 overflow-auto p-3">
        <ChannelSection title="Canais de texto" channels={textChannels} target={target} setTarget={setTarget} />
        <ChannelSection
          title="Canais de voz"
          channels={voiceChannels}
          target={target}
          profileById={profileById}
          voicePresence={voicePresence}
          activeVoiceChannel={activeVoiceChannel}
          speakingUserId={profile.id}
          isRecording={isRecording}
          muted={muted}
          onJoinVoiceChannel={onJoinVoiceChannel}
          setTarget={setTarget}
        />
      </div>

      <div className="social-sidebar-footer border-top border-dark-subtle d-grid gap-2">
        <div className="social-sidebar-admin-actions d-grid gap-2">
          {canManage ? (
            <>
              <button className="btn btn-outline-light" type="button" onClick={() => openSettings('channels')}>Criar canal</button>
              <button className="btn btn-outline-light" type="button" onClick={() => openSettings('roles')}>Cargos</button>
            </>
          ) : (
            <span className="soft-empty">Config. disponivel para donos e admins.</span>
          )}
        </div>
        <UserVoiceDock
          profile={profile}
          activeVoiceChannel={activeVoiceChannel}
          muted={muted}
          deafened={deafened}
          voiceChatOpen={voiceChatOpen}
          onToggleMuted={onToggleMuted}
          onToggleDeafened={onToggleDeafened}
          onToggleVoiceChat={onToggleVoiceChat}
          onLeaveVoice={onLeaveVoice}
          onOpenSettings={() => canManage && openSettings('overview')}
        />
      </div>
    </>
  );
}
