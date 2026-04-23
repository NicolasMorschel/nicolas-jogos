import { state, resetUserState } from '../state.js';
import { $, showToast, showLoader, hideLoader, closeModal, hidePurchaseSuccess } from '../utils.js';
import * as authModel from '../models/authModel.js';
import { refreshAll } from '../app.js';
import { switchView } from '../views/commonView.js';

export async function loginSubmit() {
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value.trim();
  const { error } = await authModel.signIn(email, password);
  if (error) return showToast(error.message);
  closeModal('loginModal');
  $('loginEmail').value = '';
  $('loginPassword').value = '';
  await refreshAll();
  if (state.profile?.role === 'admin') switchView('adminView', 'Carregando dashboard...');
  showToast('Login concluído com sucesso.');
}

export async function registerSubmit() {
  const name = $('registerName').value.trim();
  const email = $('registerEmail').value.trim();
  const password = $('registerPassword').value;
  if (!name || !email || !password) return showToast('Preenche todos os campos.');
  const { error } = await authModel.signUp(name, email, password);
  if (error) return showToast(error.message);
  closeModal('registerModal');
  $('registerName').value = '';
  $('registerEmail').value = '';
  $('registerPassword').value = '';
  showToast('Conta criada. Se confirmação de e-mail estiver ativa no Supabase, confirma teu e-mail antes de entrar.');
}
export async function logout() {
  try {
    state.isLoggingOut = true;
    showLoader('Encerrando sessão...', 0);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout no logout')), 4000)
    );

    const signOutPromise = authModel.signOut();
    const result = await Promise.race([signOutPromise, timeout]);

    if (result?.error) {
      console.error(result.error);
    }

    resetUserState();
    state.isLoggingOut = true;

    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    hidePurchaseSuccess();

    hideLoader();
    window.location.reload();

  } catch (err) {
    console.error(err);

    resetUserState();
    state.isLoggingOut = true;
    hidePurchaseSuccess();
    hideLoader();

    window.location.reload();
  }
}