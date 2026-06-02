import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { ChatMessage, CommunityChannelType, CommunityServer, SocialTarget } from '../../types';
import { buildInviteUrl, normalizeInviteInput } from './socialHelpers';

type SocialFormHandlersArgs = {
  target: SocialTarget;
  chatText: string;
  selectedFile: File | null;
  replyToMessage: ChatMessage | null;
  activeVoiceTarget: SocialTarget | null;
  voiceChatText: string;
  groupName: string;
  groupMembers: string[];
  serverName: string;
  serverDescription: string;
  inviteCode: string;
  selectedServer?: CommunityServer;
  channelName: string;
  channelType: CommunityChannelType;
  roleName: string;
  roleColor: string;
  setChatText: Dispatch<SetStateAction<string>>;
  setReplyToMessage: Dispatch<SetStateAction<ChatMessage | null>>;
  setRecordingError: (error: string) => void;
  setFileWithPreview: (file: File | null) => void;
  setVoiceChatText: Dispatch<SetStateAction<string>>;
  setGroupName: Dispatch<SetStateAction<string>>;
  setGroupMembers: Dispatch<SetStateAction<string[]>>;
  setServerName: Dispatch<SetStateAction<string>>;
  setServerDescription: Dispatch<SetStateAction<string>>;
  setInviteCode: Dispatch<SetStateAction<string>>;
  setCopiedInvite: Dispatch<SetStateAction<boolean>>;
  setChannelName: Dispatch<SetStateAction<string>>;
  setRoleName: Dispatch<SetStateAction<string>>;
  onSendChatMessage: (target: SocialTarget, body: string, file?: File | null, replyToMessageId?: number | null) => Promise<void> | void;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void> | void;
  onCreateServer: (name: string, description: string) => Promise<void> | void;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
  onCreateChannel: (serverId: number, name: string, type: CommunityChannelType) => Promise<void> | void;
  onCreateRole: (serverId: number, name: string, color: string) => Promise<void> | void;
};

export function useSocialFormHandlers(args: SocialFormHandlersArgs) {
  async function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!args.target.id || (!args.chatText.trim() && !args.selectedFile)) return;
    await args.onSendChatMessage(args.target, args.chatText, args.selectedFile, args.replyToMessage?.id || null);
    args.setChatText('');
    args.setReplyToMessage(null);
    args.setRecordingError('');
    args.setFileWithPreview(null);
  }

  async function submitVoiceChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!args.activeVoiceTarget || !args.voiceChatText.trim()) return;
    await args.onSendChatMessage(args.activeVoiceTarget, args.voiceChatText);
    args.setVoiceChatText('');
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!args.groupName.trim()) return;
    await args.onCreateGroup(args.groupName, args.groupMembers);
    args.setGroupName('');
    args.setGroupMembers([]);
  }

  async function createServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!args.serverName.trim()) return;
    await args.onCreateServer(args.serverName, args.serverDescription);
    args.setServerName('');
    args.setServerDescription('');
  }

  async function joinByInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!args.inviteCode.trim()) return;
    await args.onJoinServerByInvite(normalizeInviteInput(args.inviteCode));
    args.setInviteCode('');
  }

  async function copyServerInvite(server: CommunityServer) {
    const invite = buildInviteUrl(server);
    try {
      await navigator.clipboard.writeText(invite);
      args.setCopiedInvite(true);
      window.setTimeout(() => args.setCopiedInvite(false), 1600);
    } catch {
      args.setCopiedInvite(false);
    }
  }

  async function createChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!args.selectedServer || !args.channelName.trim()) return;
    await args.onCreateChannel(args.selectedServer.id, args.channelName, args.channelType);
    args.setChannelName('');
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!args.selectedServer || !args.roleName.trim()) return;
    await args.onCreateRole(args.selectedServer.id, args.roleName, args.roleColor);
    args.setRoleName('');
  }

  return {
    submitChat,
    submitVoiceChat,
    createGroup,
    createServer,
    joinByInvite,
    copyServerInvite,
    createChannel,
    createRole
  };
}
