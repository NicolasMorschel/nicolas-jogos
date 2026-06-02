import type { Dispatch, SetStateAction } from 'react';
import type { CommunityVoicePresence } from '../../types';

type SocialVoiceActionsArgs = {
  profileId: string;
  activeVoicePresence?: CommunityVoicePresence;
  setVoiceChatOpen: Dispatch<SetStateAction<boolean>>;
  onJoinVoice: (channelId: number) => Promise<void> | void;
  onLeaveVoice: (channelId: number) => Promise<void> | void;
};

export function useSocialVoiceActions({
  profileId,
  activeVoicePresence,
  setVoiceChatOpen,
  onJoinVoice,
  onLeaveVoice
}: SocialVoiceActionsArgs) {
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

  return { enterVoiceChannel, leaveActiveVoice };
}
