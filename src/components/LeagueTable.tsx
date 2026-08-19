import type { LeagueRow } from '../lib/types'

type LeagueTableProps = {
  rows: LeagueRow[]
  highlightUserId?: string
}

export function LeagueTable({ rows, highlightUserId }: LeagueTableProps) {
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p>No players yet. Sign up to join the league!</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table className="league-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Pts</th>
            <th>Exact</th>
            <th>Results</th>
            <th>Predicted</th>
            <th>Scored</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.user_id}
              className={row.user_id === highlightUserId ? 'highlight-row' : undefined}
            >
              <td>{index + 1}</td>
              <td>
                <strong>{row.display_name ?? row.username}</strong>
                <span className="subtle">@{row.username}</span>
              </td>
              <td>{row.total_points}</td>
              <td>{row.exact_scores}</td>
              <td>{row.correct_results}</td>
              <td>{row.predictions_made}</td>
              <td>{row.predictions_scored}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
