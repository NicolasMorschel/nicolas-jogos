import type { FormEvent } from 'react';
import type { CommunityChannel, CommunityChannelType } from '../../../types';

export function ServerChannelsSettings({
  channels,
  channelName,
  setChannelName,
  channelType,
  setChannelType,
  createChannel,
  onDeleteChannel
}: {
  channels: CommunityChannel[];
  channelName: string;
  setChannelName: (value: string) => void;
  channelType: CommunityChannelType;
  setChannelType: (value: CommunityChannelType) => void;
  createChannel: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteChannel: (channelId: number) => Promise<void> | void;
}) {
  return (
    <div className="card social-settings-card">
      <div className="card-body">
        <span className="kicker">Canais</span>
        <form className="row g-2 mt-3" onSubmit={createChannel}>
          <div className="col-12 col-lg">
            <input className="form-control" value={channelName} onChange={event => setChannelName(event.target.value)} placeholder="Nome do canal" />
          </div>
          <div className="col-12 col-lg-3">
            <select className="form-select" value={channelType} onChange={event => setChannelType(event.target.value as CommunityChannelType)}>
              <option value="text">Texto</option>
              <option value="voice">Voz</option>
            </select>
          </div>
          <div className="col-12 col-lg-auto">
            <button className="btn btn-primary w-100" type="submit">Criar canal</button>
          </div>
        </form>
        <div className="social-management-list mt-4">
          {channels.map(channel => (
            <div className="social-management-row" key={channel.id}>
              <div>
                <strong>{channel.channel_type === 'voice' ? 'Voz' : '#'} {channel.name}</strong>
                <span>{channel.channel_type === 'voice' ? 'Canal de voz' : 'Canal de texto'}</span>
              </div>
              <button className="btn btn-outline-light" type="button" onClick={() => window.confirm('Excluir este canal?') && onDeleteChannel(channel.id)}>Excluir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
