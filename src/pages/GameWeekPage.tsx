import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isFixtureOpen } from '../lib/scoring'
import { PL_SEASON, type Fixture, type Prediction, type Profile } from '../lib/types'
import { supabase } from '../lib/supabase'

type PlayerPick = {
  userId: string
  username: string
  displayName: string | null
  homeScore: number
  awayScore: number
  points: number | null
}

export function GameWeekPage() {
  const { user } = useAuth()
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [fixtureResult, profileResult] = await Promise.all([
      supabase.from('fixtures').select('*').eq('season', PL_SEASON).order('kickoff', { ascending: true }),
      supabase.from('profiles').select('*').order('username', { ascending: true }),
    ])

    if (fixtureResult.error) {
      setError(fixtureResult.error.message)
      setLoading(false)
      return
    }

    if (profileResult.error) {
      setError(profileResult.error.message)
      setLoading(false)
      return
    }

    const nextFixtures = (fixtureResult.data ?? []) as Fixture[]
    setFixtures(nextFixtures)
    setProfiles((profileResult.data ?? []) as Profile[])

    const ids = nextFixtures.map((fixture) => fixture.id)
    if (ids.length === 0) {
      setPredictions([])
      setLoading(false)
      return
    }

    const { data: predictionData, error: predictionError } = await supabase
      .from('predictions')
      .select('*')
      .in('fixture_id', ids)

    if (predictionError) {
      setError(predictionError.message)
    } else {
      setPredictions((predictionData ?? []) as Prediction[])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const matchdays = useMemo(() => {
    const values = fixtures
      .map((fixture) => fixture.matchday)
      .filter((value): value is number => value != null)
    return [...new Set(values)].sort((a, b) => a - b)
  }, [fixtures])

  const defaultMatchday = useMemo(() => {
    const upcoming = fixtures.filter((fixture) => isFixtureOpen(fixture))
    if (upcoming.length > 0) return upcoming[0].matchday
    const started = [...fixtures].reverse().find((fixture) => !isFixtureOpen(fixture))
    return started?.matchday ?? matchdays.at(-1) ?? null
  }, [fixtures, matchdays])

  useEffect(() => {
    if (selectedMatchday == null && defaultMatchday != null) {
      setSelectedMatchday(defaultMatchday)
    }
  }, [defaultMatchday, selectedMatchday])

  const visibleFixtures = fixtures.filter((fixture) => fixture.matchday === selectedMatchday)

  const picksByFixture = useMemo(() => {
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
    const map = new Map<number, PlayerPick[]>()

    for (const prediction of predictions) {
      const profile = profileById.get(prediction.user_id)
      if (!profile) continue
      const list = map.get(prediction.fixture_id) ?? []
      list.push({
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        homeScore: prediction.home_score,
        awayScore: prediction.away_score,
        points: prediction.points,
      })
      map.set(prediction.fixture_id, list)
    }

    for (const [fixtureId, list] of map) {
      list.sort((a, b) => a.username.localeCompare(b.username))
      map.set(fixtureId, list)
    }

    return map
  }, [predictions, profiles])

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h1>Game week picks</h1>
          <p className="lead">Other players&apos; scores appear after each match kicks off.</p>
        </div>
        {matchdays.length > 0 ? (
          <label className="matchday-select">
            Matchday
            <select
              value={selectedMatchday ?? ''}
              onChange={(event) => setSelectedMatchday(Number(event.target.value))}
            >
              {matchdays.map((matchday) => (
                <option key={matchday} value={matchday}>
                  {matchday}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {error ? <div className="notice error">{error}</div> : null}

      {loading ? (
        <p>Loading game week picks…</p>
      ) : visibleFixtures.length === 0 ? (
        <div className="empty-state">
          <p>No fixtures synced yet for this season.</p>
        </div>
      ) : (
        <div className="fixture-grid">
          {visibleFixtures.map((fixture) => (
            <FixturePicks
              key={fixture.id}
              fixture={fixture}
              picks={picksByFixture.get(fixture.id) ?? []}
              currentUserId={user?.id}
              playerCount={profiles.length}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function FixturePicks({
  fixture,
  picks,
  currentUserId,
  playerCount,
}: {
  fixture: Fixture
  picks: PlayerPick[]
  currentUserId?: string
  playerCount: number
}) {
  const open = isFixtureOpen(fixture)
  const finished = fixture.status === 'FINISHED'
  const kickoff = new Date(fixture.kickoff).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const yourPick = picks.find((pick) => pick.userId === currentUserId)
  const revealedPicks = open ? picks.filter((pick) => pick.userId === currentUserId) : picks

  return (
    <article className="fixture-card">
      <div className="fixture-meta">
        <span>Matchday {fixture.matchday ?? '?'}</span>
        <span>{kickoff}</span>
      </div>

      <div className="fixture-teams">
        <div className="team-score">
          <Crest crest={fixture.home_team_crest} name={fixture.home_team} />
          {finished ? <span className="actual-score">{fixture.home_score}</span> : null}
        </div>
        <span className="score-divider" aria-hidden="true">
          {finished ? '-' : 'v'}
        </span>
        <div className="team-score away">
          <Crest crest={fixture.away_team_crest} name={fixture.away_team} />
          {finished ? <span className="actual-score">{fixture.away_score}</span> : null}
        </div>
      </div>

      {open ? (
        <div className="picks-locked">
          {yourPick ? (
            <p>
              Your pick: {yourPick.homeScore}-{yourPick.awayScore}
            </p>
          ) : (
            <p>You have not predicted this match yet.</p>
          )}
          <p className="subtle">Other picks unlock at kickoff.</p>
        </div>
      ) : revealedPicks.length === 0 ? (
        <p className="subtle">No predictions submitted for this match.</p>
      ) : (
        <div className="picks-table-wrap">
          <table className="picks-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Pick</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {revealedPicks.map((pick) => (
                <tr
                  key={pick.userId}
                  className={pick.userId === currentUserId ? 'highlight-row' : undefined}
                >
                  <td>
                    <strong>{pick.displayName ?? pick.username}</strong>
                    <span className="subtle">@{pick.username}</span>
                  </td>
                  <td>
                    {pick.homeScore}-{pick.awayScore}
                  </td>
                  <td className={pointsClass(pick.points)}>{pick.points ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {playerCount > revealedPicks.length ? (
            <p className="subtle picks-missing">
              {playerCount - revealedPicks.length} player
              {playerCount - revealedPicks.length === 1 ? '' : 's'} did not predict this match.
            </p>
          ) : null}
        </div>
      )}
    </article>
  )
}

function pointsClass(points: number | null) {
  if (points === 3) return 'pick-pts exact'
  if (points === 1) return 'pick-pts result'
  if (points === 0) return 'pick-pts miss'
  return 'pick-pts'
}

function Crest({ crest, name }: { crest: string | null; name: string }) {
  if (crest) {
    return <img src={crest} alt={name} title={name} className="crest" />
  }
  return <div className="crest placeholder" title={name} aria-label={name} />
}
