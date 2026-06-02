import { useCallback, useEffect, useState } from 'react';
import type {
  AdminUser,
  AuthState,
  ChatGroup,
  ChatGroupMember,
  ChatMessage,
  ChatMessagePin,
  ChatMessageReaction,
  ChatMessageReport,
  CommunityChannel,
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  CommunityVoicePresence,
  Friendship,
  Game,
  GamePlayStats,
  GameRestriction,
  LibraryItem,
  PublicProfile,
  SavedCard,
  StoreConfig,
  UserReport
} from '../types';
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
  const [gameRestrictions, setGameRestrictions] = useState<GameRestriction[]>([]);
  const [socialProfiles, setSocialProfiles] = useState<PublicProfile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [playStats, setPlayStats] = useState<GamePlayStats[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessageReactions, setChatMessageReactions] = useState<ChatMessageReaction[]>([]);
  const [chatMessagePins, setChatMessagePins] = useState<ChatMessagePin[]>([]);
  const [chatMessageReports, setChatMessageReports] = useState<ChatMessageReport[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [chatGroupMembers, setChatGroupMembers] = useState<ChatGroupMember[]>([]);
  const [communityServers, setCommunityServers] = useState<CommunityServer[]>([]);
  const [communityServerMembers, setCommunityServerMembers] = useState<CommunityServerMember[]>([]);
  const [communityRoles, setCommunityRoles] = useState<CommunityRole[]>([]);
  const [communityMemberRoles, setCommunityMemberRoles] = useState<CommunityMemberRole[]>([]);
  const [communityChannels, setCommunityChannels] = useState<CommunityChannel[]>([]);
  const [communityVoicePresence, setCommunityVoicePresence] = useState<CommunityVoicePresence[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLibraryItems, setAdminLibraryItems] = useState<LibraryItem[]>([]);
  const [adminGameRestrictions, setAdminGameRestrictions] = useState<GameRestriction[]>([]);
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
    let nextGameRestrictions: GameRestriction[] = [];
    let nextSocialProfiles: PublicProfile[] = [];
    let nextFriendships: Friendship[] = [];
    let nextUserReports: UserReport[] = [];
    let nextPlayStats: GamePlayStats[] = [];
    let nextChatMessages: ChatMessage[] = [];
    let nextChatMessageReactions: ChatMessageReaction[] = [];
    let nextChatMessagePins: ChatMessagePin[] = [];
    let nextChatMessageReports: ChatMessageReport[] = [];
    let nextChatGroups: ChatGroup[] = [];
    let nextChatGroupMembers: ChatGroupMember[] = [];
    let nextCommunityServers: CommunityServer[] = [];
    let nextCommunityServerMembers: CommunityServerMember[] = [];
    let nextCommunityRoles: CommunityRole[] = [];
    let nextCommunityMemberRoles: CommunityMemberRole[] = [];
    let nextCommunityChannels: CommunityChannel[] = [];
    let nextCommunityVoicePresence: CommunityVoicePresence[] = [];

    if (session?.user) {
      const userData = await api.fetchUserData(session.user.id);
      if (userData.cartRes.error) throw userData.cartRes.error;
      if (userData.favRes.error) throw userData.favRes.error;
      if (userData.libRes.error) throw userData.libRes.error;
      if (userData.cardsRes.error) throw userData.cardsRes.error;
      if (userData.restrictionsRes.error) throw userData.restrictionsRes.error;
      if (userData.profilesRes.error) throw userData.profilesRes.error;
      if (userData.friendshipsRes.error) throw userData.friendshipsRes.error;
      if (userData.reportsRes.error) throw userData.reportsRes.error;
      if (userData.playStatsRes.error) throw userData.playStatsRes.error;
      if (userData.communicationRes.error) throw userData.communicationRes.error;
      nextCartIds = (userData.cartRes.data || []).map(row => Number(row.game_id));
      nextFavoriteIds = (userData.favRes.data || []).map(row => Number(row.game_id));
      nextLibraryIds = (userData.libRes.data || []).map(row => Number(row.game_id));
      nextSavedCards = (userData.cardsRes.data || []) as SavedCard[];
      nextGameRestrictions = (userData.restrictionsRes.data || []) as GameRestriction[];
      nextSocialProfiles = (userData.profilesRes.data || []) as PublicProfile[];
      nextFriendships = (userData.friendshipsRes.data || []) as Friendship[];
      nextUserReports = (userData.reportsRes.data || []) as UserReport[];
      nextPlayStats = (userData.playStatsRes.data || []) as GamePlayStats[];
      nextChatMessages = (userData.communicationRes.data?.chatMessages || []) as ChatMessage[];
      nextChatMessageReactions = (userData.communicationRes.data?.chatMessageReactions || []) as ChatMessageReaction[];
      nextChatMessagePins = (userData.communicationRes.data?.chatMessagePins || []) as ChatMessagePin[];
      nextChatMessageReports = (userData.communicationRes.data?.chatMessageReports || []) as ChatMessageReport[];
      nextChatGroups = (userData.communicationRes.data?.chatGroups || []) as ChatGroup[];
      nextChatGroupMembers = (userData.communicationRes.data?.chatGroupMembers || []) as ChatGroupMember[];
      nextCommunityServers = (userData.communicationRes.data?.communityServers || []) as CommunityServer[];
      nextCommunityServerMembers = (userData.communicationRes.data?.communityServerMembers || []) as CommunityServerMember[];
      nextCommunityRoles = (userData.communicationRes.data?.communityRoles || []) as CommunityRole[];
      nextCommunityMemberRoles = (userData.communicationRes.data?.communityMemberRoles || []) as CommunityMemberRole[];
      nextCommunityChannels = (userData.communicationRes.data?.communityChannels || []) as CommunityChannel[];
      nextCommunityVoicePresence = (userData.communicationRes.data?.communityVoicePresence || []) as CommunityVoicePresence[];
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
    setGameRestrictions(nextGameRestrictions);
    setSocialProfiles(nextSocialProfiles);
    setFriendships(nextFriendships);
    setUserReports(nextUserReports);
    setPlayStats(nextPlayStats);
    setChatMessages(nextChatMessages);
    setChatMessageReactions(nextChatMessageReactions);
    setChatMessagePins(nextChatMessagePins);
    setChatMessageReports(nextChatMessageReports);
    setChatGroups(nextChatGroups);
    setChatGroupMembers(nextChatGroupMembers);
    setCommunityServers(nextCommunityServers);
    setCommunityServerMembers(nextCommunityServerMembers);
    setCommunityRoles(nextCommunityRoles);
    setCommunityMemberRoles(nextCommunityMemberRoles);
    setCommunityChannels(nextCommunityChannels);
    setCommunityVoicePresence(nextCommunityVoicePresence);
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
    setGameRestrictions([]);
    setSocialProfiles([]);
    setFriendships([]);
    setUserReports([]);
    setPlayStats([]);
    setChatMessages([]);
    setChatMessageReactions([]);
    setChatMessagePins([]);
    setChatMessageReports([]);
    setChatGroups([]);
    setChatGroupMembers([]);
    setCommunityServers([]);
    setCommunityServerMembers([]);
    setCommunityRoles([]);
    setCommunityMemberRoles([]);
    setCommunityChannels([]);
    setCommunityVoicePresence([]);
    setAdminUsers([]);
    setAdminLibraryItems([]);
    setAdminGameRestrictions([]);
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
    gameRestrictions,
    socialProfiles,
    friendships,
    userReports,
    playStats,
    chatMessages,
    chatMessageReactions,
    chatMessagePins,
    chatMessageReports,
    chatGroups,
    chatGroupMembers,
    communityServers,
    communityServerMembers,
    communityRoles,
    communityMemberRoles,
    communityChannels,
    communityVoicePresence,
    adminUsers,
    adminLibraryItems,
    setAdminLibraryItems,
    adminGameRestrictions,
    setAdminGameRestrictions,
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
