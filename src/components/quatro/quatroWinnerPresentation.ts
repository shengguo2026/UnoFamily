export const QUATRO_WINNING_LINE_HOLD_MS = 3_000

export type QuatroWinnerPresentationStage =
  | 'playing'
  | 'winningLine'
  | 'celebration'

export function quatroWinnerPresentationStage(
  hasWinner: boolean,
  winnerElapsedMs: number,
): QuatroWinnerPresentationStage {
  if (!hasWinner) return 'playing'
  return winnerElapsedMs < QUATRO_WINNING_LINE_HOLD_MS
    ? 'winningLine'
    : 'celebration'
}
