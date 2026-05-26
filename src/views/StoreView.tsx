import type { CSSProperties } from 'react';
import type { AuthState, FranchiseSummary, Game, QuickFilter, StoreConfig, ViewId } from '../types';
import { FilterButton, StatusRow } from '../components/common';
import { FormSelect } from '../components/forms';
import { GameCard, TagList } from '../components/game';
import { brl, coverStyle, genres, hasGameDiscount } from '../utils';

export function StoreView({
  auth,
  filteredGames,
  heroGames,
  heroSlide,
  setHeroSlide,
  storeConfig,
  franchises,
  isAdmin,
  isLoggedIn,
  favoriteIds,
  libraryIds,
  cartIds,
  quickFilter,
  setQuickFilter,
  genreFilter,
  setGenreFilter,
  sortFilter,
  setSortFilter,
  onOpenGame,
  onToggleFavorite,
  onBuyGame,
  onSwitchView
}: {
  auth: AuthState;
  games: Game[];
  filteredGames: Game[];
  heroGames: Game[];
  heroSlide: number;
  setHeroSlide: (value: number | ((current: number) => number)) => void;
  storeConfig: StoreConfig;
  franchises: FranchiseSummary[];
  isAdmin: boolean;
  isLoggedIn: boolean;
  favoriteIds: number[];
  libraryIds: number[];
  cartIds: number[];
  quickFilter: QuickFilter;
  setQuickFilter: (filter: QuickFilter) => void;
  genreFilter: string;
  setGenreFilter: (genre: string) => void;
  sortFilter: string;
  setSortFilter: (sort: string) => void;
  onOpenGame: (gameId: number) => void;
  onToggleFavorite: (gameId: number) => void;
  onBuyGame: (gameId: number) => void;
  onSwitchView: (view: ViewId) => void;
}) {
  return (
    <section className="view active">
      <section className="hero-section">
        <div className="container-xxl">
          <div className="row g-3 align-items-stretch">
            <div className="col-12 col-xl-8">
              <div className="hero-slider h-100">
                <div className="hero-track" style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
                  {heroGames.map(game => (
                    <article className="hero-slide" style={{ '--cover': coverStyle(game.franchise) } as CSSProperties} key={game.id}>
                      <div className="hero-content">
                        <span className="kicker">{game.franchise}</span>
                        <h1>{game.title}</h1>
                        <p>{game.description}</p>
                        <TagList tags={game.tags} />
                        <div className="price-chip">
                          {hasGameDiscount(game) && <span className="discount-box">-{game.discount}%</span>}
                          <span>{brl(game.price)}</span>
                        </div>
                        <div className="stack-actions" style={{ marginTop: 18 }}>
                          <button className="btn primary-btn" onClick={() => onOpenGame(game.id)}>Ver jogo</button>
                          <button className="btn ghost-btn" onClick={() => (isAdmin ? onSwitchView('adminView') : onBuyGame(game.id))}>
                            {isAdmin ? 'Gerenciar' : 'Adicionar'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <button className="btn slider-btn prev d-none d-sm-flex" onClick={() => setHeroSlide(current => (current - 1 + Math.max(heroGames.length, 1)) % Math.max(heroGames.length, 1))}>‹</button>
                <button className="btn slider-btn next d-none d-sm-flex" onClick={() => setHeroSlide(current => (current + 1) % Math.max(heroGames.length, 1))}>›</button>
                <div className="hero-dots">
                  {heroGames.map((game, index) => (
                    <button key={game.id} className={index === heroSlide ? 'active' : ''} onClick={() => setHeroSlide(index)} />
                  ))}
                </div>
              </div>
            </div>

            <aside className="col-12 col-xl-4 hero-side">
              <div className="side-panel promo-panel">
                <span className="kicker">Oferta principal</span>
                <h3>{storeConfig.promo_title}</h3>
                <p>{storeConfig.promo_text}</p>
                <button className="btn primary-btn full" onClick={() => document.getElementById('catalogBlock')?.scrollIntoView({ behavior: 'smooth' })}>
                  Ir para catálogo
                </button>
              </div>
              <div className="side-panel account-panel">
                <StatusRow label="Sessão" value={auth.profile?.name || 'Visitante'} />
                <StatusRow label="Tipo" value={isAdmin ? 'Administrador' : 'Usuário'} />
                {isLoggedIn && <StatusRow label="Status" value={auth.profile?.status === 'blocked' ? 'Bloqueada' : 'Ativa'} />}
                <StatusRow label="Favoritos" value={isAdmin ? '—' : favoriteIds.length} />
                <StatusRow label="Biblioteca" value={isLoggedIn && !isAdmin ? libraryIds.length : 0} />
                <StatusRow label="Carrinho" value={isAdmin ? '—' : cartIds.length} />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container-xxl">
          <div className="section-head">
            <span className="kicker">Franquias famosas</span>
            <h2>Catálogo com jogos reais</h2>
          </div>
          <div className="franchise-grid row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xxl-6 g-3">
            {franchises.map(franchise => (
              <div className="col" key={franchise.name}>
                <article className="franchise-card h-100">
                  <strong>{franchise.name}</strong>
                  <p>{franchise.count} jogo(s) no catálogo</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block" id="catalogBlock">
        <div className="container-xxl">
          <div className="row g-3 align-items-start">
            <aside className="col-12 col-xl-3 store-sidebar sticky-xl-top">
              <div className="side-panel">
                <h4>Explorar</h4>
                <FilterButton active={quickFilter === 'all'} onClick={() => setQuickFilter('all')}>Todos os jogos</FilterButton>
                <FilterButton active={quickFilter === 'featured'} onClick={() => setQuickFilter('featured')}>Destaques</FilterButton>
                <FilterButton active={quickFilter === 'discount'} onClick={() => setQuickFilter('discount')}>Maiores descontos</FilterButton>
                {!isAdmin && <FilterButton active={quickFilter === 'favorites'} onClick={() => setQuickFilter('favorites')}>Favoritos</FilterButton>}
              </div>
              <div className="side-panel">
                <h4>Gêneros</h4>
                {genres.map(genre => (
                  <FilterButton key={genre.value} active={genreFilter === genre.value} onClick={() => setGenreFilter(genre.value)}>
                    {genre.label}
                  </FilterButton>
                ))}
              </div>
            </aside>

            <div className="col-12 col-xl-9 catalog-main">
              <div className="catalog-topbar">
                <div>
                  <h2>Catálogo</h2>
                  <p>Franquias reais, carrinho e biblioteca no banco.</p>
                </div>
                <div className="catalog-filters">
                  <FormSelect value={genreFilter} onChange={event => setGenreFilter(event.target.value)}>
                    <option value="all">Todos os gêneros</option>
                    {genres.map(genre => <option key={genre.value} value={genre.value}>{genre.label}</option>)}
                  </FormSelect>
                  <FormSelect value={sortFilter} onChange={event => setSortFilter(event.target.value)}>
                    <option value="popular">Mais populares</option>
                    <option value="cheap">Menor preço</option>
                    <option value="expensive">Maior preço</option>
                    <option value="discount">Maior desconto</option>
                  </FormSelect>
                </div>
              </div>
              <div className="games-grid row row-cols-1 row-cols-md-2 row-cols-xxl-3 g-3">
                {filteredGames.length ? filteredGames.map(game => (
                  <div className="col" key={game.id}>
                    <GameCard
                      game={game}
                      isAdmin={isAdmin}
                      isFavorite={favoriteIds.includes(game.id)}
                      onFavorite={() => onToggleFavorite(game.id)}
                      onOpen={() => onOpenGame(game.id)}
                      onBuy={() => (isAdmin ? onSwitchView('adminView') : onBuyGame(game.id))}
                    />
                  </div>
                )) : (
                  <div className="col-12">
                    <div className="page-panel">Nenhum jogo encontrado com esse filtro.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
