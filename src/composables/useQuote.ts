// TODO: i18n these encouraging phrases once translations are available.
const QUOTES = {
  start: ['A quiet beginning.', 'Small steps, steady heart.', 'Arrive, then begin.'],
  mid: ['Keep the rhythm.', "You're doing beautifully.", 'Steady as the tide.'],
  near: ['Almost there.', 'One gentle push.', 'The week bends toward you.'],
  done: ['Your week is whole.', 'Beautifully complete.', 'Stillness earned.'],
} as const;

export function pickQuote(progress: number, total: number, seed = new Date().getDate()): string {
  if (total === 0) return QUOTES.start[0];
  const ratio = progress / total;
  const pool =
    ratio === 1 ? QUOTES.done : ratio > 0.66 ? QUOTES.near : ratio > 0.3 ? QUOTES.mid : QUOTES.start;
  return pool[seed % pool.length] ?? pool[0];
}
