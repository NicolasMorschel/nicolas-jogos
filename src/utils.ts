import type { Game } from './types';

export const genres = [
  { value: 'acao-aventura', label: 'Ação e aventura' },
  { value: 'mundo-aberto', label: 'Mundo aberto' },
  { value: 'survival-horror', label: 'Survival horror' },
  { value: 'fps', label: 'FPS' },
  { value: 'esporte', label: 'Esporte' },
  { value: 'rpg', label: 'RPG' }
] as const;

export function brl(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function genreLabel(value: string) {
  return genres.find(genre => genre.value === value)?.label || value.replace('-', ' ');
}

export function hasGameDiscount(game: Game) {
  return Number(game.discount || 0) > 0 && Number(game.old_price || 0) > Number(game.price || 0);
}

export function coverStyle(title: string) {
  const map: Record<string, string> = {
    'God of War': 'linear-gradient(135deg,#2f0f10,#8a3f2e)',
    'Red Dead Redemption': 'linear-gradient(135deg,#390303,#b22914)',
    'The Last of Us': 'linear-gradient(135deg,#17201a,#4f5a41)',
    'Resident Evil': 'linear-gradient(135deg,#130c19,#6f2a45)',
    'Assassin’s Creed': 'linear-gradient(135deg,#161616,#8f4545)',
    'Call of Duty': 'linear-gradient(135deg,#121923,#45566f)',
    'EA Sports FC': 'linear-gradient(135deg,#0b3f2e,#42c07f)',
    'The Witcher': 'linear-gradient(135deg,#152029,#5f6f7c)',
    GTA: 'linear-gradient(135deg,#0f1824,#45556e)',
    Cyberpunk: 'linear-gradient(135deg,#281a0b,#8f6b1f)',
    'Marvel’s Spider-Man': 'linear-gradient(135deg,#112035,#8b1d3f)',
    'Elden Ring': 'linear-gradient(135deg,#21160b,#87723c)'
  };
  return map[title] || 'linear-gradient(135deg,#13203a,#4669aa)';
}

export function normalizeTags(raw: string) {
  return raw
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

export function parseMoney(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMoney(value: number) {
  return Number(value).toFixed(2);
}

export function clampDiscount(value: number) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function discountFromPrices(price: number, oldPrice: number) {
  if (!Number.isFinite(price) || !Number.isFinite(oldPrice) || oldPrice <= 0 || price >= oldPrice) return 0;
  return clampDiscount((1 - price / oldPrice) * 100) ?? 0;
}

export function priceFromDiscount(oldPrice: number, discount: number) {
  if (!Number.isFinite(oldPrice) || !Number.isFinite(discount)) return null;
  return Number((oldPrice * (1 - discount / 100)).toFixed(2));
}

export function detectCardBrand(number: string) {
  const clean = String(number || '').replace(/\D/g, '');
  if (/^4/.test(clean)) return 'Visa';
  if (/^(5[1-5])/.test(clean)) return 'Mastercard';
  if (/^(34|37)/.test(clean)) return 'Amex';
  if (/^(4011|4312|4389)/.test(clean)) return 'Elo';
  return 'Cartão';
}
