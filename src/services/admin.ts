import { supabase } from '../lib/supabase';
import type { Game, GameRestriction, GameRestrictionType, LibraryItem } from '../types';

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
    .update({ revoked_at: new Date().toISOString(), revoked_by: adminId, revoked_reason: 'Substituido por nova restricao.' })
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
