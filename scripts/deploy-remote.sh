#!/usr/bin/env bash
set -Eeuo pipefail

: "${APP_DIR:?APP_DIR is required}"
: "${RELEASE_SHA:?RELEASE_SHA is required}"

cd "$APP_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Deployment aborted: the server working tree has local changes." >&2
  exit 1
fi

previous_sha="$(git rev-parse HEAD)"

verify_deployment() {
  docker compose ps
  docker compose exec -T backend node -e \
    "fetch('http://127.0.0.1:3000/api/v1/health').then(async response => { const body = await response.json(); if (!response.ok || body?.data?.status !== 'ok') process.exit(1); }).catch(() => process.exit(1))"
}

rollback() {
  exit_code=$?
  trap - ERR
  echo "Deployment failed. Rolling code back to $previous_sha." >&2
  git checkout --detach "$previous_sha"
  docker compose up -d --build --remove-orphans
  verify_deployment
  exit "$exit_code"
}

trap rollback ERR

git fetch --prune origin main
git checkout --detach "$RELEASE_SHA"
docker compose up -d --build --remove-orphans
verify_deployment

trap - ERR
echo "Deployment $RELEASE_SHA completed and verified."
