import { state } from '../state.js';
import { $, getGame, coverStyle } from '../utils.js';

export function renderLibrary() {
  const wrap = $('libraryGrid');
  if (!state.profile) return wrap.innerHTML = '<div class="page-panel">Faz login para abrir tua biblioteca.</div>';
  if (state.profile.role === 'admin') return wrap.innerHTML = '<div class="page-panel">Administrador não possui biblioteca de compra. Usa a área Admin para gerir bibliotecas dos usuários.</div>';
  if (!state.libraryIds.length) return wrap.innerHTML = '<div class="page-panel">Ainda não tem jogos na tua biblioteca.</div>';

  wrap.innerHTML = state.libraryIds.map(id => {
    const g = getGame(id);
    return `<article class="library-card"><div class="library-cover" style="--cover:${coverStyle(g.franchise)}"></div><div class="library-body"><h3>${g.title}</h3><p>${g.description}</p><button class="primary-btn full">Jogar</button></div></article>`;
  }).join('');
}
