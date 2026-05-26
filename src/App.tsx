import { AccountStatusBanner, Header, Loader, Toast } from './components/common';
import { GameModal, LoginModal, PurchaseSuccess, RegisterModal } from './components/modals';
import { AdminView as AdminScreen } from './views/AdminView';
import { CartView as CartScreen } from './views/CartView';
import { CheckoutView as CheckoutScreen } from './views/CheckoutView';
import { LibraryView as LibraryScreen } from './views/LibraryView';
import { ProfileView as ProfileScreen } from './views/ProfileView';
import { SocialView as SocialScreen } from './views/SocialView';
import { StoreView } from './views/StoreView';
import { useAppController } from './hooks/useAppController';

export default function App() {
  const {
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
  } = useAppController();

  return (
    <>
      {loading && <Loader text={loaderText} />}

      <Header
        currentView={currentView}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onSwitchView={switchView}
        onLogin={() => setLoginOpen(true)}
        onRegister={() => setRegisterOpen(true)}
        onLogout={handleLogout}
      />
      <AccountStatusBanner blocked={isBlocked} />
      <main>
        {currentView === 'storeView' && (
          <StoreView
            auth={auth}
            games={games}
            filteredGames={filteredGames}
            heroGames={heroGames}
            heroSlide={heroSlide}
            setHeroSlide={setHeroSlide}
            storeConfig={storeConfig}
            franchises={franchises}
            isAdmin={isAdmin}
            isLoggedIn={isLoggedIn}
            favoriteIds={favoriteIds}
            libraryIds={libraryIds}
            cartIds={cartIds}
            quickFilter={quickFilter}
            setQuickFilter={setQuickFilter}
            genreFilter={genreFilter}
            setGenreFilter={setGenreFilter}
            sortFilter={sortFilter}
            setSortFilter={setSortFilter}
            onOpenGame={setSelectedGameId}
            onToggleFavorite={toggleFavorite}
            onBuyGame={addToCart}
            onSwitchView={switchView}
          />
        )}
        {currentView === 'libraryView' && (
          <LibraryScreen
            games={libraryGames}
            profileName={auth.profile?.name}
            isAdmin={isAdmin}
            isBlocked={isBlocked}
            gameRestrictions={gameRestrictions}
            playStats={playStats}
            mode={libraryMode}
            setMode={setLibraryMode}
            onStore={() => switchView('storeView')}
            onPlayGame={playGame}
            onBlockedPlay={message => showToast(message || 'Conta bloqueada. Você pode comprar jogos, mas não pode jogar agora.')}
          />
        )}

        {currentView === 'profileView' && (
          <ProfileScreen
            profile={auth.profile}
            email={auth.user?.email || ''}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            reportForm={reportForm}
            setReportForm={setReportForm}
            socialProfiles={socialProfiles}
            friendships={friendships}
            userReports={userReports}
            playStats={playStats}
            chatMessages={chatMessages}
            chatGroups={chatGroups}
            chatGroupMembers={chatGroupMembers}
            communityServers={communityServers}
            communityServerMembers={communityServerMembers}
            communityRoles={communityRoles}
            communityMemberRoles={communityMemberRoles}
            communityChannels={communityChannels}
            communityVoicePresence={communityVoicePresence}
            favoriteGames={favoriteGames}
            libraryGames={libraryGames}
            onOpenGame={setSelectedGameId}
            onSaveProfile={saveProfile}
            onSaveEmail={saveEmail}
            onChangePassword={changePassword}
            onRequestFriend={requestFriend}
            onUpdateFriendship={updateFriendship}
            onSubmitReport={submitReport}
            onSendChatMessage={sendChatMessage}
            onCreateGroup={createChatGroup}
            onCreateServer={createCommunityServer}
            onAddServerMember={addCommunityMember}
            onCreateChannel={createCommunityChannel}
            onCreateRole={createCommunityRole}
            onAssignRole={assignCommunityRole}
            onJoinVoice={joinVoiceChannel}
            onLeaveVoice={leaveVoiceChannel}
          />
        )}

        {currentView === 'socialView' && (
          <SocialScreen
            profile={auth.profile}
            socialProfiles={socialProfiles}
            friendships={friendships}
            chatMessages={chatMessages}
            chatGroups={chatGroups}
            communityServers={communityServers}
            communityServerMembers={communityServerMembers}
            communityRoles={communityRoles}
            communityMemberRoles={communityMemberRoles}
            communityChannels={communityChannels}
            communityVoicePresence={communityVoicePresence}
            onRequestFriend={requestFriend}
            onUpdateFriendship={updateFriendship}
            onSendChatMessage={sendChatMessage}
            onDeleteMessage={deleteChatMessage}
            onCreateGroup={createChatGroup}
            onCreateServer={createCommunityServer}
            onAddServerMember={addCommunityMember}
            onJoinServerByInvite={joinCommunityByInvite}
            onUpdateServerVisibility={updateCommunityVisibility}
            onDeleteServer={deleteCommunityServer}
            onCreateChannel={createCommunityChannel}
            onDeleteChannel={deleteCommunityChannel}
            onCreateRole={createCommunityRole}
            onDeleteRole={deleteCommunityRole}
            onAssignRole={assignCommunityRole}
            onJoinVoice={joinVoiceChannel}
            onLeaveVoice={leaveVoiceChannel}
          />
        )}

        {currentView === 'cartView' && (
          <CartScreen games={cartGames} subtotal={cartSubtotal} fee={cartFee} onStore={() => switchView('storeView')} onCheckout={() => switchView('checkoutView')} onRemove={removeFromCart} onClear={clearCart} />
        )}

        {currentView === 'checkoutView' && (
          <CheckoutScreen
            games={cartGames}
            total={checkoutTotal}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            installments={installments}
            setInstallments={setInstallments}
            cardForm={cardForm}
            setCardForm={setCardForm}
            savedCards={savedCards}
            selectedSavedCardId={selectedSavedCardId}
            onSelectCard={card => {
              setSelectedSavedCardId(card.id);
              setCardForm(current => ({
                ...current,
                name: card.holder_name,
                number: `•••• •••• •••• ${card.last4}`,
                date: '',
                cvv: ''
              }));
            }}
            onCart={() => switchView('cartView')}
            onFinish={finishPurchase}
          />
        )}

        {currentView === 'adminView' && isAdmin && (
          <AdminScreen
            games={games}
            users={filteredAdminUsers}
            allUsers={adminUsers}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            adminSearchTerm={adminSearchTerm}
            setAdminSearchTerm={setAdminSearchTerm}
            adminTypeFilter={adminTypeFilter}
            setAdminTypeFilter={setAdminTypeFilter}
            adminStatusFilter={adminStatusFilter}
            setAdminStatusFilter={setAdminStatusFilter}
            selectedUser={selectedAdminUser}
            selectedUserId={selectedAdminUserId}
            adminLibraryItems={adminLibraryItems}
            adminGameRestrictions={adminGameRestrictions}
            adminLibraryMode={adminLibraryMode}
            setAdminLibraryMode={setAdminLibraryMode}
            addGameId={addGameId}
            setAddGameId={setAddGameId}
            restrictionForm={restrictionForm}
            setRestrictionForm={setRestrictionForm}
            gameForm={gameForm}
            updateGameForm={updateGameForm}
            editingGameId={editingGameId}
            savingGame={savingGame}
            resetGameForm={resetGameForm}
            submitGameForm={submitGameForm}
            carouselForm={carouselForm}
            setCarouselForm={setCarouselForm}
            promoForm={promoForm}
            setPromoForm={setPromoForm}
            onStore={() => switchView('storeView')}
            onSelectUser={selectAdminUser}
            onToggleStatus={toggleUserStatus}
            onToggleRole={toggleUserRole}
            onAddGame={adminAddGame}
            onRemoveGame={adminRemoveGame}
            onApplyGameRestriction={applyGameRestriction}
            onRevokeGameRestriction={revokeGameRestriction}
            onEditGame={startEditGame}
            onDeleteGame={deleteCatalogGame}
            onSaveCarousel={saveCarousel}
            onSavePromo={savePromo}
            currentUserId={auth.user?.id || ''}
          />
        )}
      </main>

      <LoginModal
        open={loginOpen}
        form={loginForm}
        setForm={setLoginForm}
        onClose={() => setLoginOpen(false)}
        onSubmit={handleLogin}
      />

      <RegisterModal
        open={registerOpen}
        form={registerForm}
        setForm={setRegisterForm}
        score={score}
        scoreLabels={scoreLabels}
        scoreWidths={scoreWidths}
        onClose={() => setRegisterOpen(false)}
        onSubmit={handleRegister}
      />

      <GameModal
        game={selectedGame}
        isAdmin={isAdmin}
        isFavorite={selectedGame ? favoriteIds.includes(selectedGame.id) : false}
        onClose={() => setSelectedGameId(null)}
        onFavorite={() => selectedGame && toggleFavorite(selectedGame.id)}
        onBuy={() => selectedGame && (isAdmin ? switchView('adminView') : addToCart(selectedGame.id))}
      />

      {purchaseSuccess && (
        <PurchaseSuccess onLibrary={() => {
          setPurchaseSuccess(false);
          switchView('libraryView');
        }} />
      )}

      <Toast message={toast} />
    </>
  );
}
