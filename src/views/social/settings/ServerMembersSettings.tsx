import type { CommunityMemberRole, CommunityRole, CommunityServerMember, PublicProfile } from '../../../types';
import { ServerMemberButton } from '../ServerMemberButton';

export function ServerMembersSettings({ members, roles, memberRoles, profileById, onOpenProfile }: {
  members: CommunityServerMember[];
  roles: CommunityRole[];
  memberRoles: CommunityMemberRole[];
  profileById: Map<string, PublicProfile>;
  onOpenProfile: (profileId: string) => void;
}) {
  return (
    <div className="card social-settings-card">
      <div className="card-body">
        <span className="kicker">Membros</span>
        <div className="row g-2 mt-3">
          {members.map(member => (
            <div className="col-12 col-lg-6" key={member.user_id}>
              <ServerMemberButton member={member} roles={roles} memberRoles={memberRoles} profileById={profileById} onOpenProfile={onOpenProfile} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
