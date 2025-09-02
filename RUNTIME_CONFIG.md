# Configuración Runtime para React

Este proyecto implementa un sistema de configuración en tiempo de ejecución que permite cambiar variables de entorno sin necesidad de reconstruir la imagen de Docker.

## Problema Resuelto

React compila las variables de entorno (`process.env.REACT_APP_*`) en tiempo de build, lo que significa que quedan "quemadas" en el bundle. Esto hace imposible cambiar la configuración en diferentes entornos sin reconstruir la aplicación.

## Solución Implementada

### 1. Script de Entrypoint (`entrypoint.sh`)

El script `entrypoint.sh` se ejecuta al iniciar el contenedor y genera dinámicamente un archivo `config.js` con las variables de entorno actuales:

```bash
#!/bin/sh

# Generate runtime configuration
cat <<EOF > /app/build/config.js
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-https://api.dh2o.com.co/api/v1}",
  REACT_APP_FRONTEND_URL: "${REACT_APP_FRONTEND_URL:-https://sst.dh2o.com.co}",
  REACT_APP_ENVIRONMENT: "${REACT_APP_ENVIRONMENT:-production}"
};
EOF

# Start the application
exec "$@"
```

### 2. Configuración de Entorno (`src/config/env.ts`)

Se creó un módulo centralizado que lee la configuración desde `window._env_` (producción) o `process.env` (desarrollo):

```typescript
interface EnvConfig {
  REACT_APP_API_URL: string;
  REACT_APP_FRONTEND_URL: string;
  REACT_APP_ENVIRONMENT: string;
}

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

export const getApiUrl = (): string => {
  return getEnvConfig().REACT_APP_API_URL;
};
```

### 3. Modificaciones en el Dockerfile

Se actualizó el Dockerfile para:
- Copiar el script `entrypoint.sh`
- Hacerlo ejecutable
- Usarlo como punto de entrada

```dockerfile
# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh

# Make entrypoint executable and set proper permissions
RUN chmod +x /app/entrypoint.sh && \
    chown -R nextjs:nodejs /app

# Use entrypoint script to generate runtime config and start serve
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["serve", "-s", "build", "-l", "3000"]
```

### 4. Inclusión en HTML

Se agregó la referencia al `config.js` en `public/index.html`:

```html
<script src="%PUBLIC_URL%/config.js"></script>
```

### 5. Actualización del Código

Se reemplazaron todas las referencias a `process.env.REACT_APP_*` por llamadas a las funciones helper:

**Antes:**
```typescript
const apiUrl = process.env.REACT_APP_API_URL || '';
```

**Después:**
```typescript
import { getApiUrl } from '../config/env';
const apiUrl = getApiUrl();
```

## Archivos Modificados

- ✅ `entrypoint.sh` - Script de entrypoint (nuevo)
- ✅ `src/config/env.ts` - Configuración centralizada (nuevo)
- ✅ `public/config.js` - Configuración por defecto (nuevo)
- ✅ `public/index.html` - Inclusión del script de configuración
- ✅ `Dockerfile` - Configuración del entrypoint
- ✅ `docker-compose.yml` - Variables de entorno adicionales
- ✅ `src/config/api.ts` - Uso de nueva configuración
- ✅ `src/services/api.ts` - Uso de nueva configuración
- ✅ `src/services/workerService.ts` - Uso de nueva configuración
- ✅ `src/pages/Course.tsx` - Uso de nueva configuración
- ✅ `src/pages/Profile.tsx` - Uso de nueva configuración
- ✅ `src/components/Layout.tsx` - Uso de nueva configuración
- ✅ `src/components/Navbar.tsx` - Uso de nueva configuración

## Variables de Entorno Soportadas

| Variable | Descripción | Valor por Defecto (Producción) |
|----------|-------------|--------------------------------|
| `REACT_APP_API_URL` | URL de la API backend | `https://api.dh2o.com.co/api/v1` |
| `REACT_APP_FRONTEND_URL` | URL del frontend | `https://sst.dh2o.com.co` |
| `REACT_APP_ENVIRONMENT` | Entorno de ejecución | `production` |

## Cómo Usar

### En Desarrollo
Las variables se leen desde `.env.local` o `process.env` como siempre.

### En Producción
1. Configurar las variables de entorno en el sistema de deployment
2. El script `entrypoint.sh` generará automáticamente el `config.js`
3. La aplicación leerá la configuración desde `window._env_`

### Ejemplo de Deployment

```bash
# Configurar variables de entorno
export REACT_APP_API_URL="https://api.midominio.com/api/v1"
export REACT_APP_FRONTEND_URL="https://midominio.com"
export REACT_APP_ENVIRONMENT="production"

# Ejecutar contenedor
docker run -e REACT_APP_API_URL -e REACT_APP_FRONTEND_URL -e REACT_APP_ENVIRONMENT mi-app
```

## Beneficios

1. **Flexibilidad**: Cambiar configuración sin reconstruir la imagen
2. **Seguridad**: No hay URLs hardcodeadas en el código
3. **Compatibilidad**: Funciona tanto en desarrollo como en producción
4. **Simplicidad**: Una sola imagen para múltiples entornos
5. **Mantenibilidad**: Configuración centralizada y tipada

## Notas Importantes

- El archivo `public/config.js` es solo para desarrollo y será reemplazado en producción
- Las variables deben tener el prefijo `REACT_APP_` para ser accesibles
- El script `entrypoint.sh` debe tener permisos de ejecución
- La configuración se genera cada vez que se inicia el contenedor