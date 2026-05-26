import { useState, type FormEvent } from 'react';
import type {
  ChatGroup,
  CommunityChannel,
  CommunityServer,
  CommunityVoicePresence,
  Profile,
  PublicProfile,
  SocialTarget
} from '../../types';
import { ProfileDot } from './SocialPrimitives';
import { UserVoiceDock } from './UserVoiceDock';

type SettingsTab = 'overview' | 'channels' | 'roles' | 'members';

export function ServerDock({ profile, selectedServer, servers, channels, friendProfiles, groups, setTarget }: {
  profile: Profile;
  selectedServer?: CommunityServer;
  servers: CommunityServer[];
  channels: CommunityChannel[];
  friendProfiles: PublicProfile[];
  groups: ChatGroup[];
  setTarget: (target: SocialTarget) => void;
}) {
  const firstHomeTarget = firstSidebarTarget(friendProfiles, groups);

  return (
    <aside className="col-auto social-server-dock d-flex flex-lg-column align-items-center gap-2 p-2 overflow-auto">
      <button className={`btn social-dock-home ${!selectedServer ? 'active' : ''}`} type="button" onClick={() => setTarget(firstHomeTarget)}>
        NJ
      </button>
      <div className="social-dock-divider d-none d-lg-block" />
      {servers.map(server => {
        const firstChannel = channels.find(channel => channel.server_id === server.id && channel.channel_type === 'text')
          || channels.find(channel => channel.server_id === server.id);
        return (
          <button
            className={`btn social-dock-server ${selectedServer?.id === server.id ? 'active' : ''}`}
            key={server.id}
            title={server.name}
            type="button"
            onClick={() => firstChannel && setTarget({ type: 'server_channel', id: firstChannel.id })}
          >
            {server.name.slice(0, 1).toUpperCase()}
          </button>
        );
      })}
      <div className="mt-lg-auto d-none d-lg-grid gap-2">
        <ProfileDot profile={profile} />
      </div>
    </aside>
  );
}

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
  openSettings: (tab?: SettingsTab) => void;
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
            <button className="btn btn-sm ghost-btn" type="button" onClick={() => openSettings('overview')}>
              Config.
            </button>
          )}
        </div>
        {!isMember && (
          <div className="server-public-note mt-3">
            <span>Publico</span>
            <button className="btn btn-sm primary-btn" type="button" onClick={() => onJoinServerByInvite(server.invite_code || String(server.id))}>Entrar</button>
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
              <button className="btn ghost-btn" type="button" onClick={() => openSettings('channels')}>Criar canal</button>
              <button className="btn ghost-btn" type="button" onClick={() => openSettings('roles')}>Cargos</button>
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

function ChannelSection({ title, channels, target, profileById, voicePresence = [], activeVoiceChannel, speakingUserId, isRecording = false, muted = false, setTarget, onJoinVoiceChannel }: {
  title: string;
  channels: CommunityChannel[];
  target: SocialTarget;
  profileById?: Map<string, PublicProfile>;
  voicePresence?: CommunityVoicePresence[];
  activeVoiceChannel?: CommunityChannel;
  speakingUserId?: string;
  isRecording?: boolean;
  muted?: boolean;
  setTarget: (target: SocialTarget) => void;
  onJoinVoiceChannel?: (channelId: number) => Promise<void> | void;
}) {
  return (
    <section className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="kicker">{title}</span>
      </div>
      <div className="nav nav-pills flex-column gap-1">
        {channels.map(channel => {
          const isVoice = channel.channel_type === 'voice';
          const channelPresences = isVoice ? voicePresence.filter(presence => presence.channel_id === channel.id) : [];
          const active = isVoice
            ? activeVoiceChannel?.id === channel.id
            : target.type === 'server_channel' && target.id === channel.id;
          return (
            <div className="voice-channel-wrap" key={channel.id}>
              <button
                className={`btn text-start social-channel-btn ${active ? 'active' : ''}`}
                type="button"
                onClick={() => isVoice ? onJoinVoiceChannel?.(channel.id) : setTarget({ type: 'server_channel', id: channel.id })}
              >
                <span>{isVoice ? '>' : '#'}</span>
                {channel.name}
              </button>
              {isVoice && (
                <div className="voice-channel-members">
                  {channelPresences.map(presence => {
                    const member = profileById?.get(presence.user_id);
                    const speaking = activeVoiceChannel?.id === channel.id && isRecording && !muted && presence.user_id === speakingUserId;
                    return (
                      <span className={`voice-channel-member ${speaking ? 'speaking' : ''}`} key={presence.user_id}>
                        <ProfileDot profile={member} speaking={speaking} />
                        <small>{member?.name || 'Usuario'}</small>
                      </span>
                    );
                  })}
                  {channelPresences.length === 0 && active && <span className="voice-channel-member muted">Entrando...</span>}
                </div>
              )}
            </div>
          );
        })}
        {!channels.length && <div className="soft-empty">Nenhum canal ainda.</div>}
      </div>
    </section>
  );
}

export function HomeSidebar({
  profile,
  friendProfiles,
  groups,
  publicServers,
  channels,
  target,
  groupName,
  setGroupName,
  groupMembers,
  setGroupMembers,
  serverName,
  setServerName,
  serverDescription,
  setServerDescription,
  inviteCode,
  setInviteCode,
  createGroup,
  createServer,
  joinByInvite,
  onJoinServerByInvite,
  activeVoiceChannel,
  muted,
  deafened,
  voiceChatOpen,
  onToggleMuted,
  onToggleDeafened,
  onToggleVoiceChat,
  onLeaveVoice,
  setTarget
}: {
  profile: Profile;
  friendProfiles: PublicProfile[];
  groups: ChatGroup[];
  publicServers: CommunityServer[];
  channels: CommunityChannel[];
  target: SocialTarget;
  groupName: string;
  setGroupName: (value: string) => void;
  groupMembers: string[];
  setGroupMembers: (value: string[]) => void;
  serverName: string;
  setServerName: (value: string) => void;
  serverDescription: string;
  setServerDescription: (value: string) => void;
  inviteCode: string;
  setInviteCode: (value: string) => void;
  createGroup: (event: FormEvent<HTMLFormElement>) => void;
  createServer: (event: FormEvent<HTMLFormElement>) => void;
  joinByInvite: (event: FormEvent<HTMLFormElement>) => void;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
  activeVoiceChannel?: CommunityChannel;
  muted: boolean;
  deafened: boolean;
  voiceChatOpen: boolean;
  onToggleMuted: () => void;
  onToggleDeafened: () => void;
  onToggleVoiceChat: () => void;
  onLeaveVoice: () => void;
  setTarget: (target: SocialTarget) => void;
}) {
  const [socialTab, setSocialTab] = useState<'friends' | 'available' | 'all' | 'add'>('friends');

  return (
    <>
      <div className="p-3 border-bottom border-dark-subtle">
        <div className="d-flex align-items-center gap-2">
          <ProfileDot profile={profile} />
          <div className="min-w-0">
            <div className="kicker">Central social</div>
            <h2 className="h5 mb-0 text-truncate">Conversas</h2>
          </div>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3">
        <div className="social-friends-toolbar mb-3">
          <div className="nav nav-pills flex-nowrap gap-1 overflow-auto">
            <button className={`btn ${socialTab === 'friends' ? 'primary-btn' : 'ghost-btn'}`} type="button" onClick={() => setSocialTab('friends')}>Amigos</button>
            <button className={`btn ${socialTab === 'available' ? 'primary-btn' : 'ghost-btn'}`} type="button" onClick={() => setSocialTab('available')}>Disponivel</button>
            <button className={`btn ${socialTab === 'all' ? 'primary-btn' : 'ghost-btn'}`} type="button" onClick={() => setSocialTab('all')}>Todos</button>
            <button className={`btn ${socialTab === 'add' ? 'primary-btn' : 'ghost-btn'}`} type="button" onClick={() => setSocialTab('add')}>Adicionar</button>
          </div>
        </div>

        <section className="mb-4">
          <span className="kicker d-block mb-2">Amigos</span>
          <div className="nav nav-pills flex-column gap-1">
            {friendProfiles.map(friend => (
              <button className={`btn text-start social-channel-btn ${target.type === 'direct' && target.id === friend.id ? 'active' : ''}`} key={friend.id} type="button" onClick={() => setTarget({ type: 'direct', id: friend.id })}>
                <ProfileDot profile={friend} />
                <span>{friend.name || 'Usuario'}</span>
              </button>
            ))}
            {!friendProfiles.length && <div className="soft-empty">Adiciona amigos para conversar.</div>}
          </div>
        </section>

        <section className="mb-4">
          <span className="kicker d-block mb-2">Grupos</span>
          <div className="nav nav-pills flex-column gap-1">
            {groups.map(group => (
              <button className={`btn text-start social-channel-btn ${target.type === 'group' && target.id === group.id ? 'active' : ''}`} key={group.id} type="button" onClick={() => setTarget({ type: 'group', id: group.id })}>
                <span>#</span>
                {group.name}
              </button>
            ))}
          </div>
        </section>

        {socialTab === 'add' && (
          <section className="social-create-panel mb-3">
            <form className="card social-tool-card" onSubmit={joinByInvite}>
              <div className="card-body">
                <h3 className="h6 mb-2">Entrar por convite</h3>
                <div className="input-group">
                  <input className="form-control input" value={inviteCode} onChange={event => setInviteCode(event.target.value)} placeholder="Codigo ou link do servidor" />
                  <button className="btn primary-btn" type="submit">Entrar</button>
                </div>
              </div>
            </form>

            <form className="card social-tool-card mt-3" onSubmit={createGroup}>
              <div className="card-body">
                <h3 className="h6 mb-3">Novo grupo</h3>
                <input className="form-control input mb-2" value={groupName} onChange={event => setGroupName(event.target.value)} placeholder="Nome do grupo" />
                <div className="social-check-list mb-3">
                  {friendProfiles.slice(0, 8).map(friend => (
                    <label className="form-check" key={friend.id}>
                      <input
                        className="form-check-input"
                        checked={groupMembers.includes(friend.id)}
                        onChange={event => setGroupMembers(event.target.checked ? [...groupMembers, friend.id] : groupMembers.filter(id => id !== friend.id))}
                        type="checkbox"
                      />
                      <span className="form-check-label">{friend.name}</span>
                    </label>
                  ))}
                </div>
                <button className="btn primary-btn w-100" type="submit">Criar grupo</button>
              </div>
            </form>

            <form className="card social-tool-card mt-3" onSubmit={createServer}>
              <div className="card-body">
                <h3 className="h6 mb-3">Nova comunidade</h3>
                <input className="form-control input mb-2" value={serverName} onChange={event => setServerName(event.target.value)} placeholder="Nome da comunidade" />
                <input className="form-control input mb-3" value={serverDescription} onChange={event => setServerDescription(event.target.value)} placeholder="Resumo curto" />
                <button className="btn ghost-btn w-100" type="submit">Criar comunidade</button>
              </div>
            </form>
          </section>
        )}

        <section className="mb-2">
          <span className="kicker d-block mb-2">Comunidades publicas</span>
          <div className="d-grid gap-2">
            {publicServers.map(server => {
              const firstChannel = channels.find(channel => channel.server_id === server.id && channel.channel_type === 'text') || channels.find(channel => channel.server_id === server.id);
              return (
                <div className="public-server-row" key={server.id}>
                  <button type="button" onClick={() => firstChannel && setTarget({ type: 'server_channel', id: firstChannel.id })}>
                    <span>{server.name.slice(0, 1).toUpperCase()}</span>
                    <strong>{server.name}</strong>
                  </button>
                  <button className="btn btn-sm primary-btn" type="button" onClick={() => onJoinServerByInvite(server.invite_code || String(server.id))}>Entrar</button>
                </div>
              );
            })}
            {!publicServers.length && <div className="soft-empty">Nenhum servidor publico novo.</div>}
          </div>
        </section>
      </div>

      <div className="social-sidebar-footer border-top border-dark-subtle">
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
        />
      </div>
    </>
  );
}

function firstSidebarTarget(friendProfiles: PublicProfile[], groups: ChatGroup[]): SocialTarget {
  if (friendProfiles[0]) return { type: 'direct', id: friendProfiles[0].id };
  if (groups[0]) return { type: 'group', id: groups[0].id };
  return { type: 'direct', id: '' };
}
