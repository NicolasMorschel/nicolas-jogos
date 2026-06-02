import type { ChatGroup, ChatMessage, CommunityChannel, CommunityServer, CommunityVoicePresence, Friendship, Profile, SocialTarget } from '../../types';
import { HomeSidebar, ServerChannelSidebar, ServerDock } from './SocialSidebars';
import { SocialMainStage } from './SocialMainStage';
import { SocialRightPanel } from './SocialRightPanel';
import type { ComposerMediaState } from './useComposerMedia';
import type { SocialUiState } from './useSocialUiState';
import type { SocialViewModel } from './useSocialViewModel';
import type { SocialSettingsTab } from './socialTypes';

type SocialWorkspaceActions = {
  setTarget: (target: SocialTarget) => void;
  openServerSettings: (tab?: SocialSettingsTab) => void;
  createGroup: (event: React.FormEvent<HTMLFormElement>) => void;
  createServer: (event: React.FormEvent<HTMLFormElement>) => void;
  joinByInvite: (event: React.FormEvent<HTMLFormElement>) => void;
  createChannel: (event: React.FormEvent<HTMLFormElement>) => void;
  createRole: (event: React.FormEvent<HTMLFormElement>) => void;
  copyServerInvite: (server: CommunityServer) => Promise<void> | void;
  enterVoiceChannel: (channelId: number) => Promise<void> | void;
  leaveActiveVoice: () => Promise<void> | void;
  reactToMessage: (messageId: number, emoji: string) => Promise<void> | void;
  togglePinnedMessage: (messageId: number) => Promise<void> | void;
  copyMessageText: (message: ChatMessage) => Promise<void> | void;
  reportMessage: (message: ChatMessage) => Promise<void> | void;
  submitChat: (event: React.FormEvent<HTMLFormElement>) => void;
  submitVoiceChat: (event: React.FormEvent<HTMLFormElement>) => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
  onSendChatMessage: (target: SocialTarget, body: string, file?: File | null, replyToMessageId?: number | null) => Promise<void> | void;
  onDeleteMessage: (messageId: number) => Promise<void> | void;
  onAddServerMember: (serverId: number, userId: string) => Promise<void> | void;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
  onUpdateServerVisibility: (serverId: number, visibility: CommunityServer['visibility']) => Promise<void> | void;
  onDeleteServer: (serverId: number) => Promise<void> | void;
  onDeleteChannel: (channelId: number) => Promise<void> | void;
  onDeleteRole: (roleId: number) => Promise<void> | void;
  onUpdateRoleVoicePermission: (roleId: number, canModerateVoice: boolean) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  onKickVoiceMember: (channelId: number, targetUserId: string) => Promise<void> | void;
  onOpenUserProfile: (profileId: string) => void;
};

type SocialWorkspaceProps = {
  profile: Profile;
  state: SocialUiState;
  media: ComposerMediaState;
  model: SocialViewModel;
  chatGroups: ChatGroup[];
  communityServers: CommunityServer[];
  communityChannels: CommunityChannel[];
  communityVoicePresence: CommunityVoicePresence[];
  friendships: Friendship[];
  actions: SocialWorkspaceActions;
};

export function SocialWorkspace({
  profile,
  state,
  media,
  model,
  chatGroups,
  communityServers,
  communityChannels,
  communityVoicePresence,
  friendships,
  actions
}: SocialWorkspaceProps) {
  const toggleMuted = () => state.setMuted(value => !value);
  const toggleDeafened = () => state.setDeafened(value => !value);
  const toggleVoiceChat = () => state.setVoiceChatOpen(value => !value);

  return (
    <section className="view active social-view">
      <div className="container-fluid social-workspace px-2 px-lg-3">
        <div className="row g-0 social-app-frame">
          <ServerDock
            profile={profile}
            selectedServer={model.selectedServer}
            servers={communityServers}
            channels={communityChannels}
            friendProfiles={model.friendProfiles}
            groups={chatGroups}
            setTarget={actions.setTarget}
          />

          <aside className="col-12 col-lg-3 col-xxl-2 social-channel-sidebar d-flex flex-column">
            {model.selectedServer ? (
              <ServerChannelSidebar
                profile={profile}
                server={model.selectedServer}
                textChannels={model.textChannels}
                voiceChannels={model.voiceChannels}
                target={state.target}
                isMember={model.isSelectedServerMember}
                canManage={model.canManageSelectedServer}
                profileById={model.profileById}
                voicePresence={communityVoicePresence}
                activeVoiceChannel={model.activeVoiceChannel}
                muted={state.muted}
                deafened={state.deafened}
                voiceChatOpen={state.voiceChatOpen}
                isRecording={media.isRecording}
                setTarget={actions.setTarget}
                openSettings={actions.openServerSettings}
                onJoinServerByInvite={actions.onJoinServerByInvite}
                onJoinVoiceChannel={actions.enterVoiceChannel}
                onToggleMuted={toggleMuted}
                onToggleDeafened={toggleDeafened}
                onToggleVoiceChat={toggleVoiceChat}
                onLeaveVoice={actions.leaveActiveVoice}
              />
            ) : (
              <HomeSidebar
                profile={profile}
                friendProfiles={model.friendProfiles}
                groups={chatGroups}
                publicServers={model.publicServers}
                channels={communityChannels}
                target={state.target}
                groupName={state.groupName}
                setGroupName={state.setGroupName}
                groupMembers={state.groupMembers}
                setGroupMembers={state.setGroupMembers}
                serverName={state.serverName}
                setServerName={state.setServerName}
                serverDescription={state.serverDescription}
                setServerDescription={state.setServerDescription}
                inviteCode={state.inviteCode}
                setInviteCode={state.setInviteCode}
                createGroup={actions.createGroup}
                createServer={actions.createServer}
                joinByInvite={actions.joinByInvite}
                onJoinServerByInvite={actions.onJoinServerByInvite}
                activeVoiceChannel={model.activeVoiceChannel}
                muted={state.muted}
                deafened={state.deafened}
                voiceChatOpen={state.voiceChatOpen}
                onToggleMuted={toggleMuted}
                onToggleDeafened={toggleDeafened}
                onToggleVoiceChat={toggleVoiceChat}
                onLeaveVoice={actions.leaveActiveVoice}
                setTarget={actions.setTarget}
              />
            )}
          </aside>

          <SocialMainStage
            target={state.target}
            profile={profile}
            selectedTitle={model.selectedTitle}
            selectedSubtitle={model.selectedSubtitle}
            selectedServer={model.selectedServer}
            selectedChannel={model.selectedChannel}
            roomProfile={model.roomProfile}
            settingsOpen={state.settingsOpen}
            settingsTab={state.settingsTab}
            setSettingsTab={state.setSettingsTab}
            openSettings={actions.openServerSettings}
            closeSettings={() => state.setSettingsOpen(false)}
            openProfile={() => state.target.type === 'direct' && actions.onOpenUserProfile(String(state.target.id))}
            canManageSelectedServer={model.canManageSelectedServer}
            serverChannels={model.serverChannels}
            serverMembers={model.serverMembers}
            serverRoles={model.serverRoles}
            selectedServerMemberRoles={model.selectedServerMemberRoles}
            addableFriends={model.addableFriends}
            profileById={model.profileById}
            memberToAdd={state.memberToAdd}
            setMemberToAdd={state.setMemberToAdd}
            roleUserId={state.roleUserId}
            setRoleUserId={state.setRoleUserId}
            roleId={state.roleId}
            setRoleId={state.setRoleId}
            roleName={state.roleName}
            setRoleName={state.setRoleName}
            roleColor={state.roleColor}
            setRoleColor={state.setRoleColor}
            channelName={state.channelName}
            setChannelName={state.setChannelName}
            channelType={state.channelType}
            setChannelType={state.setChannelType}
            copiedInvite={state.copiedInvite}
            createChannel={actions.createChannel}
            createRole={actions.createRole}
            copyServerInvite={actions.copyServerInvite}
            onAddServerMember={actions.onAddServerMember}
            onUpdateServerVisibility={actions.onUpdateServerVisibility}
            onDeleteServer={actions.onDeleteServer}
            onDeleteChannel={actions.onDeleteChannel}
            onDeleteRole={actions.onDeleteRole}
            onUpdateRoleVoicePermission={actions.onUpdateRoleVoicePermission}
            onAssignRole={actions.onAssignRole}
            onOpenProfile={actions.onOpenUserProfile}
            activeVoiceChannel={model.activeVoiceChannel}
            activeVoiceServer={model.activeVoiceServer}
            activeVoicePresences={model.activeVoicePresences}
            voiceChatOpen={state.voiceChatOpen}
            muted={state.muted}
            deafened={state.deafened}
            isRecording={media.isRecording}
            canModerateActiveVoice={model.canModerateActiveVoice}
            voiceMessages={model.voiceMessages}
            voiceChatText={state.voiceChatText}
            setVoiceChatText={state.setVoiceChatText}
            onToggleVoiceChat={toggleVoiceChat}
            onToggleMuted={toggleMuted}
            onToggleDeafened={toggleDeafened}
            submitVoiceChat={actions.submitVoiceChat}
            leaveActiveVoice={actions.leaveActiveVoice}
            onKickVoiceMember={actions.onKickVoiceMember}
            isSelectedServerMember={model.isSelectedServerMember}
            messages={model.messages}
            messageById={model.messageById}
            reactionsByMessageId={model.reactionsByMessageId}
            pinnedMessageIds={model.pinnedMessageIds}
            onJoinServerByInvite={actions.onJoinServerByInvite}
            onReactMessage={(messageId, emoji) => void actions.reactToMessage(messageId, emoji)}
            onReply={state.setReplyToMessage}
            onForward={message => state.setChatText(message.body)}
            onPin={messageId => void actions.togglePinnedMessage(messageId)}
            onCopy={message => void actions.copyMessageText(message)}
            onReport={message => void actions.reportMessage(message)}
            onDeleteMessage={actions.onDeleteMessage}
            chatText={state.chatText}
            setChatText={state.setChatText}
            selectedFile={media.selectedFile}
            selectedFileUrl={media.selectedFileUrl}
            setFileWithPreview={media.setFileWithPreview}
            fileInputRef={state.fileInputRef}
            isPreparingRecording={media.isPreparingRecording}
            recordingError={media.recordingError}
            replyToMessage={state.replyToMessage}
            onCancelReply={() => state.setReplyToMessage(null)}
            startRecording={media.startRecording}
            stopRecording={media.stopRecording}
            submitChat={actions.submitChat}
          />

          <SocialRightPanel
            selectedServer={model.selectedServer}
            roomProfile={model.roomProfile}
            profile={profile}
            serverMembers={model.serverMembers}
            serverRoles={model.serverRoles}
            selectedServerMemberRoles={model.selectedServerMemberRoles}
            profileById={model.profileById}
            openSettings={actions.openServerSettings}
            incoming={model.incoming}
            outgoing={model.outgoing}
            otherProfiles={model.otherProfiles}
            friendships={friendships}
            onOpenProfile={actions.onOpenUserProfile}
            onRequestFriend={actions.onRequestFriend}
            onUpdateFriendship={actions.onUpdateFriendship}
          />
        </div>
      </div>
    </section>
  );
}
