import { useEffect, useState } from 'react'
import type { Fixture, Prediction } from '../lib/types'
import { isFixtureOpen } from '../lib/scoring'
import { ScorePicker } from './ScorePicker'

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

  return (
    <article className="fixture-card">
      <div className="fixture-meta">
        <span>Matchday {fixture.matchday ?? '?'}</span>
        <span>{kickoff}</span>
      </div>

      <div className="fixture-teams">
        <TeamBlock name={fixture.home_team} crest={fixture.home_team_crest} />
        <div className="fixture-center">
          {finished ? (
            <div className="actual-score">
              {fixture.home_score} - {fixture.away_score}
            </div>
          ) : (
            <ScorePicker
              homeScore={homeScore}
              awayScore={awayScore}
              disabled={!open || saving}
              onChange={(home, away) => {
                setHomeScore(home)
                setAwayScore(away)
              }}
            />
          )}
        </div>
        <TeamBlock name={fixture.away_team} crest={fixture.away_team_crest} align="right" />
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

function TeamBlock({
  name,
  crest,
  align = 'left',
}: {
  name: string
  crest: string | null
  align?: 'left' | 'right'
}) {
  return (
    <div className={`team-block ${align}`}>
      {crest ? <img src={crest} alt="" className="crest" /> : <div className="crest placeholder" />}
      <span>{name}</span>
    </div>
  )
}
