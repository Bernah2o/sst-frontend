# SST Platform - Frontend

Interfaz de usuario para la plataforma de Seguridad y Salud en el Trabajo (SST) desarrollada con React y TypeScript.

## 🚀 Características

- **React 18**: Biblioteca de JavaScript para interfaces de usuario
- **TypeScript**: Superset tipado de JavaScript
- **Material-UI**: Componentes de interfaz de usuario
- **React Router**: Enrutamiento del lado del cliente
- **Axios**: Cliente HTTP para API
- **React Hook Form**: Manejo de formularios
- **React Query**: Gestión de estado del servidor
- **Responsive Design**: Diseño adaptable a dispositivos móviles

## 📋 Requisitos

- Node.js 16+
- npm 8+ o yarn 1.22+
- Docker (opcional)

## 🛠️ Instalación

### Desarrollo Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd sst-frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   npm start
   # o
   yarn start
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

### Docker

1. **Construir imagen Docker**
   ```bash
   docker build -t sst-frontend:latest .
   ```

2. **Ejecutar contenedor**
   ```bash
   docker run -p 3000:80 sst-frontend:latest
   ```

3. **O usar Docker Compose**
   ```bash
   docker-compose up -d
   ```

## 🗂️ Estructura del Proyecto

```
sst-frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Layout/
│   │   ├── Sidebar/
│   │   └── ...
│   ├── pages/           # Páginas de la aplicación
│   │   ├── Dashboard/
│   │   ├── Workers/
│   │   ├── Courses/
│   │   └── ...
│   ├── contexts/        # Contextos de React
│   ├── hooks/           # Hooks personalizados
│   ├── services/        # Servicios de API
│   ├── types/           # Definiciones de TypeScript
│   ├── utils/           # Utilidades
│   ├── styles/          # Estilos globales
│   ├── App.tsx          # Componente principal
│   └── index.tsx        # Punto de entrada
├── package.json         # Dependencias y scripts
├── tsconfig.json        # Configuración de TypeScript
├── Dockerfile          # Configuración de Docker
└── README.md           # Este archivo
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start                # Ejecutar en modo desarrollo
npm run dev             # Alias para start

# Construcción
npm run build           # Construir para producción
npm run build:analyze   # Analizar bundle de producción

# Testing
npm test                # Ejecutar tests
npm run test:coverage   # Tests con cobertura
npm run test:watch      # Tests en modo watch

# Linting y Formateo
npm run lint            # Ejecutar ESLint
npm run lint:fix        # Corregir errores de ESLint
npm run format          # Formatear código con Prettier

# Otros
npm run eject           # Exponer configuración (irreversible)
npm run serve           # Servir build de producción
```

## 🎨 Componentes Principales

### Layout
- **Sidebar**: Navegación lateral con menús por rol
- **Navbar**: Barra superior con información del usuario
- **Layout**: Contenedor principal de la aplicación

### Páginas
- **Dashboard**: Panel principal por rol de usuario
- **Workers**: Gestión de trabajadores
- **Courses**: Gestión de cursos
- **Evaluations**: Sistema de evaluaciones
- **Reports**: Generación de reportes
- **Settings**: Configuración del sistema

### Componentes Reutilizables
- **DataTable**: Tabla de datos con paginación y filtros
- **FormDialog**: Diálogos modales para formularios
- **FileUpload**: Componente de carga de archivos
- **Charts**: Gráficos y visualizaciones

## 🔒 Autenticación y Autorización

### Roles de Usuario
- **Admin**: Acceso completo al sistema
- **Supervisor**: Gestión de trabajadores y reportes
- **Trainer**: Gestión de cursos y evaluaciones
- **Employee**: Acceso a cursos y evaluaciones propias

### Protección de Rutas
```typescript
// Ejemplo de ruta protegida
<ProtectedRoute roles={['admin', 'supervisor']}>
  <WorkersPage />
</ProtectedRoute>
```

## 🌐 Configuración de API

### Variables de Entorno
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_VERSION=v1
```

### Servicios de API
```typescript
// Ejemplo de servicio
import { apiClient } from './apiClient';

export const workersService = {
  getAll: () => apiClient.get('/workers'),
  getById: (id: string) => apiClient.get(`/workers/${id}`),
  create: (data: WorkerCreate) => apiClient.post('/workers', data),
  update: (id: string, data: WorkerUpdate) => 
    apiClient.put(`/workers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/workers/${id}`)
};
```

## 🎯 Características Principales

### Gestión de Trabajadores
- Lista paginada con filtros
- Formularios de creación y edición
- Carga masiva desde Excel
- Exportación de datos

### Sistema de Cursos
- Catálogo de cursos
- Inscripciones y seguimiento
- Material multimedia
- Certificados automáticos

### Evaluaciones
- Creación de exámenes
- Diferentes tipos de preguntas
- Calificación automática
- Reportes de resultados

### Dashboard Responsivo
- Gráficos interactivos
- Métricas en tiempo real
- Filtros por fecha y categoría
- Exportación de reportes

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests específicos
npm test -- --testNamePattern="Workers"

# Tests en modo watch
npm run test:watch
```

### Estructura de Tests
```
src/
├── components/
│   └── __tests__/
├── pages/
│   └── __tests__/
├── services/
│   └── __tests__/
└── utils/
    └── __tests__/
```

## 📦 Construcción y Despliegue

### Desarrollo
```bash
npm run build:dev
```

### Producción
```bash
npm run build
```

### Docker
```bash
# Construir imagen
docker build -t sst-frontend:latest .

# Ejecutar contenedor
docker run -p 80:80 sst-frontend:latest
```

### Nginx (Producción)
El Dockerfile incluye configuración de Nginx optimizada para:
- Compresión gzip
- Cache de assets estáticos
- Manejo de React Router
- Headers de seguridad

## 🔧 Configuración de Desarrollo

### ESLint
```json
{
  "extends": [
    "react-app",
    "react-app/jest",
    "@typescript-eslint/recommended"
  ]
}
```

### Prettier
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 📱 Responsive Design

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: sm (600px), md (960px), lg (1280px), xl (1920px)
- **Grid System**: Sistema de grillas flexible
- **Touch Friendly**: Elementos táctiles optimizados

## 🚀 Optimizaciones de Performance

- **Code Splitting**: Carga lazy de componentes
- **Memoization**: React.memo y useMemo
- **Bundle Analysis**: Análisis de tamaño de bundle
- **Image Optimization**: Compresión y lazy loading
- **Service Worker**: Cache de recursos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- Usar TypeScript para tipado estricto
- Seguir las convenciones de ESLint y Prettier
- Escribir tests para nuevas funcionalidades
- Documentar componentes complejos
- Usar nombres descriptivos para variables y funciones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico, contacta a: [soporte@sstplatform.com](mailto:soporte@sstplatform.com)

## 🔗 Enlaces Útiles

- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Testing Library Documentation](https://testing-library.com/)
