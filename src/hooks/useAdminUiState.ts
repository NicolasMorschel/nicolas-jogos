import { useMemo, useState } from 'react';
import type { AdminUser, GameForm } from '../types';
import { emptyGameForm, emptyGameRestrictionForm } from '../config/app';
import { selectFilteredAdminUsers } from '../domain/selectors';

export function useAdminUiState(adminUsers: AdminUser[]) {
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminTypeFilter, setAdminTypeFilter] = useState('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [addGameId, setAddGameId] = useState('');
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [savingGame, setSavingGame] = useState(false);
  const [gameForm, setGameForm] = useState<GameForm>(emptyGameForm);
  const [restrictionForm, setRestrictionForm] = useState(emptyGameRestrictionForm);

  const filteredAdminUsers = useMemo(
    () => selectFilteredAdminUsers({
      users: adminUsers,
      searchTerm: adminSearchTerm,
      typeFilter: adminTypeFilter,
      statusFilter: adminStatusFilter
    }),
    [adminSearchTerm, adminStatusFilter, adminTypeFilter, adminUsers]
  );

  return {
    adminSearchTerm,
    setAdminSearchTerm,
    adminTypeFilter,
    setAdminTypeFilter,
    adminStatusFilter,
    setAdminStatusFilter,
    addGameId,
    setAddGameId,
    editingGameId,
    setEditingGameId,
    savingGame,
    setSavingGame,
    gameForm,
    setGameForm,
    restrictionForm,
    setRestrictionForm,
    filteredAdminUsers
  };
}
