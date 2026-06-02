import type { CommunityMemberRole, CommunityRole, CommunityServer, CommunityServerMember, Friendship, Profile, PublicProfile } from '../../types';
import { ConversationInfoPanel, MembersPanel, PeoplePanel } from './SocialInfoPanels';
import type { SocialSettingsTab } from './socialTypes';

type SocialRightPanelProps = {
  selectedServer?: CommunityServer;
  roomProfile?: PublicProfile;
  profile: Profile;
  serverMembers: CommunityServerMember[];
  serverRoles: CommunityRole[];
  selectedServerMemberRoles: CommunityMemberRole[];
  profileById: Map<string, PublicProfile>;
  openSettings: (tab?: SocialSettingsTab) => void;
  incoming: Friendship[];
  outgoing: Friendship[];
  otherProfiles: PublicProfile[];
  friendships: Friendship[];
  onOpenProfile: (profileId: string) => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
};

export function SocialRightPanel({
  selectedServer,
  roomProfile,
  profile,
  serverMembers,
  serverRoles,
  selectedServerMemberRoles,
  profileById,
  openSettings,
  incoming,
  outgoing,
  otherProfiles,
  friendships,
  onOpenProfile,
  onRequestFriend,
  onUpdateFriendship
}: SocialRightPanelProps) {
  return (
    <aside className="col-12 col-xl-2 d-flex social-member-panel flex-column">
      {selectedServer ? (
        <MembersPanel
          server={selectedServer}
          members={serverMembers}
          roles={serverRoles}
          memberRoles={selectedServerMemberRoles}
          profileById={profileById}
          openSettings={openSettings}
          onOpenProfile={onOpenProfile}
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
          onOpenProfile={onOpenProfile}
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
          onOpenProfile={onOpenProfile}
          onRequestFriend={onRequestFriend}
          onUpdateFriendship={onUpdateFriendship}
        />
      )}
    </aside>
  );
}
