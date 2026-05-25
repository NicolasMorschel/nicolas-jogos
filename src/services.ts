import { supabase } from './lib/supabase';
import type { Game, LibraryItem, PaymentMethod, Profile } from './types';

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

export function onAuthStateChange(callback: () => void | Promise<void>) {
  return supabase.auth.onAuthStateChange(() => {
    void callback();
  });
}

export async function fetchProfile(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).maybeSingle<Profile>();
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
  const [cartRes, favRes, libRes, cardsRes] = await Promise.all([
    supabase.from('cart').select('game_id').eq('user_id', userId),
    supabase.from('favorites').select('game_id').eq('user_id', userId),
    supabase.from('library').select('game_id').eq('user_id', userId),
    supabase.from('saved_cards').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  ]);

  return { cartRes, favRes, libRes, cardsRes };
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
