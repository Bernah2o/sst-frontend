/**
 * API Configuration
 * 
 * Esta configuración sigue las mejores prácticas de seguridad:
 * - Variables de entorno para configuración sensible
 * - Valores por defecto seguros para desarrollo local
 * - Sin URLs hardcodeadas en el código
 * 
 * Para desarrollo local: usar archivo .env.local
 * Para producción: configurar variables de entorno directamente en el servidor
 */

// Configuración base de la API
const getApiBaseUrl = (): string => {
  // La variable de entorno debe estar configurada en todos los entornos
  return process.env.REACT_APP_API_URL || '';
};

const getUploadsBaseUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace("/api/v1", "");
};

export const API_CONFIG = {
  // URLs base - configuradas desde variables de entorno
  BASE_URL: getApiBaseUrl(),
  UPLOADS_URL: getUploadsBaseUrl(),

  // Configuración de la API
  VERSION: process.env.REACT_APP_API_VERSION || "v1",
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || "30000", 10),

  // Headers por defecto
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },

  // Banderas de características - configurables por entorno
  ENABLE_DEBUG: process.env.REACT_APP_ENABLE_DEBUG === "true",
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === "true",
  ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING !== "false", // habilitado por defecto
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