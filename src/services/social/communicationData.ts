import { supabase } from '../../lib/supabase';
import type {
  ChatGroup,
  ChatGroupMember,
  ChatMessage,
  CommunityChannel,
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  CommunityVoicePresence
} from '../../types';
import { fetchChatMessageMeta, fetchChatMessages } from './chat';
import { emptyResult } from './helpers';

export async function fetchCommunicationData(userId: string) {
  const directMessagesRes = await fetchChatMessages(userId);
  if (directMessagesRes.error) return { error: directMessagesRes.error };

  const groupMembershipsRes = await supabase.from('chat_group_members').select('*').eq('user_id', userId).returns<ChatGroupMember[]>();
  if (groupMembershipsRes.error) return { error: groupMembershipsRes.error };
  const groupIds = (groupMembershipsRes.data || []).map(row => row.group_id);

  const serverMembershipsRes = await supabase.from('community_server_members').select('*').eq('user_id', userId).returns<CommunityServerMember[]>();
  if (serverMembershipsRes.error) return { error: serverMembershipsRes.error };
  const membershipServerIds = (serverMembershipsRes.data || []).map(row => row.server_id);

  const publicServersRes = await supabase
    .from('community_servers')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at')
    .returns<CommunityServer[]>();
  if (publicServersRes.error) return { error: publicServersRes.error };

  const publicServerIds = (publicServersRes.data || []).map(server => server.id);
  const serverIds = Array.from(new Set([...membershipServerIds, ...publicServerIds]));

  const [
    groupsRes,
    groupMembersRes,
    groupMessagesRes,
    serversRes,
    serverMembersRes,
    rolesRes,
    memberRolesRes,
    channelsRes,
    voicePresenceRes
  ] = await Promise.all([
    groupIds.length ? supabase.from('chat_groups').select('*').in('id', groupIds).order('created_at').returns<ChatGroup[]>() : emptyResult<ChatGroup>(),
    groupIds.length ? supabase.from('chat_group_members').select('*').in('group_id', groupIds).returns<ChatGroupMember[]>() : emptyResult<ChatGroupMember>(),
    groupIds.length ? supabase.from('chat_messages').select('*').eq('conversation_type', 'group').in('group_id', groupIds).order('created_at', { ascending: true }).limit(500).returns<ChatMessage[]>() : emptyResult<ChatMessage>(),
    serverIds.length ? supabase.from('community_servers').select('*').in('id', serverIds).order('created_at').returns<CommunityServer[]>() : emptyResult<CommunityServer>(),
    serverIds.length ? supabase.from('community_server_members').select('*').in('server_id', serverIds).returns<CommunityServerMember[]>() : emptyResult<CommunityServerMember>(),
    serverIds.length ? supabase.from('community_roles').select('*').in('server_id', serverIds).order('position').returns<CommunityRole[]>() : emptyResult<CommunityRole>(),
    serverIds.length ? supabase.from('community_member_roles').select('*').in('server_id', serverIds).returns<CommunityMemberRole[]>() : emptyResult<CommunityMemberRole>(),
    serverIds.length ? supabase.from('community_channels').select('*').in('server_id', serverIds).order('position').returns<CommunityChannel[]>() : emptyResult<CommunityChannel>(),
    serverIds.length ? supabase.from('community_voice_presence').select('*').returns<CommunityVoicePresence[]>() : emptyResult<CommunityVoicePresence>()
  ]);

  const firstError = [
    groupsRes,
    groupMembersRes,
    groupMessagesRes,
    serversRes,
    serverMembersRes,
    rolesRes,
    memberRolesRes,
    channelsRes,
    voicePresenceRes
  ].find(result => result.error)?.error;

  if (firstError) return { error: firstError };

  const channelIds = (channelsRes.data || []).map(channel => channel.id);
  const serverMessagesRes = channelIds.length
    ? await supabase.from('chat_messages').select('*').eq('conversation_type', 'server_channel').in('server_channel_id', channelIds).order('created_at', { ascending: true }).limit(700).returns<ChatMessage[]>()
    : await emptyResult<ChatMessage>();
  if (serverMessagesRes.error) return { error: serverMessagesRes.error };

  const chatMessages = [
    ...(directMessagesRes.data || []),
    ...(groupMessagesRes.data || []),
    ...(serverMessagesRes.data || [])
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const messageMetaRes = await fetchChatMessageMeta(chatMessages.map(message => message.id));
  if (messageMetaRes.error) return { error: messageMetaRes.error };

  return {
    error: null,
    data: {
      chatMessages,
      chatMessageReactions: messageMetaRes.data.reactions,
      chatMessagePins: messageMetaRes.data.pins,
      chatMessageReports: messageMetaRes.data.reports,
      chatGroups: groupsRes.data || [],
      chatGroupMembers: groupMembersRes.data || [],
      communityServers: serversRes.data || [],
      communityServerMembers: serverMembersRes.data || [],
      communityRoles: rolesRes.data || [],
      communityMemberRoles: memberRolesRes.data || [],
      communityChannels: channelsRes.data || [],
      communityVoicePresence: voicePresenceRes.data || []
    }
  };
}
