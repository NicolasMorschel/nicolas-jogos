import { useState } from 'react';
import type {
  CommunityMemberRole,
  CommunityRole,
  CommunityServer,
  CommunityServerMember,
  Friendship,
  Profile,
  PublicProfile
} from '../../types';
import { ProfileDot } from './SocialPrimitives';
import { relationFor, relationLabel } from './socialHelpers';
import type { SocialSettingsTab } from './socialTypes';
import { ServerMemberButton } from './ServerMemberButton';

export function MembersPanel({ server, members, roles, memberRoles, profileById, openSettings, onOpenProfile }: {
  server: CommunityServer;
  members: CommunityServerMember[];
  roles: CommunityRole[];
  memberRoles: CommunityMemberRole[];
  profileById: Map<string, PublicProfile>;
  openSettings: (tab?: SocialSettingsTab) => void;
  onOpenProfile: (profileId: string) => void;
}) {
  return (
    <div className="w-100 p-3 overflow-auto">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="kicker">Membros</div>
          <h2 className="h6 mb-0">{server.name}</h2>
        </div>
        <button className="btn btn-sm btn-outline-light" type="button" onClick={() => openSettings('members')}>Ver</button>
      </div>
      <div className="d-grid gap-2">
        {members.map(member => (
          <ServerMemberButton key={member.user_id} member={member} roles={roles} memberRoles={memberRoles} profileById={profileById} onOpenProfile={onOpenProfile} />
        ))}
      </div>
    </div>
  );
}

export function ConversationInfoPanel({
  profile,
  roomProfile,
  incoming,
  outgoing,
  otherProfiles,
  friendships,
  profileById,
  onOpenProfile,
  onRequestFriend,
  onUpdateFriendship
}: {
  profile: Profile;
  roomProfile: PublicProfile;
  incoming: Friendship[];
  outgoing: Friendship[];
  otherProfiles: PublicProfile[];
  friendships: Friendship[];
  profileById: Map<string, PublicProfile>;
  onOpenProfile: (profileId: string) => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
}) {
  const relation = relationFor(roomProfile.id, profile.id, friendships);

  return (
    <div className="w-100 p-3 overflow-auto">
      <div className="conversation-compact-card card social-tool-card">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <ProfileDot profile={roomProfile} />
            <div className="min-w-0">
              <span className="kicker">Conversa</span>
              <h2 className="h6 mb-0 text-truncate">{roomProfile.name || 'Usuario'}</h2>
            </div>
          </div>
          <p className="muted-note mb-3">{roomProfile.bio || 'Sem bio ainda.'}</p>
          <div className="d-flex align-items-center justify-content-between gap-2">
            <span className="relation-pill">{relationLabel(relation)}</span>
            <button className="btn btn-sm btn-outline-light" type="button" onClick={() => onOpenProfile(roomProfile.id)}>Ver perfil</button>
          </div>
        </div>
      </div>

      <details className="social-sidebar-section mt-3">
        <summary>Pessoas e convites</summary>
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
      </details>
    </div>
  );
}

export function PeoplePanel({ profile, incoming, outgoing, otherProfiles, friendships, profileById, onOpenProfile, onRequestFriend, onUpdateFriendship }: {
  profile: Profile;
  incoming: Friendship[];
  outgoing: Friendship[];
  otherProfiles: PublicProfile[];
  friendships: Friendship[];
  profileById: Map<string, PublicProfile>;
  onOpenProfile: (profileId: string) => void;
  onRequestFriend: (targetId: string) => void;
  onUpdateFriendship: (friendship: Friendship, status: Friendship['status']) => void;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProfiles = normalizedQuery
    ? otherProfiles.filter(user =>
      `${user.name} ${user.bio}`.toLowerCase().includes(normalizedQuery)
    )
    : otherProfiles;
  return (
    <div className="w-100 p-3 overflow-auto">
      <span className="kicker">Pessoas</span>
      <h2 className="h6 mb-3">Amigos e perfis</h2>
      <input className="form-control people-search mb-3" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar jogador, bio ou nome" />

      <h3 className="h6 mt-3">Solicitacoes</h3>
      <div className="d-grid gap-2">
        {incoming.map(friendship => {
          const user = profileById.get(friendship.requester_id);
          return (
            <div className="request-row" key={friendship.id}>
              <button type="button" onClick={() => onOpenProfile(friendship.requester_id)}>{user?.name || 'Usuario'}</button>
              <button className="btn btn-primary" type="button" onClick={() => onUpdateFriendship(friendship, 'accepted')}>Aceitar</button>
              <button className="btn btn-outline-light" type="button" onClick={() => onUpdateFriendship(friendship, 'rejected')}>Recusar</button>
            </div>
          );
        })}
        {!incoming.length && <div className="soft-empty">Nenhuma solicitacao pendente.</div>}
      </div>

      <h3 className="h6 mt-4">Encontrar jogadores</h3>
      <div className="d-grid gap-2">
        {filteredProfiles.map(user => {
          const relation = relationFor(user.id, profile.id, friendships);
          const disabled = relation?.status === 'accepted' || relation?.status === 'pending';
          return (
            <div className="discover-row" key={user.id}>
              <button type="button" onClick={() => onOpenProfile(user.id)}>
                <ProfileDot profile={user} />
                <span>
                  <strong>{user.name || 'Usuario'}</strong>
                  <small>{user.bio || 'Sem bio'}</small>
                </span>
              </button>
              <button className="btn btn-outline-light" type="button" disabled={disabled} onClick={() => onRequestFriend(user.id)}>
                {relationLabel(relation)}
              </button>
            </div>
          );
        })}
        {!filteredProfiles.length && <div className="soft-empty">Nenhum perfil encontrado.</div>}
      </div>

      {outgoing.length > 0 && <p className="muted-note mt-3">{outgoing.length} convite(s) enviado(s).</p>}
    </div>
  );
}
