import { useState, type FormEvent } from 'react';
import type {
  ChatGroup,
  CommunityChannel,
  CommunityServer,
  Profile,
  PublicProfile,
  SocialTarget
} from '../../types';
import { ProfileDot } from './SocialPrimitives';
import { UserVoiceDock } from './UserVoiceDock';

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
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group nav nav-pills flex-grow-1" role="group" aria-label="Filtros sociais">
              <button className={`btn btn-sm ${socialTab === 'friends' ? 'btn-primary' : 'btn-outline-light'}`} type="button" onClick={() => setSocialTab('friends')}>Amigos</button>
              <button className={`btn btn-sm ${socialTab === 'available' ? 'btn-primary' : 'btn-outline-light'}`} type="button" onClick={() => setSocialTab('available')}>Online</button>
              <button className={`btn btn-sm ${socialTab === 'all' ? 'btn-primary' : 'btn-outline-light'}`} type="button" onClick={() => setSocialTab('all')}>Todos</button>
            </div>
            <button
              className={`btn btn-sm social-filter-add ${socialTab === 'add' ? 'btn-primary' : 'btn-outline-light'}`}
              title="Adicionar pessoas ou comunidade"
              type="button"
              onClick={() => setSocialTab('add')}
            >
              +
            </button>
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
                  <input className="form-control" value={inviteCode} onChange={event => setInviteCode(event.target.value)} placeholder="Codigo ou link do servidor" />
                  <button className="btn btn-primary" type="submit">Entrar</button>
                </div>
              </div>
            </form>

            <form className="card social-tool-card mt-3" onSubmit={createGroup}>
              <div className="card-body">
                <h3 className="h6 mb-3">Novo grupo</h3>
                <input className="form-control mb-2" value={groupName} onChange={event => setGroupName(event.target.value)} placeholder="Nome do grupo" />
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
                <button className="btn btn-primary w-100" type="submit">Criar grupo</button>
              </div>
            </form>

            <form className="card social-tool-card mt-3" onSubmit={createServer}>
              <div className="card-body">
                <h3 className="h6 mb-3">Nova comunidade</h3>
                <input className="form-control mb-2" value={serverName} onChange={event => setServerName(event.target.value)} placeholder="Nome da comunidade" />
                <input className="form-control mb-3" value={serverDescription} onChange={event => setServerDescription(event.target.value)} placeholder="Resumo curto" />
                <button className="btn btn-outline-light w-100" type="submit">Criar comunidade</button>
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
                  <button className="btn btn-sm btn-primary" type="button" onClick={() => onJoinServerByInvite(server.invite_code || String(server.id))}>Entrar</button>
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
