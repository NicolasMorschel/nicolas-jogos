import type { CommunityServer, PublicProfile } from '../../../types';
import { buildInviteUrl } from '../socialHelpers';

export function ServerOverviewSettings({
  server,
  addableFriends,
  memberToAdd,
  setMemberToAdd,
  copiedInvite,
  copyServerInvite,
  onAddMember,
  onUpdateVisibility,
  onDeleteServer
}: {
  server: CommunityServer;
  addableFriends: PublicProfile[];
  memberToAdd: string;
  setMemberToAdd: (value: string) => void;
  copiedInvite: boolean;
  copyServerInvite: (server: CommunityServer) => Promise<void> | void;
  onAddMember: (serverId: number, userId: string) => Promise<void> | void;
  onUpdateVisibility: (serverId: number, visibility: CommunityServer['visibility']) => Promise<void> | void;
  onDeleteServer: (serverId: number) => Promise<void> | void;
}) {
  return (
    <div className="row g-3">
      <div className="col-12 col-xl-7">
        <div className="card social-settings-card h-100">
          <div className="card-body">
            <span className="kicker">Perfil do servidor</span>
            <h3 className="h4 mt-2">{server.name}</h3>
            <p className="text-secondary-emphasis mb-0">{server.description || 'Sem resumo ainda.'}</p>
            <div className="row g-2 mt-4">
              <div className="col-12 col-lg-5">
                <label className="form-label">Visibilidade</label>
                <select className="form-select" value={server.visibility || 'private'} onChange={event => onUpdateVisibility(server.id, event.target.value as CommunityServer['visibility'])}>
                  <option value="private">Privado</option>
                  <option value="public">Publico</option>
                </select>
              </div>
              <div className="col-12 col-lg">
                <label className="form-label">Convite</label>
                <div className="input-group">
                  <input className="form-control" value={buildInviteUrl(server)} readOnly />
                  <button className="btn btn-outline-light" type="button" onClick={() => copyServerInvite(server)}>{copiedInvite ? 'Copiado' : 'Copiar'}</button>
                </div>
              </div>
            </div>
            <div className="server-danger-zone mt-4">
              <div>
                <strong>Excluir servidor</strong>
                <span>Remove canais, cargos, membros e mensagens desse servidor.</span>
              </div>
              <button className="btn danger-btn" type="button" onClick={() => window.confirm('Excluir este servidor inteiro?') && onDeleteServer(server.id)}>Excluir</button>
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 col-xl-5">
        <div className="card social-settings-card h-100">
          <div className="card-body">
            <span className="kicker">Convidar amigo</span>
            <div className="input-group mt-3">
              <select className="form-select" value={memberToAdd} onChange={event => setMemberToAdd(event.target.value)}>
                <option value="">Escolhe um amigo</option>
                {addableFriends.map(friend => <option key={friend.id} value={friend.id}>{friend.name}</option>)}
              </select>
              <button className="btn btn-primary" type="button" onClick={() => memberToAdd && onAddMember(server.id, memberToAdd)}>Adicionar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
