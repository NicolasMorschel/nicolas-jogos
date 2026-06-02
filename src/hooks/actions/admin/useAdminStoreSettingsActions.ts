import type { AuthState, Profile } from '../../../types';
import * as api from '../../../services';

export function useAdminStoreSettingsActions({
  auth,
  carouselForm,
  promoForm,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  carouselForm: string[];
  promoForm: { title: string; text: string };
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  async function saveCarousel() {
    const ids = carouselForm.map(Number).filter(Boolean);
    const { error } = await api.saveStoreSetting('carousel', ids);
    if (error) return showToast(error.message);
    if (auth.user) {
      await api.addAdminLog({ admin_id: auth.user.id, action: 'save_carousel', details: { carousel: ids } });
    }
    await refreshAll();
    showToast('Carrossel atualizado.');
  }

  async function savePromo() {
    const titleRes = await api.saveStoreSetting('promo_title', promoForm.title.trim());
    if (titleRes.error) return showToast(titleRes.error.message);
    const textRes = await api.saveStoreSetting('promo_text', promoForm.text.trim());
    if (textRes.error) return showToast(textRes.error.message);
    if (auth.user) {
      await api.addAdminLog({ admin_id: auth.user.id, action: 'save_promo', details: promoForm });
    }
    await refreshAll();
    showToast('Oferta atualizada.');
  }

  return { saveCarousel, savePromo };
}
