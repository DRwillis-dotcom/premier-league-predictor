type ScoreSelectProps = {
  value: number
  disabled?: boolean
  'aria-label': string
  onChange: (score: number) => void
}

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i)

export function ScoreSelect({
  value,
  disabled = false,
  'aria-label': ariaLabel,
  onChange,
}: ScoreSelectProps) {
  return (
    <select
      className="score-select"
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {SCORE_OPTIONS.map((score) => (
        <option key={score} value={score}>
          {score}
        </option>
      ))}
    </select>
  )
}
