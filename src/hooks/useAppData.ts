import { useCallback, useEffect, useState } from 'react';
import type { AdminUser, AuthState, Game, LibraryItem, SavedCard, StoreConfig } from '../types';
import * as api from '../services';
import { defaultStoreConfig } from '../config/app';

export function useAppData(showToast: (message: string) => void) {
  const [auth, setAuth] = useState<AuthState>({ session: null, user: null, profile: null });
  const [games, setGames] = useState<Game[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(defaultStoreConfig);
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [libraryIds, setLibraryIds] = useState<number[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLibraryItems, setAdminLibraryItems] = useState<LibraryItem[]>([]);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaderText, setLoaderText] = useState('Conectando ao Supabase...');
  const [carouselForm, setCarouselForm] = useState<string[]>(['', '', '']);
  const [promoForm, setPromoForm] = useState({ title: defaultStoreConfig.promo_title, text: defaultStoreConfig.promo_text });

  const refreshAll = useCallback(async () => {
    const sessionRes = await api.getSession();
    if (sessionRes.error) throw sessionRes.error;
    const session = sessionRes.data.session;
    let profile = null;

    if (session?.user) {
      const profileRes = await api.fetchProfile(session.user.id);
      if (profileRes.error) throw profileRes.error;
      profile = profileRes.data;
    }

    const gamesRes = await api.fetchGames();
    if (gamesRes.error) throw gamesRes.error;
    const nextGames = gamesRes.data || [];

    const settingsRes = await api.fetchStoreSettings();
    if (settingsRes.error) throw settingsRes.error;
    const settings = Object.fromEntries((settingsRes.data || []).map(row => [row.key, row.value])) as Record<string, unknown>;
    const nextConfig: StoreConfig = {
      carousel: Array.isArray(settings.carousel) ? settings.carousel.map(Number) : defaultStoreConfig.carousel,
      promo_title: typeof settings.promo_title === 'string' ? settings.promo_title : defaultStoreConfig.promo_title,
      promo_text: typeof settings.promo_text === 'string' ? settings.promo_text : defaultStoreConfig.promo_text
    };

    let nextCartIds: number[] = [];
    let nextFavoriteIds: number[] = [];
    let nextLibraryIds: number[] = [];
    let nextSavedCards: SavedCard[] = [];

    if (session?.user) {
      const userData = await api.fetchUserData(session.user.id);
      if (userData.cartRes.error) throw userData.cartRes.error;
      if (userData.favRes.error) throw userData.favRes.error;
      if (userData.libRes.error) throw userData.libRes.error;
      if (userData.cardsRes.error) throw userData.cardsRes.error;
      nextCartIds = (userData.cartRes.data || []).map(row => Number(row.game_id));
      nextFavoriteIds = (userData.favRes.data || []).map(row => Number(row.game_id));
      nextLibraryIds = (userData.libRes.data || []).map(row => Number(row.game_id));
      nextSavedCards = (userData.cardsRes.data || []) as SavedCard[];
    }

    let nextAdminUsers: AdminUser[] = [];
    if (profile?.role === 'admin') {
      const usersRes = await api.fetchAdminUsers();
      if (usersRes.error) throw usersRes.error;
      nextAdminUsers = (usersRes.data || []) as AdminUser[];
    }

    setAuth({ session, user: session?.user || null, profile });
    setGames(nextGames);
    setStoreConfig(nextConfig);
    setCartIds(nextCartIds);
    setFavoriteIds(nextFavoriteIds);
    setLibraryIds(nextLibraryIds);
    setSavedCards(nextSavedCards);
    setAdminUsers(nextAdminUsers);
    setCarouselForm([
      String(nextConfig.carousel[0] || nextGames[0]?.id || ''),
      String(nextConfig.carousel[1] || nextGames[1]?.id || ''),
      String(nextConfig.carousel[2] || nextGames[2]?.id || '')
    ]);
    setPromoForm({ title: nextConfig.promo_title, text: nextConfig.promo_text });

    return profile;
  }, []);

  const clearSessionData = useCallback(() => {
    setCartIds([]);
    setFavoriteIds([]);
    setLibraryIds([]);
    setSavedCards([]);
    setAdminUsers([]);
    setAdminLibraryItems([]);
    setSelectedAdminUserId('');
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        await refreshAll();
      } catch (error) {
        console.error(error);
        showToast(error instanceof Error ? error.message : 'Erro ao iniciar.');
        setLoaderText('Erro ao iniciar. Abre o console.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void boot();
    const authListener = api.onAuthStateChange(async () => {
      await refreshAll();
    });

    return () => {
      mounted = false;
      authListener.data.subscription.unsubscribe();
    };
  }, [refreshAll, showToast]);

  return {
    auth,
    setAuth,
    games,
    storeConfig,
    cartIds,
    favoriteIds,
    libraryIds,
    savedCards,
    adminUsers,
    adminLibraryItems,
    setAdminLibraryItems,
    selectedAdminUserId,
    setSelectedAdminUserId,
    loading,
    setLoading,
    loaderText,
    setLoaderText,
    carouselForm,
    setCarouselForm,
    promoForm,
    setPromoForm,
    refreshAll,
    clearSessionData
  };
}
