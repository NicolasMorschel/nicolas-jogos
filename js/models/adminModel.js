import { supabaseClient } from '../config/supabase.js';

export async function fetchAdminUsers() {
  return await supabaseClient.from('admin_user_overview').select('*').order('created_at');
}

export async function fetchUserLibrary(userId) {
  return await supabaseClient.from('library').select('game_id, source').eq('user_id', userId);
}

export async function updateUserStatus(id, status) {
  return await supabaseClient.from('profiles').update({ status }).eq('id', id);
}

export async function updateUserRole(id, role) {
  return await supabaseClient.from('profiles').update({ role }).eq('id', id);
}

export async function adminAddLibrary(userId, gameId) {
  return await supabaseClient
    .from('library')
    .upsert({ user_id: userId, game_id: gameId, source: 'admin_grant' }, { onConflict: 'user_id,game_id', ignoreDuplicates: true });
}

export async function adminRemoveLibrary(userId, gameId) {
  return await supabaseClient.from('library').delete().eq('user_id', userId).eq('game_id', gameId);
}

export async function addAdminLog(payload) {
  return await supabaseClient.from('admin_logs').insert(payload);
}

// ==========================
// CRUD DE JOGOS DO CATÁLOGO
// ==========================

export async function createGame(payload, signal) {
  let query = supabaseClient.from('games').insert(payload).select().single();
  if (signal) query = query.abortSignal(signal);
  return await query;
}

export async function updateGame(id, payload, signal) {
  let query = supabaseClient.from('games').update(payload).eq('id', id).select().single();
  if (signal) query = query.abortSignal(signal);
  return await query;
}

export async function deleteGameRelations(gameId) {
  const libRes = await supabaseClient.from('library').delete().eq('game_id', gameId);
  if (libRes.error) return libRes;

  const cartRes = await supabaseClient.from('cart').delete().eq('game_id', gameId);
  if (cartRes.error) return cartRes;

  const favRes = await supabaseClient.from('favorites').delete().eq('game_id', gameId);
  if (favRes.error) return favRes;

  return { error: null };
}

export async function deleteGame(gameId) {
  return await supabaseClient.from('games').delete().eq('id', gameId);
}
