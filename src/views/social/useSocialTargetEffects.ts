import { useEffect, useRef, type MutableRefObject } from 'react';
import type { ChatGroup, CommunityChannel, Profile, PublicProfile, SocialTarget } from '../../types';
import { normalizeInviteInput, readStoredTarget, targetExists } from './socialHelpers';

type SocialTargetEffectsArgs = {
  profile: Profile | null;
  target: SocialTarget;
  firstTarget: SocialTarget;
  friendProfiles: PublicProfile[];
  chatGroups: ChatGroup[];
  communityChannels: CommunityChannel[];
  selectedChannel?: CommunityChannel;
  inviteHandledRef: MutableRefObject<boolean>;
  setTarget: (target: SocialTarget) => void;
  setSettingsOpen: (open: boolean) => void;
  onJoinServerByInvite: (invite: string) => Promise<void> | void;
};

export function useSocialTargetEffects({
  profile,
  target,
  firstTarget,
  friendProfiles,
  chatGroups,
  communityChannels,
  selectedChannel,
  inviteHandledRef,
  setTarget,
  setSettingsOpen,
  onJoinServerByInvite
}: SocialTargetEffectsArgs) {
  const restoredTargetRef = useRef(false);

  useEffect(() => {
    if (restoredTargetRef.current || !firstTarget.id) return;
    restoredTargetRef.current = true;
    const saved = readStoredTarget();
    const nextTarget = saved && targetExists(saved, friendProfiles, chatGroups, communityChannels) ? saved : firstTarget;
    setTarget(nextTarget);
  }, [chatGroups, communityChannels, firstTarget, friendProfiles, setTarget]);

  useEffect(() => {
    if (!target.id && firstTarget.id) setTarget(firstTarget);
  }, [firstTarget, setTarget, target.id]);

  useEffect(() => {
    if (target.id && !targetExists(target, friendProfiles, chatGroups, communityChannels)) setTarget(firstTarget);
  }, [chatGroups, communityChannels, firstTarget, friendProfiles, setTarget, target]);

  useEffect(() => {
    if (selectedChannel?.channel_type !== 'voice') return;
    const fallbackChannel = communityChannels.find(channel => channel.server_id === selectedChannel.server_id && channel.channel_type === 'text');
    if (fallbackChannel) {
      setTarget({ type: 'server_channel', id: fallbackChannel.id });
    } else {
      setTarget(firstTarget);
    }
  }, [communityChannels, firstTarget, selectedChannel?.channel_type, selectedChannel?.server_id, setTarget]);

  useEffect(() => {
    if (!profile || inviteHandledRef.current) return;
    const invite = new URLSearchParams(window.location.search).get('invite');
    if (!invite) return;

    inviteHandledRef.current = true;
    void onJoinServerByInvite(normalizeInviteInput(invite));
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('invite');
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, [inviteHandledRef, onJoinServerByInvite, profile]);

  useEffect(() => {
    if (target.type !== 'server_channel') setSettingsOpen(false);
  }, [setSettingsOpen, target.type]);
}
