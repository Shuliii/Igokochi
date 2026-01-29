#!/bin/sh
set -e

# Default (fallback) - can override via env var in Docker/K8s
: "${API_BASE_URL:=http://localhost:4000}"

cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV = {
  API_BASE_URL: "${API_BASE_URL}"
};
EOF

exec "$@"
