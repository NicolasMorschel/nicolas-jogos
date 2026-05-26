import { useEffect, useMemo, useState } from 'react';
import type { Game, QuickFilter, StoreConfig } from '../types';
import { selectFilteredGames, selectFranchises, selectHeroGames } from '../domain/selectors';

export function useStoreState({
  games,
  storeConfig,
  favoriteIds,
  isAdmin
}: {
  games: Game[];
  storeConfig: StoreConfig;
  favoriteIds: number[];
  isAdmin: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('popular');
  const [heroSlide, setHeroSlide] = useState(0);

  const heroGames = useMemo(() => selectHeroGames(games, storeConfig), [games, storeConfig]);

  useEffect(() => {
    setHeroSlide(0);
  }, [heroGames.length]);

  useEffect(() => {
    if (heroGames.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroSlide(current => (current + 1) % heroGames.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [heroGames.length]);

  const filteredGames = useMemo(
    () => selectFilteredGames({ games, searchTerm, genreFilter, quickFilter, sortFilter, favoriteIds, isAdmin }),
    [favoriteIds, games, genreFilter, isAdmin, quickFilter, searchTerm, sortFilter]
  );

  const franchises = useMemo(() => selectFranchises(games), [games]);

  return {
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
    heroGames,
    filteredGames,
    franchises
  };
}
