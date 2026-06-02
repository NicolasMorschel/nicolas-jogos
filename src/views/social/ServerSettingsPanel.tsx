import type { FormEvent } from 'react';
import type {
  CommunityChannel,
  CommunityChannelType,
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  PublicProfile
} from '../../types';
import { ServerChannelsSettings } from './settings/ServerChannelsSettings';
import { ServerMembersSettings } from './settings/ServerMembersSettings';
import { ServerOverviewSettings } from './settings/ServerOverviewSettings';
import { ServerRolesSettings } from './settings/ServerRolesSettings';
import type { SocialSettingsTab } from './socialTypes';

export function ServerSettingsPanel({
  tab,
  setTab,
  server,
  channels,
  members,
  roles,
  memberRoles,
  addableFriends,
  profileById,
  memberToAdd,
  setMemberToAdd,
  roleUserId,
  setRoleUserId,
  roleId,
  setRoleId,
  roleName,
  setRoleName,
  roleColor,
  setRoleColor,
  channelName,
  setChannelName,
  channelType,
  setChannelType,
  copiedInvite,
  createChannel,
  createRole,
  copyServerInvite,
  onAddMember,
  onUpdateVisibility,
  onDeleteServer,
  onDeleteChannel,
  onDeleteRole,
  onUpdateRoleVoicePermission,
  onAssignRole,
  onOpenProfile
}: {
  tab: SocialSettingsTab;
  setTab: (tab: SocialSettingsTab) => void;
  server: CommunityServer;
  channels: CommunityChannel[];
  members: CommunityServerMember[];
  roles: CommunityRole[];
  memberRoles: CommunityMemberRole[];
  addableFriends: PublicProfile[];
  profileById: Map<string, PublicProfile>;
  memberToAdd: string;
  setMemberToAdd: (value: string) => void;
  roleUserId: string;
  setRoleUserId: (value: string) => void;
  roleId: string;
  setRoleId: (value: string) => void;
  roleName: string;
  setRoleName: (value: string) => void;
  roleColor: string;
  setRoleColor: (value: string) => void;
  channelName: string;
  setChannelName: (value: string) => void;
  channelType: CommunityChannelType;
  setChannelType: (value: CommunityChannelType) => void;
  copiedInvite: boolean;
  createChannel: (event: FormEvent<HTMLFormElement>) => void;
  createRole: (event: FormEvent<HTMLFormElement>) => void;
  copyServerInvite: (server: CommunityServer) => Promise<void> | void;
  onAddMember: (serverId: number, userId: string) => Promise<void> | void;
  onUpdateVisibility: (serverId: number, visibility: CommunityServer['visibility']) => Promise<void> | void;
  onDeleteServer: (serverId: number) => Promise<void> | void;
  onDeleteChannel: (channelId: number) => Promise<void> | void;
  onDeleteRole: (roleId: number) => Promise<void> | void;
  onUpdateRoleVoicePermission: (roleId: number, canModerateVoice: boolean) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  onOpenProfile: (profileId: string) => void;
}) {
  return (
    <div className="social-settings flex-grow-1 overflow-auto">
      <div className="row g-0 h-100">
        <aside className="col-12 col-lg-3 social-settings-nav border-end border-dark-subtle p-3">
          <div className="kicker mb-2">Config. do servidor</div>
          <h2 className="h5 mb-3">{server.name}</h2>
          <div className="nav nav-pills flex-lg-column gap-2">
            <SettingsButton active={tab === 'overview'} onClick={() => setTab('overview')}>Visao geral</SettingsButton>
            <SettingsButton active={tab === 'channels'} onClick={() => setTab('channels')}>Canais</SettingsButton>
            <SettingsButton active={tab === 'roles'} onClick={() => setTab('roles')}>Cargos</SettingsButton>
            <SettingsButton active={tab === 'members'} onClick={() => setTab('members')}>Membros</SettingsButton>
          </div>
        </aside>

        <div className="col social-settings-content p-3 p-lg-4">
          {tab === 'overview' && (
            <ServerOverviewSettings
              server={server}
              addableFriends={addableFriends}
              memberToAdd={memberToAdd}
              setMemberToAdd={setMemberToAdd}
              copiedInvite={copiedInvite}
              copyServerInvite={copyServerInvite}
              onAddMember={onAddMember}
              onUpdateVisibility={onUpdateVisibility}
              onDeleteServer={onDeleteServer}
            />
          )}

          {tab === 'channels' && (
            <ServerChannelsSettings
              channels={channels}
              channelName={channelName}
              setChannelName={setChannelName}
              channelType={channelType}
              setChannelType={setChannelType}
              createChannel={createChannel}
              onDeleteChannel={onDeleteChannel}
            />
          )}

          {tab === 'roles' && (
            <ServerRolesSettings
              server={server}
              members={members}
              roles={roles}
              memberRoles={memberRoles}
              roleUserId={roleUserId}
              setRoleUserId={setRoleUserId}
              roleId={roleId}
              setRoleId={setRoleId}
              roleName={roleName}
              setRoleName={setRoleName}
              roleColor={roleColor}
              setRoleColor={setRoleColor}
              createRole={createRole}
              onDeleteRole={onDeleteRole}
              onUpdateRoleVoicePermission={onUpdateRoleVoicePermission}
              onAssignRole={onAssignRole}
              profileById={profileById}
            />
          )}

          {tab === 'members' && (
            <ServerMembersSettings
              members={members}
              roles={roles}
              memberRoles={memberRoles}
              profileById={profileById}
              onOpenProfile={onOpenProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button className={`btn text-start ${active ? 'btn-primary' : 'btn-outline-light'}`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}
