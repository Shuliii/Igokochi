#!/bin/sh
set -e

# Defaults (fallback) - override via env vars in Docker/K8s. Var name matches
# VITE_API_BASE_URL since that's what the Helm chart's Deployment sets (and
# what the Vite build-time fallback also reads), not a bare API_BASE_URL.
: "${VITE_API_BASE_URL:=http://localhost:4000}"
: "${SLOT_CAPACITY:=1}"

cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV = {
  API_BASE_URL: "${VITE_API_BASE_URL}",
  SLOT_CAPACITY: "${SLOT_CAPACITY}"
};
EOF

exec "$@"
