/**
 * Sync Premier League fixtures/results from football-data.org into Supabase,
 * then score any finished matches.
 *
 * Run via GitHub Actions or locally:
 *   FOOTBALL_DATA_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... PL_SEASON=2026 node scripts/sync-fixtures.mjs
 */

const FOOTBALL_API = 'https://api.football-data.org/v4'
const SEASON = Number(process.env.PL_SEASON ?? 2026)

const footballKey = process.env.FOOTBALL_DATA_API_KEY
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!footballKey || !supabaseUrl || !serviceKey) {
  console.error('Missing required env: FOOTBALL_DATA_API_KEY, SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

function calculatePoints(predHome, predAway, actualHome, actualAway) {
  if (predHome === actualHome && predAway === actualAway) return 3
  const predSign = Math.sign(predHome - predAway)
  const actualSign = Math.sign(actualHome - actualAway)
  return predSign === actualSign ? 1 : 0
}

async function footballFetch(path) {
  const res = await fetch(`${FOOTBALL_API}${path}`, {
    headers: { 'X-Auth-Token': footballKey },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`football-data.org ${res.status}: ${body}`)
  }
  return res.json()
}

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer ?? 'return=minimal',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase ${res.status}: ${body}`)
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

function mapFixture(match) {
  return {
    id: match.id,
    season: SEASON,
    matchday: match.matchday ?? null,
    home_team: match.homeTeam.shortName ?? match.homeTeam.name,
    away_team: match.awayTeam.shortName ?? match.awayTeam.name,
    home_team_crest: match.homeTeam.crest ?? null,
    away_team_crest: match.awayTeam.crest ?? null,
    kickoff: match.utcDate,
    status: match.status,
    home_score: match.score?.fullTime?.home ?? null,
    away_score: match.score?.fullTime?.away ?? null,
    updated_at: new Date().toISOString(),
  }
}

async function upsertFixtures(fixtures) {
  if (fixtures.length === 0) return
  await supabaseFetch('fixtures?on_conflict=id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: JSON.stringify(fixtures),
  })
}

async function scoreFinishedFixtures(finishedFixtures) {
  for (const fixture of finishedFixtures) {
    if (fixture.home_score == null || fixture.away_score == null) continue

    const predictions = await supabaseFetch(
      `predictions?fixture_id=eq.${fixture.id}&select=id,home_score,away_score,points`,
    )

    for (const prediction of predictions ?? []) {
      const points = calculatePoints(
        prediction.home_score,
        prediction.away_score,
        fixture.home_score,
        fixture.away_score,
      )

      if (prediction.points === points) continue

      await supabaseFetch(`predictions?id=eq.${prediction.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          points,
          updated_at: new Date().toISOString(),
        }),
      })
    }
  }
}

async function main() {
  console.log(`Syncing Premier League season ${SEASON}...`)

  const data = await footballFetch(`/competitions/PL/matches?season=${SEASON}`)
  const fixtures = (data.matches ?? []).map(mapFixture)

  console.log(`Fetched ${fixtures.length} matches`)
  await upsertFixtures(fixtures)

  const finished = fixtures.filter((f) => f.status === 'FINISHED')
  console.log(`Scoring ${finished.length} finished matches...`)
  await scoreFinishedFixtures(finished)

  console.log('Sync complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
