import type { CardForm, Game, PaymentMethod, SavedCard } from '../types';
import { CheckboxField, FormInput, FormSelect } from '../components/forms';
import { brl } from '../utils';

export function CheckoutView({ games, total, paymentMethod, setPaymentMethod, installments, setInstallments, cardForm, setCardForm, savedCards, selectedSavedCardId, onSelectCard, onCart, onFinish }: {
  games: Game[];
  total: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  installments: number;
  setInstallments: (value: number) => void;
  cardForm: CardForm;
  setCardForm: (next: CardForm) => void;
  savedCards: SavedCard[];
  selectedSavedCardId: number | null;
  onSelectCard: (card: SavedCard) => void;
  onCart: () => void;
  onFinish: () => void;
}) {
  const showCard = paymentMethod === 'debito' || paymentMethod === 'credito';

  function setCardField(field: keyof CardForm, value: string | boolean) {
    setCardForm({ ...cardForm, [field]: value });
  }

  return (
    <section className="view active">
      <div className="container-xxl page-shell">
        <div className="page-header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3">
          <div>
            <span className="kicker">Etapa 2</span>
            <h1>Finalizar compra</h1>
            <p>Compra real salva na biblioteca e limpa o carrinho.</p>
          </div>
          <button className="btn btn-outline-light" onClick={onCart}>Voltar para carrinho</button>
        </div>
        <div className="row g-3 align-items-start checkout-clean">
          <div className="col-12 col-xl-8">
            <div className="card page-panel clean-panel">
              <h3>Dados do pagamento</h3>
              <div className="d-grid gap-3 checkout-form">
                <div className="payment-switch row row-cols-1 row-cols-sm-3 g-2">
                  {(['pix', 'debito', 'credito'] as PaymentMethod[]).map(method => (
                    <div className="col" key={method}>
                      <button className={`btn payment-method w-100 ${paymentMethod === method ? 'active' : ''}`} type="button" onClick={() => setPaymentMethod(method)}>
                        {method === 'pix' ? 'Pix' : method === 'debito' ? 'Débito' : 'Crédito'}
                      </button>
                    </div>
                  ))}
                </div>

                {paymentMethod === 'pix' && (
                  <div className="pix-box">
                    <p className="helper">Pagamento instantâneo. Ao confirmar, o pedido é liberado na hora.</p>
                    <div className="pix-code">PIX • aprovação imediata</div>
                  </div>
                )}

                {showCard && (
                  <>
                    <div className="saved-cards-box">
                      {savedCards.length ? (
                        <>
                          <p className="helper">Cartões salvos</p>
                          {savedCards.map(card => (
                            <button type="button" key={card.id} className={`btn saved-card-item ${selectedSavedCardId === card.id ? 'active' : ''}`} onClick={() => onSelectCard(card)}>
                              <span>{card.brand}</span>
                              <strong>•••• {card.last4}</strong>
                              <small>{card.holder_name}</small>
                            </button>
                          ))}
                        </>
                      ) : <p className="helper">Nenhum cartão salvo ainda.</p>}
                    </div>
                    <div className="card-form-box">
                      <FormInput value={cardForm.name} onChange={event => setCardField('name', event.target.value)} placeholder="Nome no cartão" />
                      <FormInput value={cardForm.number} onChange={event => setCardField('number', event.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19).trim())} placeholder="Número do cartão" maxLength={19} />
                      <div className="row g-2">
                        <div className="col-12 col-sm-6">
                          <FormInput value={cardForm.date} onChange={event => {
                            let value = event.target.value.replace(/\D/g, '').slice(0, 4);
                            if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
                            setCardField('date', value);
                          }} placeholder="MM/AA" maxLength={5} />
                        </div>
                        <div className="col-12 col-sm-6">
                          <FormInput value={cardForm.cvv} onChange={event => setCardField('cvv', event.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="CVV" maxLength={3} />
                        </div>
                      </div>
                      <CheckboxField checked={cardForm.save} onChange={checked => setCardField('save', checked)}>
                        Salvar cartão para próximas compras
                      </CheckboxField>
                    </div>
                  </>
                )}

                {paymentMethod === 'credito' && (
                  <div>
                    <label className="helper" htmlFor="installmentsSelect">Parcelamento</label>
                    <FormSelect id="installmentsSelect" value={installments} onChange={event => setInstallments(Number(event.target.value))}>
                      {[1, 2, 3, 4, 5, 6].map(value => <option key={value} value={value}>{value}x{value === 6 ? ' com juros' : ''}</option>)}
                    </FormSelect>
                    <p className="helper">{installments === 1 ? '1x sem juros' : `${installments}x de ${brl(total / installments)} com juros`}</p>
                  </div>
                )}

                <button className="btn btn-primary w-100" onClick={onFinish}>Confirmar compra</button>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-4">
            <aside className="card page-panel clean-summary summary-panel sticky-xl-top">
              <h3>Seu pedido</h3>
              <div className="checkout-items">
                {games.length ? games.map(game => <div className="checkout-line" key={game.id}><span>{game.title}</span><strong>{brl(game.price)}</strong></div>) : <div className="checkout-line"><span>Nenhum item no pedido</span><strong>R$ 0,00</strong></div>}
              </div>
              <div className="summary-list">
                <div className="total"><span>Total</span><strong>{brl(total)}</strong></div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
