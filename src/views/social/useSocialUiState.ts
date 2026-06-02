import { useRef, useState } from 'react';
import type { ChatMessage, CommunityChannelType, SocialTarget } from '../../types';
import type { SocialSettingsTab } from './socialTypes';

export function useSocialUiState() {
  const [target, setTargetState] = useState<SocialTarget>({ type: 'direct', id: '' });
  const [chatText, setChatText] = useState('');
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
  const [inviteCode, setInviteCode] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SocialSettingsTab>('overview');
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  const [voiceChatText, setVoiceChatText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inviteHandledRef = useRef(false);

  return {
    target,
    setTargetState,
    chatText,
    setChatText,
    groupName,
    setGroupName,
    groupMembers,
    setGroupMembers,
    serverName,
    setServerName,
    serverDescription,
    setServerDescription,
    channelName,
    setChannelName,
    channelType,
    setChannelType,
    roleName,
    setRoleName,
    roleColor,
    setRoleColor,
    memberToAdd,
    setMemberToAdd,
    roleUserId,
    setRoleUserId,
    roleId,
    setRoleId,
    inviteCode,
    setInviteCode,
    copiedInvite,
    setCopiedInvite,
    settingsOpen,
    setSettingsOpen,
    settingsTab,
    setSettingsTab,
    muted,
    setMuted,
    deafened,
    setDeafened,
    voiceChatOpen,
    setVoiceChatOpen,
    voiceChatText,
    setVoiceChatText,
    replyToMessage,
    setReplyToMessage,
    fileInputRef,
    inviteHandledRef
  };
}

export type SocialUiState = ReturnType<typeof useSocialUiState>;
