import { useCallback, useEffect, useState } from 'react';
import type { AdminTab, ViewId } from '../types';
import { ADMIN_TAB_STORAGE_KEY, VIEW_STORAGE_KEY, adminTabs, validViews } from '../config/app';

function safeStoredView(): ViewId {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ViewId | null;
  return saved && validViews.includes(saved) ? saved : 'storeView';
}

function safeStoredAdminTab(): AdminTab {
  const saved = localStorage.getItem(ADMIN_TAB_STORAGE_KEY) as AdminTab | null;
  return saved && adminTabs.includes(saved) ? saved : 'users';
}

export function useNavigationState({
  isAdmin,
  loading,
  showToast
}: {
  isAdmin: boolean;
  loading: boolean;
  showToast: (message: string) => void;
}) {
  const [currentView, setCurrentView] = useState<ViewId>(safeStoredView);
  const [adminTab, setAdminTabState] = useState<AdminTab>(safeStoredAdminTab);

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

  return {
    currentView,
    adminTab,
    setAdminTab,
    switchView
  };
}
