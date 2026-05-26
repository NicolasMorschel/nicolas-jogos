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
  searchTerm: string;
  onSearch: (value: string) => void;
  onSwitchView: (view: ViewId) => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
}) {
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
          <button className={`btn nav-btn ${currentView === 'storeView' ? 'active' : ''}`} onClick={() => onSwitchView('storeView')}>Loja</button>
          {!isAdmin && <button className={`btn nav-btn ${currentView === 'libraryView' ? 'active' : ''}`} onClick={() => onSwitchView('libraryView')}>Biblioteca</button>}
          {isLoggedIn && <button className={`btn nav-btn ${currentView === 'socialView' ? 'active' : ''}`} onClick={() => onSwitchView('socialView')}>Comunidades</button>}
          {isLoggedIn && <button className={`btn nav-btn ${currentView === 'profileView' ? 'active' : ''}`} onClick={() => onSwitchView('profileView')}>Perfil</button>}
          {!isAdmin && <button className={`btn nav-btn ${currentView === 'cartView' ? 'active' : ''}`} onClick={() => onSwitchView('cartView')}>Carrinho</button>}
          {!isAdmin && <button className={`btn nav-btn ${currentView === 'checkoutView' ? 'active' : ''}`} onClick={() => onSwitchView('checkoutView')}>Checkout</button>}
          {isAdmin && <button className={`btn nav-btn ${currentView === 'adminView' ? 'active' : ''}`} onClick={() => onSwitchView('adminView')}>Admin</button>}
        </nav>

        <div className="input-group searchbox flex-grow-1 w-100">
          <span className="input-group-text searchbox-icon" aria-hidden="true" />
          <input className="form-control" value={searchTerm} onChange={event => onSearch(event.target.value)} placeholder="Buscar jogos, tags ou franquias..." />
        </div>

        <div className="header-actions flex-shrink-0">
          {isLoggedIn ? (
            <button className="btn ghost-btn" onClick={onLogout}>Sair</button>
          ) : (
            <>
              <button className="btn ghost-btn" onClick={onLogin}>Entrar</button>
              <button className="btn primary-btn" onClick={onRegister}>Criar conta</button>
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
    <button className={`btn filter-link ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;

  return (
    <div className="modal show" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      {children}
    </div>
  );
}
