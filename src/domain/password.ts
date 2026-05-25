export const passwordScoreLabels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
export const passwordScoreWidths = ['0%', '25%', '50%', '75%', '100%'];

export function strengthScore(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
