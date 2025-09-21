import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { UserRole } from '../types';

/**
 * Mapeo de permisos para cada página/funcionalidad del sistema
 * Este archivo centraliza todas las verificaciones de permisos por página
 */

export interface PagePermissionConfig {
  route: string;
  name: string;
  description: string;
  requiredPermissions: string[];
  allowedRoles: string[];
  customCheck?: (permissions: any, user: any) => boolean;
}

export const PAGE_PERMISSIONS: PagePermissionConfig[] = [
  // Dashboard pages
  {
    route: '/admin/dashboard',
    name: 'Panel de Administración',
    description: 'Dashboard principal para administradores',
    requiredPermissions: [],
    allowedRoles: ['admin'],
  },
  {
    route: '/trainer/dashboard',
    name: 'Panel de Entrenador',
    description: 'Dashboard para entrenadores',
    requiredPermissions: [],
    allowedRoles: ['trainer'],
  },
  {
    route: '/supervisor/dashboard',
    name: 'Panel de Supervisor',
    description: 'Dashboard para supervisores',
    requiredPermissions: [],
    allowedRoles: ['supervisor'],
  },
  {
    route: '/employee/dashboard',
    name: 'Panel de Empleado',
    description: 'Dashboard para empleados',
    requiredPermissions: [],
    allowedRoles: ['employee'],
  },

  // User Management
  {
    route: '/admin/users',
    name: 'Gestión de Usuarios',
    description: 'Administración de usuarios del sistema',
    requiredPermissions: ['canViewUsersPage'],
    allowedRoles: ['admin', 'supervisor'],
    customCheck: (permissions, user) => {
      if (user.role === UserRole.ADMIN) return true;
      return permissions.canViewUsersPage();
    },
  },

  // Worker Management
  {
    route: '/admin/workers',
    name: 'Gestión de Trabajadores',
    description: 'Administración de trabajadores',
    requiredPermissions: ['canViewWorkersPage'],
    allowedRoles: ['admin', 'supervisor'],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },
  {
    route: '/admin/workers/detail',
    name: 'Búsqueda de Trabajadores',
    description: 'Búsqueda y consulta de trabajadores',
    requiredPermissions: ['canViewWorkersPage'],
    allowedRoles: ['admin', 'supervisor'],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },
  {
    route: '/admin/workers/:workerId',
    name: 'Detalle de Trabajador',
    description: 'Vista detallada de un trabajador específico',
    requiredPermissions: ['canViewWorkersPage'],
    allowedRoles: ['admin'],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },

  // Course Management
  {
    route: '/admin/courses',
    name: 'Gestión de Cursos',
    description: 'Administración de cursos',
    requiredPermissions: ['canViewCoursesPage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: '/admin/enrollments',
    name: 'Gestión de Inscripciones',
    description: 'Administración de inscripciones a cursos',
    requiredPermissions: ['canViewCoursesPage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: '/employee/courses',
    name: 'Mis Cursos',
    description: 'Cursos del empleado',
    requiredPermissions: [],
    allowedRoles: ['employee'],
  },
  {
    route: '/employee/courses/:id',
    name: 'Detalle del Curso',
    description: 'Vista detallada de un curso',
    requiredPermissions: [],
    allowedRoles: ['employee'],
  },

  // Evaluation Management
  {
    route: '/admin/evaluations',
    name: 'Gestión de Evaluaciones',
    description: 'Administración de evaluaciones',
    requiredPermissions: ['canViewEvaluationsPage'],
    allowedRoles: ['admin', 'trainer'],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },
  {
    route: '/admin/evaluation-results',
    name: 'Resultados de Evaluaciones',
    description: 'Resultados y estadísticas de evaluaciones',
    requiredPermissions: ['canViewEvaluationsPage'],
    allowedRoles: ['admin', 'trainer'],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },

  // Survey Management
  {
    route: '/admin/surveys',
    name: 'Gestión de Encuestas',
    description: 'Administración de encuestas',
    requiredPermissions: ['canViewSurveysPage'],
    allowedRoles: ['admin', 'trainer'],
    customCheck: (permissions) => permissions.canViewSurveysPage(),
  },
  {
    route: '/admin/survey-tabulation',
    name: 'Tabulación de Encuestas',
    description: 'Análisis y tabulación de resultados de encuestas',
    requiredPermissions: ['canViewSurveysPage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewSurveysPage,
  },
  {
    route: '/employee/courses/:id/surveys',
    name: 'Encuestas del Curso',
    description: 'Encuestas asociadas a un curso específico',
    requiredPermissions: [],
    allowedRoles: ['employee'],
  },

  // Progress and Tracking
  {
    route: '/admin/progress',
    name: 'Progreso de Usuarios',
    description: 'Seguimiento del progreso de usuarios',
    requiredPermissions: ['canViewCoursesPage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: '/admin/user-progress',
    name: 'Progreso Detallado',
    description: 'Vista detallada del progreso de usuarios',
    requiredPermissions: ['canViewCoursesPage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },

  // Attendance
  {
    route: '/admin/attendance',
    name: 'Gestión de Asistencia',
    description: 'Control de asistencia',
    requiredPermissions: ['canViewAttendancePage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewAttendancePage(),
  },

  // Occupational Health
  {
    route: '/admin/occupational-exams',
    name: 'Exámenes Ocupacionales',
    description: 'Gestión de exámenes ocupacionales',
    requiredPermissions: ['canViewOccupationalExamPage'],
    allowedRoles: ['admin', 'supervisor'],
    customCheck: (permissions) => permissions.canViewOccupationalExamPage(),
  },
  {
    route: '/admin/seguimientos',
    name: 'Seguimientos',
    description: 'Seguimientos de salud ocupacional',
    requiredPermissions: ['canViewSeguimientoPage'],
    allowedRoles: ['admin', 'supervisor'],
    customCheck: (permissions) => permissions.canViewSeguimientoPage(),
  },
  {
    route: '/admin/reinduction',
    name: 'Reinducciones',
    description: 'Gestión de reinducciones',
    requiredPermissions: ['canViewReinductionPage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewReinductionPage(),
  },

  // Certificates
  {
    route: '/admin/certificates',
    name: 'Gestión de Certificados',
    description: 'Administración de certificados',
    requiredPermissions: ['canViewCertificatesPage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewCertificatesPage(),
  },

  // Notifications
  {
    route: '/admin/notifications',
    name: 'Gestión de Notificaciones',
    description: 'Administración de notificaciones',
    requiredPermissions: ['canViewNotificationsPage'],
    allowedRoles: ['admin', 'trainer', 'supervisor'],
    customCheck: (permissions) => permissions.canViewNotificationsPage(),
  },

  // Reports
  {
    route: '/admin/reports',
    name: 'Reportes',
    description: 'Generación y visualización de reportes',
    requiredPermissions: ['canViewReportsPage'],
    allowedRoles: ['admin', 'supervisor'],
    customCheck: (permissions) => permissions.canViewReportsPage(),
  },

  // Administration
  {
    route: '/admin/config',
    name: 'Configuración del Sistema',
    description: 'Configuración general del sistema',
    requiredPermissions: ['canViewAdminConfigPage'],
    allowedRoles: ['admin'],
    customCheck: (permissions) => permissions.canViewAdminConfigPage(),
  },
  {
    route: '/admin/roles',
    name: 'Gestión de Roles',
    description: 'Administración de roles personalizados',
    requiredPermissions: ['canViewRolesPage'],
    allowedRoles: ['admin', 'supervisor'],
    customCheck: (permissions) => permissions.canViewRolesPage(),
  },
  {
    route: '/admin/audit',
    name: 'Auditoría',
    description: 'Registro de auditoría del sistema',
    requiredPermissions: ['canViewAdminConfigPage'],
    allowedRoles: ['admin'],
    customCheck: (permissions) => permissions.canViewAdminConfigPage(),
  },
  {
    route: '/admin/files',
    name: 'Gestión de Archivos',
    description: 'Administración de archivos del sistema',
    requiredPermissions: ['canViewCoursesPage'],
    allowedRoles: ['admin', 'trainer'],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },

  // Absenteeism
  {
    route: '/admin/absenteeism',
    name: 'Gestión de Ausentismo',
    description: 'Administración de ausentismo laboral',
    requiredPermissions: ['canViewWorkersPage'],
    allowedRoles: ['admin', 'supervisor'],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },

  // Profile (accessible to all authenticated users)
  {
    route: '/profile',
    name: 'Perfil de Usuario',
    description: 'Perfil personal del usuario',
    requiredPermissions: [],
    allowedRoles: ['admin', 'trainer', 'supervisor', 'employee'],
  },
];

/**
 * Hook para verificar permisos de página
 */
export const usePagePermissions = () => {
  const permissions = usePermissions();
  const { user } = useAuth();

  const canAccessPage = (route: string): boolean => {
    const pageConfig = PAGE_PERMISSIONS.find(p => {
      // Manejar rutas con parámetros
      const routePattern = p.route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(route);
    });

    if (!pageConfig) {
      // Si no hay configuración específica, permitir acceso por defecto
      return true;
    }

    // Verificar rol
    if (!user) return false;
    
    // Normalizar el rol para comparación
    const normalizedRole = user.role?.includes('UserRole.') ? user.role.split('.')[1].toLowerCase() : user.role;
    
    if (!pageConfig.allowedRoles.includes(normalizedRole)) {
      return false;
    }

    // Verificar permisos personalizados si existe
    if (pageConfig.customCheck) {
      return pageConfig.customCheck(permissions, user);
    }

    // Verificar permisos requeridos
    if (pageConfig.requiredPermissions.length > 0) {
      return pageConfig.requiredPermissions.every(permission => {
        const permissionFunction = (permissions as any)[permission];
        return typeof permissionFunction === 'function' ? permissionFunction() : false;
      });
    }

    return true;
  };

  const getPageConfig = (route: string): PagePermissionConfig | undefined => {
    return PAGE_PERMISSIONS.find(p => {
      const routePattern = p.route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(route);
    });
  };

  const getAllowedPages = (): PagePermissionConfig[] => {
    return PAGE_PERMISSIONS.filter(page => canAccessPage(page.route));
  };

  return {
    canAccessPage,
    getPageConfig,
    getAllowedPages,
    PAGE_PERMISSIONS,
  };
};

/**
 * Función auxiliar para verificar permisos en componentes
 */
export const checkPagePermission = (route: string, user: any, permissions: any): boolean => {
  const pageConfig = PAGE_PERMISSIONS.find(p => {
    const routePattern = p.route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(route);
  });

  if (!pageConfig) return true;
  if (!user) return false;
  
  // Verificar si es administrador del sistema (con o sin rol personalizado)
  const userRole = user?.role || user?.rol;
  const isSystemAdmin = userRole === UserRole.ADMIN;
  
  if (isSystemAdmin) {
    return true; // Los administradores del sistema tienen acceso a todo
  }
  
  // Normalizar el rol para comparación
  const normalizedRole = userRole?.includes('UserRole.') ? userRole.split('.')[1].toLowerCase() : userRole?.toLowerCase();
  
  if (!pageConfig.allowedRoles.includes(normalizedRole)) return false;
  if (pageConfig.customCheck) return pageConfig.customCheck(permissions, user);
  
  if (pageConfig.requiredPermissions.length > 0) {
    return pageConfig.requiredPermissions.every(permission => {
      const permissionFunction = (permissions as any)[permission];
      return typeof permissionFunction === 'function' ? permissionFunction() : false;
    });
  }

  return true;
};