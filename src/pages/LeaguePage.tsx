import { useEffect, useState } from 'react'
import { LeagueTable } from '../components/LeagueTable'
import { useAuth } from '../context/AuthContext'
import { PL_SEASON, type LeagueRow } from '../lib/types'
import { supabase } from '../lib/supabase'

export function LeaguePage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<LeagueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLeague() {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_league_table', {
        p_season: PL_SEASON,
      })

      if (rpcError) {
        setError(rpcError.message)
      } else {
        setRows((data as LeagueRow[]) ?? [])
      }

      setLoading(false)
    }

    loadLeague()
  }, [])

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h1>League table</h1>
          <p className="lead">Ranked by total points for the 2026/27 season.</p>
        </div>
      </div>

      {error ? <div className="notice error">{error}</div> : null}
      {loading ? <p>Loading league table…</p> : <LeagueTable rows={rows} highlightUserId={user?.id} />}
    </section>
  )
}
