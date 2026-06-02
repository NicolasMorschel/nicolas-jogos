export function emptyResult<T>() {
  return Promise.resolve({ data: [] as T[], error: null });
}

export function isMissingDatabaseShapeError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === '42P01'
    || error.code === '42703'
    || error.code === 'PGRST205'
    || error.message?.toLowerCase().includes('schema cache')
    || error.message?.toLowerCase().includes('does not exist');
}
