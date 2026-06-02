import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { CommunityServer, SocialTarget } from '../../types';
import { SOCIAL_TARGET_STORAGE_KEY } from './socialHelpers';
import type { SocialSettingsTab } from './socialTypes';

type SocialTargetActionsArgs = {
  selectedServer?: CommunityServer;
  setTargetState: Dispatch<SetStateAction<SocialTarget>>;
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
  setSettingsTab: Dispatch<SetStateAction<SocialSettingsTab>>;
};

export function useSocialTargetActions({
  selectedServer,
  setTargetState,
  setSettingsOpen,
  setSettingsTab
}: SocialTargetActionsArgs) {
  const setTarget = useCallback((nextTarget: SocialTarget) => {
    setTargetState(nextTarget);
    setSettingsOpen(false);
    localStorage.setItem(SOCIAL_TARGET_STORAGE_KEY, JSON.stringify(nextTarget));
  }, [setSettingsOpen, setTargetState]);

  const openServerSettings = useCallback((tab: SocialSettingsTab = 'overview') => {
    if (!selectedServer) return;
    setSettingsTab(tab);
    setSettingsOpen(true);
  }, [selectedServer, setSettingsOpen, setSettingsTab]);

  return { setTarget, openServerSettings };
}
