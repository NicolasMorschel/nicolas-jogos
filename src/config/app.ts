import type { AdminTab, GameForm, GameRestrictionForm, StoreConfig, ViewId } from '../types';

export const VIEW_STORAGE_KEY = 'nicolasJogos.currentView';
export const ADMIN_TAB_STORAGE_KEY = 'nicolasJogos.adminTab';

export const validViews: ViewId[] = ['storeView', 'libraryView', 'cartView', 'checkoutView', 'adminView', 'profileView', 'socialView'];
export const adminTabs: AdminTab[] = ['users', 'library', 'catalog', 'home'];

export const emptyGameForm: GameForm = {
  title: '',
  franchise: '',
  genre: 'acao-aventura',
  price: '',
  oldPrice: '',
  discount: '',
  hasDiscount: false,
  featured: false,
  tags: '',
  description: ''
};

export const emptyCardForm = {
  name: '',
  number: '',
  date: '',
  cvv: '',
  save: false
};

export const emptyGameRestrictionForm: GameRestrictionForm = {
  gameId: '',
  type: 'warning',
  duration: '7d',
  reason: ''
};

export const defaultStoreConfig: StoreConfig = {
  carousel: [1, 2, 3],
  promo_title: 'Franquias famosas em destaque',
  promo_text: 'Banco online, login real e painel admin com Supabase.'
};
