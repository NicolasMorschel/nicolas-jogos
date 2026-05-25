import type { Game, GameForm } from '../types';
import {
  clampDiscount,
  discountFromPrices,
  formatMoney,
  normalizeTags,
  parseMoney,
  priceFromDiscount
} from '../utils';

export function gamePayloadFromForm(form: GameForm): Omit<Game, 'id'> {
  const title = form.title.trim();
  const franchise = form.franchise.trim();
  const description = form.description.trim();
  const tags = normalizeTags(form.tags);
  let price = parseMoney(form.price);
  let oldPrice = form.hasDiscount ? parseMoney(form.oldPrice) : price;
  let discount = form.hasDiscount ? parseMoney(form.discount) : 0;

  if (!title) throw new Error('Preenche o título do jogo.');
  if (!franchise) throw new Error('Preenche a franquia.');
  if (!form.genre) throw new Error('Seleciona um gênero.');
  if (!description) throw new Error('Preenche a descrição.');

  if (form.hasDiscount && price === null && oldPrice !== null && discount !== null) {
    price = priceFromDiscount(oldPrice, discount);
  }

  if (price === null || price < 0) throw new Error('Preço inválido.');

  if (!form.hasDiscount) {
    oldPrice = price;
    discount = 0;
  } else {
    if (oldPrice === null || oldPrice <= 0) throw new Error('Preço antigo inválido.');
    if (discount === null) discount = discountFromPrices(price, oldPrice);
    discount = clampDiscount(discount);

    if (discount === null || discount < 0) throw new Error('Desconto inválido.');
    if (discount > 0 && oldPrice <= price) {
      throw new Error('Para usar desconto, o preço antigo precisa ser maior que o atual.');
    }
  }

  return {
    title,
    franchise,
    genre: form.genre,
    description,
    tags,
    price,
    old_price: oldPrice,
    discount,
    featured: form.featured
  };
}

export function syncDiscountForm(form: GameForm, source: 'toggle' | 'price' | 'old' | 'discount'): GameForm {
  const draft = { ...form };

  if (!draft.hasDiscount) {
    draft.oldPrice = '';
    draft.discount = '';
    return draft;
  }

  const price = parseMoney(draft.price);
  let oldPrice = parseMoney(draft.oldPrice);
  let discount = parseMoney(draft.discount);

  if (source === 'toggle' && oldPrice === null && price !== null) {
    oldPrice = price;
    draft.oldPrice = formatMoney(price);
  }

  if ((source === 'discount' || source === 'old' || source === 'toggle') && oldPrice !== null && discount !== null) {
    const normalized = clampDiscount(discount) ?? 0;
    draft.discount = String(normalized);
    const nextPrice = priceFromDiscount(oldPrice, normalized);
    if (nextPrice !== null) draft.price = formatMoney(nextPrice);
    return draft;
  }

  if ((source === 'price' || source === 'old') && price !== null && oldPrice !== null) {
    draft.discount = String(discountFromPrices(price, oldPrice));
  }

  return draft;
}
