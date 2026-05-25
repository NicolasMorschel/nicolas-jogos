import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { AuthState, Profile, ViewId } from '../../types';
import * as api from '../../services';

type LoginForm = { email: string; password: string };
type RegisterForm = { name: string; email: string; password: string };

export function useAuthActions({
  loginForm,
  registerForm,
  setLoginOpen,
  setLoginForm,
  setRegisterOpen,
  setRegisterForm,
  setLoading,
  setLoaderText,
  setAuth,
  clearSessionData,
  refreshAll,
  switchView,
  showToast
}: {
  loginForm: LoginForm;
  registerForm: RegisterForm;
  setLoginOpen: Dispatch<SetStateAction<boolean>>;
  setLoginForm: Dispatch<SetStateAction<LoginForm>>;
  setRegisterOpen: Dispatch<SetStateAction<boolean>>;
  setRegisterForm: Dispatch<SetStateAction<RegisterForm>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setLoaderText: Dispatch<SetStateAction<string>>;
  setAuth: Dispatch<SetStateAction<AuthState>>;
  clearSessionData: () => void;
  refreshAll: () => Promise<Profile | null>;
  switchView: (view: ViewId) => void;
  showToast: (message: string) => void;
}) {
  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    const { error } = await api.signIn(loginForm.email.trim(), loginForm.password);
    if (error) return showToast(error.message);
    setLoginOpen(false);
    setLoginForm({ email: '', password: '' });
    const profile = await refreshAll();
    if (profile?.role === 'admin') switchView('adminView');
    showToast('Login concluído com sucesso.');
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) return showToast('Preenche todos os campos.');
    const { error } = await api.signUp(registerForm.name.trim(), registerForm.email.trim(), registerForm.password);
    if (error) return showToast(error.message);
    setRegisterOpen(false);
    setRegisterForm({ name: '', email: '', password: '' });
    showToast('Conta criada. Se confirmação de e-mail estiver ativa, confirma teu e-mail antes de entrar.');
  }

  async function handleLogout() {
    setLoading(true);
    setLoaderText('Encerrando sessão...');
    const timeout = new Promise(resolve => window.setTimeout(resolve, 5000));
    await Promise.race([api.signOut().catch(console.error), timeout]);
    setAuth({ session: null, user: null, profile: null });
    clearSessionData();
    switchView('storeView');
    setLoading(false);
  }

  return { handleLogin, handleRegister, handleLogout };
}
