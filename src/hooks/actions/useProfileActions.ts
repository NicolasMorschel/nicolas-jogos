import type { Dispatch, SetStateAction } from 'react';
import type { AuthState, PasswordForm, Profile, ProfileForm, ReportForm } from '../../types';
import * as api from '../../services';

export function useProfileActions({
  auth,
  profileForm,
  setProfileForm,
  passwordForm,
  setPasswordForm,
  reportForm,
  setReportForm,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  profileForm: ProfileForm;
  setProfileForm: Dispatch<SetStateAction<ProfileForm>>;
  passwordForm: PasswordForm;
  setPasswordForm: Dispatch<SetStateAction<PasswordForm>>;
  reportForm: ReportForm;
  setReportForm: Dispatch<SetStateAction<ReportForm>>;
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  async function saveProfile() {
    if (!auth.user) return showToast('Faz login para editar teu perfil.');
    const { error } = await api.updateOwnProfile(profileForm.name, profileForm.bio, profileForm.avatarUrl, profileForm.bannerUrl);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Perfil atualizado.');
  }

  async function uploadProfileMedia(kind: 'avatar' | 'banner', file: File) {
    if (!auth.user) return showToast('Faz login para enviar imagem.');
    const uploadRes = await api.uploadProfileMedia(auth.user.id, file, kind);
    if (uploadRes.error || !uploadRes.data) return showToast(uploadRes.error?.message || 'Nao foi possivel enviar a imagem.');

    const nextForm = {
      ...profileForm,
      [kind === 'avatar' ? 'avatarUrl' : 'bannerUrl']: uploadRes.data.url
    };

    setProfileForm(nextForm);
    const { error } = await api.updateOwnProfile(nextForm.name, nextForm.bio, nextForm.avatarUrl, nextForm.bannerUrl);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast(kind === 'avatar' ? 'Foto de perfil atualizada.' : 'Banner atualizado.');
  }

  async function saveEmail() {
    const email = profileForm.email.trim();
    if (!auth.user || !email) return showToast('Informa um e-mail válido.');
    if (email === auth.user.email) return showToast('Esse e-mail já está na conta.');
    const { error } = await api.updateAuthEmail(email);
    if (error) return showToast(error.message);
    showToast('Pedido de troca de e-mail enviado. O Supabase pode pedir confirmação.');
  }

  async function changePassword() {
    if (!passwordForm.password || passwordForm.password.length < 6) return showToast('A senha precisa ter pelo menos 6 caracteres.');
    if (passwordForm.password !== passwordForm.confirmPassword) return showToast('As senhas não batem.');
    const { error } = await api.updateAuthPassword(passwordForm.password);
    if (error) return showToast(error.message);
    setPasswordForm({ password: '', confirmPassword: '' });
    showToast('Senha atualizada.');
  }

  async function submitReport() {
    if (!auth.user) return showToast('Faz login para denunciar.');
    if (!reportForm.reportedUserId) return showToast('Seleciona um usuário.');
    if (!reportForm.reason.trim()) return showToast('Escolhe ou escreve um motivo.');
    const { error } = await api.createUserReport({
      reporter_id: auth.user.id,
      reported_user_id: reportForm.reportedUserId,
      reason: reportForm.reason.trim(),
      details: reportForm.details.trim()
    });
    if (error) return showToast(error.message);
    setReportForm({ reportedUserId: '', reason: '', details: '' });
    await refreshAll();
    showToast('Denúncia enviada para análise.');
  }

  async function playGame(gameId: number) {
    if (!auth.user) return showToast('Faz login para jogar.');
    const { error } = await api.recordGamePlay(auth.user.id, gameId);
    if (error) return showToast(error.message);
    await refreshAll();
    showToast('Jogo iniciado. Tempo de sessão registrado no perfil.');
  }

  return {
    saveProfile,
    uploadProfileMedia,
    saveEmail,
    changePassword,
    submitReport,
    playGame
  };
}
