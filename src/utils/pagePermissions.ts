import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { UserRole } from "../types";

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
    route: "/admin/dashboard",
    name: "Panel de Administración",
    description: "Dashboard principal para administradores",
    requiredPermissions: [],
    allowedRoles: ["admin"],
  },
  {
    route: "/trainer/dashboard",
    name: "Panel de Entrenador",
    description: "Dashboard para entrenadores",
    requiredPermissions: [],
    allowedRoles: ["trainer"],
  },
  {
    route: "/supervisor/dashboard",
    name: "Panel de Supervisor",
    description: "Dashboard para supervisores",
    requiredPermissions: [],
    allowedRoles: ["supervisor"],
  },
  {
    route: "/employee/dashboard",
    name: "Panel de Empleado",
    description: "Dashboard para empleados",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },

  // User Management
  {
    route: "/admin/users",
    name: "Gestión de Usuarios",
    description: "Administración de usuarios del sistema",
    requiredPermissions: ["canViewUsersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions, user) => {
      if (user.role === UserRole.ADMIN) return true;
      return permissions.canViewUsersPage();
    },
  },

  // Worker Management
  {
    route: "/admin/workers",
    name: "Gestión de Trabajadores",
    description: "Administración de trabajadores",
    requiredPermissions: ["canViewWorkersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },
  {
    route: "/admin/workers/detail",
    name: "Búsqueda de Trabajadores",
    description: "Búsqueda y consulta de trabajadores",
    requiredPermissions: ["canViewWorkersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },
  {
    route: "/admin/workers/:workerId",
    name: "Detalle de Trabajador",
    description: "Vista detallada de un trabajador específico",
    requiredPermissions: ["canViewWorkersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },
  {
    route: "/admin/workers/:workerId/vacations",
    name: "Gestión de Vacaciones",
    description: "Gestión de vacaciones de trabajadores",
    requiredPermissions: ["canViewWorkersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },

  // Course Management
  {
    route: "/admin/courses",
    name: "Gestión de Cursos",
    description: "Administración de cursos",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: "/admin/interactive-lessons",
    name: "Lecciones Interactivas",
    description:
      "Administración de lecciones interactivas y material multimedia",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: "/admin/module/:moduleId/lesson/new",
    name: "Nueva Lección Interactiva",
    description: "Creador de lecciones interactivas",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: "/admin/lesson/:lessonId/edit",
    name: "Editar Lección Interactiva",
    description: "Editor de lecciones interactivas",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: "/admin/enrollments",
    name: "Gestión de Inscripciones",
    description: "Administración de inscripciones a cursos",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: "/employee/courses",
    name: "Mis Cursos",
    description: "Cursos del empleado",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/employee/courses/:id",
    name: "Detalle del Curso",
    description: "Vista detallada de un curso",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/employee/courses/:id/evaluation",
    name: "Evaluación del Curso",
    description: "Evaluación de un curso específico",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/employee/evaluations",
    name: "Mis Evaluaciones",
    description: "Evaluaciones del empleado",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/employee/surveys",
    name: "Mis Encuestas",
    description: "Encuestas del empleado",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/employee/certificates",
    name: "Mis Certificados",
    description: "Certificados del empleado",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/employee/attendance",
    name: "Mi Asistencia",
    description: "Registro de asistencia del empleado",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/employee/vacations",
    name: "Mis Vacaciones",
    description: "Solicitudes de vacaciones del empleado",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/employee/votings",
    name: "Mis Votaciones",
    description: "Votaciones disponibles para el empleado",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },

  // Evaluation Management
  {
    route: "/admin/evaluations",
    name: "Gestión de Evaluaciones",
    description: "Administración de evaluaciones",
    requiredPermissions: ["canViewEvaluationsPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },
  {
    route: "/admin/evaluation-results",
    name: "Resultados de Evaluaciones",
    description: "Resultados y estadísticas de evaluaciones",
    requiredPermissions: ["canViewEvaluationsPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },

  // Survey Management
  {
    route: "/admin/surveys",
    name: "Gestión de Encuestas",
    description: "Administración de encuestas",
    requiredPermissions: ["canViewSurveysPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewSurveysPage(),
  },
  {
    route: "/admin/survey-tabulation",
    name: "Tabulación de Encuestas",
    description: "Análisis y tabulación de resultados de encuestas",
    requiredPermissions: ["canViewSurveysPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewSurveysPage(),
  },
  {
    route: "/admin/nordico-tabulation",
    name: "Tabulación Cuestionario Nórdico",
    description: "Análisis de síntomas musculoesqueléticos por región corporal",
    requiredPermissions: ["canViewSurveysPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewSurveysPage(),
  },
  {
    route: "/admin/burnout-tabulation",
    name: "Tabulación Síndrome de Burnout",
    description:
      "Análisis MBI de agotamiento emocional, despersonalización y realización personal",
    requiredPermissions: ["canViewSurveysPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewSurveysPage(),
  },
  {
    route: "/employee/courses/:id/surveys",
    name: "Encuestas del Curso",
    description: "Encuestas asociadas a un curso específico",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },

  // Progress and Tracking
  {
    route: "/admin/progress",
    name: "Progreso de Usuarios",
    description: "Seguimiento del progreso de usuarios",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: "/admin/user-progress",
    name: "Progreso Detallado",
    description: "Vista detallada del progreso de usuarios",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },

  // Attendance
  {
    route: "/admin/attendance",
    name: "Gestión de Asistencia",
    description: "Control de asistencia",
    requiredPermissions: ["canViewAttendancePage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewAttendancePage(),
  },

  // Occupational Health
  {
    route: "/admin/occupational-exams",
    name: "Exámenes Ocupacionales",
    description: "Gestión de exámenes ocupacionales",
    requiredPermissions: ["canViewOccupationalExamPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewOccupationalExamPage(),
  },
  {
    route: "/admin/seguimientos",
    name: "Seguimientos",
    description: "Seguimientos de salud ocupacional",
    requiredPermissions: ["canViewSeguimientoPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewSeguimientoPage(),
  },
  {
    route: "/admin/reinduction",
    name: "Reinducciones",
    description: "Gestión de reinducciones",
    requiredPermissions: ["canViewReinductionPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewReinductionPage(),
  },

  // Certificates
  {
    route: "/admin/certificates",
    name: "Gestión de Certificados",
    description: "Administración de certificados",
    requiredPermissions: ["canViewCertificatesPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewCertificatesPage(),
  },

  // Notifications
  {
    route: "/admin/notifications",
    name: "Gestión de Notificaciones",
    description: "Administración de notificaciones",
    requiredPermissions: ["canViewNotificationsPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewNotificationsPage(),
  },

  // Reports
  {
    route: "/admin/reports",
    name: "Reportes",
    description: "Generación y visualización de reportes",
    requiredPermissions: ["canViewReportsPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewReportsPage(),
  },

  // Administration
  {
    route: "/admin/config",
    name: "Configuración del Sistema",
    description: "Configuración general del sistema",
    requiredPermissions: ["canViewAdminConfigPage"],
    allowedRoles: ["admin"],
    customCheck: (permissions) => permissions.canViewAdminConfigPage(),
  },
  {
    route: "/admin/roles",
    name: "Gestión de Roles",
    description: "Administración de roles personalizados",
    requiredPermissions: ["canViewRolesPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewRolesPage(),
  },
  {
    route: "/admin/audit",
    name: "Auditoría",
    description: "Registro de auditoría del sistema",
    requiredPermissions: ["canViewAdminConfigPage"],
    allowedRoles: ["admin"],
    customCheck: (permissions) => permissions.canViewAdminConfigPage(),
  },
  {
    route: "/admin/files",
    name: "Gestión de Archivos",
    description: "Administración de archivos del sistema",
    requiredPermissions: ["canViewFilesPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewFilesPage(),
  },
  {
    route: "/admin/notification-acknowledgment",
    name: "Confirmación de Notificaciones",
    description: "Gestión de confirmaciones de notificaciones",
    requiredPermissions: ["canViewNotificationsPage"],
    allowedRoles: ["admin"],
    customCheck: (permissions) => permissions.canViewNotificationsPage(),
  },
  {
    route: "/admin/evaluation-results",
    name: "Resultados de Evaluaciones",
    description: "Visualización de resultados de evaluaciones",
    requiredPermissions: ["canViewEvaluationsPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },

  // Absenteeism
  {
    route: "/admin/absenteeism",
    name: "Gestión de Ausentismo",
    description: "Administración de ausentismo laboral",
    requiredPermissions: ["canViewAbsenteeismPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewAbsenteeismPage(),
  },

  // Suppliers
  {
    route: "/admin/suppliers",
    name: "Gestión de Proveedores",
    description: "Administración de proveedores",
    requiredPermissions: ["canViewSuppliersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewSuppliersPage(),
  },

  // Profile (accessible to all authenticated users)
  {
    route: "/profile",
    name: "Perfil de Usuario",
    description: "Perfil del usuario",
    requiredPermissions: [],
    allowedRoles: ["admin", "trainer", "supervisor", "employee"],
  },

  // Dashboards específicos
  {
    route: "/trainer/dashboard",
    name: "Dashboard del Instructor",
    description: "Panel de control para instructores",
    requiredPermissions: [],
    allowedRoles: ["trainer"],
  },
  {
    route: "/employee/dashboard",
    name: "Dashboard del Empleado",
    description: "Panel de control para empleados",
    requiredPermissions: [],
    allowedRoles: ["employee"],
  },
  {
    route: "/supervisor/dashboard",
    name: "Dashboard del Supervisor",
    description: "Panel de control para supervisores",
    requiredPermissions: [],
    allowedRoles: ["supervisor"],
  },

  // Rutas adicionales
  {
    route: "/admin/user-progress",
    name: "Progreso de Usuarios",
    description: "Seguimiento del progreso de usuarios",
    requiredPermissions: ["canViewProgressPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewProgressPage(),
  },

  // Rutas que usan allowedRoles pero necesitan soporte para roles personalizados
  {
    route: "/admin/enrollments",
    name: "Inscripciones",
    description: "Gestión de inscripciones a cursos",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) =>
      permissions.canViewCoursesPage() || permissions.canViewEnrollmentPage(),
  },
  {
    route: "/admin/evaluation-results",
    name: "Resultados de Evaluaciones",
    description: "Ver resultados de evaluaciones",
    requiredPermissions: ["canViewEvaluationsPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },
  {
    route: "/admin/progress",
    name: "Progreso",
    description: "Seguimiento del progreso de usuarios",
    requiredPermissions: ["canViewProgressPage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewProgressPage(),
  },
  {
    route: "/admin/attendance",
    name: "Asistencia",
    description: "Gestión de asistencia",
    requiredPermissions: ["canViewAttendancePage"],
    allowedRoles: ["admin", "trainer", "supervisor"],
    customCheck: (permissions) => permissions.canViewAttendancePage(),
  },
  {
    route: "/admin/suppliers",
    name: "Proveedores",
    description: "Gestión de proveedores",
    requiredPermissions: ["canViewSuppliersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewSuppliersPage(),
  },
  {
    route: "/admin/workers/detail",
    name: "Búsqueda de Trabajadores",
    description: "Búsqueda detallada de trabajadores",
    requiredPermissions: ["canViewWorkersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },
  {
    route: "/admin/workers/vacations",
    name: "Vacaciones de Trabajadores",
    description: "Gestión de vacaciones",
    requiredPermissions: ["canViewWorkersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewWorkersPage(),
  },
  {
    route: "/admin/homework-assessments",
    name: "Evaluaciones de Trabajo en Casa",
    description: "Gestión de evaluaciones de trabajo en casa",
    requiredPermissions: ["canViewEvaluationsPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },
  {
    route: "/admin/ergonomic-self-inspections",
    name: "Autoinspección Puesto Ergonómico",
    description: "Gestión de autoinspecciones del puesto ergonómico",
    requiredPermissions: ["canViewEvaluationsPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },
  {
    route: "/admin/ergonomic-self-inspections/dashboard",
    name: "Dashboard Autoinspección Ergonómica",
    description:
      "Análisis consolidado de la autoinspección del puesto ergonómico",
    requiredPermissions: ["canViewEvaluationsPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewEvaluationsPage(),
  },
  {
    route: "/admin/lesson/:lessonId/preview",
    name: "Vista previa de Lección",
    description: "Vista previa de lecciones interactivas",
    requiredPermissions: ["canViewCoursesPage"],
    allowedRoles: ["admin", "trainer"],
    customCheck: (permissions) => permissions.canViewCoursesPage(),
  },
  {
    route: "/admin/plan-trabajo-anual",
    name: "Plan de Trabajo Anual SG-SST",
    description:
      "Gestión del Plan de Trabajo Anual (PL-SST-02) con seguimiento mensual P/E",
    requiredPermissions: [],
    allowedRoles: ["admin", "supervisor"],
  },
  {
    route: "/admin/plan-trabajo-anual/:planId",
    name: "Detalle Plan de Trabajo Anual",
    description:
      "Cronograma anual SG-SST con matriz de actividades y dashboard de cumplimiento",
    requiredPermissions: [],
    allowedRoles: ["admin", "supervisor"],
  },

  // Committees
  {
    route: "/admin/committees/dashboard",
    name: "Dashboard de Comités",
    description: "Dashboard general de comités COPASST y Convivencia",
    requiredPermissions: ["canViewCommitteeDashboardPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteeDashboardPage(),
  },
  {
    route: "/admin/committees",
    name: "Gestión de Comités",
    description: "Listado y gestión de comités",
    requiredPermissions: ["canViewCommitteePage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteePage(),
  },
  {
    route: "/admin/committees/:id",
    name: "Detalle de Comité",
    description: "Vista detallada de un comité",
    requiredPermissions: ["canReadCommittee"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canReadCommittee(),
  },
  {
    route: "/admin/committees/new",
    name: "Crear Comité",
    description: "Formulario para crear un nuevo comité",
    requiredPermissions: ["canCreateCommittee"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canCreateCommittee(),
  },
  {
    route: "/admin/committees/:id/edit",
    name: "Editar Comité",
    description: "Formulario para editar un comité",
    requiredPermissions: ["canUpdateCommittee"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canUpdateCommittee(),
  },
  {
    route: "/admin/committees/meetings",
    name: "Reuniones de Comité",
    description: "Gestión de reuniones de comité",
    requiredPermissions: ["canViewCommitteeMeetingsPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteeMeetingsPage(),
  },
  {
    route: "/admin/committees/:id/meetings/new",
    name: "Nueva Reunión",
    description: "Crear una nueva reunión de comité",
    requiredPermissions: ["canCreateCommitteeMeeting"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canCreateCommitteeMeeting(),
  },
  {
    route: "/meetings/:meetingId/attendance",
    name: "Asistencia a Reunión",
    description: "Registro de asistencia a reunión de comité",
    requiredPermissions: ["canViewCommitteeMeetingsPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteeMeetingsPage(),
  },
  {
    route: "/admin/committees/activities",
    name: "Actividades de Comité",
    description: "Gestión de actividades de comité",
    requiredPermissions: ["canViewCommitteeActivitiesPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteeActivitiesPage(),
  },
  {
    route: "/admin/committees/:id/activities/new",
    name: "Nueva Actividad",
    description: "Crear una nueva actividad de comité",
    requiredPermissions: ["canCreateCommitteeActivity"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canCreateCommitteeActivity(),
  },
  {
    route: "/admin/committees/documents",
    name: "Documentos de Comité",
    description: "Gestión de documentos de comité",
    requiredPermissions: ["canViewCommitteeDocumentsPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteeDocumentsPage(),
  },
  {
    route: "/admin/committees/:id/documents/new",
    name: "Nuevo Documento",
    description: "Subir un nuevo documento de comité",
    requiredPermissions: ["canCreateCommitteeDocument"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canCreateCommitteeDocument(),
  },
  {
    route: "/admin/committees/actas",
    name: "Actas de Reunión",
    description: "Gestión de actas de reunión de comité",
    requiredPermissions: ["canViewCommitteeActasPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteeActasPage(),
  },
  {
    route: "/admin/committees/:id/actas",
    name: "Actas del Comité",
    description: "Actas de reunión de un comité específico",
    requiredPermissions: ["canViewCommitteeActasPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteeActasPage(),
  },
  {
    route: "/admin/committees/:id/actas/new",
    name: "Nueva Acta",
    description: "Crear una nueva acta de reunión",
    requiredPermissions: ["canCreateCommitteeActa"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canCreateCommitteeActa(),
  },
  {
    route: "/admin/committees/:id/actas/:actaId/edit",
    name: "Editar Acta",
    description: "Editar un acta de reunión",
    requiredPermissions: ["canUpdateCommitteeActa"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canUpdateCommitteeActa(),
  },
  {
    route: "/admin/candidate-votings",
    name: "Votaciones de Candidatos",
    description: "Gestión de votaciones para candidatos a comités",
    requiredPermissions: ["canViewCommitteeVotingPage"],
    allowedRoles: ["admin", "supervisor", "trainer"],
    customCheck: (permissions) => permissions.canViewCommitteeVotingPage(),
  },
  {
    route: "/admin/candidate-votings/new",
    name: "Nueva Votación",
    description: "Crear una nueva votación de candidatos",
    requiredPermissions: ["canCreateCommitteeVoting"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canCreateCommitteeVoting(),
  },
  {
    route: "/admin/candidate-votings/:id/edit",
    name: "Editar Votación",
    description: "Editar una votación de candidatos",
    requiredPermissions: ["canUpdateCommitteeVoting"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canUpdateCommitteeVoting(),
  },
  {
    route: "/admin/committees/:id/members",
    name: "Miembros del Comité",
    description: "Gestión de miembros de un comité",
    requiredPermissions: ["canViewCommitteeMembersPage"],
    allowedRoles: ["admin", "supervisor"],
    customCheck: (permissions) => permissions.canViewCommitteeMembersPage(),
  },
];

/**
 * Hook para verificar permisos de página
 */
export const usePagePermissions = () => {
  const permissions = usePermissions();
  const { user } = useAuth();

  const canAccessPage = (route: string): boolean => {
    const pageConfig = PAGE_PERMISSIONS.find((p) => {
      // Manejar rutas con parámetros
      const routePattern = p.route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(route);
    });

    if (!pageConfig) {
      // Si no hay configuración específica, permitir acceso por defecto
      return true;
    }

    // Verificar rol
    if (!user) return false;

    // Admin y superadmin siempre tienen acceso
    const userRole = user.role || (user as any).rol;
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN) return true;

    // Normalizar el rol para comparación
    const normalizedRole = userRole?.includes("UserRole.")
      ? userRole.split(".")[1].toLowerCase()
      : userRole;

    // Si tiene rol personalizado, verificar permisos custom primero
    if (user.custom_role_id) {
      if (pageConfig.customCheck) {
        return pageConfig.customCheck(permissions, user);
      }
      if (pageConfig.requiredPermissions.length > 0) {
        return pageConfig.requiredPermissions.every((permission) => {
          const permissionFunction = (permissions as any)[permission];
          return typeof permissionFunction === "function"
            ? permissionFunction()
            : false;
        });
      }
    }

    // Verificar acceso por rol base
    if (!pageConfig.allowedRoles.includes(normalizedRole)) {
      return false;
    }

    // Verificar permisos personalizados si existe
    if (pageConfig.customCheck) {
      return pageConfig.customCheck(permissions, user);
    }

    // Verificar permisos requeridos
    if (pageConfig.requiredPermissions.length > 0) {
      return pageConfig.requiredPermissions.every((permission) => {
        const permissionFunction = (permissions as any)[permission];
        return typeof permissionFunction === "function"
          ? permissionFunction()
          : false;
      });
    }

    return true;
  };

  const getPageConfig = (route: string): PagePermissionConfig | undefined => {
    return PAGE_PERMISSIONS.find((p) => {
      const routePattern = p.route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(route);
    });
  };

  const getAllowedPages = (): PagePermissionConfig[] => {
    return PAGE_PERMISSIONS.filter((page) => canAccessPage(page.route));
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
export const checkPagePermission = (
  route: string,
  user: any,
  permissions: any,
): boolean => {
  const pageConfig = PAGE_PERMISSIONS.find((p) => {
    const routePattern = p.route.replace(/:[^/]+/g, "[^/]+");
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(route);
  });

  if (!pageConfig) return true;
  if (!user) return false;

  // Verificar si es administrador del sistema (con o sin rol personalizado)
  const userRole = user?.role || user?.rol;
  const isSystemAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

  if (isSystemAdmin) {
    return true; // Los administradores del sistema tienen acceso a todo
  }

  // Normalizar el rol para comparación
  const normalizedRole = userRole?.includes("UserRole.")
    ? userRole.split(".")[1].toLowerCase()
    : userRole?.toLowerCase();

  // Si tiene rol personalizado, verificar permisos custom primero (sin bloquear por allowedRoles)
  if (user.custom_role_id) {
    if (pageConfig.customCheck)
      return pageConfig.customCheck(permissions, user);
    if (pageConfig.requiredPermissions.length > 0) {
      return pageConfig.requiredPermissions.every((permission) => {
        const permissionFunction = (permissions as any)[permission];
        return typeof permissionFunction === "function"
          ? permissionFunction()
          : false;
      });
    }
  }

  if (!pageConfig.allowedRoles.includes(normalizedRole)) return false;
  if (pageConfig.customCheck) return pageConfig.customCheck(permissions, user);

  if (pageConfig.requiredPermissions.length > 0) {
    return pageConfig.requiredPermissions.every((permission) => {
      const permissionFunction = (permissions as any)[permission];
      return typeof permissionFunction === "function"
        ? permissionFunction()
        : false;
    });
  }

  return true;
};
