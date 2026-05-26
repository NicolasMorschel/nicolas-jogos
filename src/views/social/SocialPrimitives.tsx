import type { PublicProfile } from '../../types';

export function ProfileDot({ profile, large = false, speaking = false }: {
  profile?: Pick<PublicProfile, 'name' | 'avatar_url'>;
  large?: boolean;
  speaking?: boolean;
}) {
  const initial = (profile?.name || 'U').slice(0, 1).toUpperCase();
  return (
    <span className={`profile-dot ${large ? 'large' : ''} ${speaking ? 'speaking' : ''}`}>
      {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.name || 'Usuario'} /> : initial}
    </span>
  );
}

export function MicIcon() {
  return <span className="mic-symbol" aria-hidden="true" />;
}

export function HeadphoneIcon() {
  return <span className="headphone-symbol" aria-hidden="true" />;
}

export function GearIcon() {
  return <span className="gear-symbol" aria-hidden="true" />;
}

export function MessageIcon() {
  return <span className="message-symbol" aria-hidden="true" />;
}

