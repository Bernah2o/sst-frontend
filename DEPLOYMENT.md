# SST Platform Frontend - Deployment Guide

## 📋 Descripción

Esta guía describe cómo desplegar el frontend de SST Platform usando Dockploy.

## 🚀 Deployment con Dockploy

### Prerrequisitos

1. **Dockploy instalado y configurado**
2. **Docker y Docker Compose disponibles**
3. **Acceso al repositorio del código**
4. **Variables de entorno configuradas**

### Variables de Entorno Requeridas

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```bash
# Server Configuration
PORT=80
FRONTEND_PORT=3000

# API Configuration
REACT_APP_API_URL=https://api.tudominio.com
REACT_APP_ENVIRONMENT=production

# Domain Configuration
FRONTEND_DOMAIN=tudominio.com

# Build Configuration
GENERATE_SOURCEMAP=false
REACT_APP_VERSION=1.0.0

# Security Configuration
REACT_APP_ENABLE_HTTPS=true
```

### Pasos de Deployment

#### 1. Configuración en Dockploy

1. **Crear nuevo proyecto** en Dockploy
2. **Configurar repositorio** Git
3. **Establecer rama** de deployment (main/production)
4. **Configurar variables de entorno**

#### 2. Configuración del Build

```yaml
# En Dockploy, usar estos settings:
Build Context: .
Dockerfile: Dockerfile
Build Args:
  - NODE_ENV=production
```

#### 3. Configuración de Red

```yaml
# Network Settings:
Port Mapping: 3000:80
Health Check: /health
Domain: tu-dominio.com
SSL: Enabled (Let's Encrypt)
```

#### 4. Variables de Entorno en Dockploy

Configura estas variables en la interfaz de Dockploy:

- `NODE_ENV=production`
- `PORT=80`
- `REACT_APP_API_URL=https://api.tudominio.com`
- `REACT_APP_ENVIRONMENT=production`
- `FRONTEND_DOMAIN=tudominio.com`
- `GENERATE_SOURCEMAP=false`

### 🔧 Configuración Avanzada

#### Proxy Reverso

El nginx está configurado para hacer proxy de las requests `/api/` al backend:

```nginx
location /api/ {
    proxy_pass ${REACT_APP_API_URL}/;
    # ... configuración adicional
}
```

#### Health Checks

El contenedor expone un endpoint de health check en `/health`:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "service": "sst-frontend"
}
```

#### Optimizaciones de Performance

- **Gzip compression** habilitada
- **Cache headers** optimizados
- **Static assets** con cache de 1 año
- **Security headers** configurados
- **Resource limits** establecidos

### 🛡️ Seguridad

#### Headers de Seguridad

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy` configurado

#### Usuario No-Root

El contenedor ejecuta nginx con un usuario no-root (`nextjs:nodejs`) para mayor seguridad.

### 📊 Monitoreo

#### Health Checks

```bash
# Verificar estado del contenedor
curl -f http://localhost:3000/health
```

#### Logs

```bash
# Ver logs del contenedor
docker logs sst-frontend

# Seguir logs en tiempo real
docker logs -f sst-frontend
```

#### Métricas de Recursos

- **Memory Limit**: 512MB
- **CPU Limit**: 0.5 cores
- **Memory Reservation**: 256MB
- **CPU Reservation**: 0.25 cores

### 🔄 CI/CD Pipeline

#### Workflow Recomendado

1. **Push** a rama `main`
2. **Dockploy** detecta cambios
3. **Build** automático del contenedor
4. **Health check** del nuevo contenedor
5. **Rolling deployment** sin downtime
6. **Verificación** post-deployment

#### Rollback

En caso de problemas:

```bash
# Rollback a versión anterior
dockploy rollback sst-frontend
```

### 🐛 Troubleshooting

#### Problemas Comunes

1. **Build failures**:
   - Verificar variables de entorno
   - Revisar logs de build
   - Validar Dockerfile

2. **Health check failures**:
   - Verificar endpoint `/health`
   - Revisar configuración de nginx
   - Validar puerto expuesto

3. **Performance issues**:
   - Revisar resource limits
   - Verificar cache headers
   - Analizar bundle size

#### Comandos Útiles

```bash
# Verificar estado del contenedor
docker ps | grep sst-frontend

# Inspeccionar configuración
docker inspect sst-frontend

# Acceder al contenedor
docker exec -it sst-frontend sh

# Verificar configuración de nginx
docker exec sst-frontend cat /etc/nginx/conf.d/default.conf
```

### 📝 Notas Importantes

1. **SSL/TLS**: Configurar certificados SSL en Dockploy
2. **Domain**: Apuntar DNS al servidor de Dockploy
3. **Backup**: Configurar backups regulares
4. **Monitoring**: Implementar alertas de monitoreo
5. **Updates**: Planificar actualizaciones regulares

### 🔗 Enlaces Útiles

- [Documentación de Dockploy](https://dockploy.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

**Nota**: Esta configuración está optimizada para producción con Dockploy. Asegúrate de revisar y ajustar las configuraciones según tus necesidades específicas.