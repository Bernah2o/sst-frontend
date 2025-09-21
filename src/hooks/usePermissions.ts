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
  // Page access permissions (VIEW action)
  canViewUsersPage: boolean;
  canViewCoursesPage: boolean;
  canViewEvaluationsPage: boolean;
  canViewSurveysPage: boolean;
  canViewCertificatesPage: boolean;
  canViewAttendancePage: boolean;
  canViewReportsPage: boolean;
  canViewNotificationsPage: boolean;
  canViewWorkersPage: boolean;
  canViewReinductionPage: boolean;
  canViewAdminConfigPage: boolean;
  canViewSeguimientoPage: boolean;
  canViewRolesPage: boolean;
  canViewFilesPage: boolean;
  canViewDashboardPage: boolean;
  canViewProfilePage: boolean;
  canViewAuditPage: boolean;
  canViewAbsenteeismPage: boolean;
  canViewEnrollmentPage: boolean;
  canViewOccupationalExamPage: boolean;
  canViewProgressPage: boolean;
  canViewSuppliersPage: boolean;
  
  // CRUD permissions for each resource
  // User permissions
  canCreateUsers: boolean;
  canReadUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  // Course permissions
  canCreateCourses: boolean;
  canReadCourses: boolean;
  canUpdateCourses: boolean;
  canDeleteCourses: boolean;
  // Evaluation permissions
  canCreateEvaluations: boolean;
  canReadEvaluations: boolean;
  canUpdateEvaluations: boolean;
  canDeleteEvaluations: boolean;
  canSubmitEvaluations: boolean;
  // Survey permissions
  canCreateSurveys: boolean;
  canReadSurveys: boolean;
  canUpdateSurveys: boolean;
  canDeleteSurveys: boolean;
  canSubmitSurveys: boolean;
  // Certificate permissions
  canCreateCertificates: boolean;
  canReadCertificates: boolean;
  canUpdateCertificates: boolean;
  canDeleteCertificates: boolean;
  // Attendance permissions
  canCreateAttendance: boolean;
  canReadAttendance: boolean;
  canUpdateAttendance: boolean;
  canDeleteAttendance: boolean;
  // Report permissions
  canCreateReports: boolean;
  canReadReports: boolean;
  canUpdateReports: boolean;
  canDeleteReports: boolean;
  // Notification permissions
  canCreateNotifications: boolean;
  canReadNotifications: boolean;
  canUpdateNotifications: boolean;
  canDeleteNotifications: boolean;
  // Worker permissions
  canCreateWorkers: boolean;
  canReadWorkers: boolean;
  canUpdateWorkers: boolean;
  canDeleteWorkers: boolean;
  // Reinduction permissions
  canCreateReinduction: boolean;
  canReadReinduction: boolean;
  canUpdateReinduction: boolean;
  canDeleteReinduction: boolean;
  // Admin config permissions
  canCreateAdminConfig: boolean;
  canReadAdminConfig: boolean;
  canUpdateAdminConfig: boolean;
  canDeleteAdminConfig: boolean;
  // Seguimiento permissions
  canCreateSeguimiento: boolean;
  canReadSeguimiento: boolean;
  canUpdateSeguimiento: boolean;
  canDeleteSeguimiento: boolean;
  // Role permissions
  canCreateRoles: boolean;
  canReadRoles: boolean;
  canUpdateRoles: boolean;
  canDeleteRoles: boolean;
  // File permissions
  canCreateFiles: boolean;
  canReadFiles: boolean;
  canUpdateFiles: boolean;
  canDeleteFiles: boolean;
  // Enrollment permissions
  canCreateEnrollment: boolean;
  canReadEnrollment: boolean;
  canUpdateEnrollment: boolean;
  canDeleteEnrollment: boolean;
  // Occupational exam permissions
  canCreateOccupationalExam: boolean;
  canReadOccupationalExam: boolean;
  canUpdateOccupationalExam: boolean;
  canDeleteOccupationalExam: boolean;
  // Progress permissions
  canCreateProgress: boolean;
  canReadProgress: boolean;
  canUpdateProgress: boolean;
  canDeleteProgress: boolean;
  // Module permissions
  canCreateModules: boolean;
  canReadModules: boolean;
  canUpdateModules: boolean;
  canDeleteModules: boolean;
  canViewModulesPage: boolean;
  // Material permissions
  canCreateMaterials: boolean;
  canReadMaterials: boolean;
  canUpdateMaterials: boolean;
  canDeleteMaterials: boolean;
  canViewMaterialsPage: boolean;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [pageAccesses, setPageAccesses] = useState<PageAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<ResourcePermissions>({
    // Page access permissions
    canViewUsersPage: false,
    canViewCoursesPage: false,
    canViewEvaluationsPage: false,
    canViewSurveysPage: false,
    canViewCertificatesPage: false,
    canViewAttendancePage: false,
    canViewReportsPage: false,
    canViewNotificationsPage: false,
    canViewWorkersPage: false,
    canViewReinductionPage: false,
    canViewAdminConfigPage: false,
    canViewSeguimientoPage: false,
    canViewRolesPage: false,
    canViewFilesPage: false,
    canViewDashboardPage: false,
    canViewProfilePage: false,
    canViewAuditPage: false,
    canViewAbsenteeismPage: false,
    canViewEnrollmentPage: false,
    canViewOccupationalExamPage: false,
    canViewProgressPage: false,
    canViewSuppliersPage: false,
    // User permissions
    canCreateUsers: false,
    canReadUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    // Course permissions
    canCreateCourses: false,
    canReadCourses: false,
    canUpdateCourses: false,
    canDeleteCourses: false,
    // Evaluation permissions
    canCreateEvaluations: false,
    canReadEvaluations: false,
    canUpdateEvaluations: false,
    canDeleteEvaluations: false,
    canSubmitEvaluations: false,
    // Survey permissions
    canCreateSurveys: false,
    canReadSurveys: false,
    canUpdateSurveys: false,
    canDeleteSurveys: false,
    canSubmitSurveys: false,
    // Certificate permissions
    canCreateCertificates: false,
    canReadCertificates: false,
    canUpdateCertificates: false,
    canDeleteCertificates: false,
    // Attendance permissions
    canCreateAttendance: false,
    canReadAttendance: false,
    canUpdateAttendance: false,
    canDeleteAttendance: false,
    // Report permissions
    canCreateReports: false,
    canReadReports: false,
    canUpdateReports: false,
    canDeleteReports: false,
    // Notification permissions
    canCreateNotifications: false,
    canReadNotifications: false,
    canUpdateNotifications: false,
    canDeleteNotifications: false,
    // Worker permissions
    canCreateWorkers: false,
    canReadWorkers: false,
    canUpdateWorkers: false,
    canDeleteWorkers: false,
    // Reinduction permissions
    canCreateReinduction: false,
    canReadReinduction: false,
    canUpdateReinduction: false,
    canDeleteReinduction: false,
    // Admin config permissions
    canCreateAdminConfig: false,
    canReadAdminConfig: false,
    canUpdateAdminConfig: false,
    canDeleteAdminConfig: false,
    // Seguimiento permissions
    canCreateSeguimiento: false,
    canReadSeguimiento: false,
    canUpdateSeguimiento: false,
    canDeleteSeguimiento: false,
    // Role permissions
    canCreateRoles: false,
    canReadRoles: false,
    canUpdateRoles: false,
    canDeleteRoles: false,
    // File permissions
    canCreateFiles: false,
    canReadFiles: false,
    canUpdateFiles: false,
    canDeleteFiles: false,
    // Enrollment permissions
    canCreateEnrollment: false,
    canReadEnrollment: false,
    canUpdateEnrollment: false,
    canDeleteEnrollment: false,
    // Occupational exam permissions
    canCreateOccupationalExam: false,
    canReadOccupationalExam: false,
    canUpdateOccupationalExam: false,
    canDeleteOccupationalExam: false,
    // Progress permissions
    canCreateProgress: false,
    canReadProgress: false,
    canUpdateProgress: false,
    canDeleteProgress: false,
    // Module permissions
    canCreateModules: false,
    canReadModules: false,
    canUpdateModules: false,
    canDeleteModules: false,
    canViewModulesPage: false,
    // Material permissions
    canCreateMaterials: false,
    canReadMaterials: false,
    canUpdateMaterials: false,
    canDeleteMaterials: false,
    canViewMaterialsPage: false
  });

  // Función para cargar datos del usuario
  const loadUserData = useCallback(async () => {
      if (!user) {
        setPageAccesses([]);
        setUserPermissions({
          // Page access permissions
          canViewUsersPage: false,
          canViewCoursesPage: false,
          canViewEvaluationsPage: false,
          canViewSurveysPage: false,
          canViewCertificatesPage: false,
          canViewAttendancePage: false,
          canViewReportsPage: false,
          canViewNotificationsPage: false,
          canViewWorkersPage: false,
          canViewReinductionPage: false,
          canViewAdminConfigPage: false,
          canViewSeguimientoPage: false,
          canViewRolesPage: false,
          canViewFilesPage: false,
          canViewDashboardPage: false,
          canViewProfilePage: false,
          canViewAuditPage: false,
          canViewAbsenteeismPage: false,
          canViewEnrollmentPage: false,
          canViewOccupationalExamPage: false,
          canViewProgressPage: false,
          canViewSuppliersPage: false,
          
          // User permissions
          canCreateUsers: false,
          canReadUsers: false,
          canUpdateUsers: false,
          canDeleteUsers: false,
          // Course permissions
          canCreateCourses: false,
          canReadCourses: false,
          canUpdateCourses: false,
          canDeleteCourses: false,
          // Evaluation permissions
          canCreateEvaluations: false,
          canReadEvaluations: false,
          canUpdateEvaluations: false,
          canDeleteEvaluations: false,
          canSubmitEvaluations: false,
          // Survey permissions
          canCreateSurveys: false,
          canReadSurveys: false,
          canUpdateSurveys: false,
          canDeleteSurveys: false,
          canSubmitSurveys: false,
          // Certificate permissions
          canCreateCertificates: false,
          canReadCertificates: false,
          canUpdateCertificates: false,
          canDeleteCertificates: false,
          // Attendance permissions
          canCreateAttendance: false,
          canReadAttendance: false,
          canUpdateAttendance: false,
          canDeleteAttendance: false,
          // Report permissions
          canCreateReports: false,
          canReadReports: false,
          canUpdateReports: false,
          canDeleteReports: false,
          // Notification permissions
          canCreateNotifications: false,
          canReadNotifications: false,
          canUpdateNotifications: false,
          canDeleteNotifications: false,
          // Worker permissions
          canCreateWorkers: false,
          canReadWorkers: false,
          canUpdateWorkers: false,
          canDeleteWorkers: false,
          // Reinduction permissions
          canCreateReinduction: false,
          canReadReinduction: false,
          canUpdateReinduction: false,
          canDeleteReinduction: false,
          // Admin config permissions
          canCreateAdminConfig: false,
          canReadAdminConfig: false,
          canUpdateAdminConfig: false,
          canDeleteAdminConfig: false,
          // Seguimiento permissions
          canCreateSeguimiento: false,
          canReadSeguimiento: false,
          canUpdateSeguimiento: false,
          canDeleteSeguimiento: false,
          // Role permissions
          canCreateRoles: false,
          canReadRoles: false,
          canUpdateRoles: false,
          canDeleteRoles: false,
          // File permissions
          canCreateFiles: false,
          canReadFiles: false,
          canUpdateFiles: false,
          canDeleteFiles: false,
          // Enrollment permissions
          canCreateEnrollment: false,
          canReadEnrollment: false,
          canUpdateEnrollment: false,
          canDeleteEnrollment: false,
          // Occupational exam permissions
          canCreateOccupationalExam: false,
          canReadOccupationalExam: false,
          canUpdateOccupationalExam: false,
          canDeleteOccupationalExam: false,
          // Progress permissions
          canCreateProgress: false,
          canReadProgress: false,
          canUpdateProgress: false,
          canDeleteProgress: false,
          // Module permissions
          canCreateModules: false,
          canReadModules: false,
          canUpdateModules: false,
          canDeleteModules: false,
          canViewModulesPage: false,
          // Material permissions
          canCreateMaterials: false,
          canReadMaterials: false,
          canUpdateMaterials: false,
          canDeleteMaterials: false,
          canViewMaterialsPage: false
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
          // Page access permissions
          canViewUsersPage: false,
          canViewCoursesPage: false,
          canViewEvaluationsPage: false,
          canViewSurveysPage: false,
          canViewCertificatesPage: false,
          canViewAttendancePage: false,
          canViewReportsPage: false,
          canViewNotificationsPage: false,
          canViewWorkersPage: false,
          canViewReinductionPage: false,
          canViewAdminConfigPage: false,
          canViewSeguimientoPage: false,
          canViewRolesPage: false,
          canViewFilesPage: false,
          canViewDashboardPage: false,
          canViewProfilePage: false,
          canViewAuditPage: false,
          canViewAbsenteeismPage: false,
          canViewEnrollmentPage: false,
          canViewOccupationalExamPage: false,
          canViewProgressPage: false,
          canViewSuppliersPage: false,
          // User permissions
          canCreateUsers: false,
          canReadUsers: false,
          canUpdateUsers: false,
          canDeleteUsers: false,
          // Course permissions
          canCreateCourses: false,
          canReadCourses: false,
          canUpdateCourses: false,
          canDeleteCourses: false,
          // Evaluation permissions
          canCreateEvaluations: false,
          canReadEvaluations: false,
          canUpdateEvaluations: false,
          canDeleteEvaluations: false,
          canSubmitEvaluations: false,
          // Survey permissions
          canCreateSurveys: false,
          canReadSurveys: false,
          canUpdateSurveys: false,
          canDeleteSurveys: false,
          canSubmitSurveys: false,
          // Certificate permissions
          canCreateCertificates: false,
          canReadCertificates: false,
          canUpdateCertificates: false,
          canDeleteCertificates: false,
          // Attendance permissions
          canCreateAttendance: false,
          canReadAttendance: false,
          canUpdateAttendance: false,
          canDeleteAttendance: false,
          // Report permissions
          canCreateReports: false,
          canReadReports: false,
          canUpdateReports: false,
          canDeleteReports: false,
          // Notification permissions
          canCreateNotifications: false,
          canReadNotifications: false,
          canUpdateNotifications: false,
          canDeleteNotifications: false,
          // Worker permissions
          canCreateWorkers: false,
          canReadWorkers: false,
          canUpdateWorkers: false,
          canDeleteWorkers: false,
          // Reinduction permissions
          canCreateReinduction: false,
          canReadReinduction: false,
          canUpdateReinduction: false,
          canDeleteReinduction: false,
          // Admin config permissions
          canCreateAdminConfig: false,
          canReadAdminConfig: false,
          canUpdateAdminConfig: false,
          canDeleteAdminConfig: false,
          // Seguimiento permissions
          canCreateSeguimiento: false,
          canReadSeguimiento: false,
          canUpdateSeguimiento: false,
          canDeleteSeguimiento: false,
          // Role permissions
          canCreateRoles: false,
          canReadRoles: false,
          canUpdateRoles: false,
          canDeleteRoles: false,
          // File permissions
          canCreateFiles: false,
          canReadFiles: false,
          canUpdateFiles: false,
          canDeleteFiles: false,
          // Enrollment permissions
          canCreateEnrollment: false,
          canReadEnrollment: false,
          canUpdateEnrollment: false,
          canDeleteEnrollment: false,
          // Occupational exam permissions
          canCreateOccupationalExam: false,
          canReadOccupationalExam: false,
          canUpdateOccupationalExam: false,
          canDeleteOccupationalExam: false,
          // Progress permissions
          canCreateProgress: false,
          canReadProgress: false,
          canUpdateProgress: false,
          canDeleteProgress: false,
          // Module permissions
          canCreateModules: false,
          canReadModules: false,
          canUpdateModules: false,
          canDeleteModules: false,
          canViewModulesPage: false,
          // Material permissions
          canCreateMaterials: false,
          canReadMaterials: false,
          canUpdateMaterials: false,
          canDeleteMaterials: false,
          canViewMaterialsPage: false
        };

        // Usar el nuevo endpoint optimizado para obtener todos los permisos del usuario
        try {
          const response = await api.get('/auth/me/permissions');
          const userPermissionsData = response.data;
          
          // Si es admin (rol básico), tiene todos los permisos
          const userRole = user.role || user.rol; // Compatibilidad con ambos nombres de campo
          if (userRole === UserRole.ADMIN) {
            Object.keys(permissions).forEach(key => {
              (permissions as any)[key] = true;
            });
          } else {
            // Mapear los permisos del backend a las propiedades del frontend
            const permissionMapping = [
              // Page access permissions
              { key: 'canViewUsersPage', resource: 'users', action: 'view' },
              { key: 'canViewCoursesPage', resource: 'courses', action: 'view' },
              { key: 'canViewEvaluationsPage', resource: 'evaluations', action: 'view' },
              { key: 'canViewSurveysPage', resource: 'surveys', action: 'view' },
              { key: 'canViewCertificatesPage', resource: 'certificates', action: 'view' },
              { key: 'canViewAttendancePage', resource: 'attendance', action: 'view' },
              { key: 'canViewReportsPage', resource: 'reports', action: 'view' },
              { key: 'canViewNotificationsPage', resource: 'notifications', action: 'view' },
              { key: 'canViewWorkersPage', resource: 'workers', action: 'view' },
              { key: 'canViewReinductionPage', resource: 'reinduction', action: 'view' },
              { key: 'canViewAdminConfigPage', resource: 'admin_config', action: 'view' },
              { key: 'canViewSeguimientoPage', resource: 'seguimiento', action: 'view' },
              { key: 'canViewRolesPage', resource: 'roles', action: 'view' },
              { key: 'canViewFilesPage', resource: 'files', action: 'view' },
              { key: 'canViewDashboardPage', resource: 'dashboard', action: 'view' },
              { key: 'canViewProfilePage', resource: 'profile', action: 'view' },
              { key: 'canViewAuditPage', resource: 'audit', action: 'view' },
              { key: 'canViewAbsenteeismPage', resource: 'absenteeism', action: 'view' },
              { key: 'canViewEnrollmentPage', resource: 'enrollment', action: 'view' },
              { key: 'canViewOccupationalExamPage', resource: 'occupational_exam', action: 'view' },
              { key: 'canViewProgressPage', resource: 'progress', action: 'view' },
              { key: 'canViewSuppliersPage', resource: 'suppliers', action: 'view' },
              // User permissions
              { key: 'canCreateUsers', resource: 'users', action: 'create' },
              { key: 'canReadUsers', resource: 'users', action: 'read' },
              { key: 'canUpdateUsers', resource: 'users', action: 'update' },
              { key: 'canDeleteUsers', resource: 'users', action: 'delete' },
              // Course permissions
              { key: 'canCreateCourses', resource: 'courses', action: 'create' },
              { key: 'canReadCourses', resource: 'courses', action: 'read' },
              { key: 'canUpdateCourses', resource: 'courses', action: 'update' },
              { key: 'canDeleteCourses', resource: 'courses', action: 'delete' },
              // Evaluation permissions
              { key: 'canCreateEvaluations', resource: 'evaluations', action: 'create' },
              { key: 'canReadEvaluations', resource: 'evaluations', action: 'read' },
              { key: 'canUpdateEvaluations', resource: 'evaluations', action: 'update' },
              { key: 'canDeleteEvaluations', resource: 'evaluations', action: 'delete' },
              { key: 'canSubmitEvaluations', resource: 'evaluations', action: 'submit' },
              // Survey permissions
              { key: 'canCreateSurveys', resource: 'surveys', action: 'create' },
              { key: 'canReadSurveys', resource: 'surveys', action: 'read' },
              { key: 'canUpdateSurveys', resource: 'surveys', action: 'update' },
              { key: 'canDeleteSurveys', resource: 'surveys', action: 'delete' },
              { key: 'canSubmitSurveys', resource: 'surveys', action: 'submit' },
              // Certificate permissions
              { key: 'canCreateCertificates', resource: 'certificates', action: 'create' },
              { key: 'canReadCertificates', resource: 'certificates', action: 'read' },
              { key: 'canUpdateCertificates', resource: 'certificates', action: 'update' },
              { key: 'canDeleteCertificates', resource: 'certificates', action: 'delete' },
              // Attendance permissions
              { key: 'canCreateAttendance', resource: 'attendance', action: 'create' },
              { key: 'canReadAttendance', resource: 'attendance', action: 'read' },
              { key: 'canUpdateAttendance', resource: 'attendance', action: 'update' },
              { key: 'canDeleteAttendance', resource: 'attendance', action: 'delete' },
              // Report permissions
              { key: 'canCreateReports', resource: 'reports', action: 'create' },
              { key: 'canReadReports', resource: 'reports', action: 'read' },
              { key: 'canUpdateReports', resource: 'reports', action: 'update' },
              { key: 'canDeleteReports', resource: 'reports', action: 'delete' },
              // Notification permissions
              { key: 'canCreateNotifications', resource: 'notifications', action: 'create' },
              { key: 'canReadNotifications', resource: 'notifications', action: 'read' },
              { key: 'canUpdateNotifications', resource: 'notifications', action: 'update' },
              { key: 'canDeleteNotifications', resource: 'notifications', action: 'delete' },
              // Worker permissions
              { key: 'canCreateWorkers', resource: 'workers', action: 'create' },
              { key: 'canReadWorkers', resource: 'workers', action: 'read' },
              { key: 'canUpdateWorkers', resource: 'workers', action: 'update' },
              { key: 'canDeleteWorkers', resource: 'workers', action: 'delete' },
              // Reinduction permissions
              { key: 'canCreateReinduction', resource: 'reinduction', action: 'create' },
              { key: 'canReadReinduction', resource: 'reinduction', action: 'read' },
              { key: 'canUpdateReinduction', resource: 'reinduction', action: 'update' },
              { key: 'canDeleteReinduction', resource: 'reinduction', action: 'delete' },
              // Admin config permissions
              { key: 'canCreateAdminConfig', resource: 'admin_config', action: 'create' },
              { key: 'canReadAdminConfig', resource: 'admin_config', action: 'read' },
              { key: 'canUpdateAdminConfig', resource: 'admin_config', action: 'update' },
              { key: 'canDeleteAdminConfig', resource: 'admin_config', action: 'delete' },
              // Seguimiento permissions
              { key: 'canCreateSeguimiento', resource: 'seguimiento', action: 'create' },
              { key: 'canReadSeguimiento', resource: 'seguimiento', action: 'read' },
              { key: 'canUpdateSeguimiento', resource: 'seguimiento', action: 'update' },
              { key: 'canDeleteSeguimiento', resource: 'seguimiento', action: 'delete' },
              // Role permissions
              { key: 'canCreateRoles', resource: 'roles', action: 'create' },
              { key: 'canReadRoles', resource: 'roles', action: 'read' },
              { key: 'canUpdateRoles', resource: 'roles', action: 'update' },
              { key: 'canDeleteRoles', resource: 'roles', action: 'delete' },
              // File permissions
              { key: 'canCreateFiles', resource: 'files', action: 'create' },
              { key: 'canReadFiles', resource: 'files', action: 'read' },
              { key: 'canUpdateFiles', resource: 'files', action: 'update' },
              { key: 'canDeleteFiles', resource: 'files', action: 'delete' },
              // Enrollment permissions
              { key: 'canCreateEnrollment', resource: 'enrollment', action: 'create' },
              { key: 'canReadEnrollment', resource: 'enrollment', action: 'read' },
              { key: 'canUpdateEnrollment', resource: 'enrollment', action: 'update' },
              { key: 'canDeleteEnrollment', resource: 'enrollment', action: 'delete' },
              // Occupational exam permissions
              { key: 'canCreateOccupationalExam', resource: 'occupational_exam', action: 'create' },
              { key: 'canReadOccupationalExam', resource: 'occupational_exam', action: 'read' },
              { key: 'canUpdateOccupationalExam', resource: 'occupational_exam', action: 'update' },
              { key: 'canDeleteOccupationalExam', resource: 'occupational_exam', action: 'delete' },
              // Progress permissions
              { key: 'canCreateProgress', resource: 'progress', action: 'create' },
              { key: 'canReadProgress', resource: 'progress', action: 'read' },
              { key: 'canUpdateProgress', resource: 'progress', action: 'update' },
              { key: 'canDeleteProgress', resource: 'progress', action: 'delete' },
              // Module permissions
              { key: 'canCreateModules', resource: 'modules', action: 'create' },
              { key: 'canReadModules', resource: 'modules', action: 'read' },
              { key: 'canUpdateModules', resource: 'modules', action: 'update' },
              { key: 'canDeleteModules', resource: 'modules', action: 'delete' },
              // Material permissions
              { key: 'canCreateMaterials', resource: 'materials', action: 'create' },
              { key: 'canReadMaterials', resource: 'materials', action: 'read' },
              { key: 'canUpdateMaterials', resource: 'materials', action: 'update' },
              { key: 'canDeleteMaterials', resource: 'materials', action: 'delete' }
            ];

            // Mapear los permisos del backend a las propiedades del frontend
            permissionMapping.forEach(mapping => {
              const hasPermission = userPermissionsData.some((perm: any) => 
                perm.resource_type === mapping.resource && perm.action === mapping.action
              );
              (permissions as any)[mapping.key] = hasPermission;
            });
          }
        } catch (error) {
          console.error('Error loading permissions from /auth/me/permissions:', error);
          
          // Fallback: usar el método anterior si el nuevo endpoint falla
          const userRole = user.role || user.rol;
          if (userRole === UserRole.ADMIN) {
            Object.keys(permissions).forEach(key => {
              (permissions as any)[key] = true;
            });
          } else if (user.custom_role_id) {
            // Fallback al método batch anterior
            try {
              const permissionChecks = [
                { key: 'canViewRolesPage', resource: 'roles', action: 'view' },
                { key: 'canCreateRoles', resource: 'roles', action: 'create' },
                { key: 'canUpdateRoles', resource: 'roles', action: 'update' },
                { key: 'canDeleteRoles', resource: 'roles', action: 'delete' }
              ];
              
              const permissionRequests = permissionChecks.map(check => ({
                resource_type: check.resource,
                action: check.action
              }));

              const response = await api.post('/permissions/check-batch', permissionRequests);
              const permissionResults = response.data.permissions;

              permissionChecks.forEach((check) => {
                const result = permissionResults.find(
                  (p: any) => p.resource_type === check.resource && p.action === check.action
                );
                (permissions as any)[check.key] = result ? result.has_permission : false;
              });
            } catch (fallbackError) {
              console.error('Error with fallback permission check:', fallbackError);
            }
          } else {
            // Para usuarios sin rol personalizado, aplicar permisos hardcodeados basados en el rol del sistema
            const userRole = user.role || user.rol;
          if (userRole === UserRole.SUPERVISOR) {
            // Permisos hardcodeados para supervisores
            permissions.canViewUsersPage = true;
            permissions.canViewWorkersPage = true;
            permissions.canViewCoursesPage = true;
            permissions.canViewAttendancePage = true;
            permissions.canViewCertificatesPage = true;
            permissions.canViewReportsPage = true;
            permissions.canViewNotificationsPage = true;
            permissions.canViewReinductionPage = true;
            permissions.canViewAbsenteeismPage = true;
            permissions.canViewOccupationalExamPage = true;
            permissions.canViewSeguimientoPage = true;
            permissions.canViewDashboardPage = true;
            permissions.canViewProfilePage = true;
            permissions.canViewEnrollmentPage = true;
            permissions.canViewProgressPage = true;
            
            // Permisos CRUD básicos para supervisores
            permissions.canReadUsers = true;
            permissions.canUpdateUsers = true;
            permissions.canReadWorkers = true;
            permissions.canUpdateWorkers = true;
            permissions.canReadCourses = true;
            permissions.canReadAttendance = true;
            permissions.canReadCertificates = true;
            permissions.canReadReports = true;
            permissions.canReadNotifications = true;
            permissions.canReadReinduction = true;
            permissions.canReadOccupationalExam = true;
            permissions.canReadSeguimiento = true;
            permissions.canReadEnrollment = true;
            permissions.canReadProgress = true;
          } else if (userRole === UserRole.TRAINER) {
            // Permisos hardcodeados para entrenadores
            permissions.canViewCoursesPage = true;
            permissions.canViewEvaluationsPage = true;
            permissions.canViewSurveysPage = true;
            permissions.canViewAttendancePage = true;
            permissions.canViewCertificatesPage = true;
            permissions.canViewNotificationsPage = true;
            permissions.canViewReinductionPage = true;
            permissions.canViewDashboardPage = true;
            permissions.canViewProfilePage = true;
            
            // Permisos CRUD para entrenadores
            permissions.canCreateCourses = true;
            permissions.canReadCourses = true;
            permissions.canUpdateCourses = true;
            permissions.canCreateEvaluations = true;
            permissions.canReadEvaluations = true;
            permissions.canUpdateEvaluations = true;
            permissions.canCreateSurveys = true;
            permissions.canReadSurveys = true;
            permissions.canUpdateSurveys = true;
            permissions.canReadAttendance = true;
            permissions.canReadCertificates = true;
            permissions.canReadNotifications = true;
            permissions.canReadReinduction = true;
          } else if (userRole === UserRole.EMPLOYEE) {
            // Permisos hardcodeados para empleados
            permissions.canViewDashboardPage = true;
            permissions.canViewProfilePage = true;
            
            // Permisos básicos de lectura para empleados
            permissions.canReadCourses = true;
            permissions.canReadCertificates = true;
          }
          }
        }

        setUserPermissions(permissions);
      } catch (error) {
        console.error('Error loading user data:', error);
        setPageAccesses([]);
        setUserPermissions({
          // Page access permissions
          canViewUsersPage: false,
          canViewCoursesPage: false,
          canViewReinductionPage: false,
          canViewEvaluationsPage: false,
          canViewSurveysPage: false,
          canViewAttendancePage: false,
          canViewOccupationalExamPage: false,
          canViewSeguimientoPage: false,
          canViewCertificatesPage: false,
          canViewReportsPage: false,
          canViewNotificationsPage: false,
          canViewAdminConfigPage: false,
          canViewWorkersPage: false,
          canViewRolesPage: false,
          canViewFilesPage: false,
          canViewDashboardPage: false,
          canViewProfilePage: false,
          canViewAuditPage: false,
          canViewAbsenteeismPage: false,
          canViewEnrollmentPage: false,
          canViewProgressPage: false,
          canViewSuppliersPage: false,
          // User permissions
          canCreateUsers: false,
          canReadUsers: false,
          canUpdateUsers: false,
          canDeleteUsers: false,
          // Course permissions
          canCreateCourses: false,
          canReadCourses: false,
          canUpdateCourses: false,
          canDeleteCourses: false,
          // Enrollment permissions
          canCreateEnrollment: false,
          canReadEnrollment: false,
          canUpdateEnrollment: false,
          canDeleteEnrollment: false,
          // Evaluation permissions
          canCreateEvaluations: false,
          canReadEvaluations: false,
          canUpdateEvaluations: false,
          canDeleteEvaluations: false,
          canSubmitEvaluations: false,
          // Survey permissions
          canCreateSurveys: false,
          canReadSurveys: false,
          canUpdateSurveys: false,
          canDeleteSurveys: false,
          canSubmitSurveys: false,
          // Certificate permissions
          canCreateCertificates: false,
          canReadCertificates: false,
          canUpdateCertificates: false,
          canDeleteCertificates: false,
          // Attendance permissions
          canCreateAttendance: false,
          canReadAttendance: false,
          canUpdateAttendance: false,
          canDeleteAttendance: false,
          // Report permissions
          canCreateReports: false,
          canReadReports: false,
          canUpdateReports: false,
          canDeleteReports: false,
          // Notification permissions
          canCreateNotifications: false,
          canReadNotifications: false,
          canUpdateNotifications: false,
          canDeleteNotifications: false,
          // Worker permissions
          canCreateWorkers: false,
          canReadWorkers: false,
          canUpdateWorkers: false,
          canDeleteWorkers: false,
          // Reinduction permissions
          canCreateReinduction: false,
          canReadReinduction: false,
          canUpdateReinduction: false,
          canDeleteReinduction: false,
          // Occupational exam permissions
          canCreateOccupationalExam: false,
          canReadOccupationalExam: false,
          canUpdateOccupationalExam: false,
          canDeleteOccupationalExam: false,
          // Seguimiento permissions
          canCreateSeguimiento: false,
          canReadSeguimiento: false,
          canUpdateSeguimiento: false,
          canDeleteSeguimiento: false,
          // Admin config permissions
          canCreateAdminConfig: false,
          canReadAdminConfig: false,
          canUpdateAdminConfig: false,
          canDeleteAdminConfig: false,
          // Role permissions
          canCreateRoles: false,
          canReadRoles: false,
          canUpdateRoles: false,
          canDeleteRoles: false,
          // File permissions
          canCreateFiles: false,
          canReadFiles: false,
          canUpdateFiles: false,
          canDeleteFiles: false,
          // Progress permissions
          canCreateProgress: false,
          canReadProgress: false,
          canUpdateProgress: false,
          canDeleteProgress: false,
          // Module permissions
          canCreateModules: false,
          canReadModules: false,
          canUpdateModules: false,
          canDeleteModules: false,
          canViewModulesPage: false,
          // Material permissions
          canCreateMaterials: false,
          canReadMaterials: false,
          canUpdateMaterials: false,
          canDeleteMaterials: false,
          canViewMaterialsPage: false
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

  // Placeholder for canAccessPage - will be defined after all permission functions

  // Funciones síncronas para verificar permisos (basadas en el estado cargado)
  // Page access permissions
  const canViewUsersPage = useCallback((): boolean => {
    return userPermissions.canViewUsersPage;
  }, [userPermissions.canViewUsersPage]);

  const canViewCoursesPage = useCallback((): boolean => {
    return userPermissions.canViewCoursesPage;
  }, [userPermissions.canViewCoursesPage]);

  const canViewEvaluationsPage = useCallback((): boolean => {
    return userPermissions.canViewEvaluationsPage;
  }, [userPermissions.canViewEvaluationsPage]);

  const canViewSurveysPage = useCallback((): boolean => {
    return userPermissions.canViewSurveysPage;
  }, [userPermissions.canViewSurveysPage]);

  const canViewCertificatesPage = useCallback((): boolean => {
    return userPermissions.canViewCertificatesPage;
  }, [userPermissions.canViewCertificatesPage]);

  const canViewAttendancePage = useCallback((): boolean => {
    return userPermissions.canViewAttendancePage;
  }, [userPermissions.canViewAttendancePage]);

  const canViewReportsPage = useCallback((): boolean => {
    return userPermissions.canViewReportsPage;
  }, [userPermissions.canViewReportsPage]);

  const canViewNotificationsPage = useCallback((): boolean => {
    return userPermissions.canViewNotificationsPage;
  }, [userPermissions.canViewNotificationsPage]);

  const canViewWorkersPage = useCallback((): boolean => {
    return userPermissions.canViewWorkersPage;
  }, [userPermissions.canViewWorkersPage]);

  const canViewReinductionPage = useCallback((): boolean => {
    return userPermissions.canViewReinductionPage;
  }, [userPermissions.canViewReinductionPage]);

  const canViewAdminConfigPage = useCallback((): boolean => {
    return userPermissions.canViewAdminConfigPage;
  }, [userPermissions.canViewAdminConfigPage]);

  const canViewSeguimientoPage = useCallback((): boolean => {
    return userPermissions.canViewSeguimientoPage;
  }, [userPermissions.canViewSeguimientoPage]);

  const canViewRolesPage = useCallback((): boolean => {
    return userPermissions.canViewRolesPage;
  }, [userPermissions.canViewRolesPage]);

  const canViewFilesPage = useCallback((): boolean => {
    return userPermissions.canViewFilesPage;
  }, [userPermissions.canViewFilesPage]);

  const canViewDashboardPage = useCallback((): boolean => {
    return userPermissions.canViewDashboardPage;
  }, [userPermissions.canViewDashboardPage]);

  const canViewProfilePage = useCallback((): boolean => {
    return userPermissions.canViewProfilePage;
  }, [userPermissions.canViewProfilePage]);

  const canViewAuditPage = useCallback((): boolean => {
    return userPermissions.canViewAuditPage;
  }, [userPermissions.canViewAuditPage]);

  const canViewAbsenteeismPage = useCallback((): boolean => {
    return userPermissions.canViewAbsenteeismPage;
  }, [userPermissions.canViewAbsenteeismPage]);

  const canViewEnrollmentPage = useCallback((): boolean => {
    return userPermissions.canViewEnrollmentPage;
  }, [userPermissions.canViewEnrollmentPage]);

  const canViewOccupationalExamPage = useCallback((): boolean => {
    return userPermissions.canViewOccupationalExamPage;
  }, [userPermissions.canViewOccupationalExamPage]);

  const canViewProgressPage = useCallback((): boolean => {
    return userPermissions.canViewProgressPage;
  }, [userPermissions.canViewProgressPage]);

  const canViewSuppliersPage = useCallback((): boolean => {
    return userPermissions.canViewSuppliersPage;
  }, [userPermissions.canViewSuppliersPage]);

  // User permissions
  const canCreateUsers = useCallback((): boolean => {
    return userPermissions.canCreateUsers;
  }, [userPermissions.canCreateUsers]);

  const canReadUsers = useCallback((): boolean => {
    return userPermissions.canReadUsers;
  }, [userPermissions.canReadUsers]);

  const canUpdateUsers = useCallback((): boolean => {
    return userPermissions.canUpdateUsers;
  }, [userPermissions.canUpdateUsers]);

  const canDeleteUsers = useCallback((): boolean => {
    return userPermissions.canDeleteUsers;
  }, [userPermissions.canDeleteUsers]);

  // Course permissions
  const canCreateCourses = useCallback((): boolean => {
    return userPermissions.canCreateCourses;
  }, [userPermissions.canCreateCourses]);

  const canReadCourses = useCallback((): boolean => {
    return userPermissions.canReadCourses;
  }, [userPermissions.canReadCourses]);

  const canUpdateCourses = useCallback((): boolean => {
    return userPermissions.canUpdateCourses;
  }, [userPermissions.canUpdateCourses]);

  const canDeleteCourses = useCallback((): boolean => {
    return userPermissions.canDeleteCourses;
  }, [userPermissions.canDeleteCourses]);

  // Evaluation permissions
  const canCreateEvaluations = useCallback((): boolean => {
    return userPermissions.canCreateEvaluations;
  }, [userPermissions.canCreateEvaluations]);

  const canReadEvaluations = useCallback((): boolean => {
    return userPermissions.canReadEvaluations;
  }, [userPermissions.canReadEvaluations]);

  const canUpdateEvaluations = useCallback((): boolean => {
    return userPermissions.canUpdateEvaluations;
  }, [userPermissions.canUpdateEvaluations]);

  const canDeleteEvaluations = useCallback((): boolean => {
    return userPermissions.canDeleteEvaluations;
  }, [userPermissions.canDeleteEvaluations]);

  const canSubmitEvaluations = useCallback((): boolean => {
    return userPermissions.canSubmitEvaluations;
  }, [userPermissions.canSubmitEvaluations]);

  // Survey permissions
  const canCreateSurveys = useCallback((): boolean => {
    return userPermissions.canCreateSurveys;
  }, [userPermissions.canCreateSurveys]);

  const canReadSurveys = useCallback((): boolean => {
    return userPermissions.canReadSurveys;
  }, [userPermissions.canReadSurveys]);

  const canUpdateSurveys = useCallback((): boolean => {
    return userPermissions.canUpdateSurveys;
  }, [userPermissions.canUpdateSurveys]);

  const canDeleteSurveys = useCallback((): boolean => {
    return userPermissions.canDeleteSurveys;
  }, [userPermissions.canDeleteSurveys]);

  const canSubmitSurveys = useCallback((): boolean => {
    return userPermissions.canSubmitSurveys;
  }, [userPermissions.canSubmitSurveys]);

  // Certificate permissions
  const canCreateCertificates = useCallback((): boolean => {
    return userPermissions.canCreateCertificates;
  }, [userPermissions.canCreateCertificates]);

  const canReadCertificates = useCallback((): boolean => {
    return userPermissions.canReadCertificates;
  }, [userPermissions.canReadCertificates]);

  const canUpdateCertificates = useCallback((): boolean => {
    return userPermissions.canUpdateCertificates;
  }, [userPermissions.canUpdateCertificates]);

  const canDeleteCertificates = useCallback((): boolean => {
    return userPermissions.canDeleteCertificates;
  }, [userPermissions.canDeleteCertificates]);

  // Attendance permissions
  const canCreateAttendance = useCallback((): boolean => {
    return userPermissions.canCreateAttendance;
  }, [userPermissions.canCreateAttendance]);

  const canReadAttendance = useCallback((): boolean => {
    return userPermissions.canReadAttendance;
  }, [userPermissions.canReadAttendance]);

  const canUpdateAttendance = useCallback((): boolean => {
    return userPermissions.canUpdateAttendance;
  }, [userPermissions.canUpdateAttendance]);

  const canDeleteAttendance = useCallback((): boolean => {
    return userPermissions.canDeleteAttendance;
  }, [userPermissions.canDeleteAttendance]);

  // Report permissions
  const canCreateReports = useCallback((): boolean => {
    return userPermissions.canCreateReports;
  }, [userPermissions.canCreateReports]);

  const canReadReports = useCallback((): boolean => {
    return userPermissions.canReadReports;
  }, [userPermissions.canReadReports]);

  const canUpdateReports = useCallback((): boolean => {
    return userPermissions.canUpdateReports;
  }, [userPermissions.canUpdateReports]);

  const canDeleteReports = useCallback((): boolean => {
    return userPermissions.canDeleteReports;
  }, [userPermissions.canDeleteReports]);

  // Notification permissions
  const canCreateNotifications = useCallback((): boolean => {
    return userPermissions.canCreateNotifications;
  }, [userPermissions.canCreateNotifications]);

  const canReadNotifications = useCallback((): boolean => {
    return userPermissions.canReadNotifications;
  }, [userPermissions.canReadNotifications]);

  const canUpdateNotifications = useCallback((): boolean => {
    return userPermissions.canUpdateNotifications;
  }, [userPermissions.canUpdateNotifications]);

  const canDeleteNotifications = useCallback((): boolean => {
    return userPermissions.canDeleteNotifications;
  }, [userPermissions.canDeleteNotifications]);

  // Worker permissions
  const canCreateWorkers = useCallback((): boolean => {
    return userPermissions.canCreateWorkers;
  }, [userPermissions.canCreateWorkers]);

  const canReadWorkers = useCallback((): boolean => {
    return userPermissions.canReadWorkers;
  }, [userPermissions.canReadWorkers]);

  const canUpdateWorkers = useCallback((): boolean => {
    return userPermissions.canUpdateWorkers;
  }, [userPermissions.canUpdateWorkers]);

  const canDeleteWorkers = useCallback((): boolean => {
    return userPermissions.canDeleteWorkers;
  }, [userPermissions.canDeleteWorkers]);

  // Reinduction permissions
  const canCreateReinduction = useCallback((): boolean => {
    return userPermissions.canCreateReinduction;
  }, [userPermissions.canCreateReinduction]);

  const canReadReinduction = useCallback((): boolean => {
    return userPermissions.canReadReinduction;
  }, [userPermissions.canReadReinduction]);

  const canUpdateReinduction = useCallback((): boolean => {
    return userPermissions.canUpdateReinduction;
  }, [userPermissions.canUpdateReinduction]);

  const canDeleteReinduction = useCallback((): boolean => {
    return userPermissions.canDeleteReinduction;
  }, [userPermissions.canDeleteReinduction]);

  // Admin config permissions
  const canCreateAdminConfig = useCallback((): boolean => {
    return userPermissions.canCreateAdminConfig;
  }, [userPermissions.canCreateAdminConfig]);

  const canReadAdminConfig = useCallback((): boolean => {
    return userPermissions.canReadAdminConfig;
  }, [userPermissions.canReadAdminConfig]);

  const canUpdateAdminConfig = useCallback((): boolean => {
    return userPermissions.canUpdateAdminConfig;
  }, [userPermissions.canUpdateAdminConfig]);

  const canDeleteAdminConfig = useCallback((): boolean => {
    return userPermissions.canDeleteAdminConfig;
  }, [userPermissions.canDeleteAdminConfig]);

  // Seguimiento permissions
  const canCreateSeguimiento = useCallback((): boolean => {
    return userPermissions.canCreateSeguimiento;
  }, [userPermissions.canCreateSeguimiento]);

  const canReadSeguimiento = useCallback((): boolean => {
    return userPermissions.canReadSeguimiento;
  }, [userPermissions.canReadSeguimiento]);

  const canUpdateSeguimiento = useCallback((): boolean => {
    return userPermissions.canUpdateSeguimiento;
  }, [userPermissions.canUpdateSeguimiento]);

  const canDeleteSeguimiento = useCallback((): boolean => {
    return userPermissions.canDeleteSeguimiento;
  }, [userPermissions.canDeleteSeguimiento]);

  // Role permissions
  const canCreateRoles = useCallback((): boolean => {
    return userPermissions.canCreateRoles;
  }, [userPermissions.canCreateRoles]);

  const canReadRoles = useCallback((): boolean => {
    return userPermissions.canReadRoles;
  }, [userPermissions.canReadRoles]);

  const canUpdateRoles = useCallback((): boolean => {
    return userPermissions.canUpdateRoles;
  }, [userPermissions.canUpdateRoles]);

  const canDeleteRoles = useCallback((): boolean => {
    return userPermissions.canDeleteRoles;
  }, [userPermissions.canDeleteRoles]);

  // File permissions
  const canCreateFiles = useCallback((): boolean => {
    return userPermissions.canCreateFiles;
  }, [userPermissions.canCreateFiles]);

  const canReadFiles = useCallback((): boolean => {
    return userPermissions.canReadFiles;
  }, [userPermissions.canReadFiles]);

  const canUpdateFiles = useCallback((): boolean => {
    return userPermissions.canUpdateFiles;
  }, [userPermissions.canUpdateFiles]);

  const canDeleteFiles = useCallback((): boolean => {
    return userPermissions.canDeleteFiles;
  }, [userPermissions.canDeleteFiles]);

  // Enrollment permissions
  const canCreateEnrollment = useCallback((): boolean => {
    return userPermissions.canCreateEnrollment;
  }, [userPermissions.canCreateEnrollment]);

  const canReadEnrollment = useCallback((): boolean => {
    return userPermissions.canReadEnrollment;
  }, [userPermissions.canReadEnrollment]);

  const canUpdateEnrollment = useCallback((): boolean => {
    return userPermissions.canUpdateEnrollment;
  }, [userPermissions.canUpdateEnrollment]);

  const canDeleteEnrollment = useCallback((): boolean => {
    return userPermissions.canDeleteEnrollment;
  }, [userPermissions.canDeleteEnrollment]);

  // Occupational exam permissions
  const canCreateOccupationalExam = useCallback((): boolean => {
    return userPermissions.canCreateOccupationalExam;
  }, [userPermissions.canCreateOccupationalExam]);

  const canReadOccupationalExam = useCallback((): boolean => {
    return userPermissions.canReadOccupationalExam;
  }, [userPermissions.canReadOccupationalExam]);

  const canUpdateOccupationalExam = useCallback((): boolean => {
    return userPermissions.canUpdateOccupationalExam;
  }, [userPermissions.canUpdateOccupationalExam]);

  const canDeleteOccupationalExam = useCallback((): boolean => {
    return userPermissions.canDeleteOccupationalExam;
  }, [userPermissions.canDeleteOccupationalExam]);

  // Progress permissions
  const canCreateProgress = useCallback((): boolean => {
    return userPermissions.canCreateProgress;
  }, [userPermissions.canCreateProgress]);

  const canReadProgress = useCallback((): boolean => {
    return userPermissions.canReadProgress;
  }, [userPermissions.canReadProgress]);

  const canUpdateProgress = useCallback((): boolean => {
    return userPermissions.canUpdateProgress;
  }, [userPermissions.canUpdateProgress]);

  const canDeleteProgress = useCallback((): boolean => {
    return userPermissions.canDeleteProgress;
  }, [userPermissions.canDeleteProgress]);

  // Module permission functions
  const canCreateModules = useCallback((): boolean => {
    return userPermissions.canCreateModules;
  }, [userPermissions.canCreateModules]);

  const canReadModules = useCallback((): boolean => {
    return userPermissions.canReadModules;
  }, [userPermissions.canReadModules]);

  const canUpdateModules = useCallback((): boolean => {
    return userPermissions.canUpdateModules;
  }, [userPermissions.canUpdateModules]);

  const canDeleteModules = useCallback((): boolean => {
    return userPermissions.canDeleteModules;
  }, [userPermissions.canDeleteModules]);

  const canViewModulesPage = useCallback((): boolean => {
    return userPermissions.canViewModulesPage;
  }, [userPermissions.canViewModulesPage]);

  // Material permission functions
  const canCreateMaterials = useCallback((): boolean => {
    return userPermissions.canCreateMaterials;
  }, [userPermissions.canCreateMaterials]);

  const canReadMaterials = useCallback((): boolean => {
    return userPermissions.canReadMaterials;
  }, [userPermissions.canReadMaterials]);

  const canUpdateMaterials = useCallback((): boolean => {
    return userPermissions.canUpdateMaterials;
  }, [userPermissions.canUpdateMaterials]);

  const canDeleteMaterials = useCallback((): boolean => {
    return userPermissions.canDeleteMaterials;
  }, [userPermissions.canDeleteMaterials]);

  const canViewMaterialsPage = useCallback((): boolean => {
    return userPermissions.canViewMaterialsPage;
  }, [userPermissions.canViewMaterialsPage]);

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

  // Verificar acceso a una página específica
  const canAccessPage = useCallback((pageRoute: string): boolean => {
    // El usuario tiene acceso si su rol de sistema (tradicional) se lo permite
    if (checkTraditionalPageAccess(pageRoute, user?.role)) {
      return true;
    }

    // Si tiene un rol personalizado, verificar también esos permisos
    if (user?.custom_role_id) {
      // Mapeo de rutas a permisos específicos para usuarios con rol personalizado
      const routePermissionMap: Record<string, () => boolean> = {
        // User management routes
        '/admin/users': canUpdateUsers,
        '/users': canViewUsersPage,
        
        // Course management routes
        '/courses': canViewCoursesPage,
        '/courses/list': canViewCoursesPage,
        '/courses/create': canCreateCourses,
        '/courses/edit': canUpdateCourses,
        
        // Enrollment management routes
        '/enrollments': canViewEnrollmentPage,
        '/enrollments/list': canViewEnrollmentPage,
        '/enrollments/create': canCreateEnrollment,
        '/enrollments/edit': canUpdateEnrollment,
        '/admin/enrollments': canUpdateEnrollment,
        '/reinduction': canViewReinductionPage,
        
        // Evaluation routes
        '/evaluations': canViewEvaluationsPage,
        '/evaluations/list': canViewEvaluationsPage,
        '/evaluations/create': canCreateEvaluations,
        '/evaluations/edit': canUpdateEvaluations,
        '/evaluation-results': canViewEvaluationsPage,
        
        // Survey routes
        '/surveys': canViewSurveysPage,
        '/surveys/create': canCreateSurveys,
        '/surveys/edit': canUpdateSurveys,
        
        // Attendance routes
        '/attendance': canViewAttendancePage,
        '/attendance/list': canViewAttendancePage,
        '/admin/attendance': canUpdateAttendance,
        
        // Worker/Health routes
        '/workers': canViewWorkersPage,
        '/workers/list': canViewWorkersPage,
        '/workers/create': canCreateWorkers,
        '/workers/edit': canUpdateWorkers,
        '/admin/workers': canViewWorkersPage,
        '/occupational-exams': canViewOccupationalExamPage,
        '/admin/occupational-exams': canViewOccupationalExamPage,
        '/seguimientos': canViewSeguimientoPage,
        
        // Certificate routes
        '/certificates': canViewCertificatesPage,
        '/certificates/create': canCreateCertificates,
        
        // Report routes
        '/reports': canViewReportsPage,
        '/reports/export': canViewReportsPage,

        // Notification routes
        '/notifications': canViewNotificationsPage,
        
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
        if (permissionCheck()) {
          return true;
        }
      }

      // Si no hay un mapeo específico, verificar en pageAccesses
      const pageAccess = pageAccesses.find(access => access.page_route === pageRoute);
      if (pageAccess && pageAccess.can_access) {
        return true;
      }
    }

    // Si ninguna de las condiciones anteriores se cumple, no tiene acceso
    return false;
  }, [
    user, 
    pageAccesses, 
    userPermissions,
    canUpdateUsers,
    canViewUsersPage,
    canViewCoursesPage,
    canCreateCourses,
    canUpdateCourses,
    canViewEnrollmentPage,
    canCreateEnrollment,
    canUpdateEnrollment,
    canViewReinductionPage,
    canViewEvaluationsPage,
    canCreateEvaluations,
    canUpdateEvaluations,
    canViewSurveysPage,
    canCreateSurveys,
    canUpdateSurveys,
    canViewAttendancePage,
    canUpdateAttendance,
    canViewWorkersPage,
    canCreateWorkers,
    canUpdateWorkers,
    canViewOccupationalExamPage,
    canViewSeguimientoPage,
    canViewCertificatesPage,
    canCreateCertificates,
    canViewReportsPage,
    canViewNotificationsPage,
    canViewSuppliersPage
  ]);

  return {
    loading,
    pageAccesses,
    userPermissions,
    checkPermission,
    canAccessPage,
    // Page access permission functions
    canViewUsersPage,
    canViewCoursesPage,
    canViewEvaluationsPage,
    canViewSurveysPage,
    canViewCertificatesPage,
    canViewAttendancePage,
    canViewReportsPage,
    canViewNotificationsPage,
    canViewWorkersPage,
    canViewReinductionPage,
    canViewAdminConfigPage,
    canViewSeguimientoPage,
    canViewRolesPage,
    canViewFilesPage,
    canViewDashboardPage,
    canViewProfilePage,
    canViewAuditPage,
    canViewAbsenteeismPage,
    canViewEnrollmentPage,
    canViewOccupationalExamPage,
    canViewProgressPage,
    canViewSuppliersPage,
    // User permission functions
    canCreateUsers,
    canReadUsers,
    canUpdateUsers,
    canDeleteUsers,
    // Course permission functions
    canCreateCourses,
    canReadCourses,
    canUpdateCourses,
    canDeleteCourses,
    // Evaluation permission functions
    canCreateEvaluations,
    canReadEvaluations,
    canUpdateEvaluations,
    canDeleteEvaluations,
    canSubmitEvaluations,
    // Survey permission functions
    canCreateSurveys,
    canReadSurveys,
    canUpdateSurveys,
    canDeleteSurveys,
    canSubmitSurveys,
    // Certificate permission functions
    canCreateCertificates,
    canReadCertificates,
    canUpdateCertificates,
    canDeleteCertificates,
    // Attendance permission functions
    canCreateAttendance,
    canReadAttendance,
    canUpdateAttendance,
    canDeleteAttendance,
    // Report permission functions
    canCreateReports,
    canReadReports,
    canUpdateReports,
    canDeleteReports,
    // Notification permission functions
    canCreateNotifications,
    canReadNotifications,
    canUpdateNotifications,
    canDeleteNotifications,
    // Worker permission functions
    canCreateWorkers,
    canReadWorkers,
    canUpdateWorkers,
    canDeleteWorkers,
    // Reinduction permission functions
    canCreateReinduction,
    canReadReinduction,
    canUpdateReinduction,
    canDeleteReinduction,
    // Admin config permission functions
    canCreateAdminConfig,
    canReadAdminConfig,
    canUpdateAdminConfig,
    canDeleteAdminConfig,
    // Seguimiento permission functions
    canCreateSeguimiento,
    canReadSeguimiento,
    canUpdateSeguimiento,
    canDeleteSeguimiento,
    // Role permission functions
    canCreateRoles,
    canReadRoles,
    canUpdateRoles,
    canDeleteRoles,
    // File permission functions
    canCreateFiles,
    canReadFiles,
    canUpdateFiles,
    canDeleteFiles,
    // Enrollment permission functions
    canCreateEnrollment,
    canReadEnrollment,
    canUpdateEnrollment,
    canDeleteEnrollment,
    // Occupational exam permission functions
    canCreateOccupationalExam,
    canReadOccupationalExam,
    canUpdateOccupationalExam,
    canDeleteOccupationalExam,
    // Progress permission functions
    canCreateProgress,
    canReadProgress,
    canUpdateProgress,
    canDeleteProgress,
    // Module permission functions
    canCreateModules,
    canReadModules,
    canUpdateModules,
    canDeleteModules,
    canViewModulesPage,
    // Material permission functions
    canCreateMaterials,
    canReadMaterials,
    canUpdateMaterials,
    canDeleteMaterials,
    canViewMaterialsPage,
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
    '/admin/audit': ['admin'],
    '/admin/absenteeism': ['admin', 'supervisor'],
    '/admin/occupational-exams': ['admin', 'supervisor'],
    '/admin/seguimientos': ['admin', 'supervisor'],
    '/admin/attendance': ['admin', 'trainer', 'supervisor'],
    '/admin/admin-attendance': ['admin'],
    '/admin/evaluations': ['admin', 'trainer'],
    '/admin/evaluation-results': ['admin', 'trainer'],
    '/admin/surveys': ['admin', 'trainer'],
    '/admin/certificates': ['admin', 'trainer', 'supervisor'],
    '/admin/reports': ['admin', 'supervisor'],
    '/admin/notifications': ['admin', 'trainer', 'supervisor'],
    '/admin/reinduction': ['admin', 'trainer', 'supervisor'],
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
  // Cambio importante: retornar false por defecto para mayor seguridad
  // Solo permitir acceso a rutas explícitamente definidas
  return allowedRoles ? allowedRoles.includes(normalizedRole) : false;
}

export default usePermissions;