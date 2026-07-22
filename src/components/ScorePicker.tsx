type ScorePickerProps = {
  homeScore: number
  awayScore: number
  disabled?: boolean
  onChange: (home: number, away: number) => void
}

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i)

export function ScorePicker({
  homeScore,
  awayScore,
  disabled = false,
  onChange,
}: ScorePickerProps) {
  return (
    <div className="score-picker">
      <label>
        Home
        <select
          value={homeScore}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value), awayScore)}
        >
          {SCORE_OPTIONS.map((score) => (
            <option key={`home-${score}`} value={score}>
              {score}
            </option>
          ))}
        </select>
      </label>
      <span className="score-divider">-</span>
      <label>
        Away
        <select
          value={awayScore}
          disabled={disabled}
          onChange={(event) => onChange(homeScore, Number(event.target.value))}
        >
          {SCORE_OPTIONS.map((score) => (
            <option key={`away-${score}`} value={score}>
              {score}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
