import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { AuthState, Profile } from '../types';
import * as api from '../services';

export function useProfileStatusSync({
  auth,
  setAuth,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  setAuth: Dispatch<SetStateAction<AuthState>>;
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  const noticeRef = useRef(auth.profile?.status || 'active');

  useEffect(() => {
    noticeRef.current = auth.profile?.status || 'active';
  }, [auth.user?.id]);

  const syncProfile = useCallback(async () => {
    const userId = auth.user?.id;
    if (!userId) return;

    const { data: profile, error } = await api.fetchProfile(userId);
    if (error || !profile) return;

    let roleChanged = false;
    let becameBlocked = false;
    let becameActive = false;

    setAuth(current => {
      if (!current.user || current.user.id !== userId) return current;
      roleChanged = current.profile?.role !== profile.role;
      becameBlocked = current.profile?.status !== 'blocked' && profile.status === 'blocked';
      becameActive = current.profile?.status === 'blocked' && profile.status === 'active';
      return { ...current, profile };
    });

    if (becameBlocked && noticeRef.current !== 'blocked') {
      noticeRef.current = 'blocked';
      showToast('Conta bloqueada. Você pode comprar, mas não pode jogar até um admin reativar.');
    }

    if (becameActive && noticeRef.current !== 'active') {
      noticeRef.current = 'active';
      showToast('Conta reativada. A biblioteca voltou a liberar jogos.');
    }

    if (roleChanged) await refreshAll();
  }, [auth.user?.id, refreshAll, setAuth, showToast]);

  useEffect(() => {
    if (!auth.user) return;

    const interval = window.setInterval(() => {
      void syncProfile();
    }, 8000);

    function syncWhenVisible() {
      if (document.visibilityState === 'visible') void syncProfile();
    }

    window.addEventListener('focus', syncProfile);
    document.addEventListener('visibilitychange', syncWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncProfile);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [auth.user, syncProfile]);
}
