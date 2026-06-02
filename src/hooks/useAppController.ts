import { useCallback, useEffect, useMemo, useState } from 'react';
import { passwordScoreLabels, passwordScoreWidths, strengthScore } from '../domain/password';
import { selectGamesByIds } from '../domain/selectors';
import { useToast } from './useToast';
import { useAdminActions } from './actions/useAdminActions';
import { useAuthActions } from './actions/useAuthActions';
import { useCustomerActions } from './actions/useCustomerActions';
import { useProfileActions } from './actions/useProfileActions';
import { useSocialActions } from './actions/useSocialActions';
import { useAppData } from './useAppData';
import { useAdminUiState } from './useAdminUiState';
import { useCheckoutState } from './useCheckoutState';
import { useNavigationState } from './useNavigationState';
import { useProfileStatusSync } from './useProfileStatusSync';
import { useStoreState } from './useStoreState';

export function useAppController() {
  const { toast, showToast } = useToast();
  const appData = useAppData(showToast);
  const {
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
    clearSessionData: clearLoadedSessionData
  } = appData;

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [libraryMode, setLibraryMode] = useState<'cards' | 'table'>('cards');
  const [adminLibraryMode, setAdminLibraryMode] = useState<'cards' | 'table'>('table');
  const [viewedProfileId, setViewedProfileId] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', avatarUrl: '', bannerUrl: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [reportForm, setReportForm] = useState({ reportedUserId: '', reason: '', details: '' });

  const isAdmin = auth.profile?.role === 'admin';
  const isLoggedIn = !!auth.session?.user && !!auth.profile;
  const isBlocked = auth.profile?.status === 'blocked';
  const selectedGame = games.find(game => Number(game.id) === Number(selectedGameId)) || null;

  useProfileStatusSync({ auth, setAuth, refreshAll, showToast });

  const { currentView, adminTab, setAdminTab, switchView } = useNavigationState({ isAdmin, loading, showToast });
  const storeState = useStoreState({ games, storeConfig, favoriteIds, isAdmin });

  const cartGames = useMemo(() => selectGamesByIds(cartIds, games), [cartIds, games]);
  const libraryGames = useMemo(() => selectGamesByIds(libraryIds, games), [libraryIds, games]);
  const favoriteGames = useMemo(() => selectGamesByIds(favoriteIds, games), [favoriteIds, games]);
  const checkoutState = useCheckoutState(cartGames);
  const {
    paymentMethod,
    installments,
    setSelectedSavedCardId,
    cardForm,
    setCardForm,
    checkoutTotal
  } = checkoutState;
  const adminUiState = useAdminUiState(adminUsers);
  const {
    addGameId,
    editingGameId,
    setEditingGameId,
    savingGame,
    setSavingGame,
    gameForm,
    setGameForm,
    restrictionForm,
    setRestrictionForm
  } = adminUiState;

  const selectedAdminUser = adminUsers.find(user => user.id === selectedAdminUserId) || null;

  useEffect(() => {
    setProfileForm({
      name: auth.profile?.name || '',
      bio: auth.profile?.bio || '',
      avatarUrl: auth.profile?.avatar_url || '',
      bannerUrl: auth.profile?.banner_url || '',
      email: auth.user?.email || ''
    });
  }, [auth.profile?.name, auth.profile?.bio, auth.profile?.avatar_url, auth.profile?.banner_url, auth.user?.email]);

  const clearSessionData = useCallback(() => {
    clearLoadedSessionData();
    setPurchaseSuccess(false);
    setViewedProfileId('');
  }, [clearLoadedSessionData]);

  const openOwnProfile = useCallback(() => {
    setViewedProfileId('');
    switchView('profileView');
  }, [switchView]);

  const openUserProfile = useCallback((profileId: string) => {
    if (!profileId || profileId === auth.profile?.id) {
      openOwnProfile();
      return;
    }
    setViewedProfileId(profileId);
    switchView('profileView');
  }, [auth.profile?.id, openOwnProfile, switchView]);

  const authActions = useAuthActions({
    loginForm,
    registerForm,
    setLoginOpen,
    setLoginForm,
    setRegisterOpen,
    setRegisterForm,
    setLoading,
    setLoaderText,
    setAuth,
    clearSessionData,
    refreshAll,
    switchView,
    showToast
  });

  const customerActions = useCustomerActions({
    auth,
    isAdmin,
    isLoggedIn,
    cartIds,
    favoriteIds,
    libraryIds,
    cardForm,
    setCardForm,
    paymentMethod,
    installments,
    checkoutTotal,
    savedCards,
    setLoading,
    setLoaderText,
    setSelectedSavedCardId,
    setPurchaseSuccess,
    refreshAll,
    showToast
  });

  const profileActions = useProfileActions({
    auth,
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    reportForm,
    setReportForm,
    refreshAll,
    showToast
  });

  const socialActions = useSocialActions({
    auth,
    friendships,
    refreshAll,
    showToast
  });

  const adminActions = useAdminActions({
    auth,
    selectedAdminUserId,
    setSelectedAdminUserId,
    setAdminTab,
    adminLibraryItems,
    setAdminLibraryItems,
    setAdminGameRestrictions,
    addGameId,
    restrictionForm,
    setRestrictionForm,
    gameForm,
    setGameForm,
    editingGameId,
    setEditingGameId,
    savingGame,
    setSavingGame,
    carouselForm,
    promoForm,
    refreshAll,
    showToast
  });

  const score = strengthScore(registerForm.password);
  const scoreLabels = passwordScoreLabels;
  const scoreWidths = passwordScoreWidths;

  return {
    ...appData,
    ...storeState,
    ...checkoutState,
    ...adminUiState,
    currentView,
    adminTab,
    toast,
    showToast,
    loginOpen,
    setLoginOpen,
    registerOpen,
    setRegisterOpen,
    selectedGame,
    setSelectedGameId,
    purchaseSuccess,
    setPurchaseSuccess,
    loginForm,
    setLoginForm,
    registerForm,
    setRegisterForm,
    libraryMode,
    setLibraryMode,
    adminLibraryMode,
    setAdminLibraryMode,
    viewedProfileId,
    setViewedProfileId,
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    reportForm,
    setReportForm,
    carouselForm,
    setCarouselForm,
    promoForm,
    setPromoForm,
    isAdmin,
    isLoggedIn,
    isBlocked,
    cartGames,
    libraryGames,
    favoriteGames,
    selectedAdminUser,
    score,
    scoreLabels,
    scoreWidths,
    switchView,
    openOwnProfile,
    openUserProfile,
    setAdminTab,
    ...authActions,
    ...customerActions,
    ...adminActions,
    ...profileActions,
    ...socialActions
  };
}

export type AppController = ReturnType<typeof useAppController>;
