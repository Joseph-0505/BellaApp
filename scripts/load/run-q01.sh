#!/bin/sh
# KAN-78 / Q-01: roda o teste de carga e calcula a taxa de hit do cache pelo log do backend.
# Pré-requisitos: stack Docker no ar (docker compose up -d) e backend com LOG_LEVEL=debug,
# porque cache.hit e cache.miss são registrados em debug. Rode sem outra carga na máquina.
# Variáveis opcionais: BASE_URL, RATE (padrão 20), DURATION (padrão 2m).
set -eu

cd "$(dirname "$0")/../.."
backend=${BACKEND_CONTAINER:-bellaapp-backend}
since=$(date -u +%Y-%m-%dT%H:%M:%SZ)

docker run --rm --network host \
  -e BASE_URL -e RATE -e DURATION \
  -v "$PWD/scripts/load:/scripts:ro" \
  grafana/k6:0.54.0 run /scripts/q01-listagens.js || status=$?

echo
echo "Taxa de hit do cache desde $since (hit / (hit + miss)):"
docker logs --since "$since" "$backend" 2>&1 \
  | grep -o '"event":"cache\.\(hit\|miss\)","key":"[^"]*","namespace":"[a-z]*"' \
  | sed 's/"event":"cache\.\([a-z]*\)".*"namespace":"\([a-z]*\)"/\2 \1/' \
  | awk '{ count[$1, $2]++; seen[$1] = 1 }
         END {
           for (ns in seen) {
             hit = count[ns, "hit"] + 0; miss = count[ns, "miss"] + 0
             printf "  %-14s hit %5d  miss %4d  taxa %.1f%%\n", ns, hit, miss, 100 * hit / (hit + miss)
           }
         }'

exit "${status:-0}"
