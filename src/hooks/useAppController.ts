import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminTab, CardForm, GameForm, PaymentMethod, QuickFilter, ViewId } from '../types';
import {
  ADMIN_TAB_STORAGE_KEY,
  VIEW_STORAGE_KEY,
  adminTabs,
  emptyCardForm,
  emptyGameForm,
  validViews
} from '../config/app';
import { passwordScoreLabels, passwordScoreWidths, strengthScore } from '../domain/password';
import {
  selectFilteredAdminUsers,
  selectFilteredGames,
  selectFranchises,
  selectGamesByIds,
  selectHeroGames
} from '../domain/selectors';
import { useToast } from './useToast';
import { useAdminActions } from './actions/useAdminActions';
import { useAuthActions } from './actions/useAuthActions';
import { useCustomerActions } from './actions/useCustomerActions';
import { useAppData } from './useAppData';

function safeStoredView(): ViewId {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ViewId | null;
  return saved && validViews.includes(saved) ? saved : 'storeView';
}

function safeStoredAdminTab(): AdminTab {
  const saved = localStorage.getItem(ADMIN_TAB_STORAGE_KEY) as AdminTab | null;
  return saved && adminTabs.includes(saved) ? saved : 'users';
}

export function useAppController() {
  const { toast, showToast } = useToast();
  const {
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
    clearSessionData: clearLoadedSessionData
  } = useAppData(showToast);

  const [currentView, setCurrentView] = useState<ViewId>(safeStoredView);
  const [adminTab, setAdminTabState] = useState<AdminTab>(safeStoredAdminTab);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('popular');
  const [heroSlide, setHeroSlide] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [installments, setInstallments] = useState(1);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<number | null>(null);
  const [cardForm, setCardForm] = useState<CardForm>(emptyCardForm);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminTypeFilter, setAdminTypeFilter] = useState('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [addGameId, setAddGameId] = useState('');
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [savingGame, setSavingGame] = useState(false);
  const [gameForm, setGameForm] = useState<GameForm>(emptyGameForm);

  const isAdmin = auth.profile?.role === 'admin';
  const isLoggedIn = !!auth.session?.user && !!auth.profile;
  const selectedGame = games.find(game => Number(game.id) === Number(selectedGameId)) || null;

  const resolveView = useCallback(
    (view: ViewId): ViewId => {
      if (loading) return view;
      if (view === 'adminView' && !isAdmin) return 'storeView';
      if (isAdmin && (view === 'libraryView' || view === 'cartView' || view === 'checkoutView')) return 'adminView';
      return view;
    },
    [isAdmin, loading]
  );

  const switchView = useCallback(
    (view: ViewId) => {
      const next = resolveView(view);
      setCurrentView(next);
      localStorage.setItem(VIEW_STORAGE_KEY, next);
      if (view !== next) showToast(isAdmin ? 'Administrador não usa essa área.' : 'Somente admin.');
    },
    [isAdmin, resolveView, showToast]
  );

  const setAdminTab = useCallback((tab: AdminTab) => {
    setAdminTabState(tab);
    localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
  }, []);

  useEffect(() => {
    setCurrentView(view => {
      const next = resolveView(view);
      if (next !== view) localStorage.setItem(VIEW_STORAGE_KEY, next);
      return next;
    });
  }, [resolveView]);

  const heroGames = useMemo(() => selectHeroGames(games, storeConfig), [games, storeConfig]);

  useEffect(() => {
    setHeroSlide(0);
  }, [heroGames.length]);

  useEffect(() => {
    if (heroGames.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroSlide(current => (current + 1) % heroGames.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [heroGames.length]);

  const filteredGames = useMemo(
    () => selectFilteredGames({ games, searchTerm, genreFilter, quickFilter, sortFilter, favoriteIds, isAdmin }),
    [favoriteIds, games, genreFilter, isAdmin, quickFilter, searchTerm, sortFilter]
  );

  const franchises = useMemo(() => selectFranchises(games), [games]);

  const cartGames = useMemo(() => selectGamesByIds(cartIds, games), [cartIds, games]);
  const libraryGames = useMemo(() => selectGamesByIds(libraryIds, games), [libraryIds, games]);
  const cartSubtotal = cartGames.reduce((sum, game) => sum + Number(game.price || 0), 0);
  const cartFee = cartGames.length ? 4.9 : 0;
  const baseCheckoutTotal = cartSubtotal + cartFee;
  const checkoutTotal = paymentMethod === 'credito' ? baseCheckoutTotal * (installments <= 1 ? 1 : 1 + installments * 0.02) : baseCheckoutTotal;

  const filteredAdminUsers = useMemo(
    () => selectFilteredAdminUsers({
      users: adminUsers,
      searchTerm: adminSearchTerm,
      typeFilter: adminTypeFilter,
      statusFilter: adminStatusFilter
    }),
    [adminSearchTerm, adminStatusFilter, adminTypeFilter, adminUsers]
  );

  const selectedAdminUser = adminUsers.find(user => user.id === selectedAdminUserId) || null;

  const clearSessionData = useCallback(() => {
    clearLoadedSessionData();
    setPurchaseSuccess(false);
  }, [clearLoadedSessionData]);

  const { handleLogin, handleRegister, handleLogout } = useAuthActions({
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

  const { toggleFavorite, addToCart, removeFromCart, clearCart, finishPurchase } = useCustomerActions({
    auth,
    isAdmin,
    isLoggedIn,
    cartIds,
    favoriteIds,
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

  const {
    selectAdminUser,
    toggleUserStatus,
    toggleUserRole,
    adminAddGame,
    adminRemoveGame,
    startEditGame,
    resetGameForm,
    submitGameForm,
    deleteCatalogGame,
    saveCarousel,
    savePromo,
    updateGameForm
  } = useAdminActions({
    auth,
    selectedAdminUserId,
    setSelectedAdminUserId,
    setAdminTab,
    adminLibraryItems,
    setAdminLibraryItems,
    addGameId,
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
    auth,
    games,
    storeConfig,
    cartIds,
    favoriteIds,
    libraryIds,
    savedCards,
    adminUsers,
    adminLibraryItems,
    selectedAdminUserId,
    currentView,
    adminTab,
    loading,
    loaderText,
    toast,
    loginOpen,
    setLoginOpen,
    registerOpen,
    setRegisterOpen,
    selectedGame,
    setSelectedGameId,
    purchaseSuccess,
    setPurchaseSuccess,
    searchTerm,
    setSearchTerm,
    quickFilter,
    setQuickFilter,
    genreFilter,
    setGenreFilter,
    sortFilter,
    setSortFilter,
    heroSlide,
    setHeroSlide,
    paymentMethod,
    setPaymentMethod,
    installments,
    setInstallments,
    selectedSavedCardId,
    setSelectedSavedCardId,
    cardForm,
    setCardForm,
    loginForm,
    setLoginForm,
    registerForm,
    setRegisterForm,
    adminSearchTerm,
    setAdminSearchTerm,
    adminTypeFilter,
    setAdminTypeFilter,
    adminStatusFilter,
    setAdminStatusFilter,
    addGameId,
    setAddGameId,
    editingGameId,
    savingGame,
    gameForm,
    carouselForm,
    setCarouselForm,
    promoForm,
    setPromoForm,
    isAdmin,
    isLoggedIn,
    heroGames,
    filteredGames,
    franchises,
    cartGames,
    libraryGames,
    cartSubtotal,
    cartFee,
    checkoutTotal,
    filteredAdminUsers,
    selectedAdminUser,
    score,
    scoreLabels,
    scoreWidths,
    switchView,
    setAdminTab,
    handleLogin,
    handleRegister,
    handleLogout,
    toggleFavorite,
    addToCart,
    removeFromCart,
    clearCart,
    finishPurchase,
    selectAdminUser,
    toggleUserStatus,
    toggleUserRole,
    adminAddGame,
    adminRemoveGame,
    startEditGame,
    resetGameForm,
    submitGameForm,
    deleteCatalogGame,
    saveCarousel,
    savePromo,
    updateGameForm
  };
}
