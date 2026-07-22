import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FixtureCard } from '../components/FixtureCard'
import { useAuth } from '../context/AuthContext'
import { PL_SEASON, type Fixture, type Prediction } from '../lib/types'
import { supabase } from '../lib/supabase'

export function PredictionsPage() {
  const { user } = useAuth()
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: fixtureData, error: fixtureError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('season', PL_SEASON)
      .order('kickoff', { ascending: true })

    if (fixtureError) {
      setError(fixtureError.message)
      setLoading(false)
      return
    }

    setFixtures(fixtureData ?? [])

    if (user) {
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)

      if (predictionError) {
        setError(predictionError.message)
      } else {
        setPredictions(predictionData ?? [])
      }
    } else {
      setPredictions([])
    }

    setLoading(false)
  }, [user])

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
    const now = Date.now()
    const upcoming = fixtures.filter(
      (fixture) => fixture.status === 'SCHEDULED' && new Date(fixture.kickoff).getTime() > now,
    )
    if (upcoming.length > 0) {
      return upcoming[0].matchday
    }
    return matchdays.at(-1) ?? null
  }, [fixtures, matchdays])

  useEffect(() => {
    if (selectedMatchday == null && defaultMatchday != null) {
      setSelectedMatchday(defaultMatchday)
    }
  }, [defaultMatchday, selectedMatchday])

  const visibleFixtures = fixtures.filter((fixture) => fixture.matchday === selectedMatchday)

  const predictionByFixture = useMemo(() => {
    return new Map(predictions.map((prediction) => [prediction.fixture_id, prediction]))
  }, [predictions])

  async function savePrediction(fixtureId: number, homeScore: number, awayScore: number) {
    if (!user) return

    setSavingId(fixtureId)
    setError(null)

    const existing = predictionByFixture.get(fixtureId)

    if (existing) {
      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) setError(updateError.message)
    } else {
      const { error: insertError } = await supabase.from('predictions').insert({
        user_id: user.id,
        fixture_id: fixtureId,
        home_score: homeScore,
        away_score: awayScore,
      })

      if (insertError) setError(insertError.message)
    }

    await loadData()
    setSavingId(null)
  }

  if (!user) {
    return (
      <section className="panel">
        <h1>Predict this week&apos;s fixtures</h1>
        <p className="lead">Sign in to submit your score predictions before kickoff.</p>
        <div className="inline-actions">
          <Link to="/login" className="primary-button">
            Sign in
          </Link>
          <Link to="/signup" className="ghost-button">
            Create account
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h1>Predict fixtures</h1>
          <p className="lead">
            Exact score = 3 points · Correct result = 1 point · Predictions lock at kickoff
          </p>
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
        <p>Loading fixtures…</p>
      ) : visibleFixtures.length === 0 ? (
        <div className="empty-state">
          <p>No fixtures synced yet for the 2026/27 season.</p>
          <p className="subtle">
            Run the sync GitHub Action once your football-data.org and Supabase keys are configured.
          </p>
        </div>
      ) : (
        <div className="fixture-grid">
          {visibleFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              prediction={predictionByFixture.get(fixture.id)}
              saving={savingId === fixture.id}
              onSave={savePrediction}
            />
          ))}
        </div>
      )}
    </section>
  )
}
