import { AccountStatusBanner, Header, Loader, Toast } from './components/common';
import { AppModals } from './app/AppModals';
import { AppRoutes } from './app/AppRoutes';
import { useAppController } from './hooks/useAppController';

export default function App() {
  const controller = useAppController();

  return (
    <>
      {controller.loading && <Loader text={controller.loaderText} />}

      <Header
        currentView={controller.currentView}
        isAdmin={controller.isAdmin}
        isLoggedIn={controller.isLoggedIn}
        libraryCount={controller.libraryIds.length}
        cartCount={controller.cartIds.length}
        favoriteCount={controller.favoriteIds.length}
        searchTerm={controller.searchTerm}
        onSearch={controller.setSearchTerm}
        onSwitchView={view => {
          if (view === 'profileView') controller.openOwnProfile();
          else controller.switchView(view);
        }}
        onLogin={() => controller.setLoginOpen(true)}
        onRegister={() => controller.setRegisterOpen(true)}
        onLogout={controller.handleLogout}
      />

      <AccountStatusBanner blocked={controller.isBlocked} />
      <main>
        <AppRoutes controller={controller} />
      </main>
      <AppModals controller={controller} />
      <Toast message={controller.toast} />
    </>
  );
}
