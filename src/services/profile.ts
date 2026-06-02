import { supabase } from '../lib/supabase';
import type { Friendship, GamePlayStats, LibraryItem, Profile, ProfileComment, PublicProfile, UserReport } from '../types';
import { isMissingDatabaseShapeError } from './social/helpers';

const PROFILE_MEDIA_BUCKET = 'profile-media';

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

export async function fetchPublicProfiles() {
  return supabase
    .from('profiles')
    .select('id, name, avatar_url, banner_url, bio, created_at')
    .eq('status', 'active')
    .order('name')
    .returns<PublicProfile[]>();
}

export async function uploadProfileMedia(userId: string, file: File, kind: 'avatar' | 'banner') {
  if (!file.type.startsWith('image/')) {
    return { data: null, error: new Error('Use uma imagem para foto ou banner.') };
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${userId}/${kind}-${Date.now()}.${extension}`;
  let bucket = PROFILE_MEDIA_BUCKET;
  let uploadRes = await uploadProfileFile(bucket, path, file);

  if (uploadRes.error) {
    bucket = 'chat-media';
    uploadRes = await uploadProfileFile(bucket, `${userId}/profile/${kind}-${Date.now()}.${extension}`, file);
  }

  if (uploadRes.error) return { data: null, error: uploadRes.error };

  const publicRes = supabase.storage.from(bucket).getPublicUrl(uploadRes.data.path);
  return {
    data: {
      url: publicRes.data.publicUrl,
      path: uploadRes.data.path
    },
    error: null
  };
}

export async function fetchProfileComments(profileId: string) {
  const res = await supabase
    .from('profile_comments')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(40)
    .returns<ProfileComment[]>();

  return isMissingDatabaseShapeError(res.error) ? { data: [] as ProfileComment[], error: null } : res;
}

export async function createProfileComment(profileId: string, authorId: string, body: string) {
  return supabase
    .from('profile_comments')
    .insert({ profile_id: profileId, author_id: authorId, body })
    .select()
    .single<ProfileComment>();
}

export async function deleteProfileComment(commentId: number) {
  return supabase.from('profile_comments').delete().eq('id', commentId);
}

export async function fetchPublicProfileCollections(userId: string) {
  const [libraryRes, favoritesRes, playStatsRes] = await Promise.all([
    supabase.from('library').select('game_id, source').eq('user_id', userId).returns<LibraryItem[]>(),
    supabase.from('favorites').select('game_id').eq('user_id', userId),
    supabase.from('game_play_stats').select('*').eq('user_id', userId).returns<GamePlayStats[]>()
  ]);

  const permissionDenied = [libraryRes.error, favoritesRes.error, playStatsRes.error].some(error =>
    error?.code === '42501' || error?.message?.toLowerCase().includes('permission denied')
  );

  if (permissionDenied) {
    return {
      data: { libraryIds: [] as number[], favoriteIds: [] as number[], playStats: [] as GamePlayStats[] },
      error: null
    };
  }

  const error = libraryRes.error || favoritesRes.error || playStatsRes.error;
  return {
    data: {
      libraryIds: (libraryRes.data || []).map(row => Number(row.game_id)),
      favoriteIds: (favoritesRes.data || []).map(row => Number(row.game_id)),
      playStats: playStatsRes.data || []
    },
    error
  };
}

function uploadProfileFile(bucket: string, path: string, file: File) {
  return supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  });
}

export async function fetchFriendships(userId: string) {
  return supabase
    .from('friendships')
    .select('*')
    .or(`status.eq.accepted,requester_id.eq.${userId},addressee_id.eq.${userId}`)
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
