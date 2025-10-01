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

# Check if logging is disabled in production
if [ "${REACT_APP_ENABLE_LOGGING:-false}" = "false" ] && [ "${REACT_APP_ENVIRONMENT:-production}" = "production" ]; then
    echo "Starting application with minimal logging..."
    # Redirect stdout to /dev/null but keep stderr for critical errors
    exec "$@" > /dev/null
else
    echo "Starting application with full logging..."
    # Start the application normally
    exec "$@"
fi