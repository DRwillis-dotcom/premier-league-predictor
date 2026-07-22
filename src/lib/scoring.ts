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

export function isFixtureOpen(fixture: { status: string; kickoff: string }): boolean {
  return fixture.status === 'SCHEDULED' && new Date(fixture.kickoff) > new Date()
}
