import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  People,
  School,
  Assignment,
  Assessment,
  CardMembership,
  Notifications,
  Settings,
  ExpandLess,
  ExpandMore,
  Person,
  Work,
  Timeline,
  BarChart,
  Security,
  MedicalServices,
  Quiz,
  Folder,
  AdminPanelSettings,
  SupervisorAccount,
  MenuOpen,
  Menu as MenuIcon,
  CheckCircle,
  Schedule,
  Group,
  Description,
  Healing,
  Poll,
  FilePresent,
  Refresh,
  TrendingUp,
  ManageAccounts,
  PersonSearch,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const { user } = useAuth();
  const { 
    canManageUsers, 
    canAccessPage,
    canViewCourses,
    canManageCourses,
    canViewEvaluations,
    canManageEvaluations,
    canViewSurveys,
    canManageSurveys,
    canViewAttendance,
    canManageAttendance,
    canViewWorkers,
    canManageWorkers,
    canViewCertificates,
    canManageCertificates,
    canViewReports,
    canViewNotifications,
    canViewOccupationalExam,
    canViewSeguimiento,
    canViewAdminConfig,
    canViewReinduction
  } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  

  // Persistir estado de expansión en localStorage
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sidebar-expanded-items');
      return saved ? JSON.parse(saved) : ['dashboard'];
    } catch (error) {
      console.warn('Error loading sidebar state from localStorage:', error);
      return ['dashboard'];
    }
  });

  // Guardar estado de expansión cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-expanded-items', JSON.stringify(expandedItems));
    } catch (error) {
      console.warn('Error saving sidebar state to localStorage:', error);
    }
  }, [expandedItems]);

  const handleExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Dashboard />,
      children: [
        {
          id: 'admin-dashboard',
          label: 'Panel Administrativo',
          icon: <AdminPanelSettings />,
          path: '/admin/dashboard',
          roles: ['admin']
        },
        {
          id: 'trainer-dashboard',
          label: 'Panel Entrenador',
          icon: <School />,
          path: '/trainer/dashboard',
          roles: ['trainer']
        },
        {
          id: 'supervisor-dashboard',
          label: 'Panel Supervisor',
          icon: <SupervisorAccount />,
          path: '/supervisor/dashboard',
          roles: ['supervisor']
        },
        {
          id: 'employee-dashboard',
          label: 'Panel Empleado',
          icon: <Person />,
          path: '/employee/dashboard',
          roles: ['employee']
        }
      ]
    },
    {
      id: 'employee-courses',
      label: 'Mis Cursos',
      icon: <School />,
      path: '/employee/courses',
      roles: ['employee']
    },
    {
      id: 'employee-surveys',
      label: 'Mis Encuestas',
      icon: <Poll />,
      path: '/employee/surveys',
      roles: ['employee']
    },
    {
      id: 'employee-evaluations',
      label: 'Mis Evaluaciones',
      icon: <Quiz />,
      path: '/employee/evaluations',
      roles: ['employee']
    },
    {
      id: 'employee-attendance',
      label: 'Mi Asistencia',
      icon: <Schedule />,
      path: '/employee/attendance',
      roles: ['employee']
    },
    {
      id: 'employee-certificates',
      label: 'Mis Certificados',
      icon: <CardMembership />,
      path: '/employee/certificates',
      roles: ['employee']
    },
    {
      id: 'worker-management',
      label: 'Gestión de Trabajadores',
      icon: <ManageAccounts />,
      children: [
        {
          id: 'workers',
          label: 'Trabajadores',
          icon: <Work />,
          path: '/admin/workers',
          roles: ['admin', 'supervisor']
        },
        {
          id: 'worker-detail',
          label: 'Consulta Individual',
          icon: <PersonSearch />,
          path: '/admin/workers/detail',
          roles: ['admin', 'supervisor']
        }
      ],
      roles: ['admin', 'supervisor']
    },
    {
      id: 'courses',
      label: 'Gestión de Cursos',
      icon: <School />,
      children: [
        {
          id: 'courses-list',
          label: 'Cursos',
          icon: <School />,
          path: '/admin/courses',
          roles: ['admin', 'trainer']
        },
        // Sesiones eliminadas - funcionalidad removida del sistema
        {
          id: 'enrollments',
          label: 'Inscripciones',
          icon: <Assignment />,
          path: '/admin/enrollments',
          roles: ['admin', 'trainer', 'supervisor']
        },
        {
          id: 'reinduction',
          label: 'Reinducciones',
          icon: <Refresh />,
          path: '/admin/reinduction',
          roles: ['admin', 'trainer', 'supervisor']
        }
      ],
      roles: ['admin', 'trainer', 'supervisor']
    },
    {
      id: 'evaluations',
      label: 'Evaluaciones y Encuestas',
      icon: <Assessment />,
      children: [
        {
          id: 'evaluations-list',
          label: 'Evaluaciones',
          icon: <Quiz />,
          path: '/admin/evaluations',
          roles: ['admin', 'trainer']
        },
        {
          id: 'evaluation-results',
          label: 'Resultados de Evaluaciones',
          icon: <BarChart />,
          path: '/admin/evaluation-results',
          roles: ['admin', 'trainer']
        },
        {
          id: 'surveys',
          label: 'Encuestas',
          icon: <Poll />,
          path: '/admin/surveys',
          roles: ['admin', 'trainer']
        }
      ],
      roles: ['admin', 'trainer']
    },
    {
      id: 'attendance',
      label: 'Asistencia',
      icon: <CheckCircle />,
      children: [
        {
          id: 'attendance-list',
          label: 'Registro de Asistencia',
          icon: <Schedule />,
          path: '/admin/attendance',
          roles: ['admin', 'trainer', 'supervisor']
        },
        {
          id: 'admin-attendance',
          label: 'Gestión de Asistencia',
          icon: <Group />,
          path: '/admin/admin-attendance',
          roles: ['admin']
        }
      ],
      roles: ['admin', 'trainer', 'supervisor']
    },
    {
      id: 'health',
      label: 'Salud Ocupacional',
      icon: <MedicalServices />,
      children: [
        {
          id: 'occupational-exams',
          label: 'Exámenes Ocupacionales',
          icon: <Healing />,
          path: '/admin/occupational-exams',
          roles: ['admin', 'supervisor']
        },
        {
          id: 'seguimientos',
          label: 'Seguimientos',
          icon: <Timeline />,
          path: '/admin/seguimientos',
          roles: ['admin', 'supervisor']
        },
        {
          id: 'absenteeism',
          label: 'Ausentismo',
          icon: <MedicalServices />,
          path: '/admin/absenteeism',
          roles: ['admin', 'supervisor']
        }
      ],
      roles: ['admin', 'supervisor']
    },
    {
      id: 'certificates',
      label: 'Certificados',
      icon: <CardMembership />,
      path: '/admin/certificates',
      roles: ['admin', 'trainer', 'supervisor']
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <Description />,
      path: '/admin/reports',
      roles: ['admin', 'supervisor']
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: <Notifications />,
      path: '/admin/notifications',
      roles: ['admin', 'trainer', 'supervisor']
    },
    {
      id: 'administration',
      label: 'Administración',
      icon: <AdminPanelSettings />,
      children: [
        {
          id: 'audit',
          label: 'Auditoría',
          icon: <Security />,
          path: '/admin/audit',
          roles: ['admin']
        },
        {
          id: 'config',
          label: 'Configuración',
          icon: <Settings />,
          path: '/admin/config',
          roles: ['admin']
        },
        {
          id: 'roles',
          label: 'Gestión de Roles',
          icon: <ManageAccounts />,
          path: '/admin/roles',
          roles: ['admin']
        },
        {
          id: 'users',
          label: 'Gestión de Usuarios',
          icon: <People />,
          path: '/admin/users',
          roles: ['admin', 'supervisor']
        }
      ],
      roles: ['admin', 'supervisor']
    }
  ];

  const filterMenuByRole = (items: MenuItem[]): MenuItem[] => {
    if (!user) return [];
    
    return items.filter(item => {
      // Verificación granular por permisos específicos para usuarios con rol personalizado
      if (user.custom_role_id) {
        // Mapeo de elementos del menú a permisos específicos
        const permissionMap: Record<string, () => boolean> = {
          // Dashboard - acceso basado en rol y permisos personalizados
          'dashboard': () => true, // Will be filtered by children
          'admin-dashboard': () => user.role === 'admin',
          'trainer-dashboard': () => user.role === 'trainer',
          'supervisor-dashboard': () => user.role === 'supervisor',
          'employee-dashboard': () => user.role === 'employee',
          
          // Employee sections - solo para empleados
          'employee-courses': () => user.role === 'employee',
          'employee-surveys': () => user.role === 'employee',
          'employee-evaluations': () => user.role === 'employee',
          'employee-attendance': () => user.role === 'employee',
          'employee-certificates': () => user.role === 'employee',
          
          // Worker management
          'worker-management': () => canViewWorkers() || canManageWorkers(),
          'workers': canViewWorkers,
          'workers-list': canViewWorkers,
          'worker-detail': canViewWorkers,
          
          // Course management
          'courses': canViewCourses,
          'courses-list': canViewCourses,
          'enrollments': canViewCourses,
          'reinduction': () => canViewReinduction(),
          
          // Evaluation management
          'evaluations': canViewEvaluations,
          'evaluations-list': canViewEvaluations,
          'evaluation-results': canViewEvaluations,
          'surveys': canViewSurveys,
          
          // Attendance
          'attendance': canViewAttendance,
          'attendance-list': canViewAttendance,
          'admin-attendance': canManageAttendance,
          
          // Health/Medical
          'health': () => canViewOccupationalExam() || canViewSeguimiento(),
          'occupational-exams': () => canViewOccupationalExam(),
          'seguimientos': () => canViewSeguimiento(),
          
          // Certificates
          'certificates': canViewCertificates,
          
          // Reports
          'reports': canViewReports,
          
          // Notifications
          'notifications': canViewNotifications,
          
          // Administration (always check individual permissions)
          'administration': () => true, // Will be filtered by children
          'audit': () => user.role === 'admin', // Solo admins pueden ver auditoría
          'config': () => canViewAdminConfig(),
          'roles': () => user.role === 'admin', // Solo admins pueden gestionar roles
          'users': canManageUsers
        };

        const permissionCheck = permissionMap[item.id];
        if (permissionCheck && !permissionCheck()) {
          return false;
        }
      } else {
        // Verificación tradicional por roles del sistema para usuarios sin rol personalizado
        if (item.roles && !item.roles.includes(user.role)) {
          return false;
        }
      }
      
      // Para elementos con hijos, filtrar recursivamente
      if (item.children) {
        item.children = filterMenuByRole(item.children);
        return item.children.length > 0;
      }
      
      return true;
    });
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isItemActive = item.path ? isActive(item.path) : false;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding className="sidebar-menu-item">
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleExpand(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            selected={isItemActive}
            sx={{
              pl: 2 + level * 2,
              minHeight: 48,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '20',
                borderRight: `3px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '30',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isItemActive ? theme.palette.primary.main : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontSize: level > 0 ? '0.875rem' : '1rem',
                fontWeight: isItemActive ? 600 : 400,
                color: isItemActive ? theme.palette.primary.main : 'inherit',
              }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const filteredMenuItems = filterMenuByRole(menuItems);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" noWrap component="div">
          Plataforma SST
        </Typography>
        <IconButton onClick={onToggle} size="small">
          <MenuOpen />
        </IconButton>
      </Box>

      {/* User Info */}
      {user && (
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: theme.palette.grey[50],
          }}
        >
          <Typography variant="subtitle2" noWrap>
            {user.first_name} {user.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user.role === 'admin' ? 'Administrador' :
             user.role === 'trainer' ? 'Entrenador' :
             user.role === 'supervisor' ? 'Supervisor' : 'Empleado'}
          </Typography>
        </Box>
      )}

      {/* Menu Items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }} className="sidebar-content">
        <List>
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © 2024 Plataforma SST
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={open}
      onClose={onToggle}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          zIndex: 1200,
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;