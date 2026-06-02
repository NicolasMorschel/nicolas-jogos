import { useMemo } from 'react';
import type {
  ChatGroup,
  ChatMessage,
  ChatMessageReaction,
  CommunityChannel,
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
import { filterMessages, findFirstTarget, sortChannels, targetLabel } from './socialHelpers';

type SocialViewModelArgs = {
  profile: Profile;
  socialProfiles: PublicProfile[];
  friendships: Friendship[];
  chatMessages: ChatMessage[];
  chatMessageReactions: ChatMessageReaction[];
  chatMessagePins: Array<{ message_id: number }>;
  chatGroups: ChatGroup[];
  communityServers: CommunityServer[];
  communityServerMembers: CommunityServerMember[];
  communityRoles: CommunityRole[];
  communityMemberRoles: CommunityMemberRole[];
  communityChannels: CommunityChannel[];
  communityVoicePresence: CommunityVoicePresence[];
  target: SocialTarget;
};

export function useSocialViewModel({
  profile,
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
  target
}: SocialViewModelArgs) {
  const profileById = useMemo(() => new Map(socialProfiles.map(user => [user.id, user])), [socialProfiles]);
  const profileId = profile.id;
  const acceptedFriendships = friendships.filter(friendship => friendship.status === 'accepted');
  const incoming = friendships.filter(friendship => friendship.status === 'pending' && friendship.addressee_id === profileId);
  const outgoing = friendships.filter(friendship => friendship.status === 'pending' && friendship.requester_id === profileId);
  const friendIds = acceptedFriendships.map(friendship => friendship.requester_id === profileId ? friendship.addressee_id : friendship.requester_id);
  const friendProfiles = friendIds.map(id => profileById.get(id)).filter(Boolean) as PublicProfile[];
  const otherProfiles = socialProfiles.filter(user => user.id !== profileId);
  const firstTarget = findFirstTarget(friendProfiles, chatGroups, communityServers, communityChannels);

  const selectedChannel = target.type === 'server_channel'
    ? communityChannels.find(channel => channel.id === target.id)
    : undefined;
  const selectedServer = selectedChannel
    ? communityServers.find(server => server.id === selectedChannel.server_id)
    : undefined;
  const serverChannels = selectedServer
    ? communityChannels.filter(channel => channel.server_id === selectedServer.id).sort(sortChannels)
    : [];
  const textChannels = serverChannels.filter(channel => channel.channel_type === 'text');
  const voiceChannels = serverChannels.filter(channel => channel.channel_type === 'voice');

  const activeVoicePresence = communityVoicePresence.find(presence => presence.user_id === profileId);
  const activeVoiceChannel = activeVoicePresence
    ? communityChannels.find(channel => channel.id === activeVoicePresence.channel_id)
    : undefined;
  const activeVoiceServer = activeVoiceChannel
    ? communityServers.find(server => server.id === activeVoiceChannel.server_id)
    : undefined;
  const activeVoicePresences = activeVoiceChannel
    ? communityVoicePresence.filter(presence => presence.channel_id === activeVoiceChannel.id)
    : [];

  const serverMembers = selectedServer
    ? communityServerMembers.filter(member => member.server_id === selectedServer.id)
    : [];
  const serverRoles = selectedServer
    ? communityRoles.filter(role => role.server_id === selectedServer.id).sort((a, b) => b.position - a.position || a.id - b.id)
    : [];
  const selectedServerMemberRoles = selectedServer
    ? communityMemberRoles.filter(role => role.server_id === selectedServer.id)
    : [];
  const addableFriends = selectedServer
    ? friendProfiles.filter(friend => !serverMembers.some(member => member.user_id === friend.id))
    : [];

  const selectedServerMembership = selectedServer
    ? serverMembers.find(member => member.user_id === profileId)
    : undefined;
  const isSelectedServerMember = !!selectedServerMembership || !!(selectedServer && (selectedServer.owner_id === profileId || profile.role === 'admin'));
  const canManageSelectedServer = !!selectedServer && (selectedServer.owner_id === profileId || profile.role === 'admin');
  const canModerateActiveVoice = canModerateVoice(profile, activeVoiceServer, communityRoles, communityMemberRoles);
  const publicServers = communityServers.filter(server =>
    server.visibility === 'public'
    && !communityServerMembers.some(member => member.server_id === server.id && member.user_id === profileId)
  );

  const messageById = useMemo(() => new Map(chatMessages.map(message => [message.id, message])), [chatMessages]);
  const reactionsByMessageId = useMemo(() => {
    const map = new Map<number, ChatMessageReaction[]>();
    chatMessageReactions.forEach(reaction => {
      map.set(reaction.message_id, [...(map.get(reaction.message_id) || []), reaction]);
    });
    return map;
  }, [chatMessageReactions]);
  const pinnedMessageIds = useMemo(() => new Set(chatMessagePins.map(pin => pin.message_id)), [chatMessagePins]);
  const messages = filterMessages(chatMessages, profile.id, target);
  const activeVoiceTarget: SocialTarget | null = activeVoiceChannel ? { type: 'server_channel', id: activeVoiceChannel.id } : null;
  const voiceMessages = activeVoiceTarget ? filterMessages(chatMessages, profile.id, activeVoiceTarget).slice(-8) : [];
  const selectedTitle = targetLabel(target, profileById, chatGroups, communityChannels);
  const selectedSubtitle = target.type === 'direct'
    ? 'Mensagem direta'
    : target.type === 'group'
      ? 'Grupo privado'
      : 'Canal de texto';
  const roomProfile = target.type === 'direct' ? profileById.get(String(target.id)) : undefined;

  return {
    profileById,
    acceptedFriendships,
    incoming,
    outgoing,
    friendProfiles,
    otherProfiles,
    firstTarget,
    selectedChannel,
    selectedServer,
    serverChannels,
    textChannels,
    voiceChannels,
    activeVoicePresence,
    activeVoiceChannel,
    activeVoiceServer,
    activeVoicePresences,
    serverMembers,
    serverRoles,
    selectedServerMemberRoles,
    addableFriends,
    isSelectedServerMember,
    canManageSelectedServer,
    canModerateActiveVoice,
    publicServers,
    messageById,
    reactionsByMessageId,
    pinnedMessageIds,
    messages,
    activeVoiceTarget,
    voiceMessages,
    selectedTitle,
    selectedSubtitle,
    roomProfile
  };
}

export type SocialViewModel = ReturnType<typeof useSocialViewModel>;

function canModerateVoice(
  profile: Profile,
  server: CommunityServer | undefined,
  roles: CommunityRole[],
  memberRoles: CommunityMemberRole[]
) {
  if (!server) return false;
  if (server.owner_id === profile.id || profile.role === 'admin') return true;
  const userRoleIds = new Set(
    memberRoles
      .filter(memberRole => memberRole.server_id === server.id && memberRole.user_id === profile.id)
      .map(memberRole => memberRole.role_id)
  );
  return roles.some(role => role.server_id === server.id && userRoleIds.has(role.id) && !!role.can_moderate_voice);
}
