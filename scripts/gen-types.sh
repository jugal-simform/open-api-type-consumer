#!/usr/bin/env bash
set -euo pipefail

# Generates TypeScript types from an OpenAPI/Swagger spec.
# URL source, in priority order:
#   1. First CLI arg:        npm run gen:types -- http://api.example.com/openapi.json
#   2. SWAGGER_URL env var:  SWAGGER_URL=http://api.example.com/openapi.json npm run gen:types
#   3. Default below.

DEFAULT_URL="http://localhost:8080/swagger.json"
URL="${1:-${SWAGGER_URL:-$DEFAULT_URL}}"
OUT="src/types/api.d.ts"

mkdir -p "$(dirname "$OUT")"

echo "Generating types from: $URL"
npx openapi-typescript "$URL" -o "$OUT"
