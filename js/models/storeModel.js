import { supabaseClient } from '../config/supabase.js';

export async function fetchGames() {
  return await supabaseClient.from('games').select('*').order('id');
}
export async function fetchStoreSettings() {
  return await supabaseClient.from('store_settings').select('*').order('key');
}
export async function saveStoreSetting(key, value) {
  return await supabaseClient.from('store_settings').upsert({ key, value }, { onConflict: 'key' });
}
