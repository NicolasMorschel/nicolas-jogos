import { state } from '../state.js';
import { $, brl, isAdmin, getGame, coverStyle } from '../utils.js';

export function renderHero() {
  const ids = (state.storeConfig.carousel?.length ? state.storeConfig.carousel : [1,2,3]).slice(0,3);
  const heroGames = ids.map(getGame).filter(Boolean);
  $('heroTrack').innerHTML = heroGames.map(game => `
    <article class="hero-slide" style="--cover:${coverStyle(game.franchise)};">
      <div class="hero-content">
        <span class="kicker">${game.franchise}</span>
        <h1>${game.title}</h1>
        <p>${game.description}</p>
        <div class="tag-list">${(game.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
        <div class="price-chip"><span class="discount-box">-${game.discount}%</span><span>${brl(game.price)}</span></div>
        <div class="stack-actions" style="margin-top:18px;">
          <button class="primary-btn" onclick="window.App.openGame(${game.id})">Ver jogo</button>
          <button class="ghost-btn" onclick="window.App.addToCart(${game.id})">Adicionar</button>
        </div>
      </div>
    </article>
  `).join('');
  $('heroDots').innerHTML = heroGames.map((_,i)=>`<button class="${i===0 ? 'active' : ''}" onclick="window.App.goHero(${i})"></button>`).join('');
  state.currentSlide = 0;
  updateHeroPosition();
  clearInterval(state.heroTimer);
  if (heroGames.length > 1) {
    state.heroTimer = setInterval(() => {
      state.currentSlide = (state.currentSlide + 1) % heroGames.length;
      updateHeroPosition();
    }, 4200);
  }
  $('promoTitle').textContent = state.storeConfig.promo_title;
  $('promoText').textContent = state.storeConfig.promo_text;
}

export function updateHeroPosition() {
  $('heroTrack').style.transform = `translateX(-${state.currentSlide * 100}%)`;
  $('heroDots').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active', i===state.currentSlide));
}
export function goHero(i) {
  state.currentSlide = i;
  updateHeroPosition();
}

export function renderFranchises() {
  const grouped = [...new Set(state.games.map(g => g.franchise))].map(name => ({
    name,
    count: state.games.filter(g => g.franchise === name).length
  }));
  $('franchiseGrid').innerHTML = grouped.map(f => `
    <article class="franchise-card">
      <strong>${f.name}</strong>
      <p>${f.count} jogo(s) no catálogo</p>
    </article>
  `).join('');
}

export function renderGames() {
  let list = [...state.games];
  const term = $('searchInput').value.toLowerCase().trim();
  const genre = $('genreFilter').value;
  const sort = $('sortFilter').value;
  const adminMode = isAdmin();

  if (term) {
    list = list.filter(g => `${g.title} ${g.franchise} ${g.description} ${(g.tags || []).join(' ')}`.toLowerCase().includes(term));
  }
  if (genre !== 'all') list = list.filter(g => g.genre === genre);
  if (state.quickFilter === 'featured') list = list.filter(g => g.featured);
  if (state.quickFilter === 'discount') list = [...list].sort((a,b)=>b.discount-a.discount);
  if (state.quickFilter === 'favorites') list = adminMode ? list : list.filter(g => state.favoriteIds.includes(g.id));
  if (sort === 'cheap') list.sort((a,b)=>a.price-b.price);
  if (sort === 'expensive') list.sort((a,b)=>b.price-a.price);
  if (sort === 'discount' && state.quickFilter !== 'discount') list.sort((a,b)=>b.discount-a.discount);

  $('gamesGrid').innerHTML = list.map(game => {
    const favAction = adminMode ? "window.App.showToast('Administrador não usa favoritos.')" : `window.App.toggleFavorite(${game.id})`;
    const buyAction = adminMode ? "window.App.switchView('adminView','Abrindo painel administrativo...')" : `window.App.addToCart(${game.id})`;
    const buyLabel = adminMode ? 'Gerenciar' : 'Comprar';
    return `
      <article class="game-card">
        <div class="game-cover" style="--cover:${coverStyle(game.franchise)};">
          <div class="game-cover-top">
            <span class="mini-pill">${game.franchise}</span>
            <button class="icon-button ${adminMode ? 'disabled-btn' : ''}" ${adminMode ? 'disabled' : ''} onclick="${favAction}">${state.favoriteIds.includes(game.id) ? '❤' : '♡'}</button>
          </div>
          <h3>${game.title}</h3>
        </div>
        <div class="game-body">
          <p>${game.description}</p>
          <div class="tag-list">${(game.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
          <div class="price-row">
            <div class="price-group">
              <span class="old-price">${brl(game.old_price)}</span>
              <strong class="new-price">${brl(game.price)}</strong>
              <span class="discount-box">-${game.discount}%</span>
            </div>
            <div class="stack-actions">
              <button class="ghost-btn" onclick="window.App.openGame(${game.id})">Ver</button>
              <button class="primary-btn" onclick="${buyAction}">${buyLabel}</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('') || '<div class="page-panel">Nenhum jogo encontrado com esse filtro.</div>';
}

export function renderGameModal() {
  const g = getGame(state.selectedGameId);
  const adminMode = isAdmin();
  if (!g) return;
  $('gameModalTitle').textContent = g.title;
  $('gameModalGenre').textContent = String(g.genre).replace('-', ' ').toUpperCase();
  $('gameModalCover').style.setProperty('--cover', coverStyle(g.franchise));
  $('gameModalCover').innerHTML = `<div class="cover-art cover-large" style="background:${coverStyle(g.franchise)}"><span>${g.franchise}</span><strong>${g.title}</strong></div>`;
  $('gameModalDesc').textContent = g.description;
  $('gameModalTags').innerHTML = (g.tags || []).map(t=>`<span>${t}</span>`).join('');
  $('gameModalOldPrice').textContent = brl(g.old_price);
  $('gameModalNewPrice').textContent = brl(g.price);
  $('gameModalDiscount').textContent = `-${g.discount}%`;

  $('modalFavoriteBtn').textContent = adminMode ? 'Somente pelo painel admin' : (state.favoriteIds.includes(g.id) ? 'Remover favorito' : 'Favoritar');
  $('modalAddCart').textContent = adminMode ? 'Ir para o Admin' : 'Adicionar ao carrinho';
  $('modalFavoriteBtn').disabled = adminMode;
  $('modalAddCart').disabled = false;
  $('modalFavoriteBtn').classList.toggle('disabled-btn', adminMode);
  $('modalAddCart').classList.remove('disabled-btn');
}
