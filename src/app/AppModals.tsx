import type { AppController } from '../hooks/useAppController';
import { GameModal, LoginModal, PurchaseSuccess, RegisterModal } from '../components/modals';

export function AppModals({ controller: c }: { controller: AppController }) {
  return (
    <>
      <LoginModal
        open={c.loginOpen}
        form={c.loginForm}
        setForm={c.setLoginForm}
        onClose={() => c.setLoginOpen(false)}
        onSubmit={c.handleLogin}
      />

      <RegisterModal
        open={c.registerOpen}
        form={c.registerForm}
        setForm={c.setRegisterForm}
        score={c.score}
        scoreLabels={c.scoreLabels}
        scoreWidths={c.scoreWidths}
        onClose={() => c.setRegisterOpen(false)}
        onSubmit={c.handleRegister}
      />

      <GameModal
        game={c.selectedGame}
        isAdmin={c.isAdmin}
        isFavorite={c.selectedGame ? c.favoriteIds.includes(c.selectedGame.id) : false}
        onClose={() => c.setSelectedGameId(null)}
        onFavorite={() => c.selectedGame && c.toggleFavorite(c.selectedGame.id)}
        onBuy={() => c.selectedGame && (c.isAdmin ? c.switchView('adminView') : c.addToCart(c.selectedGame.id))}
      />

      {c.purchaseSuccess && (
        <PurchaseSuccess onLibrary={() => {
          c.setPurchaseSuccess(false);
          c.switchView('libraryView');
        }} />
      )}
    </>
  );
}
