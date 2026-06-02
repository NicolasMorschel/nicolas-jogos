import type { CommunityMemberRole, CommunityRole, CommunityServerMember, PublicProfile } from '../../types';
import { ProfileDot } from './SocialPrimitives';

export function ServerMemberButton({ member, roles, memberRoles, profileById, onOpenProfile }: {
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
