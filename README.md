# Premier League Predictor

Predict Premier League scores for the **2026/27** season, earn points, and compete on a league table.

## Scoring

| Prediction | Points |
| --- | ---: |
| Exact score | 3 |
| Correct result (win/draw/loss) | 1 |
| Wrong result | 0 |

Predictions lock at kickoff.

## Stack

- **Frontend:** React + Vite (hosted on GitHub Pages)
- **Auth & database:** [Supabase](https://supabase.com) (free tier)
- **Fixtures & results:** [football-data.org](https://www.football-data.org/) API

## Local development

1. **Clone and install**

   ```bash
   git clone https://github.com/YOUR_USERNAME/premier-league-predictor.git
   cd premier-league-predictor
   npm install
   ```

2. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a project
   - In **SQL Editor**, run the contents of [`supabase/schema.sql`](supabase/schema.sql)
   - In **Authentication → Providers**, enable Email
   - Copy your project URL and anon key from **Project Settings → API**

3. **Get a football-data.org API key**
   - Register at [football-data.org/client/register](https://www.football-data.org/client/register)
   - Free tier includes the Premier League (delayed scores are fine for a prediction league)

4. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in:

   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_PL_SEASON=2026
   ```

5. **Run locally**

   ```bash
   npm run dev
   ```

6. **Sync fixtures once** (after adding service role key locally or via GitHub Actions):

   ```bash
   FOOTBALL_DATA_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-fixtures.mjs
   ```

## Deploy to GitHub Pages

1. Push this repo to GitHub as `premier-league-predictor` (the Vite `base` path assumes this repo name).

2. In the repo, go to **Settings → Pages → Build and deployment** and choose **GitHub Actions**.

3. Add these **repository secrets** (Settings → Secrets and variables → Actions):

   | Secret | Purpose |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
   | `FOOTBALL_DATA_API_KEY` | football-data.org token |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (sync script only) |

4. Optional repository variable:

   | Variable | Default |
   | --- | --- |
   | `PL_SEASON` | `2026` |

5. Push to `main`. The **Deploy to GitHub Pages** workflow builds and publishes the app.

6. Run **Sync fixtures and score predictions** manually once, then every 6 hours on schedule.

Your site will be live at:

`https://YOUR_USERNAME.github.io/premier-league-predictor/`

## How scoring updates

The sync workflow:

1. Fetches all Premier League matches for the season from football-data.org
2. Upserts them into Supabase
3. For finished matches, calculates points for every prediction

## Project structure

```
src/                 React app
supabase/schema.sql  Database tables, RLS, league table function
scripts/             Fixture sync script
.github/workflows/   GitHub Pages deploy + fixture sync
```

## Notes

- The 2026/27 season uses `PL_SEASON=2026` in football-data.org (start year of the season).
- Before the season starts, the API may return no fixtures yet — the app will show an empty state until data is available.
- If you use a different GitHub repo name, update `base` in `vite.config.ts`.
