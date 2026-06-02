import type { ChatGroup, CommunityChannel, CommunityServer, Profile, PublicProfile, SocialTarget } from '../../types';
import { ProfileDot } from './SocialPrimitives';

export function ServerDock({ profile, selectedServer, servers, channels, friendProfiles, groups, setTarget }: {
  profile: Profile;
  selectedServer?: CommunityServer;
  servers: CommunityServer[];
  channels: CommunityChannel[];
  friendProfiles: PublicProfile[];
  groups: ChatGroup[];
  setTarget: (target: SocialTarget) => void;
}) {
  const firstHomeTarget = firstSidebarTarget(friendProfiles, groups);

  return (
    <aside className="col-auto social-server-dock d-flex flex-lg-column align-items-center gap-2 p-2 overflow-auto">
      <button className={`btn social-dock-home ${!selectedServer ? 'active' : ''}`} type="button" onClick={() => setTarget(firstHomeTarget)}>
        NJ
      </button>
      <div className="social-dock-divider d-none d-lg-block" />
      {servers.map(server => {
        const firstChannel = channels.find(channel => channel.server_id === server.id && channel.channel_type === 'text')
          || channels.find(channel => channel.server_id === server.id);
        return (
          <button
            className={`btn social-dock-server ${selectedServer?.id === server.id ? 'active' : ''}`}
            key={server.id}
            title={server.name}
            type="button"
            onClick={() => firstChannel && setTarget({ type: 'server_channel', id: firstChannel.id })}
          >
            {server.name.slice(0, 1).toUpperCase()}
          </button>
        );
      })}
      <div className="mt-lg-auto d-none d-lg-grid gap-2">
        <ProfileDot profile={profile} />
      </div>
    </aside>
  );
}

function firstSidebarTarget(friendProfiles: PublicProfile[], groups: ChatGroup[]): SocialTarget {
  if (friendProfiles[0]) return { type: 'direct', id: friendProfiles[0].id };
  if (groups[0]) return { type: 'group', id: groups[0].id };
  return { type: 'direct', id: '' };
}
