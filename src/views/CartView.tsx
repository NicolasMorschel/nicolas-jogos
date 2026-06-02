import type { Game } from '../types';
import { brl } from '../utils';

export function CartView({ games, subtotal, fee, onStore, onCheckout, onRemove, onSaveForLater, onClear }: {
  games: Game[];
  subtotal: number;
  fee: number;
  onStore: () => void;
  onCheckout: () => void;
  onRemove: (id: number) => void;
  onSaveForLater: (id: number) => void;
  onClear: () => void;
}) {
  return (
    <section className="view active">
      <div className="container-xxl page-shell">
        <div className="page-header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3">
          <div>
            <span className="kicker">Etapa 1</span>
            <h1>Carrinho</h1>
            <p>Confere teus jogos antes de seguir para o pagamento.</p>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button className="btn btn-outline-light" onClick={onStore}>Continuar comprando</button>
            <button className="btn btn-primary" onClick={onCheckout}>Ir para checkout</button>
          </div>
        </div>
        <div className="row g-3 align-items-start">
          <div className="col-12 col-xl-8">
            <div className="card page-panel">
              {games.length ? games.map(game => (
                <div className="card cart-line" key={game.id}>
                  <div>
                    <strong>{game.title}</strong>
                    <div className="admin-user-meta">{game.franchise}</div>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <strong>{brl(game.price)}</strong>
                    <button className="btn btn-outline-light" onClick={() => onSaveForLater(game.id)}>Salvar para depois</button>
                    <button className="btn btn-outline-light" onClick={() => onRemove(game.id)}>Remover</button>
                  </div>
                </div>
              )) : <div>Teu carrinho está vazio no momento.</div>}
            </div>
          </div>
          <div className="col-12 col-xl-4">
            <aside className="card page-panel summary-panel sticky-xl-top">
              <h3>Resumo do pedido</h3>
              <div className="summary-list">
                <div><span>Itens</span><strong>{games.length}</strong></div>
                <div><span>Subtotal</span><strong>{brl(subtotal)}</strong></div>
                <div><span>Taxa</span><strong>{brl(fee)}</strong></div>
                <div className="total"><span>Total</span><strong>{brl(subtotal + fee)}</strong></div>
              </div>
              <button className="btn btn-primary w-100" onClick={onCheckout}>Finalizar compra</button>
              <button className="btn btn-outline-light w-100" onClick={onStore}>Continuar explorando</button>
              <button className="btn btn-outline-light w-100" onClick={onClear}>Limpar carrinho</button>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
