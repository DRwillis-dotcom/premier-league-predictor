import { useEffect, useState } from 'react'
import type { Fixture, Prediction } from '../lib/types'
import { isFixtureOpen } from '../lib/scoring'
import { ScoreSelect } from './ScorePicker'

type FixtureCardProps = {
  fixture: Fixture
  prediction?: Prediction
  saving?: boolean
  onSave: (fixtureId: number, homeScore: number, awayScore: number) => Promise<void>
}

export function FixtureCard({ fixture, prediction, saving = false, onSave }: FixtureCardProps) {
  const open = isFixtureOpen(fixture)
  const kickoff = new Date(fixture.kickoff).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  const [homeScore, setHomeScore] = useState(prediction?.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(prediction?.away_score ?? 0)

  useEffect(() => {
    setHomeScore(prediction?.home_score ?? 0)
    setAwayScore(prediction?.away_score ?? 0)
  }, [prediction?.home_score, prediction?.away_score, fixture.id])

  const finished = fixture.status === 'FINISHED'
  const points = prediction?.points
  const disabled = !open || saving

  return (
    <article className="fixture-card">
      <div className="fixture-meta">
        <span>Matchday {fixture.matchday ?? '?'}</span>
        <span>{kickoff}</span>
      </div>

      <div className="fixture-teams">
        <div className="team-score">
          <Crest crest={fixture.home_team_crest} name={fixture.home_team} />
          {finished ? (
            <span className="actual-score">{fixture.home_score}</span>
          ) : (
            <ScoreSelect
              value={homeScore}
              disabled={disabled}
              aria-label={`${fixture.home_team} score`}
              onChange={setHomeScore}
            />
          )}
        </div>

        <span className="score-divider" aria-hidden="true">
          -
        </span>

        <div className="team-score away">
          <Crest crest={fixture.away_team_crest} name={fixture.away_team} />
          {finished ? (
            <span className="actual-score">{fixture.away_score}</span>
          ) : (
            <ScoreSelect
              value={awayScore}
              disabled={disabled}
              aria-label={`${fixture.away_team} score`}
              onChange={setAwayScore}
            />
          )}
        </div>
      </div>

      <div className="fixture-footer">
        {prediction ? (
          <span className="prediction-tag">
            Your pick: {prediction.home_score}-{prediction.away_score}
            {points != null ? ` · ${points} pts` : ''}
          </span>
        ) : (
          <span className="prediction-tag muted">No prediction yet</span>
        )}

        {open ? (
          <button
            type="button"
            className="primary-button"
            disabled={saving}
            onClick={() => onSave(fixture.id, homeScore, awayScore)}
          >
            {saving ? 'Saving…' : prediction ? 'Update prediction' : 'Save prediction'}
          </button>
        ) : (
          <span className="status-pill">{fixture.status.replaceAll('_', ' ')}</span>
        )}
      </div>
    </article>
  )
}

function Crest({ crest, name }: { crest: string | null; name: string }) {
  if (crest) {
    return <img src={crest} alt={name} title={name} className="crest" />
  }
  return <div className="crest placeholder" title={name} aria-label={name} />
}
