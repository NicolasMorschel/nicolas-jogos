import { supabase } from '../lib/supabase';

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

export async function updateAuthEmail(email: string) {
  return supabase.auth.updateUser({ email });
}

export async function updateAuthPassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export function onAuthStateChange(callback: () => void | Promise<void>) {
  return supabase.auth.onAuthStateChange(() => {
    void callback();
  });
}
