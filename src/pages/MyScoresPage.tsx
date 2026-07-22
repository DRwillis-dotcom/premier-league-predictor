import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { calculatePoints } from '../lib/scoring'
import { PL_SEASON, type Fixture, type Prediction } from '../lib/types'
import { supabase } from '../lib/supabase'

type ScoredPrediction = Prediction & { fixture: Fixture }

export function MyScoresPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ScoredPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function loadScores() {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('predictions')
        .select('*, fixtures!inner(*)')
        .eq('user_id', userId)
        .eq('fixtures.season', PL_SEASON)
        .order('created_at', { ascending: false })

      if (queryError) {
        setError(queryError.message)
      } else {
        setItems(
          (data ?? []).map((row) => {
            const { fixtures, ...prediction } = row as Prediction & { fixtures: Fixture }
            return { ...prediction, fixture: fixtures }
          }),
        )
      }

      setLoading(false)
    }

    loadScores()
  }, [user])

  const summary = useMemo(() => {
    const scored = items.filter((item) => item.points != null)
    return {
      total: scored.reduce((sum, item) => sum + (item.points ?? 0), 0),
      exact: scored.filter((item) => item.points === 3).length,
      results: scored.filter((item) => item.points === 1).length,
      pending: items.filter((item) => item.fixture.status !== 'FINISHED').length,
    }
  }, [items])

  if (!user) {
    return (
      <section className="panel">
        <h1>My scores</h1>
        <p className="lead">Sign in to track your points.</p>
        <Link to="/login" className="primary-button">
          Sign in
        </Link>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h1>My scores</h1>
          <p className="lead">Your predictions and points for 2026/27.</p>
        </div>
      </div>

      <div className="stats-row">
        <Stat label="Total points" value={summary.total} />
        <Stat label="Exact scores" value={summary.exact} />
        <Stat label="Correct results" value={summary.results} />
        <Stat label="Pending" value={summary.pending} />
      </div>

      {error ? <div className="notice error">{error}</div> : null}

      {loading ? (
        <p>Loading your predictions…</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No predictions yet.</p>
          <Link to="/" className="primary-button">
            Make predictions
          </Link>
        </div>
      ) : (
        <div className="score-list">
          {items.map((item) => {
            const finished = item.fixture.status === 'FINISHED'
            const actualHome = item.fixture.home_score
            const actualAway = item.fixture.away_score
            const previewPoints =
              finished && actualHome != null && actualAway != null
                ? calculatePoints(item.home_score, item.away_score, actualHome, actualAway)
                : null

            return (
              <article key={item.id} className="score-item">
                <div>
                  <strong>
                    {item.fixture.home_team} vs {item.fixture.away_team}
                  </strong>
                  <p className="subtle">Matchday {item.fixture.matchday ?? '?'}</p>
                </div>
                <div className="score-item-middle">
                  <span>Predicted {item.home_score}-{item.away_score}</span>
                  {finished ? (
                    <span>
                      Actual {actualHome}-{actualAway}
                    </span>
                  ) : (
                    <span className="subtle">Awaiting result</span>
                  )}
                </div>
                <div className="points-badge">
                  {item.points ?? previewPoints ?? '—'}
                  {(item.points ?? previewPoints) != null ? ' pts' : ''}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
