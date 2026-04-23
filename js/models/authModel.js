import { supabaseClient } from '../config/supabase.js';

export async function getSession() {
  return await supabaseClient.auth.getSession();
}
export async function signIn(email, password) {
  return await supabaseClient.auth.signInWithPassword({ email, password });
}
export async function signUp(name, email, password) {
  return await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
}
export async function signOut() {
  return await supabaseClient.auth.signOut();
}
export function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange(callback);
}
