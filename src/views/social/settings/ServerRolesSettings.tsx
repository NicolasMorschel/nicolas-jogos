import type { FormEvent } from 'react';
import type { CommunityMemberRole, CommunityRole, CommunityServer, CommunityServerMember, PublicProfile } from '../../../types';

export function ServerRolesSettings({
  server,
  members,
  roles,
  roleUserId,
  setRoleUserId,
  roleId,
  setRoleId,
  roleName,
  setRoleName,
  roleColor,
  setRoleColor,
  createRole,
  onDeleteRole,
  onUpdateRoleVoicePermission,
  onAssignRole,
  profileById
}: {
  server: CommunityServer;
  members: CommunityServerMember[];
  roles: CommunityRole[];
  memberRoles: CommunityMemberRole[];
  roleUserId: string;
  setRoleUserId: (value: string) => void;
  roleId: string;
  setRoleId: (value: string) => void;
  roleName: string;
  setRoleName: (value: string) => void;
  roleColor: string;
  setRoleColor: (value: string) => void;
  createRole: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteRole: (roleId: number) => Promise<void> | void;
  onUpdateRoleVoicePermission: (roleId: number, canModerateVoice: boolean) => Promise<void> | void;
  onAssignRole: (serverId: number, userId: string, roleId: number) => Promise<void> | void;
  profileById: Map<string, PublicProfile>;
}) {
  return (
    <div className="row g-3">
      <div className="col-12 col-xl-5">
        <form className="card social-settings-card h-100" onSubmit={createRole}>
          <div className="card-body">
            <span className="kicker">Novo cargo</span>
            <input className="form-control mt-3 mb-2" value={roleName} onChange={event => setRoleName(event.target.value)} placeholder="Nome do cargo" />
            <input className="form-control form-control-color mb-3" value={roleColor} onChange={event => setRoleColor(event.target.value)} type="color" />
            <button className="btn btn-primary w-100" type="submit">Criar cargo</button>
          </div>
        </form>
      </div>
      <div className="col-12 col-xl-7">
        <div className="card social-settings-card h-100">
          <div className="card-body">
            <span className="kicker">Aplicar cargo</span>
            <div className="row g-2 mt-3">
              <div className="col-12 col-lg">
                <select className="form-select" value={roleUserId} onChange={event => setRoleUserId(event.target.value)}>
                  <option value="">Membro</option>
                  {members.map(member => <option key={member.user_id} value={member.user_id}>{profileById.get(member.user_id)?.name || 'Usuario'}</option>)}
                </select>
              </div>
              <div className="col-12 col-lg">
                <select className="form-select" value={roleId} onChange={event => setRoleId(event.target.value)}>
                  <option value="">Cargo</option>
                  {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </div>
              <div className="col-12 col-lg-auto">
                <button className="btn btn-primary w-100" type="button" onClick={() => roleUserId && roleId && onAssignRole(server.id, roleUserId, Number(roleId))}>Aplicar</button>
              </div>
            </div>
            <div className="social-management-list mt-4">
              {roles.map(role => (
                <div className="social-management-row" key={role.id}>
                  <div className="d-flex flex-column gap-2">
                    <span className="role-chip" style={{ borderColor: role.color, color: role.color }}>{role.name}</span>
                    <div className="form-check form-switch">
                      <input
                        checked={!!role.can_moderate_voice}
                        className="form-check-input"
                        id={`voice-moderate-${role.id}`}
                        type="checkbox"
                        onChange={event => onUpdateRoleVoicePermission(role.id, event.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`voice-moderate-${role.id}`}>Pode remover da call</label>
                    </div>
                  </div>
                  <button className="btn btn-outline-light" type="button" onClick={() => window.confirm('Excluir este cargo?') && onDeleteRole(role.id)}>Excluir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
