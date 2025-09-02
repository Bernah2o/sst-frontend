// Runtime environment configuration
// This allows reading configuration from window._env_ (set by entrypoint.sh in production)
// or fallback to process.env for development

interface EnvConfig {
  REACT_APP_API_URL: string;
  REACT_APP_FRONTEND_URL: string;
  REACT_APP_ENVIRONMENT: string;
}

// Get configuration from window._env_ (production) or process.env (development)
function getEnvConfig(): EnvConfig {
  // Check if window._env_ exists (production runtime config)
  if (typeof window !== 'undefined' && (window as any)._env_) {
    return (window as any)._env_;
  }
  
  // Fallback to process.env for development
  return {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
    REACT_APP_FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
    REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development'
  };
}

// Export the configuration
export const env = getEnvConfig();

// Helper function to get API URL
export const getApiUrl = (): string => {
  return env.REACT_APP_API_URL;
};

// Helper function to get frontend URL
export const getFrontendUrl = (): string => {
  return env.REACT_APP_FRONTEND_URL;
};

// Helper function to get environment
export const getEnvironment = (): string => {
  return env.REACT_APP_ENVIRONMENT;
};