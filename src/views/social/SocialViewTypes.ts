import type {
  ChatGroup,
  ChatMessage,
  ChatMessagePin,
  ChatMessageReaction,
  ChatMessageReport,
  CommunityChannel,
  CommunityChannelType,
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  CommunityVoicePresence,
  Friendship,
  Profile,
  PublicProfile,
  SocialTarget
} from '../../types';

export type SocialViewProps = {
  profile: Profile | null;
  socialProfiles: PublicProfile[];
  friendships: Friendship[];
  chatMessages: ChatMessage[];
  chatMessageReactions: ChatMessageReaction[];
  chatMessagePins: ChatMessagePin[];
  chatMessageReports: ChatMessageReport[];
  chatGroups: ChatGroup[];
  communityServers: CommunityServer[];
  communityServerMembers: CommunityServerMember[];
  communityRoles: CommunityRole[];
  communityMemberRoles: CommunityMemberRole[];
  communityChannels: CommunityChannel[];
  communityVoicePresence: CommunityVoicePresence[];
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
  onSendChatMessage: (target: SocialTarget, body: string, file?: File | null, replyToMessageId?: number | null) => Promise<void> | void;
  onDeleteMessage: (messageId: number) => Promise<void> | void;
  onReactMessage: (messageId: number, emoji: string) => Promise<void> | void;
  onPinMessage: (messageId: number) => Promise<void> | void;
  onUnpinMessage: (messageId: number) => Promise<void> | void;
  onReportMessage: (messageId: number) => Promise<void> | void;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void> | void;
  onCreateServer: (name: string, description: string) => Promise<void> | void;
  onAddServerMember: (serverId: number, userId: string) => Promise<void> | void;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
  onUpdateServerVisibility: (serverId: number, visibility: CommunityServer['visibility']) => Promise<void> | void;
  onDeleteServer: (serverId: number) => Promise<void> | void;
  onCreateChannel: (serverId: number, name: string, type: CommunityChannelType) => Promise<void> | void;
  onDeleteChannel: (channelId: number) => Promise<void> | void;
  onCreateRole: (serverId: number, name: string, color: string) => Promise<void> | void;
  onDeleteRole: (roleId: number) => Promise<void> | void;
  onUpdateRoleVoicePermission: (roleId: number, canModerateVoice: boolean) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  onJoinVoice: (channelId: number) => Promise<void> | void;
  onLeaveVoice: (channelId: number) => Promise<void> | void;
  onKickVoiceMember: (channelId: number, targetUserId: string) => Promise<void> | void;
  onOpenUserProfile: (profileId: string) => void;
};
