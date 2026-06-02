import type { CSSProperties } from 'react';
import type { Game } from '../types';
import { brl, coverStyle, hasGameDiscount } from '../utils';

export function TagList({ tags }: { tags: string[] }) {
  return <div className="tag-list d-flex flex-wrap gap-2">{(tags || []).map(tag => <span className="badge rounded-pill text-bg-dark border border-secondary-subtle" key={tag}>{tag}</span>)}</div>;
}

export function PriceGroup({ game }: { game: Game }) {
  return (
    <div className="price-group">
      {hasGameDiscount(game) && <span className="old-price">{brl(game.old_price)}</span>}
      <strong className="new-price">{brl(game.price)}</strong>
      {hasGameDiscount(game) && <span className="discount-box">-{game.discount}%</span>}
    </div>
  );
}

export function GameCard({ game, isAdmin, isFavorite, isOwned = false, isInCart = false, onFavorite, onOpen, onBuy }: {
  game: Game;
  isAdmin: boolean;
  isFavorite: boolean;
  isOwned?: boolean;
  isInCart?: boolean;
  onFavorite: () => void;
  onOpen: () => void;
  onBuy: () => void;
}) {
  const buyLabel = isAdmin ? 'Gerenciar' : isOwned ? 'Na biblioteca' : isInCart ? 'No carrinho' : 'Comprar';

  return (
    <article className="card game-card h-100">
      <div className="game-cover" style={{ '--cover': coverStyle(game.franchise) } as CSSProperties}>
        <div className="game-cover-top">
          <span className="mini-pill">{game.franchise}</span>
          <button className={`btn icon-button ${isAdmin ? 'disabled-btn' : ''}`} disabled={isAdmin} onClick={onFavorite} aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>
        <h3>{game.title}</h3>
      </div>
      <div className="card-body game-body">
        <p>{game.description}</p>
        <div className="d-flex flex-wrap gap-2">
          {isOwned && <span className="owned-pill">Na biblioteca</span>}
          {!isOwned && isInCart && <span className="cart-pill">No carrinho</span>}
        </div>
        <TagList tags={game.tags} />
        <div className="price-row">
          <PriceGroup game={game} />
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button className="btn btn-outline-light" onClick={onOpen}>Ver</button>
            <button className="btn btn-primary" onClick={onBuy}>{buyLabel}</button>
          </div>
        </div>
      </div>
    </article>
  );
}
