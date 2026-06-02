import type { CommunityChannel, CommunityVoicePresence, PublicProfile, SocialTarget } from '../../types';
import { ProfileDot } from './SocialPrimitives';

export function ChannelSection({ title, channels, target, profileById, voicePresence = [], activeVoiceChannel, speakingUserId, isRecording = false, muted = false, setTarget, onJoinVoiceChannel }: {
  title: string;
  channels: CommunityChannel[];
  target: SocialTarget;
  profileById?: Map<string, PublicProfile>;
  voicePresence?: CommunityVoicePresence[];
  activeVoiceChannel?: CommunityChannel;
  speakingUserId?: string;
  isRecording?: boolean;
  muted?: boolean;
  setTarget: (target: SocialTarget) => void;
  onJoinVoiceChannel?: (channelId: number) => Promise<void> | void;
}) {
  return (
    <section className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="kicker">{title}</span>
      </div>
      <div className="nav nav-pills flex-column gap-1">
        {channels.map(channel => {
          const isVoice = channel.channel_type === 'voice';
          const channelPresences = isVoice ? voicePresence.filter(presence => presence.channel_id === channel.id) : [];
          const active = isVoice
            ? activeVoiceChannel?.id === channel.id
            : target.type === 'server_channel' && target.id === channel.id;
          return (
            <div className="voice-channel-wrap" key={channel.id}>
              <button
                className={`btn text-start social-channel-btn ${active ? 'active' : ''}`}
                type="button"
                onClick={() => isVoice ? onJoinVoiceChannel?.(channel.id) : setTarget({ type: 'server_channel', id: channel.id })}
              >
                <span>{isVoice ? '>' : '#'}</span>
                {channel.name}
              </button>
              {isVoice && (
                <div className="voice-channel-members">
                  {channelPresences.map(presence => {
                    const member = profileById?.get(presence.user_id);
                    const speaking = activeVoiceChannel?.id === channel.id && isRecording && !muted && presence.user_id === speakingUserId;
                    return (
                      <span className={`voice-channel-member ${speaking ? 'speaking' : ''}`} key={presence.user_id}>
                        <ProfileDot profile={member} speaking={speaking} />
                        <small>{member?.name || 'Usuario'}</small>
                      </span>
                    );
                  })}
                  {channelPresences.length === 0 && active && <span className="voice-channel-member muted">Entrando...</span>}
                </div>
              )}
            </div>
          );
        })}
        {!channels.length && <div className="soft-empty">Nenhum canal ainda.</div>}
      </div>
    </section>
  );
}
