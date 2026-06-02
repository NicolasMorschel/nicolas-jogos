import type { AuthState, Friendship, Profile } from '../../types';
import { useChatActions } from './useChatActions';
import { useCommunityActions } from './useCommunityActions';
import { useFriendActions } from './useFriendActions';

export function useSocialActions({
  auth,
  friendships,
  refreshAll,
  showToast
}: {
  auth: AuthState;
  friendships: Friendship[];
  refreshAll: () => Promise<Profile | null>;
  showToast: (message: string) => void;
}) {
  return {
    ...useFriendActions({ auth, friendships, refreshAll, showToast }),
    ...useChatActions({ auth, refreshAll, showToast }),
    ...useCommunityActions({ auth, refreshAll, showToast })
  };
}
