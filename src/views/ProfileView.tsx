import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Friendship,
  Game,
  GamePlayStats,
  GameRestriction,
  PasswordForm,
  Profile,
  ProfileComment,
  ProfileForm,
  ProfileTab,
  PublicProfile,
  ReportForm,
  UserReport
} from '../types';
import * as api from '../services';
import { ProfileEditPanel } from './profile/ProfileEditPanel';
import { ProfileHero } from './profile/ProfileHero';
import {
  ProfileCollectionPanel,
  ProfileCommentsPanel,
  ProfileFriendsPanel,
  ProfileOverviewPanel,
  ProfileRestrictionsPanel
} from './profile/ProfilePanels';
import { relationFor } from './profile/profileHelpers';

const PROFILE_TAB_STORAGE_KEY = 'nicolas-jogos-profile-tab';
const profileTabs: ProfileTab[] = ['overview', 'library', 'favorites', 'friends', 'restrictions', 'edit'];

function safeStoredProfileTab(): ProfileTab {
  const saved = localStorage.getItem(PROFILE_TAB_STORAGE_KEY) as ProfileTab | null;
  return saved && profileTabs.includes(saved) ? saved : 'overview';
}

type ProfileViewProps = {
  profile: Profile | null;
  viewedProfileId: string;
  email: string;
  games: Game[];
  profileForm: ProfileForm;
  setProfileForm: (value: ProfileForm | ((current: ProfileForm) => ProfileForm)) => void;
  passwordForm: PasswordForm;
  setPasswordForm: (value: PasswordForm | ((current: PasswordForm) => PasswordForm)) => void;
  reportForm: ReportForm;
  setReportForm: (value: ReportForm | ((current: ReportForm) => ReportForm)) => void;
  socialProfiles: PublicProfile[];
  friendships: Friendship[];
  userReports: UserReport[];
  playStats: GamePlayStats[];
  gameRestrictions: GameRestriction[];
  favoriteGames: Game[];
  libraryGames: Game[];
  onOpenGame: (gameId: number) => void;
  onOpenProfile: (profileId: string) => void;
  onOpenOwnProfile: () => void;
  onSaveProfile: () => void;
  onUploadProfileMedia: (kind: 'avatar' | 'banner', file: File) => void;
  onSaveEmail: () => void;
  onChangePassword: () => void;
  onRequestFriend: (targetId: string) => void;
};

export function ProfileView({
  profile,
  viewedProfileId,
  email,
  games,
  profileForm,
  setProfileForm,
  passwordForm,
  setPasswordForm,
  reportForm,
  setReportForm,
  socialProfiles,
  friendships,
  userReports: _userReports,
  playStats,
  gameRestrictions,
  favoriteGames,
  libraryGames,
  onOpenGame,
  onOpenProfile,
  onOpenOwnProfile,
  onSaveProfile,
  onUploadProfileMedia,
  onSaveEmail,
  onChangePassword,
  onRequestFriend
}: ProfileViewProps) {
  const [activeTab, setActiveTabState] = useState<ProfileTab>(safeStoredProfileTab);
  const [commentText, setCommentText] = useState('');
  const [profileComments, setProfileComments] = useState<ProfileComment[]>([]);
  const [publicLibraryGames, setPublicLibraryGames] = useState<Game[]>([]);
  const [publicFavoriteGames, setPublicFavoriteGames] = useState<Game[]>([]);
  const [publicPlayStats, setPublicPlayStats] = useState<GamePlayStats[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const lastDisplayedProfileId = useRef('');

  const profileById = useMemo(() => new Map(socialProfiles.map(user => [user.id, user])), [socialProfiles]);
  const gamesById = useMemo(() => new Map(games.map(game => [Number(game.id), game])), [games]);
  const ownProfileId = profile?.id || '';
  const isOwnProfile = !viewedProfileId || viewedProfileId === ownProfileId;
  const displayedProfile = isOwnProfile ? profile : profileById.get(viewedProfileId);
  const displayedProfileId = displayedProfile?.id || '';
  const displayedPlayStats = isOwnProfile ? playStats : publicPlayStats;
  const displayedStatsByGame = useMemo(() => new Map(displayedPlayStats.map(stats => [Number(stats.game_id), stats])), [displayedPlayStats]);
  const displayedLibraryGames = isOwnProfile ? libraryGames : publicLibraryGames;
  const displayedFavoriteGames = isOwnProfile ? favoriteGames : publicFavoriteGames;
  const displayedFriends = displayedProfileId ? friendsFor(displayedProfileId) : [];
  const totalMinutes = displayedPlayStats.reduce((sum, stats) => sum + Number(stats.minutes_played || 0), 0);
  const displayedPlayedGames = [...displayedLibraryGames]
    .map(game => ({ game, stats: displayedStatsByGame.get(game.id) }))
    .sort((a, b) => {
      const aLast = a.stats?.last_played_at ? Date.parse(a.stats.last_played_at) : 0;
      const bLast = b.stats?.last_played_at ? Date.parse(b.stats.last_played_at) : 0;
      return bLast - aLast || Number(b.stats?.minutes_played || 0) - Number(a.stats?.minutes_played || 0);
    });
  const relation = displayedProfileId && !isOwnProfile ? relationFor(ownProfileId, displayedProfileId, friendships) : undefined;

  function setActiveTab(tab: ProfileTab) {
    const safeTab = !isOwnProfile && (tab === 'edit' || tab === 'restrictions') ? 'overview' : tab;
    setActiveTabState(safeTab);
    localStorage.setItem(PROFILE_TAB_STORAGE_KEY, safeTab);
  }

  function friendsFor(userId: string) {
    const ids = friendships
      .filter(friendship => friendship.status === 'accepted' && (friendship.requester_id === userId || friendship.addressee_id === userId))
      .map(friendship => friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id);
    return ids.map(id => profileById.get(id)).filter(Boolean) as PublicProfile[];
  }

  useEffect(() => {
    if (!displayedProfileId || lastDisplayedProfileId.current === displayedProfileId) return;
    lastDisplayedProfileId.current = displayedProfileId;
    setActiveTabState('overview');
    localStorage.setItem(PROFILE_TAB_STORAGE_KEY, 'overview');
  }, [displayedProfileId]);

  useEffect(() => {
    if (!displayedProfileId) return;
    let cancelled = false;

    async function loadProfileExtras() {
      const commentsRes = await api.fetchProfileComments(displayedProfileId);
      if (!cancelled && !commentsRes.error) setProfileComments(commentsRes.data || []);

      if (!isOwnProfile) {
        const collectionRes = await api.fetchPublicProfileCollections(displayedProfileId);
        if (!cancelled && !collectionRes.error) {
          const data = collectionRes.data;
          setPublicLibraryGames(data.libraryIds.map(id => gamesById.get(id)).filter(Boolean) as Game[]);
          setPublicFavoriteGames(data.favoriteIds.map(id => gamesById.get(id)).filter(Boolean) as Game[]);
          setPublicPlayStats(data.playStats);
        }
      }
    }

    setCommentText('');
    setReportOpen(false);
    if (!isOwnProfile && (activeTab === 'edit' || activeTab === 'restrictions')) setActiveTab('overview');
    void loadProfileExtras();

    return () => {
      cancelled = true;
    };
  }, [activeTab, displayedProfileId, gamesById, isOwnProfile]);

  async function submitProfileComment() {
    if (!profile || !displayedProfileId) return;
    const body = commentText.trim();
    if (!body) return;
    const { error } = await api.createProfileComment(displayedProfileId, profile.id, body);
    if (error) return;
    setCommentText('');
    const commentsRes = await api.fetchProfileComments(displayedProfileId);
    if (!commentsRes.error) setProfileComments(commentsRes.data || []);
  }

  async function deleteProfileComment(commentId: number) {
    const { error } = await api.deleteProfileComment(commentId);
    if (error) return;
    setProfileComments(current => current.filter(comment => comment.id !== commentId));
  }

  function openReportForm() {
    if (!displayedProfileId) return;
    setReportForm(current => ({ ...current, reportedUserId: displayedProfileId }));
    setReportOpen(value => !value);
  }

  async function submitViewedProfileReport() {
    if (!profile || !displayedProfileId) return;
    const reason = reportForm.reason.trim();
    if (!reason) return;
    const { error } = await api.createUserReport({
      reporter_id: profile.id,
      reported_user_id: displayedProfileId,
      reason,
      details: reportForm.details.trim()
    });
    if (error) return;
    setReportForm({ reportedUserId: '', reason: '', details: '' });
    setReportOpen(false);
  }

  if (!profile) {
    return (
      <section className="view active">
        <div className="container-xxl page-shell">
          <div className="card page-panel">Faz login para abrir teu perfil.</div>
        </div>
      </section>
    );
  }

  if (!displayedProfile) {
    return (
      <section className="view active">
        <div className="container-xxl page-shell">
          <div className="card page-panel">
            <h2>Perfil nao encontrado</h2>
            <button className="btn btn-primary" type="button" onClick={onOpenOwnProfile}>Voltar ao meu perfil</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="view active">
      <div className="container-xxl page-shell">
        <ProfileHero
          profile={displayedProfile}
          libraryCount={displayedLibraryGames.length}
          favoriteCount={displayedFavoriteGames.length}
          friendCount={displayedFriends.length}
          totalMinutes={totalMinutes}
          isOwnProfile={isOwnProfile}
          relation={relation}
          currentUserId={ownProfileId}
          onBackToOwnProfile={onOpenOwnProfile}
          onRequestFriend={() => displayedProfileId && onRequestFriend(displayedProfileId)}
          onOpenReport={openReportForm}
        />

        {!isOwnProfile && reportOpen && (
          <section className="card page-panel profile-card">
            <span className="kicker">Denuncia</span>
            <h2>Denunciar {displayedProfile.name || 'usuario'}</h2>
            <div className="row g-2">
              <div className="col-12 col-md-5">
                <input className="form-control input" value={reportForm.reason} onChange={event => setReportForm(current => ({ ...current, reason: event.target.value, reportedUserId: displayedProfileId }))} placeholder="Motivo" />
              </div>
              <div className="col-12 col-md-5">
                <input className="form-control input" value={reportForm.details} onChange={event => setReportForm(current => ({ ...current, details: event.target.value, reportedUserId: displayedProfileId }))} placeholder="Detalhes" />
              </div>
              <div className="col-12 col-md-2">
                <button className="btn btn-primary w-100" type="button" onClick={submitViewedProfileReport}>Enviar</button>
              </div>
            </div>
          </section>
        )}

        <div className="profile-tabs nav nav-pills">
          <ProfileTabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Visao geral</ProfileTabButton>
          <ProfileTabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')}>Biblioteca</ProfileTabButton>
          <ProfileTabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')}>Favoritos</ProfileTabButton>
          <ProfileTabButton active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>Amigos</ProfileTabButton>
          {isOwnProfile && <ProfileTabButton active={activeTab === 'restrictions'} onClick={() => setActiveTab('restrictions')}>Restricoes</ProfileTabButton>}
          {isOwnProfile && <ProfileTabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')}>Editar perfil</ProfileTabButton>}
        </div>

        {activeTab === 'overview' && (
          <>
            <ProfileOverviewPanel
              playedGames={displayedPlayedGames}
              totalMinutes={totalMinutes}
              onOpenGame={onOpenGame}
            />
            <ProfileCommentsPanel
              comments={profileComments}
              commentText={commentText}
              profileById={profileById}
              currentUserId={profile.id}
              onCommentTextChange={setCommentText}
              onSubmit={submitProfileComment}
              onDelete={deleteProfileComment}
            />
          </>
        )}

        {activeTab === 'library' && (
          <ProfileCollectionPanel title="Biblioteca" subtitle="Todos os jogos que este perfil tem na conta." games={displayedLibraryGames} onOpenGame={onOpenGame} />
        )}

        {activeTab === 'favorites' && (
          <ProfileCollectionPanel title="Favoritos" subtitle="Jogos marcados como favoritos por este perfil." games={displayedFavoriteGames} onOpenGame={onOpenGame} />
        )}

        {activeTab === 'friends' && (
          <ProfileFriendsPanel friends={displayedFriends} onOpenProfile={onOpenProfile} />
        )}

        {activeTab === 'restrictions' && isOwnProfile && (
          <ProfileRestrictionsPanel restrictions={gameRestrictions} gamesById={gamesById} />
        )}

        {activeTab === 'edit' && isOwnProfile && (
          <ProfileEditPanel
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            email={email}
            onSaveProfile={onSaveProfile}
            onUploadProfileMedia={onUploadProfileMedia}
            onSaveEmail={onSaveEmail}
            onChangePassword={onChangePassword}
          />
        )}
      </div>
    </section>
  );
}

function ProfileTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`btn nav-btn ${active ? 'active' : ''}`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}
