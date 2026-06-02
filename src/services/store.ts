import { supabase } from '../lib/supabase';
import type { Game, PaymentMethod } from '../types';

export async function fetchGames() {
  return supabase.from('games').select('*').order('id').returns<Game[]>();
}

export async function fetchStoreSettings() {
  return supabase.from('store_settings').select('*').order('key');
}

export async function saveStoreSetting(key: string, value: unknown) {
  return supabase.from('store_settings').upsert({ key, value }, { onConflict: 'key' });
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
