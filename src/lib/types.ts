export type Profile = {
  id: string
  username: string
  display_name: string | null
  created_at: string
}

export type Fixture = {
  id: number
  season: number
  matchday: number | null
  home_team: string
  away_team: string
  home_team_crest: string | null
  away_team_crest: string | null
  kickoff: string
  status: string
  home_score: number | null
  away_score: number | null
}

export type Prediction = {
  id: string
  user_id: string
  fixture_id: number
  home_score: number
  away_score: number
  points: number | null
  created_at: string
  updated_at: string
}

export type LeagueRow = {
  user_id: string
  username: string
  display_name: string | null
  total_points: number
  exact_scores: number
  correct_results: number
  predictions_scored: number
}

export const PL_SEASON = Number(import.meta.env.VITE_PL_SEASON ?? 2026)
