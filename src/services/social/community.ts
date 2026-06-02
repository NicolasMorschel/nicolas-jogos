import { supabase } from '../../lib/supabase';
import type { ChatGroup, CommunityChannel, CommunityChannelType, CommunityRole, CommunityServer } from '../../types';

export async function createChatGroup(ownerId: string, name: string, memberIds: string[]) {
  const groupRes = await supabase.from('chat_groups').insert({ owner_id: ownerId, name: name.trim() }).select().single<ChatGroup>();
  if (groupRes.error || !groupRes.data) return groupRes;

  const uniqueMembers = Array.from(new Set([ownerId, ...memberIds]));
  const members = uniqueMembers.map(userId => ({
    group_id: groupRes.data.id,
    user_id: userId,
    member_role: userId === ownerId ? 'owner' : 'member'
  }));
  const membersRes = await supabase.from('chat_group_members').insert(members);
  if (membersRes.error) return { data: null, error: membersRes.error };
  return groupRes;
}

export async function createCommunityServer(ownerId: string, name: string, description: string) {
  const serverRes = await supabase
    .from('community_servers')
    .insert({ owner_id: ownerId, name: name.trim(), description: description.trim(), visibility: 'private' })
    .select()
    .single<CommunityServer>();
  if (serverRes.error || !serverRes.data) return serverRes;

  const serverId = serverRes.data.id;
  const memberRes = await supabase.from('community_server_members').insert({ server_id: serverId, user_id: ownerId });
  if (memberRes.error) return { data: null, error: memberRes.error };

  const roleRes = await supabase
    .from('community_roles')
    .insert({ server_id: serverId, name: 'Fundador', color: '#ffd166', position: 100, can_manage_server: true, can_manage_channels: true, can_manage_roles: true })
    .select()
    .single<CommunityRole>();
  if (roleRes.error || !roleRes.data) return { data: null, error: roleRes.error };

  const memberRoleRes = await supabase.from('community_member_roles').insert({ server_id: serverId, user_id: ownerId, role_id: roleRes.data.id });
  if (memberRoleRes.error) return { data: null, error: memberRoleRes.error };

  const channelsRes = await supabase.from('community_channels').insert([
    { server_id: serverId, name: 'geral', channel_type: 'text', position: 1 },
    { server_id: serverId, name: 'voz principal', channel_type: 'voice', position: 2 }
  ]);
  if (channelsRes.error) return { data: null, error: channelsRes.error };

  return serverRes;
}

export async function addServerMember(serverId: number, userId: string) {
  return supabase.from('community_server_members').insert({ server_id: serverId, user_id: userId });
}

export async function joinCommunityByInvite(invite: string) {
  return supabase.rpc('join_community_by_invite', { invite });
}

export async function updateCommunityServerVisibility(serverId: number, visibility: CommunityServer['visibility']) {
  return supabase
    .from('community_servers')
    .update({ visibility })
    .eq('id', serverId)
    .select()
    .single<CommunityServer>();
}

export async function deleteCommunityServer(serverId: number) {
  return supabase.from('community_servers').delete().eq('id', serverId);
}

export async function createCommunityChannel(serverId: number, name: string, type: CommunityChannelType) {
  return supabase
    .from('community_channels')
    .insert({ server_id: serverId, name: name.trim(), channel_type: type })
    .select()
    .single<CommunityChannel>();
}

export async function deleteCommunityChannel(channelId: number) {
  return supabase.from('community_channels').delete().eq('id', channelId);
}

export async function createCommunityRole(serverId: number, name: string, color: string) {
  return supabase
    .from('community_roles')
    .insert({ server_id: serverId, name: name.trim(), color, position: 1 })
    .select()
    .single<CommunityRole>();
}

export async function deleteCommunityRole(roleId: number) {
  return supabase.from('community_roles').delete().eq('id', roleId);
}

export async function updateCommunityRoleVoicePermission(roleId: number, canModerateVoice: boolean) {
  return supabase
    .from('community_roles')
    .update({ can_moderate_voice: canModerateVoice })
    .eq('id', roleId)
    .select()
    .single<CommunityRole>();
}

export async function assignCommunityRole(serverId: number, userId: string, roleId: number) {
  return supabase.from('community_member_roles').upsert({ server_id: serverId, user_id: userId, role_id: roleId }, { onConflict: 'server_id,user_id,role_id' });
}

export async function joinVoiceChannel(channelId: number, userId: string) {
  return supabase.from('community_voice_presence').upsert({ channel_id: channelId, user_id: userId, joined_at: new Date().toISOString() }, { onConflict: 'channel_id,user_id' });
}

export async function leaveVoiceChannel(channelId: number, userId: string) {
  return supabase.from('community_voice_presence').delete().eq('channel_id', channelId).eq('user_id', userId);
}

export async function kickVoiceMember(channelId: number, targetUserId: string) {
  return supabase.rpc('kick_voice_member', {
    channel_id_input: channelId,
    target_user_id_input: targetUserId
  });
}
