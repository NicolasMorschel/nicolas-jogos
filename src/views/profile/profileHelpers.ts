import type { Friendship, Profile, PublicProfile } from '../../types';
import { coverStyle } from '../../utils';

export function profileBanner(profile: Profile) {
  if (profile.banner_url) return `linear-gradient(90deg, rgba(6,10,18,.92), rgba(6,10,18,.38)), url(${JSON.stringify(profile.banner_url)})`;
  return `${coverStyle(profile.name || 'Nicolas Jogos')}`;
}

export function publicProfileBanner(profile: PublicProfile) {
  if (profile.banner_url) return `linear-gradient(90deg, rgba(6,10,18,.92), rgba(6,10,18,.38)), url(${JSON.stringify(profile.banner_url)})`;
  return `${coverStyle(profile.name || 'Nicolas Jogos')}`;
}

export function relationFor(currentUserId: string, targetId: string, friendships: Friendship[]) {
  return friendships.find(friendship =>
    (friendship.requester_id === currentUserId && friendship.addressee_id === targetId)
    || (friendship.addressee_id === currentUserId && friendship.requester_id === targetId)
  );
}

export function relationLabel(relation: Friendship | undefined, currentUserId: string) {
  if (!relation) return 'Adicionar';
  if (relation.status === 'accepted') return 'Amigo';
  if (relation.status === 'rejected') return 'Adicionar';
  if (relation.status === 'pending') return relation.requester_id === currentUserId ? 'Enviado' : 'Responder';
  return 'Indisponível';
}
