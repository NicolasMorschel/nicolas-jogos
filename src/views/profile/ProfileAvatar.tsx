export function ProfileAvatar({ profile, small = false }: { profile: { name: string; avatar_url: string }; small?: boolean }) {
  const initial = (profile.name || 'U').trim().slice(0, 1).toUpperCase();

  return (
    <div className={`profile-avatar ${small ? 'small' : ''}`}>
      {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{initial}</span>}
    </div>
  );
}
