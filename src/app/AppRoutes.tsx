import type { AppController } from '../hooks/useAppController';
import { AdminView as AdminScreen } from '../views/AdminView';
import { CartView as CartScreen } from '../views/CartView';
import { CheckoutView as CheckoutScreen } from '../views/CheckoutView';
import { LibraryView as LibraryScreen } from '../views/LibraryView';
import { ProfileView as ProfileScreen } from '../views/ProfileView';
import { SocialView as SocialScreen } from '../views/SocialView';
import { StoreView } from '../views/StoreView';

export function AppRoutes({ controller: c }: { controller: AppController }) {
  return (
    <>
      {c.currentView === 'storeView' && (
        <StoreView
          auth={c.auth}
          games={c.games}
          filteredGames={c.filteredGames}
          heroGames={c.heroGames}
          heroSlide={c.heroSlide}
          setHeroSlide={c.setHeroSlide}
          storeConfig={c.storeConfig}
          franchises={c.franchises}
          isAdmin={c.isAdmin}
          isLoggedIn={c.isLoggedIn}
          favoriteIds={c.favoriteIds}
          libraryIds={c.libraryIds}
          cartIds={c.cartIds}
          quickFilter={c.quickFilter}
          setQuickFilter={c.setQuickFilter}
          genreFilter={c.genreFilter}
          setGenreFilter={c.setGenreFilter}
          sortFilter={c.sortFilter}
          setSortFilter={c.setSortFilter}
          onOpenGame={c.setSelectedGameId}
          onToggleFavorite={c.toggleFavorite}
          onBuyGame={c.addToCart}
          onSwitchView={c.switchView}
        />
      )}

      {c.currentView === 'libraryView' && (
        <LibraryScreen
          games={c.libraryGames}
          profileName={c.auth.profile?.name}
          isAdmin={c.isAdmin}
          isBlocked={c.isBlocked}
          gameRestrictions={c.gameRestrictions}
          playStats={c.playStats}
          mode={c.libraryMode}
          setMode={c.setLibraryMode}
          onStore={() => c.switchView('storeView')}
          onPlayGame={c.playGame}
          onBlockedPlay={message => c.showToast(message || 'Conta bloqueada. Você pode comprar jogos, mas não pode jogar agora.')}
        />
      )}

      {c.currentView === 'profileView' && (
        <ProfileScreen
          profile={c.auth.profile}
          viewedProfileId={c.viewedProfileId}
          email={c.auth.user?.email || ''}
          games={c.games}
          profileForm={c.profileForm}
          setProfileForm={c.setProfileForm}
          passwordForm={c.passwordForm}
          setPasswordForm={c.setPasswordForm}
          reportForm={c.reportForm}
          setReportForm={c.setReportForm}
          socialProfiles={c.socialProfiles}
          friendships={c.friendships}
          userReports={c.userReports}
          playStats={c.playStats}
          gameRestrictions={c.gameRestrictions}
          favoriteGames={c.favoriteGames}
          libraryGames={c.libraryGames}
          onOpenGame={c.setSelectedGameId}
          onOpenProfile={c.openUserProfile}
          onOpenOwnProfile={c.openOwnProfile}
          onSaveProfile={c.saveProfile}
          onUploadProfileMedia={c.uploadProfileMedia}
          onSaveEmail={c.saveEmail}
          onChangePassword={c.changePassword}
          onRequestFriend={c.requestFriend}
        />
      )}

      {c.currentView === 'socialView' && (
        <SocialScreen
          profile={c.auth.profile}
          socialProfiles={c.socialProfiles}
          friendships={c.friendships}
          chatMessages={c.chatMessages}
          chatGroups={c.chatGroups}
          communityServers={c.communityServers}
          communityServerMembers={c.communityServerMembers}
          communityRoles={c.communityRoles}
          communityMemberRoles={c.communityMemberRoles}
          communityChannels={c.communityChannels}
          communityVoicePresence={c.communityVoicePresence}
          onRequestFriend={c.requestFriend}
          onUpdateFriendship={c.updateFriendship}
          onSendChatMessage={c.sendChatMessage}
          onDeleteMessage={c.deleteChatMessage}
          chatMessageReactions={c.chatMessageReactions}
          chatMessagePins={c.chatMessagePins}
          chatMessageReports={c.chatMessageReports}
          onReactMessage={c.reactToChatMessage}
          onPinMessage={c.pinChatMessage}
          onUnpinMessage={c.unpinChatMessage}
          onReportMessage={c.reportChatMessage}
          onCreateGroup={c.createChatGroup}
          onCreateServer={c.createCommunityServer}
          onAddServerMember={c.addCommunityMember}
          onJoinServerByInvite={c.joinCommunityByInvite}
          onUpdateServerVisibility={c.updateCommunityVisibility}
          onDeleteServer={c.deleteCommunityServer}
          onCreateChannel={c.createCommunityChannel}
          onDeleteChannel={c.deleteCommunityChannel}
          onCreateRole={c.createCommunityRole}
          onDeleteRole={c.deleteCommunityRole}
          onUpdateRoleVoicePermission={c.updateCommunityRoleVoicePermission}
          onAssignRole={c.assignCommunityRole}
          onJoinVoice={c.joinVoiceChannel}
          onLeaveVoice={c.leaveVoiceChannel}
          onKickVoiceMember={c.kickVoiceMember}
          onOpenUserProfile={c.openUserProfile}
        />
      )}

      {c.currentView === 'cartView' && (
        <CartScreen
          games={c.cartGames}
          subtotal={c.cartSubtotal}
          fee={c.cartFee}
          onStore={() => c.switchView('storeView')}
          onCheckout={() => c.switchView('checkoutView')}
          onRemove={c.removeFromCart}
          onSaveForLater={c.moveCartItemToFavorites}
          onClear={c.clearCart}
        />
      )}

      {c.currentView === 'checkoutView' && (
        <CheckoutScreen
          games={c.cartGames}
          total={c.checkoutTotal}
          paymentMethod={c.paymentMethod}
          setPaymentMethod={c.setPaymentMethod}
          installments={c.installments}
          setInstallments={c.setInstallments}
          cardForm={c.cardForm}
          setCardForm={c.setCardForm}
          savedCards={c.savedCards}
          selectedSavedCardId={c.selectedSavedCardId}
          onSelectCard={card => {
            c.setSelectedSavedCardId(card.id);
            c.setCardForm(current => ({
              ...current,
              name: card.holder_name,
              number: `•••• •••• •••• ${card.last4}`,
              date: '',
              cvv: ''
            }));
          }}
          onCart={() => c.switchView('cartView')}
          onFinish={c.finishPurchase}
        />
      )}

      {c.currentView === 'adminView' && c.isAdmin && (
        <AdminScreen
          games={c.games}
          users={c.filteredAdminUsers}
          allUsers={c.adminUsers}
          adminTab={c.adminTab}
          setAdminTab={c.setAdminTab}
          adminSearchTerm={c.adminSearchTerm}
          setAdminSearchTerm={c.setAdminSearchTerm}
          adminTypeFilter={c.adminTypeFilter}
          setAdminTypeFilter={c.setAdminTypeFilter}
          adminStatusFilter={c.adminStatusFilter}
          setAdminStatusFilter={c.setAdminStatusFilter}
          selectedUser={c.selectedAdminUser}
          selectedUserId={c.selectedAdminUserId}
          adminLibraryItems={c.adminLibraryItems}
          adminGameRestrictions={c.adminGameRestrictions}
          adminLibraryMode={c.adminLibraryMode}
          setAdminLibraryMode={c.setAdminLibraryMode}
          addGameId={c.addGameId}
          setAddGameId={c.setAddGameId}
          restrictionForm={c.restrictionForm}
          setRestrictionForm={c.setRestrictionForm}
          gameForm={c.gameForm}
          updateGameForm={c.updateGameForm}
          editingGameId={c.editingGameId}
          savingGame={c.savingGame}
          resetGameForm={c.resetGameForm}
          submitGameForm={c.submitGameForm}
          carouselForm={c.carouselForm}
          setCarouselForm={c.setCarouselForm}
          promoForm={c.promoForm}
          setPromoForm={c.setPromoForm}
          onStore={() => c.switchView('storeView')}
          onSelectUser={c.selectAdminUser}
          onToggleStatus={c.toggleUserStatus}
          onToggleRole={c.toggleUserRole}
          onAddGame={c.adminAddGame}
          onRemoveGame={c.adminRemoveGame}
          onApplyGameRestriction={c.applyGameRestriction}
          onRevokeGameRestriction={c.revokeGameRestriction}
          onEditGame={c.startEditGame}
          onDeleteGame={c.deleteCatalogGame}
          onSaveCarousel={c.saveCarousel}
          onSavePromo={c.savePromo}
          currentUserId={c.auth.user?.id || ''}
        />
      )}
    </>
  );
}
