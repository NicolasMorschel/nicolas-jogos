import type { CSSProperties, FormEvent } from 'react';
import type { Game } from '../types';
import { Modal } from './common';
import { FormInput } from './forms';
import { PriceGroup, TagList } from './game';
import { coverStyle, genreLabel } from '../utils';

export function LoginModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit
}: {
  open: boolean;
  form: { email: string; password: string };
  setForm: (form: { email: string; password: string }) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <form className="modal-card small-card" onSubmit={onSubmit}>
        <div className="modal-head">
          <div>
            <h3>Entrar na conta</h3>
            <p>Login real com Supabase Auth.</p>
          </div>
          <button className="btn close" type="button" onClick={onClose}>×</button>
        </div>
        <div className="form-grid">
          <FormInput value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} type="email" placeholder="Seu e-mail" />
          <FormInput value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} type="password" placeholder="Sua senha" />
          <button className="btn primary-btn full">Entrar</button>
        </div>
      </form>
    </Modal>
  );
}

export function RegisterModal({
  open,
  form,
  setForm,
  score,
  scoreLabels,
  scoreWidths,
  onClose,
  onSubmit
}: {
  open: boolean;
  form: { name: string; email: string; password: string };
  setForm: (form: { name: string; email: string; password: string }) => void;
  score: number;
  scoreLabels: string[];
  scoreWidths: string[];
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <form className="modal-card small-card" onSubmit={onSubmit}>
        <div className="modal-head">
          <div>
            <h3>Criar conta</h3>
            <p>Cadastro real com Supabase Auth.</p>
          </div>
          <button className="btn close" type="button" onClick={onClose}>×</button>
        </div>
        <div className="form-grid">
          <FormInput value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} type="text" placeholder="Seu nome" />
          <FormInput value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} type="email" placeholder="Seu e-mail" />
          <FormInput value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} type="password" placeholder="Crie uma senha forte" />
          <div>
            <p className="helper">Força da senha</p>
            <div className="strength">
              <div className="strength-bar" style={{ width: scoreWidths[score] }} />
            </div>
            <p className="helper">{form.password ? `Segurança da senha: ${scoreLabels[score]}` : 'Digite uma senha para analisar.'}</p>
          </div>
          <button className="btn primary-btn full">Criar conta</button>
        </div>
      </form>
    </Modal>
  );
}

export function GameModal({
  game,
  isAdmin,
  isFavorite,
  onClose,
  onFavorite,
  onBuy
}: {
  game: Game | null;
  isAdmin: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onFavorite: () => void;
  onBuy: () => void;
}) {
  return (
    <Modal open={!!game} onClose={onClose}>
      {game && (
        <div className="modal-card game-modal-card">
          <div className="modal-head">
            <div>
              <h3>{game.title}</h3>
              <p>{genreLabel(game.genre).toUpperCase()}</p>
            </div>
            <button className="btn close" type="button" onClick={onClose}>×</button>
          </div>
          <div className="game-modal-body row g-3">
            <div className="col-12 col-lg-6">
              <div className="game-modal-cover" style={{ '--cover': coverStyle(game.franchise) } as CSSProperties}>
                <div className="cover-art cover-large" style={{ background: coverStyle(game.franchise) }}>
                  <span>{game.franchise}</span>
                  <strong>{game.title}</strong>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="form-grid">
                <p>{game.description}</p>
                <TagList tags={game.tags} />
                <PriceGroup game={game} />
                <div className="stack-actions">
                  <button className={`btn ghost-btn ${isAdmin ? 'disabled-btn' : ''}`} disabled={isAdmin} onClick={onFavorite}>
                    {isAdmin ? 'Somente pelo painel admin' : isFavorite ? 'Remover favorito' : 'Favoritar'}
                  </button>
                  <button className="btn primary-btn" onClick={onBuy}>
                    {isAdmin ? 'Ir para o Admin' : 'Adicionar ao carrinho'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function PurchaseSuccess({ onLibrary }: { onLibrary: () => void }) {
  return (
    <div className="purchase-success">
      <div className="purchase-success-card">
        <div className="purchase-success-icon">✓</div>
        <h3>Compra realizada</h3>
        <p>Seus jogos foram enviados para a biblioteca.</p>
        <button className="btn primary-btn" onClick={onLibrary}>Ir para biblioteca</button>
      </div>
    </div>
  );
}
