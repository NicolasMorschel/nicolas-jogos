import type {
  ChatGroup,
  ChatMessage,
  CommunityChannel,
  CommunityServer,
  Friendship,
  PublicProfile,
  SocialTarget
} from '../../types';

export const SOCIAL_TARGET_STORAGE_KEY = 'nicolas-jogos-social-target';

export function findFirstTarget(friendProfiles: PublicProfile[], groups: ChatGroup[], servers: CommunityServer[], channels: CommunityChannel[]): SocialTarget {
  if (friendProfiles[0]) return { type: 'direct', id: friendProfiles[0].id };
  if (groups[0]) return { type: 'group', id: groups[0].id };
  const firstServer = servers[0];
  const firstChannel = firstServer
    ? channels.find(channel => channel.server_id === firstServer.id && channel.channel_type === 'text') || channels.find(channel => channel.server_id === firstServer.id)
    : undefined;
  return firstChannel ? { type: 'server_channel', id: firstChannel.id } : { type: 'direct', id: '' };
}

export function readStoredTarget(): SocialTarget | null {
  try {
    const raw = localStorage.getItem(SOCIAL_TARGET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SocialTarget;
    if (parsed?.type === 'direct' || parsed?.type === 'group' || parsed?.type === 'server_channel') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function targetExists(target: SocialTarget, friends: PublicProfile[], groups: ChatGroup[], channels: CommunityChannel[]) {
  if (!target.id) return false;
  if (target.type === 'direct') return friends.some(friend => friend.id === target.id);
  if (target.type === 'group') return groups.some(group => group.id === target.id);
  return channels.some(channel => channel.id === target.id);
}

export function filterMessages(messages: ChatMessage[], currentUserId: string, target: SocialTarget) {
  if (!target.id) return [];
  return messages.filter(message => {
    if (target.type === 'direct') {
      return message.conversation_type === 'direct'
        && ((message.sender_id === currentUserId && message.receiver_id === target.id) || (message.sender_id === target.id && message.receiver_id === currentUserId));
    }
    if (target.type === 'group') return message.conversation_type === 'group' && message.group_id === target.id;
    return message.conversation_type === 'server_channel' && message.server_channel_id === target.id;
  });
}

export function targetLabel(target: SocialTarget, profileById: Map<string, PublicProfile>, groups: ChatGroup[], channels: CommunityChannel[]) {
  if (target.type === 'direct') return profileById.get(String(target.id))?.name || '';
  if (target.type === 'group') return groups.find(group => group.id === target.id)?.name || '';
  return channels.find(channel => channel.id === target.id)?.name || '';
}

export function sortChannels(a: CommunityChannel, b: CommunityChannel) {
  return a.position - b.position || a.id - b.id;
}

export function relationFor(targetId: string, currentUserId: string, friendships: Friendship[]) {
  return friendships.find(friendship =>
    (friendship.requester_id === currentUserId && friendship.addressee_id === targetId)
    || (friendship.requester_id === targetId && friendship.addressee_id === currentUserId)
  );
}

export function relationLabel(relation?: Friendship) {
  if (!relation) return 'Adicionar';
  if (relation.status === 'accepted') return 'Amigo';
  if (relation.status === 'pending') return 'Pendente';
  if (relation.status === 'blocked') return 'Bloqueado';
  return 'Adicionar';
}

export function buildInviteUrl(server: CommunityServer) {
  const code = server.invite_code || String(server.id);
  return `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(code)}`;
}

export function normalizeInviteInput(value: string) {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('invite') || trimmed;
  } catch {
    return trimmed;
  }
}

export function requestAudioStream() {
  return new Promise<MediaStream>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('audio-permission-timeout')), 10000);
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        window.clearTimeout(timeoutId);
        resolve(stream);
      })
      .catch(error => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}
