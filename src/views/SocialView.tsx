import { SocialWorkspace } from './social/SocialWorkspace';
import type { SocialViewProps } from './social/SocialViewTypes';
import { useComposerMedia } from './social/useComposerMedia';
import { useSocialFormHandlers } from './social/useSocialFormHandlers';
import { useSocialMessageActions } from './social/useSocialMessageActions';
import { useSocialTargetActions } from './social/useSocialTargetActions';
import { useSocialTargetEffects } from './social/useSocialTargetEffects';
import { useSocialUiState } from './social/useSocialUiState';
import { useSocialViewModel } from './social/useSocialViewModel';
import { useSocialVoiceActions } from './social/useSocialVoiceActions';

export function SocialView({
  profile,
  socialProfiles,
  friendships,
  chatMessages,
  chatMessageReactions,
  chatMessagePins,
  chatMessageReports: _chatMessageReports,
  chatGroups,
  communityServers,
  communityServerMembers,
  communityRoles,
  communityMemberRoles,
  communityChannels,
  communityVoicePresence,
  onRequestFriend,
  onUpdateFriendship,
  onSendChatMessage,
  onDeleteMessage,
  onReactMessage,
  onPinMessage,
  onUnpinMessage,
  onReportMessage,
  onCreateGroup,
  onCreateServer,
  onAddServerMember,
  onJoinServerByInvite,
  onUpdateServerVisibility,
  onDeleteServer,
  onCreateChannel,
  onDeleteChannel,
  onCreateRole,
  onDeleteRole,
  onUpdateRoleVoicePermission,
  onAssignRole,
  onJoinVoice,
  onLeaveVoice,
  onKickVoiceMember,
  onOpenUserProfile
}: SocialViewProps) {
  const safeProfile = profile || {
    id: '',
    name: '',
    role: 'user' as const,
    status: 'active' as const,
    avatar_url: '',
    banner_url: '',
    bio: '',
    created_at: ''
  };
  const state = useSocialUiState();
  const media = useComposerMedia();
  const model = useSocialViewModel({
    profile: safeProfile,
    socialProfiles,
    friendships,
    chatMessages,
    chatMessageReactions,
    chatMessagePins,
    chatGroups,
    communityServers,
    communityServerMembers,
    communityRoles,
    communityMemberRoles,
    communityChannels,
    communityVoicePresence,
    target: state.target
  });

  const { setTarget, openServerSettings } = useSocialTargetActions({
    selectedServer: model.selectedServer,
    setTargetState: state.setTargetState,
    setSettingsOpen: state.setSettingsOpen,
    setSettingsTab: state.setSettingsTab
  });

  useSocialTargetEffects({
    profile,
    target: state.target,
    firstTarget: model.firstTarget,
    friendProfiles: model.friendProfiles,
    chatGroups,
    communityChannels,
    selectedChannel: model.selectedChannel,
    inviteHandledRef: state.inviteHandledRef,
    setTarget,
    setSettingsOpen: state.setSettingsOpen,
    onJoinServerByInvite
  });

  const formHandlers = useSocialFormHandlers({
    target: state.target,
    chatText: state.chatText,
    selectedFile: media.selectedFile,
    replyToMessage: state.replyToMessage,
    activeVoiceTarget: model.activeVoiceTarget,
    voiceChatText: state.voiceChatText,
    groupName: state.groupName,
    groupMembers: state.groupMembers,
    serverName: state.serverName,
    serverDescription: state.serverDescription,
    inviteCode: state.inviteCode,
    selectedServer: model.selectedServer,
    channelName: state.channelName,
    channelType: state.channelType,
    roleName: state.roleName,
    roleColor: state.roleColor,
    setChatText: state.setChatText,
    setReplyToMessage: state.setReplyToMessage,
    setRecordingError: media.setRecordingError,
    setFileWithPreview: media.setFileWithPreview,
    setVoiceChatText: state.setVoiceChatText,
    setGroupName: state.setGroupName,
    setGroupMembers: state.setGroupMembers,
    setServerName: state.setServerName,
    setServerDescription: state.setServerDescription,
    setInviteCode: state.setInviteCode,
    setCopiedInvite: state.setCopiedInvite,
    setChannelName: state.setChannelName,
    setRoleName: state.setRoleName,
    onSendChatMessage,
    onCreateGroup,
    onCreateServer,
    onJoinServerByInvite,
    onCreateChannel,
    onCreateRole
  });

  const voiceActions = useSocialVoiceActions({
    profileId: safeProfile.id,
    activeVoicePresence: model.activeVoicePresence,
    setVoiceChatOpen: state.setVoiceChatOpen,
    onJoinVoice,
    onLeaveVoice
  });

  const messageActions = useSocialMessageActions({
    pinnedMessageIds: model.pinnedMessageIds,
    onReactMessage,
    onPinMessage,
    onUnpinMessage,
    onReportMessage
  });

  if (!profile) {
    return (
      <section className="view active">
        <div className="container-xxl page-shell">
          <div className="alert account-status-alert mb-0">Faz login para abrir as comunidades.</div>
        </div>
      </section>
    );
  }

  return (
    <SocialWorkspace
      profile={profile}
      state={state}
      media={media}
      model={model}
      chatGroups={chatGroups}
      communityServers={communityServers}
      communityChannels={communityChannels}
      communityVoicePresence={communityVoicePresence}
      friendships={friendships}
      actions={{
        setTarget,
        openServerSettings,
        ...formHandlers,
        ...voiceActions,
        ...messageActions,
        onRequestFriend,
        onUpdateFriendship,
        onSendChatMessage,
        onDeleteMessage,
        onAddServerMember,
        onJoinServerByInvite,
        onUpdateServerVisibility,
        onDeleteServer,
        onDeleteChannel,
        onDeleteRole,
        onUpdateRoleVoicePermission,
        onAssignRole,
        onKickVoiceMember,
        onOpenUserProfile
      }}
    />
  );
}
