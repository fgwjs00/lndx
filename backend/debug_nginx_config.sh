#!/bin/bash
set -euo pipefail

echo "Checking Nginx uploads proxy safety..."

SITE_CONF="${1:-/www/server/nginx/conf/vhost/ln.tuojiaya.com.conf}"

echo
echo "1. nginx syntax"
nginx -t

echo
echo "2. uploads block in site config: ${SITE_CONF}"
if [ -f "$SITE_CONF" ]; then
    sed -n '/location \/uploads\//,/}/p' "$SITE_CONF"
else
    echo "Site config not found: ${SITE_CONF}"
fi

echo
echo "3. direct unauthenticated request should not return 200"
set +e
curl -i "http://127.0.0.1/uploads/id-cards/default-avatar.png" | sed -n '1,8p'
set -e

echo
echo "Expected safe result: /uploads/ is proxied to Express and returns 401/403 without a token."
echo "Unsafe result: Nginx uses alias/root for backend/uploads or returns file content without auth."

cat <<'SAFE_UPLOADS_PROXY'

Safe uploads block:
location /uploads/ {
    proxy_pass http://127.0.0.1:3000/uploads/;
    proxy_set_header Authorization $http_authorization;
}
SAFE_UPLOADS_PROXY
