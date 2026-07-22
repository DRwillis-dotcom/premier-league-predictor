#!/usr/bin/env bash
# One-time setup helper after you have Supabase + football-data.org keys.
# Usage: ./scripts/setup-secrets.sh

set -euo pipefail

REPO="${1:-}"

if [[ -z "$REPO" ]]; then
  echo "Usage: ./scripts/setup-secrets.sh OWNER/premier-league-predictor"
  echo "Example: ./scripts/setup-secrets.sh davidwilliams/premier-league-predictor"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install from https://cli.github.com/"
  exit 1
fi

read -r -p "Supabase URL (VITE_SUPABASE_URL): " SUPABASE_URL
read -r -p "Supabase anon key (VITE_SUPABASE_ANON_KEY): " SUPABASE_ANON
read -r -p "Supabase service role key (SUPABASE_SERVICE_ROLE_KEY): " SUPABASE_SERVICE
read -r -p "football-data.org API key (FOOTBALL_DATA_API_KEY): " FOOTBALL_KEY

gh secret set VITE_SUPABASE_URL --body "$SUPABASE_URL" --repo "$REPO"
gh secret set VITE_SUPABASE_ANON_KEY --body "$SUPABASE_ANON" --repo "$REPO"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$SUPABASE_SERVICE" --repo "$REPO"
gh secret set FOOTBALL_DATA_API_KEY --body "$FOOTBALL_KEY" --repo "$REPO"
gh variable set PL_SEASON --body "2026" --repo "$REPO"

echo ""
echo "Secrets configured for $REPO"
echo "Next: Settings → Pages → Build and deployment → GitHub Actions"
echo "Then run workflow: Sync fixtures and score predictions"
