import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import type {
  ChatGroup,
  ChatGroupMember,
  ChatMessage,
  CommunityChannel,
  CommunityChannelType,
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  CommunityVoicePresence,
  Friendship,
  Game,
  GamePlayStats,
  PasswordForm,
  Profile,
  ProfileForm,
  ProfileTab,
  PublicProfile,
  ReportForm,
  SocialTarget,
  UserReport
} from '../types';
import { FormInput, FormSelect, FormTextarea } from '../components/forms';
import { coverStyle, formatPlayTime, formatShortDate, genreLabel } from '../utils';

type ChatTarget =
  | { type: 'direct'; id: string }
  | { type: 'group'; id: number }
  | { type: 'server_channel'; id: number };

const PROFILE_TAB_STORAGE_KEY = 'nicolas-jogos-profile-tab';
const profileTabs: ProfileTab[] = ['overview', 'edit', 'reports'];

function safeStoredProfileTab(): ProfileTab {
  const saved = localStorage.getItem(PROFILE_TAB_STORAGE_KEY) as ProfileTab | null;
  return saved && profileTabs.includes(saved) ? saved : 'overview';
}

type ProfileViewProps = {
  profile: Profile | null;
  email: string;
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
  chatMessages: ChatMessage[];
  chatGroups: ChatGroup[];
  chatGroupMembers: ChatGroupMember[];
  communityServers: CommunityServer[];
  communityServerMembers: CommunityServerMember[];
  communityRoles: CommunityRole[];
  communityMemberRoles: CommunityMemberRole[];
  communityChannels: CommunityChannel[];
  communityVoicePresence: CommunityVoicePresence[];
  favoriteGames: Game[];
  libraryGames: Game[];
  onOpenGame: (gameId: number) => void;
  onSaveProfile: () => void;
  onSaveEmail: () => void;
  onChangePassword: () => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
  onSubmitReport: () => void;
  onSendChatMessage: (target: SocialTarget, body: string, file?: File | null) => Promise<void> | void;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void> | void;
  onCreateServer: (name: string, description: string) => Promise<void> | void;
  onAddServerMember: (serverId: number, userId: string) => Promise<void> | void;
  onCreateChannel: (serverId: number, name: string, type: CommunityChannelType) => Promise<void> | void;
  onCreateRole: (serverId: number, name: string, color: string) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  onJoinVoice: (channelId: number) => Promise<void> | void;
  onLeaveVoice: (channelId: number) => Promise<void> | void;
};

export function ProfileView({
  profile,
  email,
  profileForm,
  setProfileForm,
  passwordForm,
  setPasswordForm,
  reportForm,
  setReportForm,
  socialProfiles,
  friendships,
  userReports,
  playStats,
  chatMessages,
  chatGroups,
  chatGroupMembers,
  communityServers,
  communityServerMembers,
  communityRoles,
  communityMemberRoles,
  communityChannels,
  communityVoicePresence,
  favoriteGames,
  libraryGames,
  onOpenGame,
  onSaveProfile,
  onSaveEmail,
  onChangePassword,
  onRequestFriend,
  onUpdateFriendship,
  onSubmitReport,
  onSendChatMessage,
  onCreateGroup,
  onCreateServer,
  onAddServerMember,
  onCreateChannel,
  onCreateRole,
  onAssignRole,
  onJoinVoice,
  onLeaveVoice
}: ProfileViewProps) {
  const [activeTab, setActiveTabState] = useState<ProfileTab>(safeStoredProfileTab);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const profileById = useMemo(() => new Map(socialProfiles.map(user => [user.id, user])), [socialProfiles]);
  const playStatsByGame = useMemo(() => new Map(playStats.map(stats => [Number(stats.game_id), stats])), [playStats]);
  const profileId = profile?.id || '';

  const friends = profile ? friendships.filter(friendship => friendship.status === 'accepted') : [];
  const incoming = profile ? friendships.filter(friendship => friendship.status === 'pending' && friendship.addressee_id === profileId) : [];
  const outgoing = profile ? friendships.filter(friendship => friendship.status === 'pending' && friendship.requester_id === profileId) : [];
  const friendIds = friends.map(friendship => friendship.requester_id === profileId ? friendship.addressee_id : friendship.requester_id);
  const friendProfiles = friendIds.map(id => profileById.get(id)).filter(Boolean) as PublicProfile[];
  const otherProfiles = socialProfiles.filter(user => user.id !== profileId);
  const totalMinutes = playStats.reduce((sum, stats) => sum + Number(stats.minutes_played || 0), 0);
  const playedGames = [...libraryGames]
    .map(game => ({ game, stats: playStatsByGame.get(game.id) }))
    .sort((a, b) => Number(b.stats?.minutes_played || 0) - Number(a.stats?.minutes_played || 0) || a.game.title.localeCompare(b.game.title, 'pt-BR'));
  const selectedPublicProfile = selectedProfileId ? profileById.get(selectedProfileId) : undefined;

  function setActiveTab(tab: ProfileTab) {
    setActiveTabState(tab);
    localStorage.setItem(PROFILE_TAB_STORAGE_KEY, tab);
  }

  if (!profile) {
    return (
      <section className="view active">
        <div className="container-xxl page-shell">
          <div className="page-panel">Faz login para abrir teu perfil.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="view active">
      <div className="container-xxl page-shell">
        <ProfileHero
          profile={profile}
          libraryCount={libraryGames.length}
          favoriteCount={favoriteGames.length}
          friendCount={friends.length}
          totalMinutes={totalMinutes}
        />

        <div className="profile-tabs nav nav-pills">
          <ProfileTabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Visão geral</ProfileTabButton>
          <ProfileTabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')}>Editar perfil</ProfileTabButton>
          <ProfileTabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Denúncias</ProfileTabButton>
        </div>

        {activeTab === 'overview' && (
          <OverviewPanel
            playedGames={playedGames}
            favoriteGames={favoriteGames}
            libraryGames={libraryGames}
            friendProfiles={friendProfiles}
            totalMinutes={totalMinutes}
            onOpenGame={onOpenGame}
            onOpenProfile={setSelectedProfileId}
          />
        )}

        {activeTab === 'edit' && (
          <EditProfilePanel
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            email={email}
            onSaveProfile={onSaveProfile}
            onSaveEmail={onSaveEmail}
            onChangePassword={onChangePassword}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsPanel
            reportForm={reportForm}
            setReportForm={setReportForm}
            otherProfiles={otherProfiles}
            userReports={userReports}
            profileById={profileById}
            onOpenProfile={setSelectedProfileId}
            onSubmitReport={onSubmitReport}
          />
        )}

        {selectedPublicProfile && (
          <PublicProfilePreview
            profile={selectedPublicProfile}
            relation={relationFor(profile.id, selectedPublicProfile.id, friendships)}
            currentUserId={profile.id}
            onClose={() => setSelectedProfileId('')}
            onRequestFriend={onRequestFriend}
          />
        )}
      </div>
    </section>
  );
}

function ProfileHero({ profile, libraryCount, favoriteCount, friendCount, totalMinutes }: {
  profile: Profile;
  libraryCount: number;
  favoriteCount: number;
  friendCount: number;
  totalMinutes: number;
}) {
  return (
    <section className="profile-steam-hero" style={{ '--profile-banner': profileBanner(profile) } as CSSProperties}>
      <div className="profile-hero-shade">
        <Avatar profile={profile} />
        <div className="profile-hero-copy">
          <span className="kicker">Perfil</span>
          <h1>{profile.name || 'Usuário'}</h1>
          <p>{profile.bio || 'Sem bio ainda. Usa Editar perfil para deixar essa área com tua cara.'}</p>
          <div className="profile-steam-stats">
            <StatPill label="Jogos" value={libraryCount} />
            <StatPill label="Favoritos" value={favoriteCount} />
            <StatPill label="Amigos" value={friendCount} />
            <StatPill label="Tempo jogado" value={formatPlayTime(totalMinutes)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewPanel({ playedGames, favoriteGames, libraryGames, friendProfiles, totalMinutes, onOpenGame, onOpenProfile }: {
  playedGames: Array<{ game: Game; stats?: GamePlayStats }>;
  favoriteGames: Game[];
  libraryGames: Game[];
  friendProfiles: PublicProfile[];
  totalMinutes: number;
  onOpenGame: (gameId: number) => void;
  onOpenProfile: (profileId: string) => void;
}) {
  const topGame = playedGames[0];

  return (
    <div className="profile-steam-layout">
      <section className="page-panel profile-showcase">
        <span className="kicker">Jogos jogados</span>
        <h2>{topGame ? topGame.game.title : 'Nada jogado ainda'}</h2>
        <p>{topGame ? `Seu jogo mais recente/mais jogado aparece aqui. Total geral: ${formatPlayTime(totalMinutes)}.` : 'Quando você clicar em Jogar na biblioteca, o perfil registra tempo e sessões.'}</p>
        <div className="played-games-list">
          {playedGames.slice(0, 8).map(({ game, stats }) => (
            <button className="played-game-row clickable-row" key={game.id} type="button" onClick={() => onOpenGame(game.id)}>
              <div className="played-game-cover" style={{ '--cover': coverStyle(game.franchise) } as CSSProperties} />
              <div>
                <strong>{game.title}</strong>
                <span>{genreLabel(game.genre)} • {formatShortDate(stats?.last_played_at)}</span>
              </div>
              <b>{formatPlayTime(stats?.minutes_played || 0)}</b>
            </button>
          ))}
          {!playedGames.length && <div className="admin-empty-state">Sua biblioteca ainda está vazia.</div>}
        </div>
      </section>

      <aside className="profile-side-stack">
        <FriendStrip friends={friendProfiles} onOpenProfile={onOpenProfile} />
        <GameStrip title="Favoritos" games={favoriteGames} empty="Nenhum favorito marcado." onOpenGame={onOpenGame} />
        <GameStrip title="Biblioteca" games={libraryGames} empty="Nenhum jogo na biblioteca." onOpenGame={onOpenGame} />
      </aside>
    </div>
  );
}

function EditProfilePanel({
  profileForm,
  setProfileForm,
  passwordForm,
  setPasswordForm,
  email,
  onSaveProfile,
  onSaveEmail,
  onChangePassword
}: {
  profileForm: ProfileForm;
  setProfileForm: (value: ProfileForm | ((current: ProfileForm) => ProfileForm)) => void;
  passwordForm: PasswordForm;
  setPasswordForm: (value: PasswordForm | ((current: PasswordForm) => PasswordForm)) => void;
  email: string;
  onSaveProfile: () => void;
  onSaveEmail: () => void;
  onChangePassword: () => void;
}) {
  return (
    <div className="row g-3">
      <div className="col-12 col-xl-7">
        <section className="page-panel profile-card">
          <span className="kicker">Aparência</span>
          <h2>Editar perfil público</h2>
          <div className="form-grid">
            <FormInput value={profileForm.name} onChange={event => setProfileForm(current => ({ ...current, name: event.target.value }))} placeholder="Nome público" />
            <FormInput value={profileForm.avatarUrl} onChange={event => setProfileForm(current => ({ ...current, avatarUrl: event.target.value }))} placeholder="URL da foto de perfil" />
            <FormInput value={profileForm.bannerUrl} onChange={event => setProfileForm(current => ({ ...current, bannerUrl: event.target.value }))} placeholder="URL do banner de fundo" />
            <FormTextarea value={profileForm.bio} onChange={event => setProfileForm(current => ({ ...current, bio: event.target.value }))} placeholder="Bio" />
            <button className="btn primary-btn" type="button" onClick={onSaveProfile}>Salvar perfil</button>
          </div>
        </section>
      </div>

      <div className="col-12 col-xl-5">
        <section className="page-panel profile-card">
          <span className="kicker">Segurança</span>
          <h2>E-mail e senha</h2>
          <div className="form-grid">
            <FormInput value={profileForm.email} onChange={event => setProfileForm(current => ({ ...current, email: event.target.value }))} placeholder="E-mail" />
            <button className="btn ghost-btn" type="button" onClick={onSaveEmail}>{profileForm.email === email ? 'E-mail atual' : 'Alterar e-mail'}</button>
            <FormInput type="password" value={passwordForm.password} onChange={event => setPasswordForm(current => ({ ...current, password: event.target.value }))} placeholder="Nova senha" />
            <FormInput type="password" value={passwordForm.confirmPassword} onChange={event => setPasswordForm(current => ({ ...current, confirmPassword: event.target.value }))} placeholder="Confirmar senha" />
            <button className="btn primary-btn" type="button" onClick={onChangePassword}>Alterar senha</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SocialHub({
  profile,
  friends,
  friendProfiles,
  incoming,
  outgoing,
  otherProfiles,
  profileById,
  friendships,
  chatMessages,
  chatGroups,
  chatGroupMembers,
  communityServers,
  communityServerMembers,
  communityRoles,
  communityMemberRoles,
  communityChannels,
  communityVoicePresence,
  selectedPublicProfile,
  onOpenProfile,
  onRequestFriend,
  onUpdateFriendship,
  onSendChatMessage,
  onCreateGroup,
  onCreateServer,
  onAddServerMember,
  onCreateChannel,
  onCreateRole,
  onAssignRole,
  onJoinVoice,
  onLeaveVoice
}: {
  profile: Profile;
  friends: Friendship[];
  friendProfiles: PublicProfile[];
  incoming: Friendship[];
  outgoing: Friendship[];
  otherProfiles: PublicProfile[];
  profileById: Map<string, PublicProfile>;
  friendships: Friendship[];
  chatMessages: ChatMessage[];
  chatGroups: ChatGroup[];
  chatGroupMembers: ChatGroupMember[];
  communityServers: CommunityServer[];
  communityServerMembers: CommunityServerMember[];
  communityRoles: CommunityRole[];
  communityMemberRoles: CommunityMemberRole[];
  communityChannels: CommunityChannel[];
  communityVoicePresence: CommunityVoicePresence[];
  selectedPublicProfile?: PublicProfile;
  onOpenProfile: (profileId: string) => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
  onSendChatMessage: (target: SocialTarget, body: string, file?: File | null) => Promise<void> | void;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void> | void;
  onCreateServer: (name: string, description: string) => Promise<void> | void;
  onAddServerMember: (serverId: number, userId: string) => Promise<void> | void;
  onCreateChannel: (serverId: number, name: string, type: CommunityChannelType) => Promise<void> | void;
  onCreateRole: (serverId: number, name: string, color: string) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  onJoinVoice: (channelId: number) => Promise<void> | void;
  onLeaveVoice: (channelId: number) => Promise<void> | void;
}) {
  const firstFriendId = friendProfiles[0]?.id || '';
  const firstGroupId = chatGroups[0]?.id || 0;
  const firstServer = communityServers[0];
  const firstTextChannel = firstServer ? communityChannels.find(channel => channel.server_id === firstServer.id && channel.channel_type === 'text') : undefined;
  const [target, setTarget] = useState<ChatTarget>(
    firstFriendId ? { type: 'direct', id: firstFriendId } : firstGroupId ? { type: 'group', id: firstGroupId } : firstTextChannel ? { type: 'server_channel', id: firstTextChannel.id } : { type: 'direct', id: '' }
  );
  const [chatText, setChatText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<CommunityChannelType>('text');
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#7aa2ff');
  const [memberToAdd, setMemberToAdd] = useState('');
  const [roleUserId, setRoleUserId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const selectedServer = target.type === 'server_channel'
    ? communityServers.find(server => server.id === communityChannels.find(channel => channel.id === target.id)?.server_id)
    : undefined;
  const serverChannels = selectedServer ? communityChannels.filter(channel => channel.server_id === selectedServer.id).sort((a, b) => a.position - b.position || a.id - b.id) : [];
  const selectedChannel = target.type === 'server_channel' ? communityChannels.find(channel => channel.id === target.id) : undefined;
  const selectedLabel = targetLabel(target, profileById, chatGroups, communityChannels);
  const messages = filterMessages(chatMessages, profile.id, target);
  const serverMembers = selectedServer ? communityServerMembers.filter(member => member.server_id === selectedServer.id) : [];
  const serverRoles = selectedServer ? communityRoles.filter(role => role.server_id === selectedServer.id) : [];
  const voiceChannels = serverChannels.filter(channel => channel.channel_type === 'voice');

  useEffect(() => {
    if (target.type === 'direct' && !target.id && firstFriendId) setTarget({ type: 'direct', id: firstFriendId });
  }, [firstFriendId, target]);

  async function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target.id) return;
    await onSendChatMessage(target, chatText, selectedFile);
    setChatText('');
    setSelectedFile(null);
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreateGroup(groupName, groupMembers);
    setGroupName('');
    setGroupMembers([]);
  }

  async function createServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreateServer(serverName, serverDescription);
    setServerName('');
    setServerDescription('');
  }

  async function createChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedServer) return;
    await onCreateChannel(selectedServer.id, channelName, channelType);
    setChannelName('');
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedServer) return;
    await onCreateRole(selectedServer.id, roleName, roleColor);
    setRoleName('');
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(file);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.warn('Não foi possível iniciar a gravação de áudio.', error);
      setIsRecording(false);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  const addableFriends = selectedServer
    ? friendProfiles.filter(friend => !serverMembers.some(member => member.user_id === friend.id))
    : [];

  return (
    <div className="social-command-center">
      <aside className="social-rail page-panel">
        <SocialSection title="Amigos">
          {friendProfiles.map(friend => (
            <button className={`social-target ${target.type === 'direct' && target.id === friend.id ? 'active' : ''}`} key={friend.id} type="button" onClick={() => setTarget({ type: 'direct', id: friend.id })}>
              <Avatar profile={friend} small />
              <span>{friend.name || 'Usuário'}</span>
            </button>
          ))}
          {!friendProfiles.length && <div className="admin-empty-state">Adiciona amigos para usar DM.</div>}
        </SocialSection>

        <SocialSection title="Grupos">
          {chatGroups.map(group => (
            <button className={`social-target ${target.type === 'group' && target.id === group.id ? 'active' : ''}`} key={group.id} type="button" onClick={() => setTarget({ type: 'group', id: group.id })}>
              <span className="social-target-icon">#</span>
              <span>{group.name}</span>
            </button>
          ))}
          <form className="mini-create-form" onSubmit={createGroup}>
            <input value={groupName} onChange={event => setGroupName(event.target.value)} placeholder="Novo grupo" />
            <div className="mini-check-grid">
              {friendProfiles.slice(0, 6).map(friend => (
                <label key={friend.id}>
                  <input checked={groupMembers.includes(friend.id)} onChange={event => {
                    setGroupMembers(current => event.target.checked ? [...current, friend.id] : current.filter(id => id !== friend.id));
                  }} type="checkbox" />
                  {friend.name}
                </label>
              ))}
            </div>
            <button className="btn ghost-btn" type="submit">Criar grupo</button>
          </form>
        </SocialSection>

        <SocialSection title="Comunidades">
          {communityServers.map(server => {
            const firstChannel = communityChannels.find(channel => channel.server_id === server.id && channel.channel_type === 'text')
              || communityChannels.find(channel => channel.server_id === server.id);
            return (
              <button className={`social-target ${selectedServer?.id === server.id ? 'active' : ''}`} key={server.id} type="button" onClick={() => firstChannel && setTarget({ type: 'server_channel', id: firstChannel.id })}>
                <span className="social-target-icon">{server.name.slice(0, 1).toUpperCase()}</span>
                <span>{server.name}</span>
              </button>
            );
          })}
          <form className="mini-create-form" onSubmit={createServer}>
            <input value={serverName} onChange={event => setServerName(event.target.value)} placeholder="Nova comunidade" />
            <input value={serverDescription} onChange={event => setServerDescription(event.target.value)} placeholder="Descrição curta" />
            <button className="btn ghost-btn" type="submit">Criar comunidade</button>
          </form>
        </SocialSection>
      </aside>

      <section className="social-chat page-panel">
        <header className="social-chat-header">
          <div>
            <span>{target.type === 'direct' ? 'Mensagem direta' : target.type === 'group' ? 'Grupo' : selectedChannel?.channel_type === 'voice' ? 'Canal de voz' : 'Canal de texto'}</span>
            <strong>{selectedLabel || 'Escolhe uma conversa'}</strong>
          </div>
          {target.type === 'direct' && target.id && (
            <button className="btn ghost-btn" type="button" onClick={() => onOpenProfile(target.id)}>Ver perfil</button>
          )}
        </header>

        {selectedServer && (
          <div className="channel-strip">
            {serverChannels.map(channel => (
              <button className={`channel-chip ${target.type === 'server_channel' && target.id === channel.id ? 'active' : ''}`} key={channel.id} type="button" onClick={() => setTarget({ type: 'server_channel', id: channel.id })}>
                {channel.channel_type === 'voice' ? 'Voz' : '#'} {channel.name}
              </button>
            ))}
          </div>
        )}

        {selectedChannel?.channel_type === 'voice' && (
          <VoiceRoom
            channel={selectedChannel}
            profile={profile}
            profileById={profileById}
            presences={communityVoicePresence.filter(presence => presence.channel_id === selectedChannel.id)}
            onJoin={onJoinVoice}
            onLeave={onLeaveVoice}
          />
        )}

        <div className="social-chat-messages">
          {messages.map(message => (
            <ChatBubble key={message.id} message={message} mine={message.sender_id === profile.id} sender={profileById.get(message.sender_id)} />
          ))}
          {!messages.length && <div className="admin-empty-state">Sem mensagens ainda. Começa a conversa.</div>}
        </div>

        <form className="social-chat-compose" onSubmit={submitChat}>
          <input value={chatText} onChange={event => setChatText(event.target.value)} placeholder={target.id ? 'Mensagem, ideia ou call...' : 'Escolhe uma conversa'} disabled={!target.id} />
          <label className="btn ghost-btn media-picker">
            Mídia
            <input accept="image/*,video/*,audio/*" type="file" onChange={event => setSelectedFile(event.target.files?.[0] || null)} />
          </label>
          <button className={`btn ghost-btn ${isRecording ? 'danger-btn' : ''}`} type="button" onClick={isRecording ? stopRecording : startRecording}>
            {isRecording ? 'Parar' : 'Áudio'}
          </button>
          <button className="btn primary-btn" type="submit" disabled={!target.id}>Enviar</button>
          {selectedFile && (
            <div className="selected-file-pill">
              {selectedFile.name}
              <button type="button" onClick={() => setSelectedFile(null)}>×</button>
            </div>
          )}
        </form>
      </section>

      <aside className="social-details page-panel">
        {selectedServer ? (
          <ServerTools
            server={selectedServer}
            currentUserId={profile.id}
            members={serverMembers}
            roles={serverRoles}
            memberRoles={communityMemberRoles.filter(role => role.server_id === selectedServer.id)}
            addableFriends={addableFriends}
            profileById={profileById}
            memberToAdd={memberToAdd}
            setMemberToAdd={setMemberToAdd}
            roleUserId={roleUserId}
            setRoleUserId={setRoleUserId}
            roleId={roleId}
            setRoleId={setRoleId}
            roleName={roleName}
            setRoleName={setRoleName}
            roleColor={roleColor}
            setRoleColor={setRoleColor}
            channelName={channelName}
            setChannelName={setChannelName}
            channelType={channelType}
            setChannelType={setChannelType}
            onAddMember={onAddServerMember}
            onCreateChannel={createChannel}
            onCreateRole={createRole}
            onAssignRole={onAssignRole}
          />
        ) : (
          <PeopleTools
            profile={profile}
            incoming={incoming}
            outgoing={outgoing}
            otherProfiles={otherProfiles}
            profileById={profileById}
            friendships={friendships}
            selectedPublicProfile={selectedPublicProfile}
            onOpenProfile={onOpenProfile}
            onRequestFriend={onRequestFriend}
            onUpdateFriendship={onUpdateFriendship}
          />
        )}
      </aside>
    </div>
  );
}

function ChatBubble({ message, mine, sender }: { message: ChatMessage; mine: boolean; sender?: PublicProfile }) {
  return (
    <article className={`chat-bubble ${mine ? 'mine' : ''}`}>
      {!mine && <strong>{sender?.name || 'Usuário'}</strong>}
      {message.body && <p>{message.body}</p>}
      {message.attachment_url && <AttachmentPreview message={message} />}
      <span>{formatShortDate(message.created_at)}</span>
    </article>
  );
}

function AttachmentPreview({ message }: { message: ChatMessage }) {
  if (message.attachment_type === 'image') return <img className="chat-media-preview" src={message.attachment_url} alt={message.attachment_name || 'Imagem enviada'} />;
  if (message.attachment_type === 'video') return <video className="chat-media-preview" src={message.attachment_url} controls />;
  if (message.attachment_type === 'audio') return <audio className="chat-audio-preview" src={message.attachment_url} controls />;
  return <a className="chat-file-link" href={message.attachment_url} target="_blank" rel="noreferrer">{message.attachment_name || 'Abrir anexo'}</a>;
}

function VoiceRoom({ channel, profile, profileById, presences, onJoin, onLeave }: {
  channel: CommunityChannel;
  profile: Profile;
  profileById: Map<string, PublicProfile>;
  presences: CommunityVoicePresence[];
  onJoin: (channelId: number) => Promise<void> | void;
  onLeave: (channelId: number) => Promise<void> | void;
}) {
  const inside = presences.some(presence => presence.user_id === profile.id);
  return (
    <div className="voice-room">
      <div>
        <span className="kicker">Sala de voz</span>
        <strong>{channel.name}</strong>
        <p>Primeira versão: presença em sala e lista de quem entrou. A camada WebRTC ao vivo fica preparada para próxima etapa.</p>
      </div>
      <div className="voice-members">
        {presences.map(presence => <span key={presence.user_id}>{profileById.get(presence.user_id)?.name || 'Usuário'}</span>)}
        {!presences.length && <span>Ninguém na sala</span>}
      </div>
      <button className={`btn ${inside ? 'ghost-btn' : 'primary-btn'}`} type="button" onClick={() => inside ? onLeave(channel.id) : onJoin(channel.id)}>
        {inside ? 'Sair da voz' : 'Entrar na voz'}
      </button>
    </div>
  );
}

function ServerTools({
  server,
  currentUserId,
  members,
  roles,
  memberRoles,
  addableFriends,
  profileById,
  memberToAdd,
  setMemberToAdd,
  roleUserId,
  setRoleUserId,
  roleId,
  setRoleId,
  roleName,
  setRoleName,
  roleColor,
  setRoleColor,
  channelName,
  setChannelName,
  channelType,
  setChannelType,
  onAddMember,
  onCreateChannel,
  onCreateRole,
  onAssignRole
}: {
  server: CommunityServer;
  currentUserId: string;
  members: CommunityServerMember[];
  roles: CommunityRole[];
  memberRoles: CommunityMemberRole[];
  addableFriends: PublicProfile[];
  profileById: Map<string, PublicProfile>;
  memberToAdd: string;
  setMemberToAdd: (value: string) => void;
  roleUserId: string;
  setRoleUserId: (value: string) => void;
  roleId: string;
  setRoleId: (value: string) => void;
  roleName: string;
  setRoleName: (value: string) => void;
  roleColor: string;
  setRoleColor: (value: string) => void;
  channelName: string;
  setChannelName: (value: string) => void;
  channelType: CommunityChannelType;
  setChannelType: (value: CommunityChannelType) => void;
  onAddMember: (serverId: number, userId: string) => Promise<void> | void;
  onCreateChannel: (event: FormEvent<HTMLFormElement>) => void;
  onCreateRole: (event: FormEvent<HTMLFormElement>) => void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
}) {
  const isOwner = server.owner_id === currentUserId;

  return (
    <>
      <span className="kicker">Comunidade</span>
      <h2>{server.name}</h2>
      <p>{server.description || 'Sem descrição.'}</p>

      <h3>Membros</h3>
      <div className="server-member-list">
        {members.map(member => {
          const memberProfile = profileById.get(member.user_id);
          const memberRoleNames = memberRoles
            .filter(item => item.user_id === member.user_id)
            .map(item => roles.find(role => role.id === item.role_id)?.name)
            .filter(Boolean);
          return (
            <div className="server-member-row" key={member.user_id}>
              <Avatar profile={memberProfile || { name: 'Usuário', avatar_url: '' }} small />
              <div>
                <strong>{memberProfile?.name || 'Usuário'}</strong>
                <span>{memberRoleNames.join(', ') || 'Membro'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {isOwner && (
        <>
          <h3>Adicionar amigo</h3>
          <div className="inline-tool-row">
            <select value={memberToAdd} onChange={event => setMemberToAdd(event.target.value)}>
              <option value="">Escolhe amigo</option>
              {addableFriends.map(friend => <option key={friend.id} value={friend.id}>{friend.name}</option>)}
            </select>
            <button className="btn ghost-btn" type="button" onClick={() => memberToAdd && onAddMember(server.id, memberToAdd)}>Adicionar</button>
          </div>

          <h3>Canais</h3>
          <form className="stacked-tool-form" onSubmit={onCreateChannel}>
            <input value={channelName} onChange={event => setChannelName(event.target.value)} placeholder="Nome do canal" />
            <select value={channelType} onChange={event => setChannelType(event.target.value as CommunityChannelType)}>
              <option value="text">Texto</option>
              <option value="voice">Voz</option>
            </select>
            <button className="btn ghost-btn" type="submit">Criar canal</button>
          </form>

          <h3>Cargos</h3>
          <form className="stacked-tool-form" onSubmit={onCreateRole}>
            <input value={roleName} onChange={event => setRoleName(event.target.value)} placeholder="Nome do cargo" />
            <input value={roleColor} onChange={event => setRoleColor(event.target.value)} type="color" />
            <button className="btn ghost-btn" type="submit">Criar cargo</button>
          </form>
          <div className="inline-tool-row">
            <select value={roleUserId} onChange={event => setRoleUserId(event.target.value)}>
              <option value="">Membro</option>
              {members.map(member => <option key={member.user_id} value={member.user_id}>{profileById.get(member.user_id)?.name || 'Usuário'}</option>)}
            </select>
            <select value={roleId} onChange={event => setRoleId(event.target.value)}>
              <option value="">Cargo</option>
              {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <button className="btn primary-btn" type="button" onClick={() => roleUserId && roleId && onAssignRole(server.id, roleUserId, Number(roleId))}>Aplicar</button>
          </div>
        </>
      )}
    </>
  );
}

function PeopleTools({ profile, incoming, outgoing, otherProfiles, profileById, friendships, selectedPublicProfile, onOpenProfile, onRequestFriend, onUpdateFriendship }: {
  profile: Profile;
  incoming: Friendship[];
  outgoing: Friendship[];
  otherProfiles: PublicProfile[];
  profileById: Map<string, PublicProfile>;
  friendships: Friendship[];
  selectedPublicProfile?: PublicProfile;
  onOpenProfile: (profileId: string) => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
}) {
  return (
    <>
      <span className="kicker">Pessoas</span>
      <h2>Convites e perfis</h2>
      {selectedPublicProfile && <p>Selecionado: <strong>{selectedPublicProfile.name}</strong></p>}
      <h3>Solicitações</h3>
      <div className="profile-list">
        {incoming.map(friendship => (
          <FriendshipRow
            key={friendship.id}
            profile={profileById.get(friendship.requester_id)}
            actions={(
              <>
                <button className="btn primary-btn" type="button" onClick={() => onUpdateFriendship(friendship, 'accepted')}>Aceitar</button>
                <button className="btn ghost-btn" type="button" onClick={() => onUpdateFriendship(friendship, 'rejected')}>Recusar</button>
              </>
            )}
          />
        ))}
        {outgoing.map(friendship => (
          <FriendshipRow
            key={friendship.id}
            profile={profileById.get(friendship.addressee_id)}
            actions={<button className="btn ghost-btn" type="button" onClick={() => onUpdateFriendship(friendship, 'rejected')}>Cancelar</button>}
          />
        ))}
        {!incoming.length && !outgoing.length && <div className="admin-empty-state">Nenhuma solicitação pendente.</div>}
      </div>

      <h3>Encontrar usuários</h3>
      <div className="profile-list">
        {otherProfiles.map(user => {
          const relation = relationFor(profile.id, user.id, friendships);
          const disabled = !!relation && relation.status !== 'rejected';
          return (
            <div className="profile-list-item clickable-row" key={user.id}>
              <button className="profile-pick-button" type="button" onClick={() => onOpenProfile(user.id)}>
                <Avatar profile={user} small />
                <span>
                  <strong>{user.name || 'Usuário'}</strong>
                  <small>{user.bio || 'Sem bio'}</small>
                </span>
              </button>
              <button className="btn ghost-btn" type="button" disabled={disabled} onClick={() => onRequestFriend(user.id)}>
                {relationLabel(relation, profile.id)}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ReportsPanel({ reportForm, setReportForm, otherProfiles, userReports, profileById, onOpenProfile, onSubmitReport }: {
  reportForm: ReportForm;
  setReportForm: (value: ReportForm | ((current: ReportForm) => ReportForm)) => void;
  otherProfiles: PublicProfile[];
  userReports: UserReport[];
  profileById: Map<string, PublicProfile>;
  onOpenProfile: (profileId: string) => void;
  onSubmitReport: () => void;
}) {
  return (
    <section className="page-panel profile-card">
      <span className="kicker">Denúncias</span>
      <h2>Denunciar usuário</h2>
      <div className="row g-2">
        <div className="col-12 col-md-6">
          <FormSelect value={reportForm.reportedUserId} onChange={event => setReportForm(current => ({ ...current, reportedUserId: event.target.value }))}>
            <option value="">Seleciona o usuário</option>
            {otherProfiles.map(user => <option key={user.id} value={user.id}>{user.name || 'Usuário'}</option>)}
          </FormSelect>
        </div>
        <div className="col-12 col-md-6">
          <FormInput value={reportForm.reason} onChange={event => setReportForm(current => ({ ...current, reason: event.target.value }))} placeholder="Motivo" />
        </div>
        <div className="col-12">
          <FormTextarea value={reportForm.details} onChange={event => setReportForm(current => ({ ...current, details: event.target.value }))} placeholder="Detalhes da denúncia" />
        </div>
        <div className="col-12 col-md-auto">
          <button className="btn primary-btn w-100" type="button" onClick={onSubmitReport}>Enviar denúncia</button>
        </div>
      </div>
      <div className="profile-report-history">
        {userReports.slice(0, 6).map(report => (
          <button className="profile-report clickable-row" key={report.id} type="button" onClick={() => onOpenProfile(report.reported_user_id)}>
            <strong>{profileById.get(report.reported_user_id)?.name || 'Usuário'}</strong>
            <span>{report.reason} • {report.status === 'open' ? 'Aberta' : report.status}</span>
          </button>
        ))}
        {!userReports.length && <div className="admin-empty-state mt-3">Nenhuma denúncia enviada.</div>}
      </div>
    </section>
  );
}

function PublicProfilePreview({ profile, relation, currentUserId, onClose, onRequestFriend }: {
  profile: PublicProfile;
  relation?: Friendship;
  currentUserId: string;
  onClose: () => void;
  onRequestFriend: (profileId: string) => void;
}) {
  const canAdd = !relation || relation.status === 'rejected';

  return (
    <div className="profile-preview-drawer page-panel">
      <button className="btn ghost-btn profile-preview-close" type="button" onClick={onClose}>×</button>
      <div className="profile-preview-banner" style={{ '--profile-banner': publicProfileBanner(profile) } as CSSProperties} />
      <Avatar profile={profile} />
      <h2>{profile.name || 'Usuário'}</h2>
      <p>{profile.bio || 'Sem bio.'}</p>
      <button className="btn primary-btn" type="button" disabled={!canAdd || profile.id === currentUserId} onClick={() => onRequestFriend(profile.id)}>
        {profile.id === currentUserId ? 'Seu perfil' : relationLabel(relation, currentUserId)}
      </button>
    </div>
  );
}

function Avatar({ profile, small = false }: { profile: { name: string; avatar_url: string }; small?: boolean }) {
  const initial = (profile.name || 'U').trim().slice(0, 1).toUpperCase();

  return (
    <div className={`profile-avatar ${small ? 'small' : ''}`}>
      {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{initial}</span>}
    </div>
  );
}

function FriendshipRow({ profile, actions }: {
  profile?: PublicProfile;
  actions: ReactNode;
}) {
  return (
    <div className="profile-list-item">
      <Avatar profile={profile || { name: 'Usuário', avatar_url: '' }} small />
      <div>
        <strong>{profile?.name || 'Usuário'}</strong>
        <small>{profile?.bio || 'Sem bio'}</small>
      </div>
      <div className="profile-row-actions">{actions}</div>
    </div>
  );
}

function FriendStrip({ friends, onOpenProfile }: { friends: PublicProfile[]; onOpenProfile: (profileId: string) => void }) {
  return (
    <section className="page-panel profile-card">
      <span className="kicker">Amigos</span>
      <h2>Amigos</h2>
      <div className="friend-strip">
        {friends.map(friend => (
          <button key={friend.id} type="button" onClick={() => onOpenProfile(friend.id)}>
            <Avatar profile={friend} small />
            <span>{friend.name}</span>
          </button>
        ))}
        {!friends.length && <div className="admin-empty-state">Nenhum amigo ainda.</div>}
      </div>
    </section>
  );
}

function GameStrip({ title, games, empty, onOpenGame }: { title: string; games: Game[]; empty: string; onOpenGame: (gameId: number) => void }) {
  return (
    <section className="page-panel profile-card">
      <span className="kicker">{title}</span>
      <h2>{title}</h2>
      <div className="profile-game-strip">
        {games.length ? games.slice(0, 8).map(game => (
          <button className="profile-game-card" key={game.id} type="button" onClick={() => onOpenGame(game.id)}>
            <div style={{ '--cover': coverStyle(game.franchise) } as CSSProperties} />
            <strong>{game.title}</strong>
            <span>{game.franchise}</span>
          </button>
        )) : <div className="admin-empty-state">{empty}</div>}
      </div>
    </section>
  );
}

function SocialSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="social-section">
      <h3>{title}</h3>
      {children}
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

function StatPill({ label, value }: { label: string | number; value: string | number }) {
  return (
    <span>
      <strong>{value}</strong>
      {label}
    </span>
  );
}

function filterMessages(messages: ChatMessage[], currentUserId: string, target: ChatTarget) {
  if (!target.id) return [];
  if (target.type === 'direct') {
    return messages.filter(message =>
      message.conversation_type === 'direct'
      && ((message.sender_id === currentUserId && message.receiver_id === target.id) || (message.sender_id === target.id && message.receiver_id === currentUserId))
    );
  }
  if (target.type === 'group') return messages.filter(message => message.conversation_type === 'group' && message.group_id === target.id);
  return messages.filter(message => message.conversation_type === 'server_channel' && message.server_channel_id === target.id);
}

function targetLabel(target: ChatTarget, profileById: Map<string, PublicProfile>, groups: ChatGroup[], channels: CommunityChannel[]) {
  if (!target.id) return '';
  if (target.type === 'direct') return profileById.get(target.id)?.name || 'Usuário';
  if (target.type === 'group') return groups.find(group => group.id === target.id)?.name || 'Grupo';
  return channels.find(channel => channel.id === target.id)?.name || 'Canal';
}

function profileBanner(profile: Profile) {
  if (profile.banner_url) return `linear-gradient(90deg, rgba(6,10,18,.92), rgba(6,10,18,.38)), url(${JSON.stringify(profile.banner_url)})`;
  return `${coverStyle(profile.name || 'Nicolas Jogos')}`;
}

function publicProfileBanner(profile: PublicProfile) {
  if (profile.banner_url) return `linear-gradient(90deg, rgba(6,10,18,.92), rgba(6,10,18,.38)), url(${JSON.stringify(profile.banner_url)})`;
  return `${coverStyle(profile.name || 'Nicolas Jogos')}`;
}

function relationFor(currentUserId: string, targetId: string, friendships: Friendship[]) {
  return friendships.find(friendship =>
    (friendship.requester_id === currentUserId && friendship.addressee_id === targetId)
    || (friendship.addressee_id === currentUserId && friendship.requester_id === targetId)
  );
}

function relationLabel(relation: Friendship | undefined, currentUserId: string) {
  if (!relation) return 'Adicionar';
  if (relation.status === 'accepted') return 'Amigo';
  if (relation.status === 'rejected') return 'Adicionar';
  if (relation.status === 'pending') return relation.requester_id === currentUserId ? 'Enviado' : 'Responder';
  return 'Indisponível';
}
