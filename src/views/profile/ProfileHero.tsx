import type { CSSProperties } from 'react';
import type { Friendship, Profile, PublicProfile } from '../../types';
import { formatPlayTime } from '../../utils';
import { ProfileAvatar } from './ProfileAvatar';
import { publicProfileBanner, relationLabel } from './profileHelpers';

export function ProfileHero({
  profile,
  libraryCount,
  favoriteCount,
  friendCount,
  totalMinutes,
  isOwnProfile,
  relation,
  currentUserId,
  onBackToOwnProfile,
  onRequestFriend,
  onOpenReport
}: {
  profile: Profile | PublicProfile;
  libraryCount: number;
  favoriteCount: number;
  friendCount: number;
  totalMinutes: number;
  isOwnProfile: boolean;
  relation?: Friendship;
  currentUserId: string;
  onBackToOwnProfile: () => void;
  onRequestFriend: () => void;
  onOpenReport: () => void;
}) {
  const friendButtonLabel = relationLabel(relation, currentUserId);
  const friendActionDisabled = relation?.status === 'accepted' || relation?.status === 'pending';

  return (
    <section className="profile-steam-hero" style={{ '--profile-banner': publicProfileBanner(profile) } as CSSProperties}>
      <div className="profile-hero-shade">
        <ProfileAvatar profile={profile} />
        <div className="profile-hero-copy">
          <span className="kicker">Perfil</span>
          <h1>{profile.name || 'Usuario'}</h1>
          <p>{profile.bio || 'Sem bio ainda. Use Editar perfil para deixar essa area com a sua cara.'}</p>
          <div className="profile-steam-stats">
            <StatPill label="Jogos" value={libraryCount} />
            <StatPill label="Favoritos" value={favoriteCount} />
            <StatPill label="Amigos" value={friendCount} />
            <StatPill label="Tempo jogado" value={formatPlayTime(totalMinutes)} />
          </div>
          {!isOwnProfile && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button className="btn btn-primary" type="button" disabled={friendActionDisabled} onClick={onRequestFriend}>{friendButtonLabel}</button>
              <button className="btn btn-outline-light" type="button" onClick={onBackToOwnProfile}>Meu perfil</button>
              <button className="btn btn-outline-light danger-btn" type="button" onClick={onOpenReport}>Denunciar jogador</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatPill({ label, value }: { label: string | number; value: string | number }) {
  return (
    <span>
      <strong>{value}</strong>
      {label}
    </span>
  );
}
