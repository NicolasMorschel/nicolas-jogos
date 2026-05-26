import type { GameRestriction, GameRestrictionDuration, GameRestrictionType } from '../types';

export function isRestrictionActive(restriction: GameRestriction) {
  if (restriction.revoked_at) return false;
  if (!restriction.expires_at) return true;
  return new Date(restriction.expires_at).getTime() > Date.now();
}

export function isBanRestriction(restriction: GameRestriction) {
  return restriction.restriction_type === 'temporary_ban' || restriction.restriction_type === 'permanent_ban';
}

export function activeRestrictionsForGame(restrictions: GameRestriction[], gameId: number) {
  return restrictions.filter(restriction => Number(restriction.game_id) === Number(gameId) && isRestrictionActive(restriction));
}

export function activeBanForGame(restrictions: GameRestriction[], gameId: number) {
  const activeBans = activeRestrictionsForGame(restrictions, gameId).filter(isBanRestriction);
  return activeBans.find(restriction => restriction.restriction_type === 'permanent_ban') || activeBans[0] || null;
}

export function activeWarningsForGame(restrictions: GameRestriction[], gameId: number) {
  return activeRestrictionsForGame(restrictions, gameId).filter(restriction => restriction.restriction_type === 'warning');
}

export function restrictionTypeLabel(type: GameRestrictionType) {
  if (type === 'warning') return 'Aviso';
  if (type === 'temporary_ban') return 'Ban temporário';
  return 'Ban permanente';
}

export function restrictionDurationLabel(duration: GameRestrictionDuration) {
  if (duration === '24h') return '24 horas';
  if (duration === '7d') return '7 dias';
  return '30 dias';
}

export function expiresAtForDuration(duration: GameRestrictionDuration) {
  const now = new Date();
  const hours = duration === '24h' ? 24 : duration === '7d' ? 24 * 7 : 24 * 30;
  now.setHours(now.getHours() + hours);
  return now.toISOString();
}

export function restrictionStatusText(restriction: GameRestriction) {
  if (restriction.revoked_at) return 'Revogado';
  if (restriction.expires_at && new Date(restriction.expires_at).getTime() <= Date.now()) return 'Expirado';
  if (restriction.restriction_type === 'permanent_ban') return 'Permanente';
  if (restriction.expires_at) return `Até ${new Date(restriction.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
  return 'Ativo';
}
