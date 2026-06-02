import type { Dispatch, FormEvent, RefObject, SetStateAction } from 'react';
import type {
  ChatMessage,
  ChatMessageReaction,
  CommunityChannel,
  CommunityChannelType,
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  Profile,
  PublicProfile,
  SocialTarget
} from '../../types';
import { MessageComposer } from './ChatComposer';
import { ServerSettingsPanel } from './ServerSettingsPanel';
import { SocialChatHeader } from './SocialChatHeader';
import { SocialMessageStream } from './SocialMessageStream';
import { VoiceCallPanel } from './VoiceCallPanel';
import type { SocialSettingsTab } from './socialTypes';

type SocialMainStageProps = {
  target: SocialTarget;
  profile: Profile;
  selectedTitle: string;
  selectedSubtitle: string;
  selectedServer?: CommunityServer;
  selectedChannel?: CommunityChannel;
  roomProfile?: PublicProfile;
  settingsOpen: boolean;
  settingsTab: SocialSettingsTab;
  setSettingsTab: (tab: SocialSettingsTab) => void;
  openSettings: (tab?: SocialSettingsTab) => void;
  closeSettings: () => void;
  openProfile: () => void;
  canManageSelectedServer: boolean;
  serverChannels: CommunityChannel[];
  serverMembers: CommunityServerMember[];
  serverRoles: CommunityRole[];
  selectedServerMemberRoles: CommunityMemberRole[];
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
  onAddServerMember: (serverId: number, userId: string) => Promise<void> | void;
  onUpdateServerVisibility: (serverId: number, visibility: CommunityServer['visibility']) => Promise<void> | void;
  onDeleteServer: (serverId: number) => Promise<void> | void;
  onDeleteChannel: (channelId: number) => Promise<void> | void;
  onDeleteRole: (roleId: number) => Promise<void> | void;
  onUpdateRoleVoicePermission: (roleId: number, canModerateVoice: boolean) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  onOpenProfile: (profileId: string) => void;
  activeVoiceChannel?: CommunityChannel;
  activeVoiceServer?: CommunityServer;
  activeVoicePresences: Array<{ channel_id: number; user_id: string; joined_at: string }>;
  voiceChatOpen: boolean;
  muted: boolean;
  deafened: boolean;
  isRecording: boolean;
  canModerateActiveVoice: boolean;
  voiceMessages: ChatMessage[];
  voiceChatText: string;
  setVoiceChatText: (value: string) => void;
  onToggleVoiceChat: () => void;
  onToggleMuted: () => void;
  onToggleDeafened: () => void;
  submitVoiceChat: (event: FormEvent<HTMLFormElement>) => void;
  leaveActiveVoice: () => Promise<void> | void;
  onKickVoiceMember: (channelId: number, targetUserId: string) => Promise<void> | void;
  isSelectedServerMember: boolean;
  messages: ChatMessage[];
  messageById: Map<number, ChatMessage>;
  reactionsByMessageId: Map<number, ChatMessageReaction[]>;
  pinnedMessageIds: Set<number>;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
  onReactMessage: (messageId: number, emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onPin: (messageId: number) => void;
  onCopy: (message: ChatMessage) => void;
  onReport: (message: ChatMessage) => void;
  onDeleteMessage: (messageId: number) => Promise<void> | void;
  chatText: string;
  setChatText: Dispatch<SetStateAction<string>>;
  selectedFile: File | null;
  selectedFileUrl: string;
  setFileWithPreview: (file: File | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isPreparingRecording: boolean;
  recordingError: string;
  replyToMessage: ChatMessage | null;
  onCancelReply: () => void;
  startRecording: () => Promise<void> | void;
  stopRecording: () => Promise<void> | void;
  submitChat: (event: FormEvent<HTMLFormElement>) => void;
};

export function SocialMainStage(props: SocialMainStageProps) {
  return (
    <main className="col social-chat-stage d-flex flex-column min-w-0">
      <SocialChatHeader
        title={props.selectedTitle || 'Escolhe uma conversa'}
        subtitle={props.selectedSubtitle}
        selectedServer={props.selectedServer}
        selectedChannel={props.selectedChannel}
        roomProfile={props.roomProfile}
        canManageServer={props.canManageSelectedServer}
        settingsOpen={props.settingsOpen}
        openSettings={props.openSettings}
        closeSettings={props.closeSettings}
        openProfile={props.openProfile}
      />

      {props.settingsOpen && props.selectedServer ? (
        <ServerSettingsPanel
          tab={props.settingsTab}
          setTab={props.setSettingsTab}
          server={props.selectedServer}
          channels={props.serverChannels}
          members={props.serverMembers}
          roles={props.serverRoles}
          memberRoles={props.selectedServerMemberRoles}
          addableFriends={props.addableFriends}
          profileById={props.profileById}
          memberToAdd={props.memberToAdd}
          setMemberToAdd={props.setMemberToAdd}
          roleUserId={props.roleUserId}
          setRoleUserId={props.setRoleUserId}
          roleId={props.roleId}
          setRoleId={props.setRoleId}
          roleName={props.roleName}
          setRoleName={props.setRoleName}
          roleColor={props.roleColor}
          setRoleColor={props.setRoleColor}
          channelName={props.channelName}
          setChannelName={props.setChannelName}
          channelType={props.channelType}
          setChannelType={props.setChannelType}
          copiedInvite={props.copiedInvite}
          createChannel={props.createChannel}
          createRole={props.createRole}
          copyServerInvite={props.copyServerInvite}
          onAddMember={props.onAddServerMember}
          onUpdateVisibility={props.onUpdateServerVisibility}
          onDeleteServer={props.onDeleteServer}
          onDeleteChannel={props.onDeleteChannel}
          onDeleteRole={props.onDeleteRole}
          onUpdateRoleVoicePermission={props.onUpdateRoleVoicePermission}
          onAssignRole={props.onAssignRole}
          onOpenProfile={props.onOpenProfile}
        />
      ) : (
        <>
          {props.activeVoiceChannel && (
            <VoiceCallPanel
              channel={props.activeVoiceChannel}
              server={props.activeVoiceServer}
              profile={props.profile}
              profileById={props.profileById}
              presences={props.activeVoicePresences}
              expanded={props.voiceChatOpen}
              muted={props.muted}
              deafened={props.deafened}
              isRecording={props.isRecording}
              canModerateVoice={props.canModerateActiveVoice}
              messages={props.voiceMessages}
              voiceText={props.voiceChatText}
              setVoiceText={props.setVoiceChatText}
              onToggleExpanded={props.onToggleVoiceChat}
              onToggleMuted={props.onToggleMuted}
              onToggleDeafened={props.onToggleDeafened}
              onSubmitMessage={props.submitVoiceChat}
              onLeave={props.leaveActiveVoice}
              onKickMember={props.onKickVoiceMember}
            />
          )}

          <SocialMessageStream
            selectedServer={props.selectedServer}
            isSelectedServerMember={props.isSelectedServerMember}
            messages={props.messages}
            profile={props.profile}
            profileById={props.profileById}
            messageById={props.messageById}
            reactionsByMessageId={props.reactionsByMessageId}
            pinnedMessageIds={props.pinnedMessageIds}
            onJoinServerByInvite={props.onJoinServerByInvite}
            onReact={props.onReactMessage}
            onReply={props.onReply}
            onForward={props.onForward}
            onPin={props.onPin}
            onCopy={props.onCopy}
            onReport={props.onReport}
            onDelete={props.onDeleteMessage}
            onOpenProfile={props.onOpenProfile}
          />

          <MessageComposer
            targetId={props.target.id}
            chatText={props.chatText}
            setChatText={props.setChatText}
            selectedFile={props.selectedFile}
            selectedFileUrl={props.selectedFileUrl}
            setFileWithPreview={props.setFileWithPreview}
            fileInputRef={props.fileInputRef}
            isRecording={props.isRecording}
            isPreparingRecording={props.isPreparingRecording}
            recordingError={props.recordingError}
            replyToMessage={props.replyToMessage}
            replySenderName={props.replyToMessage ? props.profileById.get(props.replyToMessage.sender_id)?.name || 'Usuario' : ''}
            onCancelReply={props.onCancelReply}
            startRecording={props.startRecording}
            stopRecording={props.stopRecording}
            canWrite={!props.selectedServer || props.isSelectedServerMember}
            submitChat={props.submitChat}
          />
        </>
      )}
    </main>
  );
}
