import { FormInput, FormSelect, FormTextarea } from '../../components/forms';
import type { AdminViewProps } from './types';

export function AdminHomeSection(props: Pick<
  AdminViewProps,
  'games' | 'carouselForm' | 'setCarouselForm' | 'promoForm' | 'setPromoForm' | 'onSaveCarousel' | 'onSavePromo'
>) {
  return (
    <div className="admin-bottom-grid row g-3">
      <div className="col-12 col-xl-6">
        <section className="card page-panel admin-card h-100">
          <div className="admin-card-head">
            <div>
              <span className="kicker">Home</span>
              <h3>Carrossel principal</h3>
            </div>
          </div>
          <div className="admin-d-grid gap-3 row row-cols-1 row-cols-md-3 g-2">
            {[0, 1, 2].map(index => (
              <div className="col" key={index}>
                <FormSelect value={props.carouselForm[index] || ''} onChange={event => {
                  const next = [...props.carouselForm];
                  next[index] = event.target.value;
                  props.setCarouselForm(next);
                }}>
                  {props.games.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
                </FormSelect>
              </div>
            ))}
          </div>
          <button className="btn btn-primary mt-3" onClick={props.onSaveCarousel}>Salvar carrossel</button>
        </section>
      </div>
      <div className="col-12 col-xl-6">
        <section className="card page-panel admin-card h-100">
          <div className="admin-card-head">
            <div>
              <span className="kicker">Comunicação</span>
              <h3>Oferta principal</h3>
            </div>
          </div>
          <div className="d-grid gap-3">
            <FormInput value={props.promoForm.title} onChange={event => props.setPromoForm({ ...props.promoForm, title: event.target.value })} placeholder="Título da oferta" />
            <FormTextarea value={props.promoForm.text} onChange={event => props.setPromoForm({ ...props.promoForm, text: event.target.value })} placeholder="Texto da oferta" />
            <button className="btn btn-primary" onClick={props.onSavePromo}>Salvar oferta</button>
          </div>
        </section>
      </div>
    </div>
  );
}
