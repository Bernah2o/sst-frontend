import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UserRole } from '../types';

export interface PermissionCheck {
  resource_type: string;
  action: string;
}

export interface PermissionResult {
  has_permission: boolean;
  reason?: string;
}

export interface PageAccess {
  id: number;
  role_id: number;
  page_route: string;
  page_name: string;
  can_access: boolean;
}

export interface ResourcePermissions {
  // User permissions
  canManageUsers: boolean;
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  // Course permissions
  canManageCourses: boolean;
  canViewCourses: boolean;
  canCreateCourses: boolean;
  canDeleteCourses: boolean;
  // Enrollment permissions
  canManageEnrollments: boolean;
  canViewEnrollments: boolean;
  canCreateEnrollments: boolean;
  canDeleteEnrollments: boolean;
  // Evaluation permissions
  canManageEvaluations: boolean;
  canViewEvaluations: boolean;
  canCreateEvaluations: boolean;
  canDeleteEvaluations: boolean;
  // Report permissions
  canViewReports: boolean;
  canExportReports: boolean;
  // Survey permissions
  canManageSurveys: boolean;
  canViewSurveys: boolean;
  canCreateSurveys: boolean;
  canDeleteSurveys: boolean;
  // Certificate permissions
  canManageCertificates: boolean;
  canViewCertificates: boolean;
  canCreateCertificates: boolean;
  // Attendance permissions
  canManageAttendance: boolean;
  canViewAttendance: boolean;
  canUpdateAttendance: boolean;
  // Worker permissions
  canManageWorkers: boolean;
  canViewWorkers: boolean;
  canCreateWorkers: boolean;
  canDeleteWorkers: boolean;
  // Notification permissions
  canManageNotifications: boolean;
  canViewNotifications: boolean;
  canCreateNotifications: boolean;
  // Reinduction permissions
  canManageReinduction: boolean;
  canViewReinduction: boolean;
  canCreateReinduction: boolean;
  // Occupational exam permissions
  canManageOccupationalExam: boolean;
  canViewOccupationalExam: boolean;
  canCreateOccupationalExam: boolean;
  // Seguimiento permissions
  canManageSeguimiento: boolean;
  canViewSeguimiento: boolean;
  canCreateSeguimiento: boolean;
  // Admin config permissions
  canManageAdminConfig: boolean;
  canViewAdminConfig: boolean;
  canUpdateAdminConfig: boolean;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [pageAccesses, setPageAccesses] = useState<PageAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<ResourcePermissions>({
    // User permissions
    canManageUsers: false,
    canViewUsers: false,
    canCreateUsers: false,
    canDeleteUsers: false,
    // Course permissions
    canManageCourses: false,
    canViewCourses: false,
    canCreateCourses: false,
    canDeleteCourses: false,
    // Enrollment permissions
    canManageEnrollments: false,
    canViewEnrollments: false,
    canCreateEnrollments: false,
    canDeleteEnrollments: false,
    // Evaluation permissions
    canManageEvaluations: false,
    canViewEvaluations: false,
    canCreateEvaluations: false,
    canDeleteEvaluations: false,
    // Report permissions
    canViewReports: false,
    canExportReports: false,
    // Survey permissions
    canManageSurveys: false,
    canViewSurveys: false,
    canCreateSurveys: false,
    canDeleteSurveys: false,
    // Certificate permissions
    canManageCertificates: false,
    canViewCertificates: false,
    canCreateCertificates: false,
    // Attendance permissions
    canManageAttendance: false,
    canViewAttendance: false,
    canUpdateAttendance: false,
    // Worker permissions
    canManageWorkers: false,
    canViewWorkers: false,
    canCreateWorkers: false,
    canDeleteWorkers: false,
    // Notification permissions
    canManageNotifications: false,
    canViewNotifications: false,
    canCreateNotifications: false,
    // Reinduction permissions
    canManageReinduction: false,
    canViewReinduction: false,
    canCreateReinduction: false,
    // Occupational exam permissions
    canManageOccupationalExam: false,
    canViewOccupationalExam: false,
    canCreateOccupationalExam: false,
    // Seguimiento permissions
    canManageSeguimiento: false,
    canViewSeguimiento: false,
    canCreateSeguimiento: false,
    // Admin config permissions
    canManageAdminConfig: false,
    canViewAdminConfig: false,
    canUpdateAdminConfig: false
  });

  // Función para cargar datos del usuario
  const loadUserData = useCallback(async () => {
      if (!user) {
        setPageAccesses([]);
        setUserPermissions({
          // User permissions
          canManageUsers: false,
          canViewUsers: false,
          canCreateUsers: false,
          canDeleteUsers: false,
          // Course permissions
          canManageCourses: false,
          canViewCourses: false,
          canCreateCourses: false,
          canDeleteCourses: false,
          // Enrollment permissions
          canManageEnrollments: false,
          canViewEnrollments: false,
          canCreateEnrollments: false,
          canDeleteEnrollments: false,
          // Evaluation permissions
          canManageEvaluations: false,
          canViewEvaluations: false,
          canCreateEvaluations: false,
          canDeleteEvaluations: false,
          // Report permissions
          canViewReports: false,
          canExportReports: false,
          // Survey permissions
          canManageSurveys: false,
          canViewSurveys: false,
          canCreateSurveys: false,
          canDeleteSurveys: false,
          // Certificate permissions
          canManageCertificates: false,
          canViewCertificates: false,
          canCreateCertificates: false,
          // Attendance permissions
          canManageAttendance: false,
          canViewAttendance: false,
          canUpdateAttendance: false,
          // Worker permissions
          canManageWorkers: false,
          canViewWorkers: false,
          canCreateWorkers: false,
          canDeleteWorkers: false,
          // Notification permissions
          canManageNotifications: false,
          canViewNotifications: false,
          canCreateNotifications: false,
          // Reinduction permissions
          canManageReinduction: false,
          canViewReinduction: false,
          canCreateReinduction: false,
          // Occupational exam permissions
          canManageOccupationalExam: false,
          canViewOccupationalExam: false,
          canCreateOccupationalExam: false,
          // Seguimiento permissions
          canManageSeguimiento: false,
          canViewSeguimiento: false,
          canCreateSeguimiento: false,
          // Admin config permissions
          canManageAdminConfig: false,
          canViewAdminConfig: false,
          canUpdateAdminConfig: false
        });
        return;
      }

      try {
        setLoading(true);
        
        // Cargar accesos a páginas si tiene rol personalizado
        if (user.custom_role_id) {
          const pageResponse = await api.get('/permissions/my-pages');
          setPageAccesses(pageResponse.data);
        } else {
          setPageAccesses([]);
        }

        // Cargar permisos específicos
        const permissions: ResourcePermissions = {
          // User permissions
          canManageUsers: false,
          canViewUsers: false,
          canCreateUsers: false,
          canDeleteUsers: false,
          // Course permissions
          canManageCourses: false,
          canViewCourses: false,
          canCreateCourses: false,
          canDeleteCourses: false,
          // Enrollment permissions
          canManageEnrollments: false,
          canViewEnrollments: false,
          canCreateEnrollments: false,
          canDeleteEnrollments: false,
          // Evaluation permissions
          canManageEvaluations: false,
          canViewEvaluations: false,
          canCreateEvaluations: false,
          canDeleteEvaluations: false,
          // Report permissions
          canViewReports: false,
          canExportReports: false,
          // Survey permissions
          canManageSurveys: false,
          canViewSurveys: false,
          canCreateSurveys: false,
          canDeleteSurveys: false,
          // Certificate permissions
          canManageCertificates: false,
          canViewCertificates: false,
          canCreateCertificates: false,
          // Attendance permissions
          canManageAttendance: false,
          canViewAttendance: false,
          canUpdateAttendance: false,
          // Worker permissions
          canManageWorkers: false,
          canViewWorkers: false,
          canCreateWorkers: false,
          canDeleteWorkers: false,
          // Notification permissions
          canManageNotifications: false,
          canViewNotifications: false,
          canCreateNotifications: false,
          // Reinduction permissions
          canManageReinduction: false,
          canViewReinduction: false,
          canCreateReinduction: false,
          // Occupational exam permissions
          canManageOccupationalExam: false,
          canViewOccupationalExam: false,
          canCreateOccupationalExam: false,
          // Seguimiento permissions
          canManageSeguimiento: false,
          canViewSeguimiento: false,
          canCreateSeguimiento: false,
          // Admin config permissions
          canManageAdminConfig: false,
          canViewAdminConfig: false,
          canUpdateAdminConfig: false
        };

        // Si es admin (rol básico), tiene todos los permisos independientemente de si tiene rol personalizado
        const userRole = user.role || user.rol; // Compatibilidad con ambos nombres de campo
        if (userRole === UserRole.ADMIN) {
          Object.keys(permissions).forEach(key => {
            (permissions as any)[key] = true;
          });
        } else if (user.custom_role_id) {
          // Para usuarios con rol personalizado, verificar permisos específicos
          try {
            const permissionChecks = [
              // User permissions
              { key: 'canManageUsers', resource: 'USER', action: 'UPDATE' },
              { key: 'canViewUsers', resource: 'USER', action: 'READ' },
              { key: 'canCreateUsers', resource: 'USER', action: 'CREATE' },
              { key: 'canDeleteUsers', resource: 'USER', action: 'DELETE' },
              // Course permissions
              { key: 'canManageCourses', resource: 'COURSE', action: 'READ' },
              { key: 'canViewCourses', resource: 'COURSE', action: 'READ' },
              { key: 'canCreateCourses', resource: 'COURSE', action: 'CREATE' },
              { key: 'canDeleteCourses', resource: 'COURSE', action: 'DELETE' },
              // Enrollment permissions
              { key: 'canManageEnrollments', resource: 'ENROLLMENT', action: 'UPDATE' },
              { key: 'canViewEnrollments', resource: 'ENROLLMENT', action: 'READ' },
              { key: 'canCreateEnrollments', resource: 'ENROLLMENT', action: 'CREATE' },
              { key: 'canDeleteEnrollments', resource: 'ENROLLMENT', action: 'DELETE' },
              // Evaluation permissions
              { key: 'canManageEvaluations', resource: 'EVALUATION', action: 'UPDATE' },
              { key: 'canViewEvaluations', resource: 'EVALUATION', action: 'READ' },
              { key: 'canCreateEvaluations', resource: 'EVALUATION', action: 'CREATE' },
              { key: 'canDeleteEvaluations', resource: 'EVALUATION', action: 'DELETE' },
              // Report permissions
              { key: 'canViewReports', resource: 'REPORT', action: 'READ' },
              { key: 'canExportReports', resource: 'REPORT', action: 'EXPORT' },
              // Survey permissions
              { key: 'canManageSurveys', resource: 'SURVEY', action: 'UPDATE' },
              { key: 'canViewSurveys', resource: 'SURVEY', action: 'READ' },
              { key: 'canCreateSurveys', resource: 'SURVEY', action: 'CREATE' },
              { key: 'canDeleteSurveys', resource: 'SURVEY', action: 'DELETE' },
              // Certificate permissions
              { key: 'canManageCertificates', resource: 'CERTIFICATE', action: 'UPDATE' },
              { key: 'canViewCertificates', resource: 'CERTIFICATE', action: 'READ' },
              { key: 'canCreateCertificates', resource: 'CERTIFICATE', action: 'CREATE' },
              // Attendance permissions
              { key: 'canManageAttendance', resource: 'ATTENDANCE', action: 'UPDATE' },
              { key: 'canViewAttendance', resource: 'ATTENDANCE', action: 'READ' },
              { key: 'canUpdateAttendance', resource: 'ATTENDANCE', action: 'UPDATE' },
              // Worker permissions
              { key: 'canManageWorkers', resource: 'WORKER', action: 'UPDATE' },
              { key: 'canViewWorkers', resource: 'WORKER', action: 'READ' },
              { key: 'canCreateWorkers', resource: 'WORKER', action: 'CREATE' },
              { key: 'canDeleteWorkers', resource: 'WORKER', action: 'DELETE' },
              // Notification permissions
              { key: 'canManageNotifications', resource: 'NOTIFICATION', action: 'UPDATE' },
              { key: 'canViewNotifications', resource: 'NOTIFICATION', action: 'READ' },
              { key: 'canCreateNotifications', resource: 'NOTIFICATION', action: 'CREATE' },
              // Reinduction permissions
              { key: 'canManageReinduction', resource: 'REINDUCTION', action: 'UPDATE' },
              { key: 'canViewReinduction', resource: 'REINDUCTION', action: 'READ' },
              { key: 'canCreateReinduction', resource: 'REINDUCTION', action: 'CREATE' },
              // Occupational exam permissions
              { key: 'canManageOccupationalExam', resource: 'OCCUPATIONAL_EXAM', action: 'UPDATE' },
              { key: 'canViewOccupationalExam', resource: 'OCCUPATIONAL_EXAM', action: 'READ' },
              { key: 'canCreateOccupationalExam', resource: 'OCCUPATIONAL_EXAM', action: 'CREATE' },
              // Seguimiento permissions
              { key: 'canManageSeguimiento', resource: 'SEGUIMIENTO', action: 'UPDATE' },
              { key: 'canViewSeguimiento', resource: 'SEGUIMIENTO', action: 'READ' },
              { key: 'canCreateSeguimiento', resource: 'SEGUIMIENTO', action: 'CREATE' },
              // Admin config permissions
              { key: 'canManageAdminConfig', resource: 'ADMIN_CONFIG', action: 'UPDATE' },
              { key: 'canViewAdminConfig', resource: 'ADMIN_CONFIG', action: 'READ' },
              { key: 'canUpdateAdminConfig', resource: 'ADMIN_CONFIG', action: 'UPDATE' }
            ];

            const responses = await Promise.all(
              permissionChecks.map(check => 
                api.post('/permissions/check', { 
                  resource_type: check.resource, 
                  action: check.action 
                }).catch(() => ({ data: { has_permission: false } }))
              )
            );

            permissionChecks.forEach((check, index) => {
              (permissions as any)[check.key] = responses[index].data.has_permission;
            });
          } catch (error) {
            console.error('Error checking permissions:', error);
          }
        }

        setUserPermissions(permissions);
      } catch (error) {
        console.error('Error loading user data:', error);
        setPageAccesses([]);
        setUserPermissions({
          // User permissions
          canManageUsers: false,
          canViewUsers: false,
          canCreateUsers: false,
          canDeleteUsers: false,
          // Course permissions
          canManageCourses: false,
          canViewCourses: false,
          canCreateCourses: false,
          canDeleteCourses: false,
          // Enrollment permissions
          canManageEnrollments: false,
          canViewEnrollments: false,
          canCreateEnrollments: false,
          canDeleteEnrollments: false,
          // Evaluation permissions
          canManageEvaluations: false,
          canViewEvaluations: false,
          canCreateEvaluations: false,
          canDeleteEvaluations: false,
          // Report permissions
          canViewReports: false,
          canExportReports: false,
          // Survey permissions
          canManageSurveys: false,
          canViewSurveys: false,
          canCreateSurveys: false,
          canDeleteSurveys: false,
          // Certificate permissions
          canManageCertificates: false,
          canViewCertificates: false,
          canCreateCertificates: false,
          // Attendance permissions
          canManageAttendance: false,
          canViewAttendance: false,
          canUpdateAttendance: false,
          // Worker permissions
          canManageWorkers: false,
          canViewWorkers: false,
          canCreateWorkers: false,
          canDeleteWorkers: false,
          // Notification permissions
          canManageNotifications: false,
          canViewNotifications: false,
          canCreateNotifications: false,
          // Reinduction permissions
          canManageReinduction: false,
          canViewReinduction: false,
          canCreateReinduction: false,
          // Occupational exam permissions
          canManageOccupationalExam: false,
          canViewOccupationalExam: false,
          canCreateOccupationalExam: false,
          // Seguimiento permissions
          canManageSeguimiento: false,
          canViewSeguimiento: false,
          canCreateSeguimiento: false,
          // Admin config permissions
          canManageAdminConfig: false,
          canViewAdminConfig: false,
          canUpdateAdminConfig: false
        });
      } finally {
        setLoading(false);
      }
  }, [user?.custom_role_id, user?.role]);

  // Efecto para cargar datos cuando cambie el usuario
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Función para refrescar permisos manualmente
  const refreshPermissions = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  // Verificar si el usuario tiene un permiso específico
  const checkPermission = useCallback(async (resourceType: string, action: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await api.post('/permissions/check', {
        resource_type: resourceType,
        action: action
      });
      return response.data.has_permission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }, [user]);

  // Verificar acceso a una página específica
  const canAccessPage = useCallback((pageRoute: string): boolean => {
    // Si no tiene rol personalizado, usar lógica tradicional
    if (!user?.custom_role_id) {
      return checkTraditionalPageAccess(pageRoute, user?.role);
    }

    // Mapeo de rutas a permisos específicos para usuarios con rol personalizado
    const routePermissionMap: Record<string, () => boolean> = {
      // User management routes
      '/admin/users': canManageUsers,
      '/users': canViewUsers,
      
      // Course management routes
      '/courses': canViewCourses,
      '/courses/list': canViewCourses,
      '/courses/create': canCreateCourses,
      '/courses/edit': canManageCourses,
      
      // Enrollment management routes
      '/enrollments': canViewEnrollments,
      '/enrollments/list': canViewEnrollments,
      '/enrollments/create': canCreateEnrollments,
      '/enrollments/edit': canManageEnrollments,
      '/admin/enrollments': canManageEnrollments,
      '/reinduction': canViewCourses,
      
      // Evaluation routes
      '/evaluations': canViewEvaluations,
      '/evaluations/list': canViewEvaluations,
      '/evaluations/create': canCreateEvaluations,
      '/evaluations/edit': canManageEvaluations,
      '/evaluation-results': canViewEvaluations,
      
      // Survey routes
      '/surveys': canViewSurveys,
      '/surveys/create': canCreateSurveys,
      '/surveys/edit': canManageSurveys,
      
      // Attendance routes
      '/attendance': canViewAttendance,
      '/attendance/list': canViewAttendance,
      '/admin/attendance': canManageAttendance,
      
      // Worker/Health routes
      '/workers': canViewWorkers,
      '/workers/list': canViewWorkers,
      '/workers/create': canCreateWorkers,
      '/workers/edit': canManageWorkers,
      '/admin/workers': canViewWorkers,  // Ruta faltante para administración de trabajadores
      '/occupational-exams': () => canViewWorkers() || canManageWorkers(),
      '/admin/occupational-exams': () => canViewWorkers() || canManageWorkers(),
      '/seguimientos': () => canViewWorkers() || canManageWorkers(),
      
      // Certificate routes
      '/certificates': canViewCertificates,
      '/certificates/create': canCreateCertificates,
      
      // Report routes
      '/reports': canViewReports,
      '/reports/export': canExportReports,
      
      // Notification routes
      '/notifications': canViewNotifications,
      
      // Admin routes (only for system admins)
      '/admin/audit': () => {
        const userRole = user?.role || user?.rol;
        return userRole === UserRole.ADMIN;
      },
      '/admin/config': () => {
        const userRole = user?.role || user?.rol;
        return userRole === UserRole.ADMIN;
      },
      '/admin/roles': () => {
        const userRole = user?.role || user?.rol;
        return userRole === UserRole.ADMIN;
      },
      
      // General routes (accessible to all authenticated users)
      '/dashboard': () => true,
      '/profile': () => true
    };

    // Verificar si hay un mapeo específico para la ruta
    const permissionCheck = routePermissionMap[pageRoute];
    if (permissionCheck) {
      return permissionCheck();
    }

    // Si tiene rol personalizado pero no hay mapeo específico, verificar en pageAccesses
    const pageAccess = pageAccesses.find(access => access.page_route === pageRoute);
    
    // Si no hay configuración específica para la página, denegar acceso por defecto para mayor seguridad
    return pageAccess ? pageAccess.can_access : false;
  }, [user, pageAccesses, userPermissions]);

  // Funciones síncronas para verificar permisos (basadas en el estado cargado)
  // User permissions
  const canManageUsers = useCallback((): boolean => {
    return userPermissions.canManageUsers;
  }, [userPermissions.canManageUsers]);

  const canViewUsers = useCallback((): boolean => {
    return userPermissions.canViewUsers;
  }, [userPermissions.canViewUsers]);

  const canCreateUsers = useCallback((): boolean => {
    return userPermissions.canCreateUsers;
  }, [userPermissions.canCreateUsers]);

  const canDeleteUsers = useCallback((): boolean => {
    return userPermissions.canDeleteUsers;
  }, [userPermissions.canDeleteUsers]);

  // Course permissions
  const canManageCourses = useCallback((): boolean => {
    return userPermissions.canManageCourses;
  }, [userPermissions.canManageCourses]);

  const canViewCourses = useCallback((): boolean => {
    return userPermissions.canViewCourses;
  }, [userPermissions.canViewCourses]);

  const canCreateCourses = useCallback((): boolean => {
    return userPermissions.canCreateCourses;
  }, [userPermissions.canCreateCourses]);

  const canDeleteCourses = useCallback((): boolean => {
    return userPermissions.canDeleteCourses;
  }, [userPermissions.canDeleteCourses]);

  // Enrollment permissions
  const canManageEnrollments = useCallback((): boolean => {
    return userPermissions.canManageEnrollments;
  }, [userPermissions.canManageEnrollments]);

  const canViewEnrollments = useCallback((): boolean => {
    return userPermissions.canViewEnrollments;
  }, [userPermissions.canViewEnrollments]);

  const canCreateEnrollments = useCallback((): boolean => {
    return userPermissions.canCreateEnrollments;
  }, [userPermissions.canCreateEnrollments]);

  const canDeleteEnrollments = useCallback((): boolean => {
    return userPermissions.canDeleteEnrollments;
  }, [userPermissions.canDeleteEnrollments]);

  // Evaluation permissions
  const canManageEvaluations = useCallback((): boolean => {
    return userPermissions.canManageEvaluations;
  }, [userPermissions.canManageEvaluations]);

  const canViewEvaluations = useCallback((): boolean => {
    return userPermissions.canViewEvaluations;
  }, [userPermissions.canViewEvaluations]);

  const canCreateEvaluations = useCallback((): boolean => {
    return userPermissions.canCreateEvaluations;
  }, [userPermissions.canCreateEvaluations]);

  const canDeleteEvaluations = useCallback((): boolean => {
    return userPermissions.canDeleteEvaluations;
  }, [userPermissions.canDeleteEvaluations]);

  // Report permissions
  const canViewReports = useCallback((): boolean => {
    return userPermissions.canViewReports;
  }, [userPermissions.canViewReports]);

  const canExportReports = useCallback((): boolean => {
    return userPermissions.canExportReports;
  }, [userPermissions.canExportReports]);

  // Survey permissions
  const canManageSurveys = useCallback((): boolean => {
    return userPermissions.canManageSurveys;
  }, [userPermissions.canManageSurveys]);

  const canViewSurveys = useCallback((): boolean => {
    return userPermissions.canViewSurveys;
  }, [userPermissions.canViewSurveys]);

  const canCreateSurveys = useCallback((): boolean => {
    return userPermissions.canCreateSurveys;
  }, [userPermissions.canCreateSurveys]);

  const canDeleteSurveys = useCallback((): boolean => {
    return userPermissions.canDeleteSurveys;
  }, [userPermissions.canDeleteSurveys]);

  // Certificate permissions
  const canManageCertificates = useCallback((): boolean => {
    return userPermissions.canManageCertificates;
  }, [userPermissions.canManageCertificates]);

  const canViewCertificates = useCallback((): boolean => {
    return userPermissions.canViewCertificates;
  }, [userPermissions.canViewCertificates]);

  const canCreateCertificates = useCallback((): boolean => {
    return userPermissions.canCreateCertificates;
  }, [userPermissions.canCreateCertificates]);

  // Attendance permissions
  const canManageAttendance = useCallback((): boolean => {
    return userPermissions.canManageAttendance;
  }, [userPermissions.canManageAttendance]);

  const canViewAttendance = useCallback((): boolean => {
    return userPermissions.canViewAttendance;
  }, [userPermissions.canViewAttendance]);

  const canUpdateAttendance = useCallback((): boolean => {
    return userPermissions.canUpdateAttendance;
  }, [userPermissions.canUpdateAttendance]);

  // Worker permissions
  const canManageWorkers = useCallback((): boolean => {
    return userPermissions.canManageWorkers;
  }, [userPermissions.canManageWorkers]);

  const canViewWorkers = useCallback((): boolean => {
    return userPermissions.canViewWorkers;
  }, [userPermissions.canViewWorkers]);

  const canCreateWorkers = useCallback((): boolean => {
    return userPermissions.canCreateWorkers;
  }, [userPermissions.canCreateWorkers]);

  const canDeleteWorkers = useCallback((): boolean => {
    return userPermissions.canDeleteWorkers;
  }, [userPermissions.canDeleteWorkers]);

  // Notification permissions
  const canManageNotifications = useCallback((): boolean => {
    return userPermissions.canManageNotifications;
  }, [userPermissions.canManageNotifications]);

  const canViewNotifications = useCallback((): boolean => {
    return userPermissions.canViewNotifications;
  }, [userPermissions.canViewNotifications]);

  const canCreateNotifications = useCallback((): boolean => {
    return userPermissions.canCreateNotifications;
  }, [userPermissions.canCreateNotifications]);

  // Reinduction permissions
  const canManageReinduction = useCallback((): boolean => {
    return userPermissions.canManageReinduction;
  }, [userPermissions.canManageReinduction]);

  const canViewReinduction = useCallback((): boolean => {
    return userPermissions.canViewReinduction;
  }, [userPermissions.canViewReinduction]);

  const canCreateReinduction = useCallback((): boolean => {
    return userPermissions.canCreateReinduction;
  }, [userPermissions.canCreateReinduction]);

  // Occupational exam permissions
  const canManageOccupationalExam = useCallback((): boolean => {
    return userPermissions.canManageOccupationalExam;
  }, [userPermissions.canManageOccupationalExam]);

  const canViewOccupationalExam = useCallback((): boolean => {
    return userPermissions.canViewOccupationalExam;
  }, [userPermissions.canViewOccupationalExam]);

  const canCreateOccupationalExam = useCallback((): boolean => {
    return userPermissions.canCreateOccupationalExam;
  }, [userPermissions.canCreateOccupationalExam]);

  // Seguimiento permissions
  const canManageSeguimiento = useCallback((): boolean => {
    return userPermissions.canManageSeguimiento;
  }, [userPermissions.canManageSeguimiento]);

  const canViewSeguimiento = useCallback((): boolean => {
    return userPermissions.canViewSeguimiento;
  }, [userPermissions.canViewSeguimiento]);

  const canCreateSeguimiento = useCallback((): boolean => {
    return userPermissions.canCreateSeguimiento;
  }, [userPermissions.canCreateSeguimiento]);

  // Admin config permissions
  const canManageAdminConfig = useCallback((): boolean => {
    return userPermissions.canManageAdminConfig;
  }, [userPermissions.canManageAdminConfig]);

  const canViewAdminConfig = useCallback((): boolean => {
    return userPermissions.canViewAdminConfig;
  }, [userPermissions.canViewAdminConfig]);

  const canUpdateAdminConfig = useCallback((): boolean => {
    return userPermissions.canUpdateAdminConfig;
  }, [userPermissions.canUpdateAdminConfig]);

  // Funciones asíncronas para verificación en tiempo real (para casos específicos)
  const checkCanManageUsers = useCallback(async (): Promise<boolean> => {
    return await checkPermission('USER', 'UPDATE');
  }, [checkPermission]);

  const checkCanViewUsers = useCallback(async (): Promise<boolean> => {
    return await checkPermission('USER', 'READ');
  }, [checkPermission]);

  const checkCanCreateUsers = useCallback(async (): Promise<boolean> => {
    return await checkPermission('USER', 'CREATE');
  }, [checkPermission]);

  const checkCanDeleteUsers = useCallback(async (): Promise<boolean> => {
    return await checkPermission('USER', 'DELETE');
  }, [checkPermission]);

  return {
    loading,
    pageAccesses,
    userPermissions,
    checkPermission,
    canAccessPage,
    // User permissions
    canManageUsers,
    canViewUsers,
    canCreateUsers,
    canDeleteUsers,
    // Course permissions
    canManageCourses,
    canViewCourses,
    canCreateCourses,
    canDeleteCourses,
    // Enrollment permissions
    canManageEnrollments,
    canViewEnrollments,
    canCreateEnrollments,
    canDeleteEnrollments,
    // Evaluation permissions
    canManageEvaluations,
    canViewEvaluations,
    canCreateEvaluations,
    canDeleteEvaluations,
    // Report permissions
    canViewReports,
    canExportReports,
    // Survey permissions
    canManageSurveys,
    canViewSurveys,
    canCreateSurveys,
    canDeleteSurveys,
    // Certificate permissions
    canManageCertificates,
    canViewCertificates,
    canCreateCertificates,
    // Attendance permissions
    canManageAttendance,
    canViewAttendance,
    canUpdateAttendance,
    // Worker permissions
    canManageWorkers,
    canViewWorkers,
    canCreateWorkers,
    canDeleteWorkers,
    // Notification permissions
    canManageNotifications,
    canViewNotifications,
    canCreateNotifications,
    // Reinduction permissions
    canManageReinduction,
    canViewReinduction,
    canCreateReinduction,
    // Occupational exam permissions
    canManageOccupationalExam,
    canViewOccupationalExam,
    canCreateOccupationalExam,
    // Seguimiento permissions
    canManageSeguimiento,
    canViewSeguimiento,
    canCreateSeguimiento,
    // Admin config permissions
    canManageAdminConfig,
    canViewAdminConfig,
    canUpdateAdminConfig,
    // Async functions for real-time checks
    checkCanManageUsers,
    checkCanViewUsers,
    checkCanCreateUsers,
    checkCanDeleteUsers,
    // Function to refresh permissions
    refreshPermissions
  };
};

// Función auxiliar para verificar acceso tradicional basado en roles del sistema
function checkTraditionalPageAccess(pageRoute: string, userRole?: string): boolean {
  if (!userRole) return false;

  // Normalizar el rol para comparación
  const normalizedRole = userRole.includes('UserRole.') ? userRole.split('.')[1].toLowerCase() : userRole.toLowerCase();

  // Mapeo tradicional de acceso a páginas por rol del sistema
  const traditionalAccess: Record<string, string[]> = {
    '/admin/users': ['admin', 'supervisor'],
    '/admin/roles': ['admin'],
    '/admin/config': ['admin'],
    '/admin/workers': ['admin', 'supervisor'],
    '/courses': ['admin', 'supervisor', 'trainer'],
    '/evaluations': ['admin', 'supervisor', 'trainer'],
    '/reports': ['admin', 'supervisor', 'trainer'],
    '/attendance': ['admin', 'supervisor', 'trainer'],
    '/surveys': ['admin', 'supervisor', 'trainer'],
    '/certificates': ['admin', 'supervisor', 'trainer'],
    '/notifications': ['admin', 'supervisor', 'trainer'],
    '/seguimiento': ['admin', 'supervisor'],
    '/profile': ['admin', 'supervisor', 'trainer', 'employee'],
    '/dashboard': ['admin', 'supervisor', 'trainer', 'employee']
  };

  const allowedRoles = traditionalAccess[pageRoute];
  return allowedRoles ? allowedRoles.includes(normalizedRole) : true;
}

export default usePermissions;