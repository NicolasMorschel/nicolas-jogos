import { Header, Loader, Toast } from './components/common';
import { GameModal, LoginModal, PurchaseSuccess, RegisterModal } from './components/modals';
import { AdminView as AdminScreen } from './views/AdminView';
import { CartView as CartScreen } from './views/CartView';
import { CheckoutView as CheckoutScreen } from './views/CheckoutView';
import { LibraryView as LibraryScreen } from './views/LibraryView';
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
          <LibraryScreen games={libraryGames} profileName={auth.profile?.name} isAdmin={isAdmin} onStore={() => switchView('storeView')} />
        )}

        {currentView === 'cartView' && (
          <CartScreen games={cartGames} subtotal={cartSubtotal} fee={cartFee} onStore={() => switchView('storeView')} onCheckout={() => switchView('checkoutView')} onRemove={removeFromCart} onClear={clearCart} />
        )}

        {currentView === 'checkoutView' && (
          <CheckoutScreen
            games={cartGames}
            total={checkoutTotal}
            paymentMethod={paymentMethod}
            setPaymentMethod={method => {
              setPaymentMethod(method);
              setSelectedSavedCardId(null);
            }}
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
            addGameId={addGameId}
            setAddGameId={setAddGameId}
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
