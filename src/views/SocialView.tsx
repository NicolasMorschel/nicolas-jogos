import { useEffect, useMemo, useRef, useState, type FormEvent, type MutableRefObject } from 'react';
import type {
  ChatGroup,
  ChatMessage,
  CommunityChannel,
  CommunityChannelType,
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  CommunityVoicePresence,
  Friendship,
  Profile,
  PublicProfile,
  SocialTarget
} from '../types';
import { formatShortDate } from '../utils';
import { MessageActionMenu } from './social/MessageActionMenu';
import { ProfileDot } from './social/SocialPrimitives';
import { HomeSidebar, ServerChannelSidebar, ServerDock } from './social/SocialSidebars';
import { VoiceCallPanel } from './social/VoiceCallPanel';

type SocialViewProps = {
  profile: Profile | null;
  socialProfiles: PublicProfile[];
  friendships: Friendship[];
  chatMessages: ChatMessage[];
  chatGroups: ChatGroup[];
  communityServers: CommunityServer[];
  communityServerMembers: CommunityServerMember[];
  communityRoles: CommunityRole[];
  communityMemberRoles: CommunityMemberRole[];
  communityChannels: CommunityChannel[];
  communityVoicePresence: CommunityVoicePresence[];
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
  onSendChatMessage: (target: SocialTarget, body: string, file?: File | null) => Promise<void> | void;
  onDeleteMessage: (messageId: number) => Promise<void> | void;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void> | void;
  onCreateServer: (name: string, description: string) => Promise<void> | void;
  onAddServerMember: (serverId: number, userId: string) => Promise<void> | void;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
  onUpdateServerVisibility: (serverId: number, visibility: CommunityServer['visibility']) => Promise<void> | void;
  onDeleteServer: (serverId: number) => Promise<void> | void;
  onCreateChannel: (serverId: number, name: string, type: CommunityChannelType) => Promise<void> | void;
  onDeleteChannel: (channelId: number) => Promise<void> | void;
  onCreateRole: (serverId: number, name: string, color: string) => Promise<void> | void;
  onDeleteRole: (roleId: number) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  onJoinVoice: (channelId: number) => Promise<void> | void;
  onLeaveVoice: (channelId: number) => Promise<void> | void;
};

type SettingsTab = 'overview' | 'channels' | 'roles' | 'members';

const SOCIAL_TARGET_STORAGE_KEY = 'nicolas-jogos-social-target';

export function SocialView({
  profile,
  socialProfiles,
  friendships,
  chatMessages,
  chatGroups,
  communityServers,
  communityServerMembers,
  communityRoles,
  communityMemberRoles,
  communityChannels,
  communityVoicePresence,
  onRequestFriend,
  onUpdateFriendship,
  onSendChatMessage,
  onDeleteMessage,
  onCreateGroup,
  onCreateServer,
  onAddServerMember,
  onJoinServerByInvite,
  onUpdateServerVisibility,
  onDeleteServer,
  onCreateChannel,
  onDeleteChannel,
  onCreateRole,
  onDeleteRole,
  onAssignRole,
  onJoinVoice,
  onLeaveVoice
}: SocialViewProps) {
  const profileById = useMemo(() => new Map(socialProfiles.map(user => [user.id, user])), [socialProfiles]);
  const [target, setTargetState] = useState<SocialTarget>({ type: 'direct', id: '' });
  const [chatText, setChatText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState('');
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
  const [previewProfileId, setPreviewProfileId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('overview');
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<number[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<number, string[]>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inviteHandledRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const profileId = profile?.id || '';
  const acceptedFriendships = profile ? friendships.filter(friendship => friendship.status === 'accepted') : [];
  const incoming = profile ? friendships.filter(friendship => friendship.status === 'pending' && friendship.addressee_id === profileId) : [];
  const outgoing = profile ? friendships.filter(friendship => friendship.status === 'pending' && friendship.requester_id === profileId) : [];
  const friendIds = acceptedFriendships.map(friendship => friendship.requester_id === profileId ? friendship.addressee_id : friendship.requester_id);
  const friendProfiles = friendIds.map(id => profileById.get(id)).filter(Boolean) as PublicProfile[];
  const otherProfiles = socialProfiles.filter(user => user.id !== profileId);
  const firstTarget = findFirstTarget(friendProfiles, chatGroups, communityServers, communityChannels);
  const selectedChannel = target.type === 'server_channel'
    ? communityChannels.find(channel => channel.id === target.id)
    : undefined;
  const selectedServer = selectedChannel
    ? communityServers.find(server => server.id === selectedChannel.server_id)
    : undefined;
  const serverChannels = selectedServer
    ? communityChannels.filter(channel => channel.server_id === selectedServer.id).sort(sortChannels)
    : [];
  const textChannels = serverChannels.filter(channel => channel.channel_type === 'text');
  const voiceChannels = serverChannels.filter(channel => channel.channel_type === 'voice');
  const activeVoicePresence = profileId ? communityVoicePresence.find(presence => presence.user_id === profileId) : undefined;
  const activeVoiceChannel = activeVoicePresence
    ? communityChannels.find(channel => channel.id === activeVoicePresence.channel_id)
    : undefined;
  const activeVoiceServer = activeVoiceChannel
    ? communityServers.find(server => server.id === activeVoiceChannel.server_id)
    : undefined;
  const activeVoicePresences = activeVoiceChannel
    ? communityVoicePresence.filter(presence => presence.channel_id === activeVoiceChannel.id)
    : [];
  const serverMembers = selectedServer
    ? communityServerMembers.filter(member => member.server_id === selectedServer.id)
    : [];
  const serverRoles = selectedServer
    ? communityRoles.filter(role => role.server_id === selectedServer.id).sort((a, b) => b.position - a.position || a.id - b.id)
    : [];
  const selectedServerMemberRoles = selectedServer
    ? communityMemberRoles.filter(role => role.server_id === selectedServer.id)
    : [];
  const addableFriends = selectedServer
    ? friendProfiles.filter(friend => !serverMembers.some(member => member.user_id === friend.id))
    : [];
  const selectedServerMembership = selectedServer
    ? serverMembers.find(member => member.user_id === profileId)
    : undefined;
  const isSelectedServerMember = !!selectedServerMembership || !!(selectedServer && (selectedServer.owner_id === profileId || profile?.role === 'admin'));
  const canManageSelectedServer = !!selectedServer && (selectedServer.owner_id === profileId || profile?.role === 'admin');
  const publicServers = communityServers.filter(server =>
    server.visibility === 'public'
    && !communityServerMembers.some(member => member.server_id === server.id && member.user_id === profileId)
  );
  const messages = profile ? filterMessages(chatMessages, profile.id, target) : [];
  const selectedTitle = targetLabel(target, profileById, chatGroups, communityChannels);
  const selectedSubtitle = target.type === 'direct'
    ? 'Mensagem direta'
    : target.type === 'group'
      ? 'Grupo privado'
      : 'Canal de texto';
  const selectedPublicProfile = previewProfileId ? profileById.get(previewProfileId) : undefined;
  const roomProfile = target.type === 'direct' ? profileById.get(String(target.id)) : undefined;

  useEffect(() => {
    const saved = readStoredTarget();
    const nextTarget = saved && targetExists(saved, friendProfiles, chatGroups, communityChannels) ? saved : firstTarget;
    setTargetState(nextTarget);
  }, []);

  useEffect(() => {
    if (!target.id && firstTarget.id) setTarget(firstTarget);
  }, [firstTarget.id, firstTarget.type, target.id]);

  useEffect(() => {
    if (target.id && !targetExists(target, friendProfiles, chatGroups, communityChannels)) setTarget(firstTarget);
  }, [target, firstTarget, friendProfiles, chatGroups, communityChannels]);

  useEffect(() => {
    if (selectedChannel?.channel_type !== 'voice') return;
    const fallbackChannel = communityChannels.find(channel => channel.server_id === selectedChannel.server_id && channel.channel_type === 'text');
    if (fallbackChannel) {
      setTarget({ type: 'server_channel', id: fallbackChannel.id });
    } else {
      setTarget(firstTarget);
    }
  }, [selectedChannel?.id, selectedChannel?.channel_type, selectedChannel?.server_id, communityChannels, firstTarget]);

  useEffect(() => {
    if (!profile || inviteHandledRef.current) return;
    const invite = new URLSearchParams(window.location.search).get('invite');
    if (!invite) return;

    inviteHandledRef.current = true;
    void onJoinServerByInvite(normalizeInviteInput(invite));
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('invite');
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, [profile, onJoinServerByInvite]);

  useEffect(() => {
    if (!selectedServer) setSettingsOpen(false);
  }, [selectedServer?.id]);

  useEffect(() => () => {
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    recordingStreamRef.current?.getTracks().forEach(track => track.stop());
  }, [selectedFileUrl]);

  function setTarget(nextTarget: SocialTarget) {
    setTargetState(nextTarget);
    setSettingsOpen(false);
    localStorage.setItem(SOCIAL_TARGET_STORAGE_KEY, JSON.stringify(nextTarget));
  }

  function openServerSettings(tab: SettingsTab = 'overview') {
    if (!selectedServer) return;
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  function setFileWithPreview(file: File | null) {
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    setSelectedFile(file);
    setSelectedFileUrl(file ? URL.createObjectURL(file) : '');
  }

  async function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target.id || (!chatText.trim() && !selectedFile)) return;
    const replyPrefix = replyToMessage
      ? `Respondendo ${profileById.get(replyToMessage.sender_id)?.name || 'Usuario'}: "${replyToMessage.body.slice(0, 90)}"\n`
      : '';
    await onSendChatMessage(target, `${replyPrefix}${chatText}`, selectedFile);
    setChatText('');
    setReplyToMessage(null);
    setRecordingError('');
    setFileWithPreview(null);
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupName.trim()) return;
    await onCreateGroup(groupName, groupMembers);
    setGroupName('');
    setGroupMembers([]);
  }

  async function createServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serverName.trim()) return;
    await onCreateServer(serverName, serverDescription);
    setServerName('');
    setServerDescription('');
  }

  async function joinByInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inviteCode.trim()) return;
    await onJoinServerByInvite(normalizeInviteInput(inviteCode));
    setInviteCode('');
  }

  async function copyServerInvite(server: CommunityServer) {
    const invite = buildInviteUrl(server);
    try {
      await navigator.clipboard.writeText(invite);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 1600);
    } catch {
      setCopiedInvite(false);
    }
  }

  async function createChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedServer || !channelName.trim()) return;
    await onCreateChannel(selectedServer.id, channelName, channelType);
    setChannelName('');
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedServer || !roleName.trim()) return;
    await onCreateRole(selectedServer.id, roleName, roleColor);
    setRoleName('');
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Seu navegador nao liberou gravacao de audio aqui.');
      return;
    }

    setRecordingError('');
    setIsPreparingRecording(true);

    try {
      const stream = await requestAudioStream();
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voz-${Date.now()}.webm`, { type: 'audio/webm' });
        setFileWithPreview(file);
        stream.getTracks().forEach(track => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
      };
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.warn('Nao foi possivel iniciar a gravacao de audio.', error);
      setRecordingError('Nao deu para acessar o microfone. Confere a permissao do navegador e tenta de novo.');
      setIsRecording(false);
    } finally {
      setIsPreparingRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  async function enterVoiceChannel(channelId: number) {
    if (!profileId) return;
    if (activeVoicePresence?.channel_id === channelId) return;
    if (activeVoicePresence) await onLeaveVoice(activeVoicePresence.channel_id);
    await onJoinVoice(channelId);
    setVoiceChatOpen(false);
  }

  async function leaveActiveVoice() {
    if (!activeVoicePresence) return;
    await onLeaveVoice(activeVoicePresence.channel_id);
    setVoiceChatOpen(false);
  }

  function reactToMessage(messageId: number, emoji: string) {
    setMessageReactions(current => ({
      ...current,
      [messageId]: [...(current[messageId] || []), emoji]
    }));
  }

  function togglePinnedMessage(messageId: number) {
    setPinnedMessageIds(current => current.includes(messageId)
      ? current.filter(id => id !== messageId)
      : [...current, messageId]
    );
  }

  async function copyMessageText(message: ChatMessage) {
    const text = message.body || message.attachment_url;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.warn('Nao foi possivel copiar a mensagem.');
    }
  }

  function reportMessage(message: ChatMessage) {
    window.alert(`Mensagem ${message.id} marcada para analise.`);
  }

  if (!profile) {
    return (
      <section className="view active">
        <div className="container-xxl page-shell">
          <div className="alert account-status-alert mb-0">Faz login para abrir as comunidades.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="view active social-view">
      <div className="container-fluid social-workspace px-2 px-lg-3">
        <div className="row g-0 social-app-frame">
          <ServerDock
            profile={profile}
            selectedServer={selectedServer}
            servers={communityServers}
            channels={communityChannels}
            friendProfiles={friendProfiles}
            groups={chatGroups}
            setTarget={setTarget}
          />

          <aside className="col-12 col-lg-3 col-xxl-2 social-channel-sidebar d-flex flex-column">
            {selectedServer ? (
              <ServerChannelSidebar
                profile={profile}
                server={selectedServer}
                textChannels={textChannels}
                voiceChannels={voiceChannels}
                target={target}
                isMember={isSelectedServerMember}
                canManage={canManageSelectedServer}
                profileById={profileById}
                voicePresence={communityVoicePresence}
                activeVoiceChannel={activeVoiceChannel}
                muted={muted}
                deafened={deafened}
                voiceChatOpen={voiceChatOpen}
                isRecording={isRecording}
                setTarget={setTarget}
                openSettings={openServerSettings}
                onJoinServerByInvite={onJoinServerByInvite}
                onJoinVoiceChannel={enterVoiceChannel}
                onToggleMuted={() => setMuted(value => !value)}
                onToggleDeafened={() => setDeafened(value => !value)}
                onToggleVoiceChat={() => setVoiceChatOpen(value => !value)}
                onLeaveVoice={leaveActiveVoice}
              />
            ) : (
              <HomeSidebar
                profile={profile}
                friendProfiles={friendProfiles}
                groups={chatGroups}
                publicServers={publicServers}
                channels={communityChannels}
                target={target}
                groupName={groupName}
                setGroupName={setGroupName}
                groupMembers={groupMembers}
                setGroupMembers={setGroupMembers}
                serverName={serverName}
                setServerName={setServerName}
                serverDescription={serverDescription}
                setServerDescription={setServerDescription}
                inviteCode={inviteCode}
                setInviteCode={setInviteCode}
                createGroup={createGroup}
                createServer={createServer}
                joinByInvite={joinByInvite}
                onJoinServerByInvite={onJoinServerByInvite}
                activeVoiceChannel={activeVoiceChannel}
                muted={muted}
                deafened={deafened}
                voiceChatOpen={voiceChatOpen}
                onToggleMuted={() => setMuted(value => !value)}
                onToggleDeafened={() => setDeafened(value => !value)}
                onToggleVoiceChat={() => setVoiceChatOpen(value => !value)}
                onLeaveVoice={leaveActiveVoice}
                setTarget={setTarget}
              />
            )}
          </aside>

          <main className="col social-chat-stage d-flex flex-column min-w-0">
            <ChatHeader
              title={selectedTitle || 'Escolhe uma conversa'}
              subtitle={selectedSubtitle}
              selectedServer={selectedServer}
              selectedChannel={selectedChannel}
              roomProfile={roomProfile}
              canManageServer={canManageSelectedServer}
              settingsOpen={settingsOpen}
              openSettings={openServerSettings}
              closeSettings={() => setSettingsOpen(false)}
              openProfile={() => target.type === 'direct' && setPreviewProfileId(String(target.id))}
            />

            {settingsOpen && selectedServer ? (
              <ServerSettingsPanel
                tab={settingsTab}
                setTab={setSettingsTab}
                server={selectedServer}
                channels={serverChannels}
                members={serverMembers}
                roles={serverRoles}
                memberRoles={selectedServerMemberRoles}
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
                copiedInvite={copiedInvite}
                createChannel={createChannel}
                createRole={createRole}
                copyServerInvite={copyServerInvite}
                onAddMember={onAddServerMember}
                onUpdateVisibility={onUpdateServerVisibility}
                onDeleteServer={onDeleteServer}
                onDeleteChannel={onDeleteChannel}
                onDeleteRole={onDeleteRole}
                onAssignRole={onAssignRole}
                onOpenProfile={setPreviewProfileId}
              />
            ) : (
              <>
                {activeVoiceChannel && (
                  <VoiceCallPanel
                    channel={activeVoiceChannel}
                    server={activeVoiceServer}
                    profile={profile}
                    profileById={profileById}
                    presences={activeVoicePresences}
                    expanded={voiceChatOpen}
                    muted={muted}
                    deafened={deafened}
                    isRecording={isRecording}
                    onToggleExpanded={() => setVoiceChatOpen(value => !value)}
                    onToggleMuted={() => setMuted(value => !value)}
                    onToggleDeafened={() => setDeafened(value => !value)}
                    onLeave={leaveActiveVoice}
                  />
                )}

                <div className="social-message-stream flex-grow-1">
                  {selectedServer && !isSelectedServerMember && (
                    <div className="server-join-banner">
                      <div>
                        <strong>Comunidade publica</strong>
                        <span>Entre para conversar, participar da voz e aparecer na lista de membros.</span>
                      </div>
                      <button className="btn primary-btn" type="button" onClick={() => onJoinServerByInvite(selectedServer.invite_code || String(selectedServer.id))}>Entrar</button>
                    </div>
                  )}
                  {messages.map(message => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      mine={message.sender_id === profile.id}
                      sender={profileById.get(message.sender_id)}
                      canDelete={message.sender_id === profile.id || profile.role === 'admin' || !!(selectedServer && selectedServer.owner_id === profile.id)}
                      pinned={pinnedMessageIds.includes(message.id)}
                      reactions={messageReactions[message.id] || []}
                      onReact={emoji => reactToMessage(message.id, emoji)}
                      onReply={() => setReplyToMessage(message)}
                      onForward={() => setChatText(message.body)}
                      onPin={() => togglePinnedMessage(message.id)}
                      onCopy={() => void copyMessageText(message)}
                      onReport={() => reportMessage(message)}
                      onDelete={onDeleteMessage}
                    />
                  ))}
                  {!messages.length && (
                    <div className="social-empty-chat">
                      <strong>Nenhuma mensagem ainda</strong>
                      <span>Comeca com uma mensagem, uma midia ou uma nota de voz.</span>
                    </div>
                  )}
                </div>

                <MessageComposer
                  targetId={target.id}
                  chatText={chatText}
                  setChatText={setChatText}
                  selectedFile={selectedFile}
                  selectedFileUrl={selectedFileUrl}
                  setFileWithPreview={setFileWithPreview}
                  fileInputRef={fileInputRef}
                  isRecording={isRecording}
                  isPreparingRecording={isPreparingRecording}
                  recordingError={recordingError}
                  replyToMessage={replyToMessage}
                  replySenderName={replyToMessage ? profileById.get(replyToMessage.sender_id)?.name || 'Usuario' : ''}
                  onCancelReply={() => setReplyToMessage(null)}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  canWrite={!selectedServer || isSelectedServerMember}
                  submitChat={submitChat}
                />
              </>
            )}
          </main>

          <aside className="col-12 col-xl-2 d-flex social-member-panel flex-column">
            {selectedServer ? (
              <MembersPanel
                server={selectedServer}
                members={serverMembers}
                roles={serverRoles}
                memberRoles={selectedServerMemberRoles}
                profileById={profileById}
                openSettings={openServerSettings}
                onOpenProfile={setPreviewProfileId}
              />
            ) : roomProfile ? (
              <ConversationInfoPanel
                profile={profile}
                roomProfile={roomProfile}
                incoming={incoming}
                outgoing={outgoing}
                otherProfiles={otherProfiles}
                friendships={friendships}
                profileById={profileById}
                selectedPublicProfile={selectedPublicProfile}
                onOpenProfile={setPreviewProfileId}
                onRequestFriend={onRequestFriend}
                onUpdateFriendship={onUpdateFriendship}
              />
            ) : (
              <PeoplePanel
                profile={profile}
                incoming={incoming}
                outgoing={outgoing}
                otherProfiles={otherProfiles}
                friendships={friendships}
                profileById={profileById}
                selectedPublicProfile={selectedPublicProfile}
                onOpenProfile={setPreviewProfileId}
                onRequestFriend={onRequestFriend}
                onUpdateFriendship={onUpdateFriendship}
              />
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

function ChatHeader({ title, subtitle, selectedServer, selectedChannel, roomProfile, canManageServer, settingsOpen, openSettings, closeSettings, openProfile }: {
  title: string;
  subtitle: string;
  selectedServer?: CommunityServer;
  selectedChannel?: CommunityChannel;
  roomProfile?: PublicProfile;
  canManageServer: boolean;
  settingsOpen: boolean;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  openProfile: () => void;
}) {
  return (
    <header className="social-chat-header d-flex align-items-center justify-content-between gap-3 px-3 px-lg-4 py-3">
      <div className="d-flex align-items-center gap-3 min-w-0">
        {roomProfile && <ProfileDot profile={roomProfile} />}
        <div className="min-w-0">
          <span className="kicker">{subtitle}</span>
          <h1 className="h4 mb-0 text-truncate">{selectedServer ? '# ' : ''}{title}</h1>
        </div>
      </div>
      <div className="btn-group flex-shrink-0">
        {roomProfile && <button className="btn ghost-btn" type="button" onClick={openProfile}>Perfil</button>}
        {selectedServer && canManageServer && (
          <button className="btn ghost-btn" type="button" onClick={() => settingsOpen ? closeSettings() : openSettings('overview')}>
            {settingsOpen ? 'Voltar ao chat' : 'Configuracoes'}
          </button>
        )}
      </div>
    </header>
  );
}

function ServerSettingsPanel({
  tab,
  setTab,
  server,
  channels,
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
  copiedInvite,
  createChannel,
  createRole,
  copyServerInvite,
  onAddMember,
  onUpdateVisibility,
  onDeleteServer,
  onDeleteChannel,
  onDeleteRole,
  onAssignRole,
  onOpenProfile
}: {
  tab: SettingsTab;
  setTab: (tab: SettingsTab) => void;
  server: CommunityServer;
  channels: CommunityChannel[];
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
  copiedInvite: boolean;
  createChannel: (event: FormEvent<HTMLFormElement>) => void;
  createRole: (event: FormEvent<HTMLFormElement>) => void;
  copyServerInvite: (server: CommunityServer) => Promise<void> | void;
  onAddMember: (serverId: number, userId: string) => Promise<void> | void;
  onUpdateVisibility: (serverId: number, visibility: CommunityServer['visibility']) => Promise<void> | void;
  onDeleteServer: (serverId: number) => Promise<void> | void;
  onDeleteChannel: (channelId: number) => Promise<void> | void;
  onDeleteRole: (roleId: number) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  onOpenProfile: (profileId: string) => void;
}) {
  return (
    <div className="social-settings flex-grow-1 overflow-auto">
      <div className="row g-0 h-100">
        <aside className="col-12 col-lg-3 social-settings-nav border-end border-dark-subtle p-3">
          <div className="kicker mb-2">Config. do servidor</div>
          <h2 className="h5 mb-3">{server.name}</h2>
          <div className="nav nav-pills flex-lg-column gap-2">
            <SettingsButton active={tab === 'overview'} onClick={() => setTab('overview')}>Visao geral</SettingsButton>
            <SettingsButton active={tab === 'channels'} onClick={() => setTab('channels')}>Canais</SettingsButton>
            <SettingsButton active={tab === 'roles'} onClick={() => setTab('roles')}>Cargos</SettingsButton>
            <SettingsButton active={tab === 'members'} onClick={() => setTab('members')}>Membros</SettingsButton>
          </div>
        </aside>

        <div className="col social-settings-content p-3 p-lg-4">
          {tab === 'overview' && (
            <div className="row g-3">
              <div className="col-12 col-xl-7">
                <div className="card social-settings-card h-100">
                  <div className="card-body">
                    <span className="kicker">Perfil do servidor</span>
                    <h3 className="h4 mt-2">{server.name}</h3>
                    <p className="text-secondary-emphasis mb-0">{server.description || 'Sem resumo ainda.'}</p>
                    <div className="row g-2 mt-4">
                      <div className="col-12 col-lg-5">
                        <label className="form-label">Visibilidade</label>
                        <select className="form-select input" value={server.visibility || 'private'} onChange={event => onUpdateVisibility(server.id, event.target.value as CommunityServer['visibility'])}>
                          <option value="private">Privado</option>
                          <option value="public">Publico</option>
                        </select>
                      </div>
                      <div className="col-12 col-lg">
                        <label className="form-label">Convite</label>
                        <div className="input-group">
                          <input className="form-control input" value={buildInviteUrl(server)} readOnly />
                          <button className="btn ghost-btn" type="button" onClick={() => copyServerInvite(server)}>{copiedInvite ? 'Copiado' : 'Copiar'}</button>
                        </div>
                      </div>
                    </div>
                    <div className="server-danger-zone mt-4">
                      <div>
                        <strong>Excluir servidor</strong>
                        <span>Remove canais, cargos, membros e mensagens desse servidor.</span>
                      </div>
                      <button className="btn danger-btn" type="button" onClick={() => window.confirm('Excluir este servidor inteiro?') && onDeleteServer(server.id)}>Excluir</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-xl-5">
                <div className="card social-settings-card h-100">
                  <div className="card-body">
                    <span className="kicker">Convidar amigo</span>
                    <div className="input-group mt-3">
                      <select className="form-select input" value={memberToAdd} onChange={event => setMemberToAdd(event.target.value)}>
                        <option value="">Escolhe um amigo</option>
                        {addableFriends.map(friend => <option key={friend.id} value={friend.id}>{friend.name}</option>)}
                      </select>
                      <button className="btn primary-btn" type="button" onClick={() => memberToAdd && onAddMember(server.id, memberToAdd)}>Adicionar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'channels' && (
            <div className="card social-settings-card">
              <div className="card-body">
                <span className="kicker">Canais</span>
                <form className="row g-2 mt-3" onSubmit={createChannel}>
                  <div className="col-12 col-lg">
                    <input className="form-control input" value={channelName} onChange={event => setChannelName(event.target.value)} placeholder="Nome do canal" />
                  </div>
                  <div className="col-12 col-lg-3">
                    <select className="form-select input" value={channelType} onChange={event => setChannelType(event.target.value as CommunityChannelType)}>
                      <option value="text">Texto</option>
                      <option value="voice">Voz</option>
                    </select>
                  </div>
                  <div className="col-12 col-lg-auto">
                    <button className="btn primary-btn w-100" type="submit">Criar canal</button>
                  </div>
                </form>
                <div className="social-management-list mt-4">
                  {channels.map(channel => (
                    <div className="social-management-row" key={channel.id}>
                      <div>
                        <strong>{channel.channel_type === 'voice' ? 'Voz' : '#'} {channel.name}</strong>
                        <span>{channel.channel_type === 'voice' ? 'Canal de voz' : 'Canal de texto'}</span>
                      </div>
                      <button className="btn ghost-btn" type="button" onClick={() => window.confirm('Excluir este canal?') && onDeleteChannel(channel.id)}>Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'roles' && (
            <div className="row g-3">
              <div className="col-12 col-xl-5">
                <form className="card social-settings-card h-100" onSubmit={createRole}>
                  <div className="card-body">
                    <span className="kicker">Novo cargo</span>
                    <input className="form-control input mt-3 mb-2" value={roleName} onChange={event => setRoleName(event.target.value)} placeholder="Nome do cargo" />
                    <input className="form-control form-control-color mb-3" value={roleColor} onChange={event => setRoleColor(event.target.value)} type="color" />
                    <button className="btn primary-btn w-100" type="submit">Criar cargo</button>
                  </div>
                </form>
              </div>
              <div className="col-12 col-xl-7">
                <div className="card social-settings-card h-100">
                  <div className="card-body">
                    <span className="kicker">Aplicar cargo</span>
                    <div className="row g-2 mt-3">
                      <div className="col-12 col-lg">
                        <select className="form-select input" value={roleUserId} onChange={event => setRoleUserId(event.target.value)}>
                          <option value="">Membro</option>
                          {members.map(member => <option key={member.user_id} value={member.user_id}>{profileById.get(member.user_id)?.name || 'Usuario'}</option>)}
                        </select>
                      </div>
                      <div className="col-12 col-lg">
                        <select className="form-select input" value={roleId} onChange={event => setRoleId(event.target.value)}>
                          <option value="">Cargo</option>
                          {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                        </select>
                      </div>
                      <div className="col-12 col-lg-auto">
                        <button className="btn primary-btn w-100" type="button" onClick={() => roleUserId && roleId && onAssignRole(server.id, roleUserId, Number(roleId))}>Aplicar</button>
                      </div>
                    </div>
                    <div className="social-management-list mt-4">
                      {roles.map(role => (
                        <div className="social-management-row" key={role.id}>
                          <span className="role-chip" style={{ borderColor: role.color, color: role.color }}>{role.name}</span>
                          <button className="btn ghost-btn" type="button" onClick={() => window.confirm('Excluir este cargo?') && onDeleteRole(role.id)}>Excluir</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div className="card social-settings-card">
              <div className="card-body">
                <span className="kicker">Membros</span>
                <div className="row g-2 mt-3">
                  {members.map(member => (
                    <div className="col-12 col-lg-6" key={member.user_id}>
                      <MemberButton member={member} roles={roles} memberRoles={memberRoles} profileById={profileById} onOpenProfile={onOpenProfile} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button className={`btn text-start ${active ? 'primary-btn' : 'ghost-btn'}`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function MembersPanel({ server, members, roles, memberRoles, profileById, openSettings, onOpenProfile }: {
  server: CommunityServer;
  members: CommunityServerMember[];
  roles: CommunityRole[];
  memberRoles: CommunityMemberRole[];
  profileById: Map<string, PublicProfile>;
  openSettings: (tab?: SettingsTab) => void;
  onOpenProfile: (profileId: string) => void;
}) {
  return (
    <div className="w-100 p-3 overflow-auto">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="kicker">Membros</div>
          <h2 className="h6 mb-0">{server.name}</h2>
        </div>
        <button className="btn btn-sm ghost-btn" type="button" onClick={() => openSettings('members')}>Ver</button>
      </div>
      <div className="d-grid gap-2">
        {members.map(member => (
          <MemberButton key={member.user_id} member={member} roles={roles} memberRoles={memberRoles} profileById={profileById} onOpenProfile={onOpenProfile} />
        ))}
      </div>
    </div>
  );
}

function MemberButton({ member, roles, memberRoles, profileById, onOpenProfile }: {
  member: CommunityServerMember;
  roles: CommunityRole[];
  memberRoles: CommunityMemberRole[];
  profileById: Map<string, PublicProfile>;
  onOpenProfile: (profileId: string) => void;
}) {
  const memberProfile = profileById.get(member.user_id);
  const roleNames = memberRoles
    .filter(item => item.user_id === member.user_id)
    .map(item => roles.find(role => role.id === item.role_id)?.name)
    .filter(Boolean);

  return (
    <button className="btn social-member-row text-start" type="button" onClick={() => onOpenProfile(member.user_id)}>
      <ProfileDot profile={memberProfile} />
      <span>
        <strong>{memberProfile?.name || 'Usuario'}</strong>
        <small>{roleNames.join(', ') || 'Membro'}</small>
      </span>
    </button>
  );
}

function VoiceSuite({ channel, profile, profileById, presences, isRecording, onJoin, onLeave }: {
  channel: CommunityChannel;
  profile: Profile;
  profileById: Map<string, PublicProfile>;
  presences: CommunityVoicePresence[];
  isRecording: boolean;
  onJoin: (channelId: number) => Promise<void> | void;
  onLeave: (channelId: number) => Promise<void> | void;
}) {
  const inside = presences.some(presence => presence.user_id === profile.id);
  return (
    <div className="voice-suite d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-3 px-3 px-lg-4 py-3">
      <div className="flex-grow-1">
        <span className="kicker">Sala de voz</span>
        <strong className="d-block">{channel.name}</strong>
        <p>{inside ? 'Voce esta conectado. Quando gravar audio, seu avatar acende na sala.' : 'Entre para aparecer na sala e conversar com o grupo.'}</p>
      </div>
      <div className="voice-live-members">
        {presences.map(presence => {
          const member = profileById.get(presence.user_id);
          const speaking = isRecording && presence.user_id === profile.id;
          return (
            <button className={`voice-member-avatar ${speaking ? 'speaking' : ''}`} key={presence.user_id} title={member?.name || 'Usuario'} type="button">
              <ProfileDot profile={member} />
              <span className="mic-mini" aria-hidden="true" />
              {speaking && <i />}
            </button>
          );
        })}
        {!presences.length && <span>Ninguem na sala</span>}
      </div>
      <button className={`btn ${inside ? 'ghost-btn' : 'primary-btn'}`} type="button" onClick={() => inside ? onLeave(channel.id) : onJoin(channel.id)}>
        {inside ? 'Sair da voz' : 'Entrar na voz'}
      </button>
    </div>
  );
}

function MessageComposer({
  targetId,
  chatText,
  setChatText,
  selectedFile,
  selectedFileUrl,
  setFileWithPreview,
  fileInputRef,
  isRecording,
  isPreparingRecording,
  recordingError,
  replyToMessage,
  replySenderName,
  onCancelReply,
  startRecording,
  stopRecording,
  canWrite,
  submitChat
}: {
  targetId: string | number;
  chatText: string;
  setChatText: (value: string) => void;
  selectedFile: File | null;
  selectedFileUrl: string;
  setFileWithPreview: (file: File | null) => void;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  isRecording: boolean;
  isPreparingRecording: boolean;
  recordingError: string;
  replyToMessage: ChatMessage | null;
  replySenderName: string;
  onCancelReply: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  canWrite: boolean;
  submitChat: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const hasTextOrFile = !!chatText.trim() || !!selectedFile;

  return (
    <form className="social-composer px-2 px-lg-3 py-3" onSubmit={submitChat}>
      {selectedFile && (
        <div className="composer-preview mb-2">
          <div>
            <strong>{selectedFile.type.startsWith('audio/') ? 'Audio pronto' : selectedFile.name}</strong>
            <span>{selectedFile.type.startsWith('audio/') ? 'Escuta antes de enviar.' : 'Arquivo anexado a proxima mensagem.'}</span>
          </div>
          {selectedFile.type.startsWith('audio/') && selectedFileUrl && <AudioPlayer src={selectedFileUrl} compact />}
          <button className="btn ghost-btn btn-sm" type="button" onClick={() => setFileWithPreview(null)}>Remover</button>
        </div>
      )}

      {(isPreparingRecording || isRecording) && (
        <div className="recording-strip mb-2">
          <span className="recording-dot" />
          {isPreparingRecording ? 'Pedindo permissao do microfone...' : 'Gravando audio. Clique no microfone para finalizar e ouvir.'}
        </div>
      )}

      {recordingError && <div className="recording-error mb-2">{recordingError}</div>}

      {replyToMessage && (
        <div className="reply-preview d-flex align-items-center justify-content-between gap-2 mb-2">
          <span className="text-truncate">
            Respondendo <strong>{replySenderName}</strong>: {replyToMessage.body || replyToMessage.attachment_name || 'anexo'}
          </span>
          <button className="btn btn-sm ghost-btn" type="button" onClick={onCancelReply}>Cancelar</button>
        </div>
      )}

      <div className="input-group social-composer-bar">
        <button className="btn social-icon-btn" type="button" onClick={() => fileInputRef.current?.click()} disabled={!targetId || !canWrite} aria-label="Enviar midia">
          +
        </button>
        <input ref={fileInputRef} className="d-none" accept="image/*,video/*,audio/*" type="file" onChange={event => setFileWithPreview(event.target.files?.[0] || null)} />
        <input className="form-control" value={chatText} onChange={event => setChatText(event.target.value)} placeholder={!targetId ? 'Escolhe uma conversa' : canWrite ? 'Digite uma mensagem' : 'Entre na comunidade para conversar'} disabled={!targetId || !canWrite} />
        <button className="btn social-icon-btn d-none d-md-inline-flex" type="button" aria-label="Figurinhas">:)</button>
        <button className={`btn social-icon-btn mic ${isRecording ? 'recording' : ''}`} type="button" onClick={isRecording ? stopRecording : startRecording} disabled={isPreparingRecording || !targetId || !canWrite} aria-label={isRecording ? 'Finalizar audio' : 'Gravar audio'}>
          {isPreparingRecording ? <span className="spinner-border spinner-border-sm" /> : <span className="mic-symbol" aria-hidden="true" />}
        </button>
        <button className="btn primary-btn social-send-btn" type="submit" disabled={!targetId || !canWrite || !hasTextOrFile}>Enviar</button>
      </div>
    </form>
  );
}

function ChatBubble({
  message,
  mine,
  sender,
  canDelete,
  pinned,
  reactions,
  onReact,
  onReply,
  onForward,
  onPin,
  onCopy,
  onReport,
  onDelete
}: {
  message: ChatMessage;
  mine: boolean;
  sender?: PublicProfile;
  canDelete: boolean;
  pinned: boolean;
  reactions: string[];
  onReact: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onPin: () => void;
  onCopy: () => void;
  onReport: () => void;
  onDelete: (messageId: number) => Promise<void> | void;
}) {
  const visibleBody = message.attachment_url && message.body.trim().toLowerCase() === 'anexo' ? '' : message.body;
  return (
    <article className={`chat-bubble-pro d-flex gap-2 ${mine ? 'mine' : ''}`}>
      {!mine && <ProfileDot profile={sender} />}
      <div>
        {!mine && <strong>{sender?.name || 'Usuario'}</strong>}
        {pinned && <span className="pinned-message-label">Fixada</span>}
        {visibleBody && <p>{visibleBody}</p>}
        {message.attachment_url && <AttachmentPreview message={message} />}
        {reactions.length > 0 && (
          <div className="message-reactions-row">
            {reactions.map((emoji, index) => <span key={`${emoji}-${index}`}>{emoji}</span>)}
          </div>
        )}
        <footer>
          <span>{formatShortDate(message.created_at)}</span>
          <MessageActionMenu
            canDelete={canDelete}
            pinned={pinned}
            onReact={onReact}
            onReply={onReply}
            onForward={onForward}
            onPin={onPin}
            onCopy={onCopy}
            onReport={onReport}
            onDelete={() => onDelete(message.id)}
          />
        </footer>
      </div>
    </article>
  );
}

function AttachmentPreview({ message }: { message: ChatMessage }) {
  if (message.attachment_type === 'image') return <img className="chat-media-preview" src={message.attachment_url} alt={message.attachment_name || 'Imagem enviada'} />;
  if (message.attachment_type === 'video') return <video className="chat-media-preview" src={message.attachment_url} controls />;
  if (message.attachment_type === 'audio') return <AudioPlayer src={message.attachment_url} />;
  return <a className="chat-file-link" href={message.attachment_url} target="_blank" rel="noreferrer">{message.attachment_name || 'Abrir anexo'}</a>;
}

function requestAudioStream() {
  return new Promise<MediaStream>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('audio-permission-timeout')), 10000);
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        window.clearTimeout(timeoutId);
        resolve(stream);
      })
      .catch(error => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function AudioPlayer({ src, compact = false }: { src: string; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrent(value);
  }

  return (
    <div className={`voice-note-player ${compact ? 'compact' : ''}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={event => setCurrent(event.currentTarget.currentTime)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button className="voice-play-button" type="button" onClick={toggleAudio} aria-label={playing ? 'Pausar audio' : 'Ouvir audio'}>
        <span className={playing ? 'pause-icon' : 'play-icon'} />
      </button>
      <div className="voice-wave-wrap">
        <div className={`audio-wave ${playing ? 'playing' : ''}`} aria-hidden="true">
          {Array.from({ length: 24 }).map((_, index) => <span key={index} />)}
        </div>
        <input
          aria-label="Linha do tempo do audio"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={current}
          onChange={event => seek(Number(event.target.value))}
        />
      </div>
      <span>{formatAudioTime(current || duration)}</span>
    </div>
  );
}

function ConversationInfoPanel({
  profile,
  roomProfile,
  incoming,
  outgoing,
  otherProfiles,
  friendships,
  profileById,
  selectedPublicProfile,
  onOpenProfile,
  onRequestFriend,
  onUpdateFriendship
}: {
  profile: Profile;
  roomProfile: PublicProfile;
  incoming: Friendship[];
  outgoing: Friendship[];
  otherProfiles: PublicProfile[];
  friendships: Friendship[];
  profileById: Map<string, PublicProfile>;
  selectedPublicProfile?: PublicProfile;
  onOpenProfile: (profileId: string) => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
}) {
  const relation = relationFor(roomProfile.id, profile.id, friendships);

  return (
    <div className="w-100 p-3 overflow-auto">
      <div className="conversation-profile-card">
        <div className="conversation-profile-banner" style={{ background: roomProfile.banner_url ? `url(${roomProfile.banner_url}) center/cover` : 'linear-gradient(135deg,#5f86ff,#0f1728)' }} />
        <ProfileDot profile={roomProfile} large />
        <h2>{roomProfile.name || 'Usuario'}</h2>
        <p>{roomProfile.bio || 'Sem bio ainda.'}</p>
        <span>{relationLabel(relation)}</span>
        <button className="btn ghost-btn w-100 mt-3" type="button" onClick={() => onOpenProfile(roomProfile.id)}>Ver perfil</button>
      </div>

      <details className="social-sidebar-section mt-3">
        <summary>Pessoas, busca e solicitacoes</summary>
        <PeoplePanel
          profile={profile}
          incoming={incoming}
          outgoing={outgoing}
          otherProfiles={otherProfiles}
          friendships={friendships}
          profileById={profileById}
          selectedPublicProfile={selectedPublicProfile}
          onOpenProfile={onOpenProfile}
          onRequestFriend={onRequestFriend}
          onUpdateFriendship={onUpdateFriendship}
        />
      </details>
    </div>
  );
}

function PeoplePanel({ profile, incoming, outgoing, otherProfiles, friendships, profileById, selectedPublicProfile, onOpenProfile, onRequestFriend, onUpdateFriendship }: {
  profile: Profile;
  incoming: Friendship[];
  outgoing: Friendship[];
  otherProfiles: PublicProfile[];
  friendships: Friendship[];
  profileById: Map<string, PublicProfile>;
  selectedPublicProfile?: PublicProfile;
  onOpenProfile: (profileId: string) => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProfiles = normalizedQuery
    ? otherProfiles.filter(user =>
      `${user.name} ${user.bio}`.toLowerCase().includes(normalizedQuery)
    )
    : otherProfiles;

  return (
    <div className="w-100 p-3 overflow-auto">
      <span className="kicker">Pessoas</span>
      <h2 className="h6 mb-3">Amigos e perfis</h2>
      <input className="form-control input people-search mb-3" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar jogador, bio ou nome" />

      <h3 className="h6 mt-3">Solicitacoes</h3>
      <div className="d-grid gap-2">
        {incoming.map(friendship => {
          const user = profileById.get(friendship.requester_id);
          return (
            <div className="request-row" key={friendship.id}>
              <button type="button" onClick={() => onOpenProfile(friendship.requester_id)}>{user?.name || 'Usuario'}</button>
              <button className="btn primary-btn" type="button" onClick={() => onUpdateFriendship(friendship, 'accepted')}>Aceitar</button>
              <button className="btn ghost-btn" type="button" onClick={() => onUpdateFriendship(friendship, 'rejected')}>Recusar</button>
            </div>
          );
        })}
        {!incoming.length && <div className="soft-empty">Nenhuma solicitacao pendente.</div>}
      </div>

      <h3 className="h6 mt-4">Encontrar jogadores</h3>
      <div className="d-grid gap-2">
        {filteredProfiles.map(user => {
          const relation = relationFor(user.id, profile.id, friendships);
          const disabled = relation?.status === 'accepted' || relation?.status === 'pending';
          return (
            <div className="discover-row" key={user.id}>
              <button type="button" onClick={() => onOpenProfile(user.id)}>
                <ProfileDot profile={user} />
                <span>
                  <strong>{user.name || 'Usuario'}</strong>
                  <small>{user.bio || 'Sem bio'}</small>
                </span>
              </button>
              <button className="btn ghost-btn" type="button" disabled={disabled} onClick={() => onRequestFriend(user.id)}>
                {relationLabel(relation)}
              </button>
            </div>
          );
        })}
        {!filteredProfiles.length && <div className="soft-empty">Nenhum perfil encontrado.</div>}
      </div>

      {outgoing.length > 0 && <p className="muted-note mt-3">{outgoing.length} convite(s) enviado(s).</p>}

      {selectedPublicProfile && (
        <div className="profile-peek mt-3">
          <button className="profile-preview-close btn ghost-btn" type="button" onClick={() => onOpenProfile('')}>Fechar</button>
          <div className="profile-peek-banner" style={{ background: selectedPublicProfile.banner_url ? `url(${selectedPublicProfile.banner_url}) center/cover` : 'linear-gradient(135deg,#4776ff,#101827)' }} />
          <ProfileDot profile={selectedPublicProfile} large />
          <h3>{selectedPublicProfile.name || 'Usuario'}</h3>
          <p>{selectedPublicProfile.bio || 'Sem bio ainda.'}</p>
        </div>
      )}
    </div>
  );
}

function findFirstTarget(friendProfiles: PublicProfile[], groups: ChatGroup[], servers: CommunityServer[], channels: CommunityChannel[]): SocialTarget {
  if (friendProfiles[0]) return { type: 'direct', id: friendProfiles[0].id };
  if (groups[0]) return { type: 'group', id: groups[0].id };
  const firstServer = servers[0];
  const firstChannel = firstServer
    ? channels.find(channel => channel.server_id === firstServer.id && channel.channel_type === 'text') || channels.find(channel => channel.server_id === firstServer.id)
    : undefined;
  return firstChannel ? { type: 'server_channel', id: firstChannel.id } : { type: 'direct', id: '' };
}

function readStoredTarget(): SocialTarget | null {
  try {
    const raw = localStorage.getItem(SOCIAL_TARGET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SocialTarget;
    if (parsed?.type === 'direct' || parsed?.type === 'group' || parsed?.type === 'server_channel') return parsed;
    return null;
  } catch {
    return null;
  }
}

function targetExists(target: SocialTarget, friends: PublicProfile[], groups: ChatGroup[], channels: CommunityChannel[]) {
  if (!target.id) return false;
  if (target.type === 'direct') return friends.some(friend => friend.id === target.id);
  if (target.type === 'group') return groups.some(group => group.id === target.id);
  return channels.some(channel => channel.id === target.id);
}

function filterMessages(messages: ChatMessage[], currentUserId: string, target: SocialTarget) {
  if (!target.id) return [];
  return messages.filter(message => {
    if (target.type === 'direct') {
      return message.conversation_type === 'direct'
        && ((message.sender_id === currentUserId && message.receiver_id === target.id) || (message.sender_id === target.id && message.receiver_id === currentUserId));
    }
    if (target.type === 'group') return message.conversation_type === 'group' && message.group_id === target.id;
    return message.conversation_type === 'server_channel' && message.server_channel_id === target.id;
  });
}

function targetLabel(target: SocialTarget, profileById: Map<string, PublicProfile>, groups: ChatGroup[], channels: CommunityChannel[]) {
  if (target.type === 'direct') return profileById.get(String(target.id))?.name || '';
  if (target.type === 'group') return groups.find(group => group.id === target.id)?.name || '';
  return channels.find(channel => channel.id === target.id)?.name || '';
}

function sortChannels(a: CommunityChannel, b: CommunityChannel) {
  return a.position - b.position || a.id - b.id;
}

function relationFor(targetId: string, currentUserId: string, friendships: Friendship[]) {
  return friendships.find(friendship =>
    (friendship.requester_id === currentUserId && friendship.addressee_id === targetId)
    || (friendship.requester_id === targetId && friendship.addressee_id === currentUserId)
  );
}

function relationLabel(relation?: Friendship) {
  if (!relation) return 'Adicionar';
  if (relation.status === 'accepted') return 'Amigo';
  if (relation.status === 'pending') return 'Pendente';
  if (relation.status === 'blocked') return 'Bloqueado';
  return 'Adicionar';
}

function buildInviteUrl(server: CommunityServer) {
  const code = server.invite_code || String(server.id);
  return `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(code)}`;
}

function normalizeInviteInput(value: string) {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('invite') || trimmed;
  } catch {
    return trimmed;
  }
}

function formatAudioTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
