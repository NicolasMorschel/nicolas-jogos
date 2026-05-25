import type { AdminUser, Game, QuickFilter, StoreConfig } from '../types';
import { defaultStoreConfig } from '../config/app';
import { hasGameDiscount } from '../utils';

export function selectHeroGames(games: Game[], storeConfig: StoreConfig) {
  const ids = (storeConfig.carousel.length ? storeConfig.carousel : defaultStoreConfig.carousel).slice(0, 3);
  return ids.map(id => games.find(game => Number(game.id) === Number(id))).filter(Boolean) as Game[];
}

export function selectFilteredGames({
  games,
  searchTerm,
  genreFilter,
  quickFilter,
  sortFilter,
  favoriteIds,
  isAdmin
}: {
  games: Game[];
  searchTerm: string;
  genreFilter: string;
  quickFilter: QuickFilter;
  sortFilter: string;
  favoriteIds: number[];
  isAdmin: boolean;
}) {
  let list = [...games];
  const term = searchTerm.toLowerCase().trim();

  if (term) {
    list = list.filter(game =>
      `${game.title} ${game.franchise} ${game.description} ${(game.tags || []).join(' ')}`
        .toLowerCase()
        .includes(term)
    );
  }

  if (genreFilter !== 'all') list = list.filter(game => game.genre === genreFilter);
  if (quickFilter === 'featured') list = list.filter(game => game.featured);
  if (quickFilter === 'discount') list = list.filter(hasGameDiscount).sort((a, b) => Number(b.discount) - Number(a.discount));
  if (quickFilter === 'favorites') list = isAdmin ? list : list.filter(game => favoriteIds.includes(Number(game.id)));
  if (sortFilter === 'cheap') list.sort((a, b) => Number(a.price) - Number(b.price));
  if (sortFilter === 'expensive') list.sort((a, b) => Number(b.price) - Number(a.price));
  if (sortFilter === 'discount' && quickFilter !== 'discount') list.sort((a, b) => Number(b.discount) - Number(a.discount));

  return list;
}

export function selectFranchises(games: Game[]) {
  return [...new Set(games.map(game => game.franchise))].map(name => ({
    name,
    count: games.filter(game => game.franchise === name).length
  }));
}

export function selectGamesByIds(ids: number[], games: Game[]) {
  return ids.map(id => games.find(game => Number(game.id) === id)).filter(Boolean) as Game[];
}

export function selectFilteredAdminUsers({
  users,
  searchTerm,
  typeFilter,
  statusFilter
}: {
  users: AdminUser[];
  searchTerm: string;
  typeFilter: string;
  statusFilter: string;
}) {
  const term = searchTerm.toLowerCase().trim();
  return users.filter(user => {
    const hit = !term || `${user.name} ${user.email}`.toLowerCase().includes(term);
    const typeOk = typeFilter === 'all' || user.role === typeFilter;
    const statusOk = statusFilter === 'all' || user.status === statusFilter;
    return hit && typeOk && statusOk;
  });
}
