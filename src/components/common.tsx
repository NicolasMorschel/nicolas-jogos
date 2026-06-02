import type { ReactNode } from 'react';
import type { ViewId } from '../types';

export function Loader({ text }: { text: string }) {
  return (
    <div className="loader">
      <div className="loader-card">
        <div className="loader-logo">NJ</div>
        <h2>Nicolas Jogos</h2>
        <p>{text}</p>
        <div className="loader-bar">
          <span style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return <div className={`app-toast ${message ? 'show' : ''}`} role="status" aria-live="polite">{message}</div>;
}

export function AccountStatusBanner({ blocked }: { blocked: boolean }) {
  if (!blocked) return null;

  return (
    <div className="container-xxl account-status-wrap">
      <div className="alert account-status-alert mb-0" role="alert">
        <strong>Conta bloqueada.</strong>
        <span> Você ainda pode navegar e comprar jogos, mas não pode jogar até um admin reativar sua conta.</span>
      </div>
    </div>
  );
}

export function Header({
  currentView,
  isAdmin,
  isLoggedIn,
  libraryCount = 0,
  cartCount = 0,
  favoriteCount = 0,
  searchTerm,
  onSearch,
  onSwitchView,
  onLogin,
  onRegister,
  onLogout
}: {
  currentView: ViewId;
  isAdmin: boolean;
  isLoggedIn: boolean;
  libraryCount?: number;
  cartCount?: number;
  favoriteCount?: number;
  searchTerm: string;
  onSearch: (value: string) => void;
  onSwitchView: (view: ViewId) => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
}) {
  const storeContext = !isAdmin && (!isLoggedIn || currentView === 'storeView' || currentView === 'libraryView' || currentView === 'cartView' || currentView === 'checkoutView');
  const socialContext = !isAdmin && isLoggedIn && (currentView === 'socialView' || currentView === 'profileView');

  return (
    <header className="navbar topbar">
      <div className="container-xxl topbar-inner d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-3">
        <button className="brand brand-button flex-shrink-0" type="button" onClick={() => onSwitchView('storeView')}>
          <span className="brand-mark">NJ</span>
          <span>
            <strong>Nicolas Jogos</strong>
            <small>Loja digital com Supabase</small>
          </span>
        </button>

        <nav className="nav nav-pills main-nav flex-wrap">
          {storeContext && (
            <span className="nav-cluster">
              <span className="nav-section-label">Loja</span>
              <NavButton active={currentView === 'storeView'} onClick={() => onSwitchView('storeView')}>Catalogo</NavButton>
              {!isAdmin && <NavButton active={currentView === 'libraryView'} count={libraryCount} onClick={() => onSwitchView('libraryView')}>Biblioteca</NavButton>}
              {!isAdmin && <NavButton active={currentView === 'cartView'} count={cartCount} onClick={() => onSwitchView('cartView')}>Carrinho</NavButton>}
              {!isAdmin && <NavButton active={currentView === 'checkoutView'} onClick={() => onSwitchView('checkoutView')}>Checkout</NavButton>}
              {!isAdmin && isLoggedIn && <NavButton active={false} onClick={() => onSwitchView('socialView')}>Comunidades</NavButton>}
              {!isAdmin && isLoggedIn && <NavButton active={false} onClick={() => onSwitchView('profileView')}>Perfil</NavButton>}
              {!isAdmin && isLoggedIn && favoriteCount > 0 && <span className="nav-meta-pill align-self-center">Favoritos {favoriteCount}</span>}
            </span>
          )}

          {socialContext && (
            <span className="nav-cluster">
              <span className="nav-section-label">Social</span>
              <NavButton active={currentView === 'socialView'} onClick={() => onSwitchView('socialView')}>Comunidades</NavButton>
              <NavButton active={currentView === 'profileView'} onClick={() => onSwitchView('profileView')}>Perfil</NavButton>
              {!isAdmin && <NavButton active={false} count={libraryCount} onClick={() => onSwitchView('libraryView')}>Biblioteca</NavButton>}
              <NavButton active={false} onClick={() => onSwitchView('storeView')}>Loja</NavButton>
            </span>
          )}

          {isAdmin && (
            <span className="nav-cluster">
              <span className="nav-section-label">Gestao</span>
              <NavButton active={currentView === 'adminView'} onClick={() => onSwitchView('adminView')}>Admin</NavButton>
              <NavButton active={currentView === 'storeView'} onClick={() => onSwitchView('storeView')}>Loja</NavButton>
              {isLoggedIn && <NavButton active={currentView === 'socialView'} onClick={() => onSwitchView('socialView')}>Comunidades</NavButton>}
              {isLoggedIn && <NavButton active={currentView === 'profileView'} onClick={() => onSwitchView('profileView')}>Perfil</NavButton>}
            </span>
          )}
        </nav>

        <div className="input-group searchbox flex-grow-1 w-100">
          <span className="input-group-text searchbox-icon" aria-hidden="true" />
          <input className="form-control" value={searchTerm} onChange={event => onSearch(event.target.value)} placeholder="Buscar jogos, tags ou franquias..." />
        </div>

        <div className="header-actions flex-shrink-0">
          {isLoggedIn ? (
            <button className="btn btn-outline-light" onClick={onLogout}>Sair</button>
          ) : (
            <>
              <button className="btn btn-outline-light" onClick={onLogin}>Entrar</button>
              <button className="btn btn-primary" onClick={onRegister}>Criar conta</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function StatusRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`btn ${active ? 'btn-primary' : 'btn-outline-light'} w-100 text-start filter-link`} onClick={onClick}>
      {children}
    </button>
  );
}

function NavButton({ active, count, onClick, children }: { active: boolean; count?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`btn nav-btn ${active ? 'active' : ''}`} onClick={onClick}>
      <span>{children}</span>
      {!!count && <span className="nav-count">{count}</span>}
    </button>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;

  return (
    <div className="modal fade show d-block app-modal" tabIndex={-1} onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down" onMouseDown={event => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
