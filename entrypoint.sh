#!/bin/sh

# Generate runtime configuration
cat <<EOF > /app/build/config.js
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-https://api.dh2o.com.co/api/v1}",
  REACT_APP_FRONTEND_URL: "${REACT_APP_FRONTEND_URL:-https://sst.dh2o.com.co}",
  REACT_APP_ENVIRONMENT: "${REACT_APP_ENVIRONMENT:-production}"
};
EOF

echo "Runtime configuration generated:"
cat /app/build/config.js

# Start the application
exec "$@"