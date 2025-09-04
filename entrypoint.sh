#!/bin/sh

# Generate runtime configuration
cat <<EOF > /app/build/config.js
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-https://api.dh2o.com.co/api/v1}",
  REACT_APP_FRONTEND_URL: "${REACT_APP_FRONTEND_URL:-https://sst.dh2o.com.co}",
  REACT_APP_ENVIRONMENT: "${REACT_APP_ENVIRONMENT:-production}",
  REACT_APP_ENABLE_DEBUG: "${REACT_APP_ENABLE_DEBUG:-false}",
  REACT_APP_ENABLE_LOGGING: "${REACT_APP_ENABLE_LOGGING:-false}"
};
EOF

echo "Runtime configuration generated:"
cat /app/build/config.js

# Start the application
exec "$@"