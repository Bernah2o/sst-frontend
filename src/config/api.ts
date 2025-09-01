// API Configuration
export const API_CONFIG = {
  // Base API URL
  BASE_URL:
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://sst-backend-upmch1-b95ca4-5-252-53-108.traefik.me/api/v1"
      : "http://localhost:8000/api/v1"),

  // Base URL for uploads and static files
  UPLOADS_URL: (() => {
    const apiUrl =
      process.env.REACT_APP_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://sst-backend-upmch1-b95ca4-5-252-53-108.traefik.me/api/v1"
        : "http://localhost:8000/api/v1");
    return apiUrl.replace("/api/v1", "");
  })(),

  // API Version
  VERSION: process.env.REACT_APP_API_VERSION || "v1",

  // Request timeout (in milliseconds)
  TIMEOUT: 30000,

  // Default headers
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },

  // Environment checks
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",

  // Feature flags
  ENABLE_DEBUG: process.env.REACT_APP_ENABLE_DEBUG === "true",
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === "true",
};

// Helper functions
export const getUploadUrl = (filename: string): string => {
  if (!filename) return '';
  
  // Remove leading /uploads/ if present
  const cleanFilename = filename.replace(/^\/uploads\//, '');
  
  return `${API_CONFIG.UPLOADS_URL}/uploads/${cleanFilename}`;
};

export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.replace(/^\//, '');
  
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Export default configuration
export default API_CONFIG;