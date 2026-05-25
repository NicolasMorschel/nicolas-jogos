import type { CSSProperties } from 'react';
import type { Game } from '../types';
import { brl, coverStyle, hasGameDiscount } from '../utils';

export function TagList({ tags }: { tags: string[] }) {
  return <div className="tag-list">{(tags || []).map(tag => <span key={tag}>{tag}</span>)}</div>;
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

export function GameCard({ game, isAdmin, isFavorite, onFavorite, onOpen, onBuy }: {
  game: Game;
  isAdmin: boolean;
  isFavorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
  onBuy: () => void;
}) {
  return (
    <article className="game-card h-100">
      <div className="game-cover" style={{ '--cover': coverStyle(game.franchise) } as CSSProperties}>
        <div className="game-cover-top">
          <span className="mini-pill">{game.franchise}</span>
          <button className={`btn icon-button ${isAdmin ? 'disabled-btn' : ''}`} disabled={isAdmin} onClick={onFavorite} aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>
        <h3>{game.title}</h3>
      </div>
      <div className="game-body">
        <p>{game.description}</p>
        <TagList tags={game.tags} />
        <div className="price-row">
          <PriceGroup game={game} />
          <div className="stack-actions">
            <button className="btn ghost-btn" onClick={onOpen}>Ver</button>
            <button className="btn primary-btn" onClick={onBuy}>{isAdmin ? 'Gerenciar' : 'Comprar'}</button>
          </div>
        </div>
      </div>
    </article>
  );
}
