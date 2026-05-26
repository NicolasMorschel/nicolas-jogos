import { supabase } from './lib/supabase';
import type {
  ChatAttachmentType,
  ChatGroup,
  ChatGroupMember,
  ChatMessage,
  CommunityChannel,
  CommunityChannelType,
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  CommunityVoicePresence,
  Friendship,
  Game,
  GamePlayStats,
  GameRestriction,
  GameRestrictionType,
  LibraryItem,
  PaymentMethod,
  Profile,
  PublicProfile,
  SocialTarget,
  UserReport
} from './types';

export async function getSession() {
  return supabase.auth.getSession();
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(name: string, email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function updateAuthEmail(email: string) {
  return supabase.auth.updateUser({ email });
}

export async function updateAuthPassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export function onAuthStateChange(callback: () => void | Promise<void>) {
  return supabase.auth.onAuthStateChange(() => {
    void callback();
  });
}

export async function fetchProfile(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).maybeSingle<Profile>();
}

export async function updateOwnProfile(name: string, bio: string, avatarUrl: string, bannerUrl: string) {
  return supabase.rpc('update_own_profile', {
    next_name: name,
    next_bio: bio,
    next_avatar_url: avatarUrl,
    next_banner_url: bannerUrl
  }).single<Profile>();
}

export async function fetchGames() {
  return supabase.from('games').select('*').order('id').returns<Game[]>();
}

export async function fetchStoreSettings() {
  return supabase.from('store_settings').select('*').order('key');
}

export async function saveStoreSetting(key: string, value: unknown) {
  return supabase.from('store_settings').upsert({ key, value }, { onConflict: 'key' });
}

export async function fetchUserData(userId: string) {
  const [cartRes, favRes, libRes, cardsRes, restrictionsRes, profilesRes, friendshipsRes, reportsRes, playStatsRes, communicationRes] = await Promise.all([
    supabase.from('cart').select('game_id').eq('user_id', userId),
    supabase.from('favorites').select('game_id').eq('user_id', userId),
    supabase.from('library').select('game_id').eq('user_id', userId),
    supabase.from('saved_cards').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    fetchUserGameRestrictions(userId),
    fetchPublicProfiles(),
    fetchFriendships(userId),
    fetchUserReports(userId),
    fetchGamePlayStats(userId),
    fetchCommunicationData(userId)
  ]);

  return { cartRes, favRes, libRes, cardsRes, restrictionsRes, profilesRes, friendshipsRes, reportsRes, playStatsRes, communicationRes };
}

export async function fetchPublicProfiles() {
  return supabase
    .from('profiles')
    .select('id, name, avatar_url, banner_url, bio, created_at')
    .eq('status', 'active')
    .order('name')
    .returns<PublicProfile[]>();
}

export async function fetchFriendships(userId: string) {
  return supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
    .returns<Friendship[]>();
}

export async function requestFriendship(requesterId: string, addresseeId: string) {
  return supabase.from('friendships').insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' }).select().single<Friendship>();
}

export async function updateFriendshipStatus(friendshipId: number, status: Friendship['status']) {
  return supabase.from('friendships').update({ status, updated_at: new Date().toISOString() }).eq('id', friendshipId);
}

export async function fetchUserReports(userId: string) {
  return supabase
    .from('user_reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
    .returns<UserReport[]>();
}

export async function createUserReport(payload: {
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details: string;
}) {
  return supabase.from('user_reports').insert(payload).select().single<UserReport>();
}

export async function fetchGamePlayStats(userId: string) {
  return supabase
    .from('game_play_stats')
    .select('*')
    .eq('user_id', userId)
    .order('minutes_played', { ascending: false })
    .returns<GamePlayStats[]>();
}

export async function recordGamePlay(userId: string, gameId: number, minutes = 30) {
  const currentRes = await supabase
    .from('game_play_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle<GamePlayStats>();

  if (currentRes.error) return currentRes;

  const payload = {
    user_id: userId,
    game_id: gameId,
    minutes_played: Number(currentRes.data?.minutes_played || 0) + minutes,
    launch_count: Number(currentRes.data?.launch_count || 0) + 1,
    last_played_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return currentRes.data
    ? supabase.from('game_play_stats').update(payload).eq('user_id', userId).eq('game_id', gameId).select().single<GamePlayStats>()
    : supabase.from('game_play_stats').insert(payload).select().single<GamePlayStats>();
}

export async function fetchChatMessages(userId: string) {
  return supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_type', 'direct')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: true })
    .limit(300)
    .returns<ChatMessage[]>();
}

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

  return {
    error: null,
    data: {
      chatMessages: [
        ...(directMessagesRes.data || []),
        ...(groupMessagesRes.data || []),
        ...(serverMessagesRes.data || [])
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
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

function emptyResult<T>() {
  return Promise.resolve({ data: [] as T[], error: null });
}

export async function uploadChatMedia(userId: string, file: File) {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const safeBase = file.name
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'arquivo';
  const path = `${userId}/${Date.now()}-${safeBase}.${extension}`;
  const uploadRes = await supabase.storage.from('chat-media').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false
  });
  if (uploadRes.error) return { data: null, error: uploadRes.error };

  const publicRes = supabase.storage.from('chat-media').getPublicUrl(path);
  return {
    data: {
      url: publicRes.data.publicUrl,
      name: file.name,
      type: attachmentTypeFromMime(file.type)
    },
    error: null
  };
}

export function attachmentTypeFromMime(mimeType: string): ChatAttachmentType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

export async function sendChatMessage(payload: {
  senderId: string;
  target: SocialTarget;
  body: string;
  attachmentUrl?: string;
  attachmentType?: ChatAttachmentType;
  attachmentName?: string;
}) {
  const base = {
    sender_id: payload.senderId,
    body: payload.body.trim() || (payload.attachmentUrl ? 'Anexo' : ''),
    attachment_url: payload.attachmentUrl || '',
    attachment_type: payload.attachmentType || 'none',
    attachment_name: payload.attachmentName || ''
  };

  const row: Record<string, unknown> = payload.target.type === 'direct'
    ? { ...base, conversation_type: 'direct', receiver_id: payload.target.id, group_id: null, server_channel_id: null }
    : payload.target.type === 'group'
      ? { ...base, conversation_type: 'group', receiver_id: null, group_id: payload.target.id, server_channel_id: null }
      : { ...base, conversation_type: 'server_channel', receiver_id: null, group_id: null, server_channel_id: payload.target.id };

  return supabase.from('chat_messages').insert(row).select().single<ChatMessage>();
}

export async function deleteChatMessage(messageId: number) {
  return supabase.from('chat_messages').delete().eq('id', messageId);
}

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

export async function assignCommunityRole(serverId: number, userId: string, roleId: number) {
  return supabase.from('community_member_roles').upsert({ server_id: serverId, user_id: userId, role_id: roleId }, { onConflict: 'server_id,user_id,role_id' });
}

export async function joinVoiceChannel(channelId: number, userId: string) {
  return supabase.from('community_voice_presence').upsert({ channel_id: channelId, user_id: userId, joined_at: new Date().toISOString() }, { onConflict: 'channel_id,user_id' });
}

export async function leaveVoiceChannel(channelId: number, userId: string) {
  return supabase.from('community_voice_presence').delete().eq('channel_id', channelId).eq('user_id', userId);
}

export async function insertFavorite(userId: string, gameId: number) {
  return supabase.from('favorites').insert({ user_id: userId, game_id: gameId });
}

export async function deleteFavorite(userId: string, gameId: number) {
  return supabase.from('favorites').delete().eq('user_id', userId).eq('game_id', gameId);
}

export async function insertCart(userId: string, gameId: number) {
  return supabase.from('cart').insert({ user_id: userId, game_id: gameId });
}

export async function deleteCart(userId: string, gameId: number) {
  return supabase.from('cart').delete().eq('user_id', userId).eq('game_id', gameId);
}

export async function clearCart(userId: string) {
  return supabase.from('cart').delete().eq('user_id', userId);
}

export async function createPurchase(payload: {
  user_id: string;
  payment_method: PaymentMethod;
  installments: number;
  total: number;
}) {
  return supabase.from('purchases').insert(payload).select().single();
}

export async function upsertLibrary(rows: Array<{ user_id: string; game_id: number; source: 'purchase' | 'admin_grant' }>) {
  return supabase.from('library').upsert(rows, { onConflict: 'user_id,game_id', ignoreDuplicates: true });
}

export async function createPurchaseItems(rows: Array<{ purchase_id: number; game_id: number }>) {
  return supabase.from('purchase_items').insert(rows);
}

export async function saveCard(payload: {
  user_id: string;
  brand: string;
  last4: string;
  holder_name: string;
}) {
  return supabase.from('saved_cards').insert(payload);
}

export async function fetchAdminUsers() {
  return supabase.from('admin_user_overview').select('*').order('created_at');
}

export async function fetchUserLibrary(userId: string) {
  return supabase.from('library').select('game_id, source').eq('user_id', userId).returns<LibraryItem[]>();
}

export async function fetchUserGameRestrictions(userId: string) {
  return supabase
    .from('game_restrictions')
    .select('*')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .returns<GameRestriction[]>();
}

export async function createGameRestriction(payload: {
  user_id: string;
  game_id: number;
  restriction_type: GameRestrictionType;
  reason: string;
  expires_at: string | null;
  created_by: string | null;
}) {
  return supabase.from('game_restrictions').insert(payload).select().single<GameRestriction>();
}

export async function revokeActiveGameBans(userId: string, gameId: number, adminId: string | null) {
  return supabase
    .from('game_restrictions')
    .update({ revoked_at: new Date().toISOString(), revoked_by: adminId, revoked_reason: 'Substituído por nova restrição.' })
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .in('restriction_type', ['temporary_ban', 'permanent_ban'])
    .is('revoked_at', null);
}

export async function revokeGameRestriction(restrictionId: number, adminId: string | null) {
  return supabase
    .from('game_restrictions')
    .update({ revoked_at: new Date().toISOString(), revoked_by: adminId, revoked_reason: 'Revogado pelo admin.' })
    .eq('id', restrictionId);
}

export async function updateUserStatus(id: string, status: 'active' | 'blocked') {
  return supabase.from('profiles').update({ status }).eq('id', id);
}

export async function updateUserRole(id: string, role: 'user' | 'admin') {
  return supabase.from('profiles').update({ role }).eq('id', id);
}

export async function adminAddLibrary(userId: string, gameId: number) {
  return supabase
    .from('library')
    .upsert({ user_id: userId, game_id: gameId, source: 'admin_grant' }, { onConflict: 'user_id,game_id', ignoreDuplicates: true });
}

export async function adminRemoveLibrary(userId: string, gameId: number) {
  return supabase.from('library').delete().eq('user_id', userId).eq('game_id', gameId);
}

export async function addAdminLog(payload: Record<string, unknown>) {
  return supabase.from('admin_logs').insert(payload);
}

export async function createGame(payload: Omit<Game, 'id'>) {
  return supabase.from('games').insert(payload).select().single<Game>();
}

export async function updateGame(id: number, payload: Omit<Game, 'id'>) {
  return supabase.from('games').update(payload).eq('id', id).select().single<Game>();
}

export async function deleteGameRelations(gameId: number) {
  const libRes = await supabase.from('library').delete().eq('game_id', gameId);
  if (libRes.error) return libRes;

  const cartRes = await supabase.from('cart').delete().eq('game_id', gameId);
  if (cartRes.error) return cartRes;

  const favRes = await supabase.from('favorites').delete().eq('game_id', gameId);
  if (favRes.error) return favRes;

  return { error: null };
}

export async function deleteGame(gameId: number) {
  return supabase.from('games').delete().eq('id', gameId);
}
