import type { PasswordForm, ProfileForm } from '../../types';
import { FormInput, FormTextarea } from '../../components/forms';

export function ProfileEditPanel({
  profileForm,
  setProfileForm,
  passwordForm,
  setPasswordForm,
  email,
  onSaveProfile,
  onUploadProfileMedia,
  onSaveEmail,
  onChangePassword
}: {
  profileForm: ProfileForm;
  setProfileForm: (value: ProfileForm | ((current: ProfileForm) => ProfileForm)) => void;
  passwordForm: PasswordForm;
  setPasswordForm: (value: PasswordForm | ((current: PasswordForm) => PasswordForm)) => void;
  email: string;
  onSaveProfile: () => void;
  onUploadProfileMedia: (kind: 'avatar' | 'banner', file: File) => void;
  onSaveEmail: () => void;
  onChangePassword: () => void;
}) {
  function uploadFromInput(kind: 'avatar' | 'banner', file?: File) {
    if (!file) return;
    onUploadProfileMedia(kind, file);
  }

  return (
    <div className="row g-3">
      <div className="col-12 col-xl-7">
        <section className="card page-panel profile-card">
          <span className="kicker">Aparencia</span>
          <h2>Editar perfil publico</h2>
          <div className="d-grid gap-3">
            <FormInput value={profileForm.name} onChange={event => setProfileForm(current => ({ ...current, name: event.target.value }))} placeholder="Nome publico" />

            <div className="row g-3 align-items-stretch">
              <div className="col-12 col-lg-5">
                <div className="profile-upload-preview avatar-preview">
                  {profileForm.avatarUrl ? <img src={profileForm.avatarUrl} alt="Previa da foto" /> : <span>Foto</span>}
                </div>
              </div>
              <div className="col-12 col-lg-7">
                <label className="form-label">Foto de perfil</label>
                <input className="form-control" type="file" accept="image/*,.gif" onChange={event => uploadFromInput('avatar', event.target.files?.[0])} />
                <small className="form-text">PNG, JPG, WEBP ou GIF direto do computador.</small>
              </div>
            </div>

            <div>
              <label className="form-label">Banner do perfil</label>
              <div className="profile-upload-preview banner-preview mb-2">
                {profileForm.bannerUrl ? <img src={profileForm.bannerUrl} alt="Previa do banner" /> : <span>Banner</span>}
              </div>
              <input className="form-control" type="file" accept="image/*,.gif" onChange={event => uploadFromInput('banner', event.target.files?.[0])} />
              <small className="form-text">Banner estatico ou GIF animado.</small>
            </div>

            <details className="profile-manual-url">
              <summary>Usar URL manual</summary>
              <div className="d-grid gap-2 mt-3">
                <FormInput value={profileForm.avatarUrl} onChange={event => setProfileForm(current => ({ ...current, avatarUrl: event.target.value }))} placeholder="URL da foto de perfil" />
                <FormInput value={profileForm.bannerUrl} onChange={event => setProfileForm(current => ({ ...current, bannerUrl: event.target.value }))} placeholder="URL do banner de fundo" />
              </div>
            </details>

            <FormTextarea value={profileForm.bio} onChange={event => setProfileForm(current => ({ ...current, bio: event.target.value }))} placeholder="Bio" />
            <button className="btn btn-primary" type="button" onClick={onSaveProfile}>Salvar perfil</button>
          </div>
        </section>
      </div>

      <div className="col-12 col-xl-5">
        <section className="card page-panel profile-card">
          <span className="kicker">Seguranca</span>
          <h2>E-mail e senha</h2>
          <div className="d-grid gap-3">
            <FormInput value={profileForm.email} onChange={event => setProfileForm(current => ({ ...current, email: event.target.value }))} placeholder="E-mail" />
            <button className="btn btn-outline-light" type="button" onClick={onSaveEmail}>{profileForm.email === email ? 'E-mail atual' : 'Alterar e-mail'}</button>
            <FormInput type="password" value={passwordForm.password} onChange={event => setPasswordForm(current => ({ ...current, password: event.target.value }))} placeholder="Nova senha" />
            <FormInput type="password" value={passwordForm.confirmPassword} onChange={event => setPasswordForm(current => ({ ...current, confirmPassword: event.target.value }))} placeholder="Confirmar senha" />
            <button className="btn btn-primary" type="button" onClick={onChangePassword}>Alterar senha</button>
          </div>
        </section>
      </div>
    </div>
  );
}
