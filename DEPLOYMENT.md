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
REACT_APP_API_URL=https://api.dh2o.com.co

# Domain Configuration
FRONTEND_DOMAIN=sst.dh2o.com.co

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

```

#### 3. Configuración de Red

```yaml
# Network Settings:
Port Mapping: 3000:80
Health Check: /health
Domain: sst.dh2o.com.co
SSL: Enabled (Let's Encrypt)
```

#### 4. Variables de Entorno en Dockploy

Configura estas variables en la interfaz de Dockploy:

- `NODE_ENV=production`
- `PORT=80`
- `REACT_APP_API_URL=https://api.dh2o.com.co`
- `REACT_APP_ENVIRONMENT=production`
- `FRONTEND_DOMAIN=sst.dh2o.com.co`
- `GENERATE_SOURCEMAP=false`

### 🔧 Configuración Avanzada


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

4. **CORS Errors**:
   - Verificar que `ALLOWED_ORIGINS` incluya el dominio del frontend
   - Confirmar que `REACT_APP_API_URL` apunte al dominio correcto
   - Revisar configuración de CORS en el backend

5. **Variables de Entorno Expuestas**:
   - Verificar que archivos `.env*` estén en `.gitignore`
   - Confirmar que no hay archivos `.env` en el repositorio Git
   - Usar `git ls-files --cached | grep \.env` para verificar

6. **Problemas de Dominio**:
   - Verificar configuración DNS
   - Confirmar que SSL esté habilitado
   - Validar que los dominios coincidan en frontend y backend

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

# Verificar que archivos .env no estén en Git
git ls-files --cached | grep \.env

# Verificar que archivos .env estén siendo ignorados
git check-ignore .env.production

# Verificar configuración de CORS desde el frontend
curl -H "Origin: https://sst.dh2o.com.co" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.dh2o.com.co/health

# Verificar conectividad entre frontend y backend
curl -f https://api.dh2o.com.co/health
```

### 🔐 Configuración de Seguridad Actual

#### Variables de Entorno Sensibles

**IMPORTANTE**: Los archivos `.env` y `.env.production` contienen información sensible y están correctamente excluidos del control de versiones:

- ✅ `.env.production` eliminado del repositorio Git
- ✅ `.gitignore` configurado para ignorar archivos `.env*`
- ✅ Variables de entorno configuradas directamente en Dockploy

#### Dominios de Producción

- **Frontend**: `https://sst.dh2o.com.co`
- **Backend API**: `https://api.dh2o.com.co`
- **Configuración CORS**: Permite peticiones solo desde el dominio del frontend

#### Configuración de Red

```bash
# Configuración actual de producción
FRONTEND_URL=https://sst.dh2o.com.co
ALLOWED_ORIGINS=https://sst.dh2o.com.co
REACT_APP_API_URL=https://api.dh2o.com.co
```

### 📝 Notas Importantes

1. **SSL/TLS**: Certificados SSL configurados automáticamente
2. **Domain**: DNS apuntando a `sst.dh2o.com.co` y `api.dh2o.com.co`
3. **Security**: Variables sensibles nunca en el repositorio
4. **CORS**: Configurado para permitir solo el dominio de producción
5. **Backup**: Configurar backups regulares
6. **Monitoring**: Implementar alertas de monitoreo
7. **Updates**: Planificar actualizaciones regulares

### 🔗 Enlaces Útiles

- [Documentación de Dockploy](https://dockploy.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

**Nota**: Esta configuración está optimizada para producción con Dockploy. Asegúrate de revisar y ajustar las configuraciones según tus necesidades específicas.