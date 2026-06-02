import { supabase } from '../lib/supabase';
import { fetchUserGameRestrictions } from './admin';
import { fetchCommunicationData } from './social/communicationData';
import { fetchFriendships, fetchGamePlayStats, fetchPublicProfiles, fetchUserReports } from './profile';

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
