// Runtime configuration - This file will be replaced by entrypoint.sh in production
const env = typeof process !== "undefined" && process.env ? process.env : {};
window._env_ = {
  REACT_APP_API_URL: env.REACT_APP_API_URL || "http://localhost:8000/api/v1",
  REACT_APP_FRONTEND_URL: env.REACT_APP_FRONTEND_URL || "http://localhost:3000",
  REACT_APP_ENVIRONMENT: env.REACT_APP_ENVIRONMENT || "development",
};
