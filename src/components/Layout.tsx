import {
  Menu as MenuIcon,
  AccountCircle,
  ExitToApp,
  School,
} from '@mui/icons-material';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiUrl } from '../config/env';
import { useAuth } from '../contexts/AuthContext';

import PermissionRefreshNotification from './PermissionRefreshNotification';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Sidebar siempre abierto en desktop, cerrado en móvil
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showPermissionNotification, setShowPermissionNotification] = useState(false);

  // Simular recepción de notificación de actualización de permisos
  useEffect(() => {
    const handlePermissionUpdate = () => {
      setShowPermissionNotification(true);
    };

    // Escuchar eventos personalizados para notificaciones de permisos
    window.addEventListener('permission-update', handlePermissionUpdate);
    
    return () => {
      window.removeEventListener('permission-update', handlePermissionUpdate);
    };
  }, []);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      const next = !sidebarCollapsed;
      setSidebarCollapsed(next);
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch { /* noop */ }
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'trainer':
        return 'warning';
      case 'supervisor':
        return 'info';
      case 'employee':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'trainer':
        return 'Entrenador';
      case 'supervisor':
        return 'Supervisor';
      case 'employee':
        return 'Empleado';
      default:
        return role;
    }
  };

  // Manejar cambios entre móvil y desktop
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);


  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        collapsed={!isMobile && sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        className="sidebar-transition"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: 0,
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              onClick={handleSidebarToggle}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <School sx={{ mr: 2, color: theme.palette.primary.main }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                color: theme.palette.primary.main,
                fontWeight: 600
              }}
            >
              Plataforma SST
            </Typography>
            
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Role Chip */}
                <Chip
                  label={getRoleLabel(user.role || user.rol)}
                  color={getRoleColor(user.role || user.rol) as any}
                  size="small"
                  variant="outlined"
                />
                
                {/* User Menu */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {user.nombre} {user.apellido}
                  </Typography>
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    <Avatar 
                      sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                      src={user.profile_picture ? 
                        (user.profile_picture.startsWith('http') ? 
                          user.profile_picture : 
                          `${getApiUrl().replace('/api/v1', '')}/uploads/${user.profile_picture}`
                        ) : undefined
                      }
                    >
                      <AccountCircle />
                    </Avatar>
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                      <AccountCircle sx={{ mr: 1 }} />
                      Mi Perfil
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ExitToApp sx={{ mr: 1 }} />
                      Cerrar Sesión
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>
            )}
          </Toolbar>
        </AppBar>
        
        {/* Page Content */}
        <Box
          className="content-wrapper"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: theme.palette.grey[50],
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <div className="main-content">
            {children}
          </div>
        </Box>
      </Box>
      
      {/* Notificación de actualización de permisos */}
      <PermissionRefreshNotification
        open={showPermissionNotification}
        onClose={() => setShowPermissionNotification(false)}
      />
    </Box>
  );
};

export default Layout;