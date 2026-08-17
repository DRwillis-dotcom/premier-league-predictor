export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
): number {
  if (predHome === actualHome && predAway === actualAway) return 3

  const predSign = Math.sign(predHome - predAway)
  const actualSign = Math.sign(actualHome - actualAway)
  return predSign === actualSign ? 1 : 0
}

export function getResultLabel(home: number, away: number): string {
  if (home > away) return 'Home win'
  if (home < away) return 'Away win'
  return 'Draw'
}

/** football-data.org statuses for fixtures that have not kicked off yet */
export const PREDICTABLE_STATUSES = ['SCHEDULED', 'TIMED'] as const

export function isFixtureOpen(fixture: { status: string; kickoff: string }): boolean {
  return (
    PREDICTABLE_STATUSES.includes(fixture.status as (typeof PREDICTABLE_STATUSES)[number]) &&
    new Date(fixture.kickoff) > new Date()
  )
}
