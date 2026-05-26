import { useCallback, useEffect, useMemo, useState } from 'react';
import { passwordScoreLabels, passwordScoreWidths, strengthScore } from '../domain/password';
import { selectGamesByIds } from '../domain/selectors';
import type { CommunityChannelType, Friendship, SocialTarget } from '../types';
import * as api from '../services';
import { useToast } from './useToast';
import { useAdminActions } from './actions/useAdminActions';
import { useAuthActions } from './actions/useAuthActions';
import { useCustomerActions } from './actions/useCustomerActions';
import { useAppData } from './useAppData';
import { useAdminUiState } from './useAdminUiState';
import { useCheckoutState } from './useCheckoutState';
import { useNavigationState } from './useNavigationState';
import { useProfileStatusSync } from './useProfileStatusSync';
import { useStoreState } from './useStoreState';

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
    gameRestrictions,
    socialProfiles,
    friendships,
    userReports,
    playStats,
    chatMessages,
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
  } = useAppData(showToast);

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [libraryMode, setLibraryMode] = useState<'cards' | 'table'>('cards');
  const [adminLibraryMode, setAdminLibraryMode] = useState<'cards' | 'table'>('table');
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', avatarUrl: '', bannerUrl: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [reportForm, setReportForm] = useState({ reportedUserId: '', reason: '', details: '' });

  const isAdmin = auth.profile?.role === 'admin';
  const isLoggedIn = !!auth.session?.user && !!auth.profile;
  const isBlocked = auth.profile?.status === 'blocked';
  const selectedGame = games.find(game => Number(game.id) === Number(selectedGameId)) || null;

  useProfileStatusSync({ auth, setAuth, refreshAll, showToast });

  const { currentView, adminTab, setAdminTab, switchView } = useNavigationState({ isAdmin, loading, showToast });
  const {
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
    heroGames,
    filteredGames,
    franchises
  } = useStoreState({ games, storeConfig, favoriteIds, isAdmin });

  const cartGames = useMemo(() => selectGamesByIds(cartIds, games), [cartIds, games]);
  const libraryGames = useMemo(() => selectGamesByIds(libraryIds, games), [libraryIds, games]);
  const favoriteGames = useMemo(() => selectGamesByIds(favoriteIds, games), [favoriteIds, games]);
  const {
    paymentMethod,
    setPaymentMethod,
    installments,
    setInstallments,
    selectedSavedCardId,
    setSelectedSavedCardId,
    cardForm,
    setCardForm,
    cartSubtotal,
    cartFee,
    checkoutTotal
  } = useCheckoutState(cartGames);
  const {
    adminSearchTerm,
    setAdminSearchTerm,
    adminTypeFilter,
    setAdminTypeFilter,
    adminStatusFilter,
    setAdminStatusFilter,
    addGameId,
    setAddGameId,
    editingGameId,
    setEditingGameId,
    savingGame,
    setSavingGame,
    gameForm,
    setGameForm,
    restrictionForm,
    setRestrictionForm,
    filteredAdminUsers
  } = useAdminUiState(adminUsers);

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
    applyGameRestriction,
    revokeGameRestriction,
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

  async function saveProfile() {
    if (!auth.user) return showToast('Faz login para editar teu perfil.');
    const { error } = await api.updateOwnProfile(profileForm.name, profileForm.bio, profileForm.avatarUrl, profileForm.bannerUrl);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Perfil atualizado.');
  }

  async function saveEmail() {
    const email = profileForm.email.trim();
    if (!auth.user || !email) return showToast('Informa um e-mail válido.');
    if (email === auth.user.email) return showToast('Esse e-mail já está na conta.');
    const { error } = await api.updateAuthEmail(email);
    if (error) return showToast(error.message);
    showToast('Pedido de troca de e-mail enviado. O Supabase pode pedir confirmação.');
  }

  async function changePassword() {
    if (!passwordForm.password || passwordForm.password.length < 6) return showToast('A senha precisa ter pelo menos 6 caracteres.');
    if (passwordForm.password !== passwordForm.confirmPassword) return showToast('As senhas não batem.');
    const { error } = await api.updateAuthPassword(passwordForm.password);
    if (error) return showToast(error.message);
    setPasswordForm({ password: '', confirmPassword: '' });
    showToast('Senha atualizada.');
  }

  async function requestFriend(targetId: string) {
    if (!auth.user) return showToast('Faz login para adicionar amigos.');
    if (targetId === auth.user.id) return showToast('Você já está no próprio perfil.');
    const existing = friendships.find(friendship =>
      (friendship.requester_id === auth.user?.id && friendship.addressee_id === targetId)
      || (friendship.addressee_id === auth.user?.id && friendship.requester_id === targetId)
    );
    if (existing?.status === 'rejected') {
      const retryRes = await api.updateFriendshipStatus(existing.id, 'pending');
      if (retryRes.error) return showToast(retryRes.error.message);
      await refreshAll();
      return showToast('Solicitação de amizade reenviada.');
    }
    const { error } = await api.requestFriendship(auth.user.id, targetId);
    if (error) return showToast(error.code === '23505' ? 'Já existe uma solicitação ou amizade com esse usuário.' : error.message);
    await refreshAll();
    showToast('Solicitação de amizade enviada.');
  }

  async function updateFriendship(friendship: Friendship, status: Friendship['status']) {
    const { error } = await api.updateFriendshipStatus(friendship.id, status);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast(status === 'accepted' ? 'Amizade aceita.' : 'Solicitação atualizada.');
  }

  async function submitReport() {
    if (!auth.user) return showToast('Faz login para denunciar.');
    if (!reportForm.reportedUserId) return showToast('Seleciona um usuário.');
    if (!reportForm.reason.trim()) return showToast('Escolhe ou escreve um motivo.');
    const { error } = await api.createUserReport({
      reporter_id: auth.user.id,
      reported_user_id: reportForm.reportedUserId,
      reason: reportForm.reason.trim(),
      details: reportForm.details.trim()
    });
    if (error) return showToast(error.message);
    setReportForm({ reportedUserId: '', reason: '', details: '' });
    await refreshAll();
    showToast('Denúncia enviada para análise.');
  }

  async function playGame(gameId: number) {
    if (!auth.user) return showToast('Faz login para jogar.');
    const { error } = await api.recordGamePlay(auth.user.id, gameId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Jogo iniciado. Tempo de sessão registrado no perfil.');
  }

  async function sendChatMessage(target: SocialTarget, body: string, file?: File | null) {
    if (!auth.user) return showToast('Faz login para usar o chat.');
    if (!body.trim() && !file) return showToast('Escreve uma mensagem ou anexa uma mídia.');
    let attachmentUrl = '';
    let attachmentType: ReturnType<typeof api.attachmentTypeFromMime> | undefined;
    let attachmentName = '';

    if (file) {
      const uploadRes = await api.uploadChatMedia(auth.user.id, file);
      if (uploadRes.error || !uploadRes.data) return showToast(uploadRes.error?.message || 'Não foi possível enviar a mídia.');
      attachmentUrl = uploadRes.data.url;
      attachmentType = uploadRes.data.type;
      attachmentName = uploadRes.data.name;
    }

    const { error } = await api.sendChatMessage({
      senderId: auth.user.id,
      target,
      body,
      attachmentUrl,
      attachmentType,
      attachmentName
    });
    if (error) return showToast(error.message);
    await refreshAll();
  }

  async function deleteChatMessage(messageId: number) {
    if (!auth.user) return showToast('Faz login para apagar mensagens.');
    const { error } = await api.deleteChatMessage(messageId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Mensagem apagada.');
  }

  async function createChatGroup(name: string, memberIds: string[]) {
    if (!auth.user) return showToast('Faz login para criar grupos.');
    if (!name.trim()) return showToast('Dá um nome para o grupo.');
    if (!memberIds.length) return showToast('Escolhe pelo menos um amigo.');
    const { error } = await api.createChatGroup(auth.user.id, name, memberIds);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Grupo criado.');
  }

  async function createCommunityServer(name: string, description: string) {
    if (!auth.user) return showToast('Faz login para criar uma comunidade.');
    if (!name.trim()) return showToast('Dá um nome para a comunidade.');
    const { error } = await api.createCommunityServer(auth.user.id, name, description);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Comunidade criada com canal geral e voz principal.');
  }

  async function addCommunityMember(serverId: number, userId: string) {
    const { error } = await api.addServerMember(serverId, userId);
    if (error) return showToast(error.code === '23505' ? 'Esse usuário já está na comunidade.' : error.message);
    await refreshAll();
    showToast('Membro adicionado.');
  }

  async function joinCommunityByInvite(invite: string) {
    if (!auth.user) return showToast('Faz login para entrar na comunidade.');
    if (!invite.trim()) return showToast('Cole um convite valido.');
    const { error } = await api.joinCommunityByInvite(invite.trim());
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Voce entrou na comunidade.');
  }

  async function updateCommunityVisibility(serverId: number, visibility: 'private' | 'public') {
    const { error } = await api.updateCommunityServerVisibility(serverId, visibility);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast(visibility === 'public' ? 'Comunidade agora esta publica.' : 'Comunidade agora esta privada.');
  }

  async function deleteCommunityServer(serverId: number) {
    const { error } = await api.deleteCommunityServer(serverId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Comunidade excluida.');
  }

  async function createCommunityChannel(serverId: number, name: string, type: CommunityChannelType) {
    if (!name.trim()) return showToast('Nome do canal vazio.');
    const { error } = await api.createCommunityChannel(serverId, name, type);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast(type === 'voice' ? 'Canal de voz criado.' : 'Canal de texto criado.');
  }

  async function deleteCommunityChannel(channelId: number) {
    const { error } = await api.deleteCommunityChannel(channelId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Canal excluido.');
  }

  async function createCommunityRole(serverId: number, name: string, color: string) {
    if (!name.trim()) return showToast('Nome do cargo vazio.');
    const { error } = await api.createCommunityRole(serverId, name, color);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Cargo criado.');
  }

  async function deleteCommunityRole(roleId: number) {
    const { error } = await api.deleteCommunityRole(roleId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Cargo excluido.');
  }

  async function assignCommunityRole(serverId: number, userId: string, roleId: number) {
    const { error } = await api.assignCommunityRole(serverId, userId, roleId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Cargo aplicado.');
  }

  async function joinVoiceChannel(channelId: number) {
    if (!auth.user) return showToast('Faz login para entrar no canal.');
    const { error } = await api.joinVoiceChannel(channelId, auth.user.id);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Você entrou no canal de voz.');
  }

  async function leaveVoiceChannel(channelId: number) {
    if (!auth.user) return showToast('Faz login para sair do canal.');
    const { error } = await api.leaveVoiceChannel(channelId, auth.user.id);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Você saiu do canal de voz.');
  }

  return {
    auth,
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
    adminGameRestrictions,
    selectedAdminUserId,
    currentView,
    adminTab,
    loading,
    loaderText,
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
    restrictionForm,
    setRestrictionForm,
    libraryMode,
    setLibraryMode,
    adminLibraryMode,
    setAdminLibraryMode,
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
    heroGames,
    filteredGames,
    franchises,
    cartGames,
    libraryGames,
    favoriteGames,
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
    applyGameRestriction,
    revokeGameRestriction,
    startEditGame,
    resetGameForm,
    submitGameForm,
    deleteCatalogGame,
    saveCarousel,
    savePromo,
    updateGameForm,
    saveProfile,
    saveEmail,
    changePassword,
    requestFriend,
    updateFriendship,
    submitReport,
    playGame,
    sendChatMessage,
    deleteChatMessage,
    createChatGroup,
    createCommunityServer,
    addCommunityMember,
    joinCommunityByInvite,
    updateCommunityVisibility,
    deleteCommunityServer,
    createCommunityChannel,
    deleteCommunityChannel,
    createCommunityRole,
    deleteCommunityRole,
    assignCommunityRole,
    joinVoiceChannel,
    leaveVoiceChannel
  };
}
