import { state } from '../state.js';
import { $, brl, getGame } from '../utils.js';

export function renderCartPage() {
  const wrap = $('cartPageItems');
  if (!state.cartIds.length) {
    wrap.innerHTML = '<div class="page-panel">Teu carrinho está vazio no momento.</div>';
  } else {
    wrap.innerHTML = state.cartIds.map(id => {
      const g = getGame(id);
      return `<div class="cart-line"><div><strong>${g.title}</strong><div class="admin-user-meta">${g.franchise}</div></div><div class="stack-actions"><strong>${brl(g.price)}</strong><button class="ghost-btn" onclick="window.App.removeFromCart(${g.id})">Remover</button></div></div>`;
    }).join('');
  }
  const sub = state.cartIds.reduce((s,id)=>s + Number(getGame(id)?.price || 0), 0);
  const fee = state.cartIds.length ? 4.9 : 0;
  $('itemCount').textContent = state.cartIds.length;
  $('subtotal').textContent = brl(sub);
  $('securityFee').textContent = brl(fee);
  $('total').textContent = brl(sub + fee);
}
