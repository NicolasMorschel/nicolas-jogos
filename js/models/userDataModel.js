import { supabaseClient } from '../config/supabase.js';

export async function fetchProfile(userId) {
  return await supabaseClient.from('profiles').select('*').eq('id', userId).maybeSingle();
}
export async function fetchUserData(userId) {
  const [cartRes, favRes, libRes, cardsRes] = await Promise.all([
    supabaseClient.from('cart').select('game_id').eq('user_id', userId),
    supabaseClient.from('favorites').select('game_id').eq('user_id', userId),
    supabaseClient.from('library').select('game_id').eq('user_id', userId),
    supabaseClient.from('saved_cards').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  ]);
  return { cartRes, favRes, libRes, cardsRes };
}
export async function insertFavorite(userId, gameId) {
  return await supabaseClient.from('favorites').insert({ user_id: userId, game_id: gameId });
}
export async function deleteFavorite(userId, gameId) {
  return await supabaseClient.from('favorites').delete().eq('user_id', userId).eq('game_id', gameId);
}
export async function insertCart(userId, gameId) {
  return await supabaseClient.from('cart').insert({ user_id: userId, game_id: gameId });
}
export async function deleteCart(userId, gameId) {
  return await supabaseClient.from('cart').delete().eq('user_id', userId).eq('game_id', gameId);
}
export async function clearCart(userId) {
  return await supabaseClient.from('cart').delete().eq('user_id', userId);
}
export async function upsertLibrary(rows) {
  return await supabaseClient.from('library').upsert(rows, { onConflict: 'user_id,game_id', ignoreDuplicates: true });
}
export async function createPurchase(payload) {
  return await supabaseClient.from('purchases').insert(payload).select().single();
}
export async function createPurchaseItems(rows) {
  return await supabaseClient.from('purchase_items').insert(rows);
}
export async function saveCard(payload) {
  return await supabaseClient.from('saved_cards').insert(payload);
}
