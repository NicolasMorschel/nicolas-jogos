export const state = {
  session: null,
  profile: null,
  games: [],
  cartIds: [],
  favoriteIds: [],
  libraryIds: [],
  savedCards: [],
  storeConfig: {
    carousel: [],
    promo_title: 'Franquias famosas em destaque',
    promo_text: 'Banco online, login real e painel admin com Supabase.'
  },
  currentSlide: 0,
  heroTimer: null,
  quickFilter: 'all',
  selectedGameId: null,
  selectedAdminUserId: null,
  adminUsers: [],
  currentAdminUserLibraryIds: [],
  adminSearchTerm: '',
  adminTypeFilter: 'all',
  adminStatusFilter: 'all',
  paymentMethod: 'pix',
  selectedSavedCardId: null,
  isLoggingOut: false
};

export function resetUserState() {
  state.session = null;
  state.profile = null;
  state.cartIds = [];
  state.favoriteIds = [];
  state.libraryIds = [];
  state.savedCards = [];
  state.selectedSavedCardId = null;
  state.paymentMethod = 'pix';
}
