import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp,
  School,
  Dashboard,
  People,
  Book,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/env';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  const getUserRoleInfo = () => {
    // Priorizar custom_role si existe
    if (user?.custom_role?.display_name) {
      return {
        label: user.custom_role.display_name,
        color: getRoleColor(user.role || '')
      };
    }
    
    // Usar role del backend
    if (user?.role) {
      return {
        label: getRoleLabel(user.role),
        color: getRoleColor(user.role)
      };
    }
    
    // Fallback a rol legacy
    return {
      label: getRoleLabel(user?.rol || ''),
      color: getRoleColor(user?.rol || '')
    };
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <School sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Plataforma SST
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Navegación por rol */}
            {user.rol === 'admin' && (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<Dashboard />}
                  onClick={() => navigate('/admin/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  color="inherit" 
                  startIcon={<People />}
                  onClick={() => navigate('/admin/users')}
                >
                  Usuarios
                </Button>
                <Button 
                  color="inherit" 
                  startIcon={<Book />}
                  onClick={() => navigate('/admin/courses')}
                >
                  Cursos
                </Button>
              </>
            )}
            
            {user.rol === 'trainer' && (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<Dashboard />}
                  onClick={() => navigate('/trainer/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  color="inherit" 
                  startIcon={<Book />}
                  onClick={() => navigate('/trainer/sessions')}
                >
                  Sesiones
                </Button>
              </>
            )}
            
            {user.rol === 'supervisor' && (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<Dashboard />}
                  onClick={() => navigate('/supervisor/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  color="inherit" 
                  startIcon={<People />}
                  onClick={() => navigate('/supervisor/team')}
                >
                  Equipo
                </Button>
              </>
            )}
            
            {user.rol === 'employee' && (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<Dashboard />}
                  onClick={() => navigate('/employee/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  color="inherit" 
                  startIcon={<Book />}
                  onClick={() => navigate('/employee/courses')}
                >
                  Mis Cursos
                </Button>
              </>
            )}
            
            {/* Información del usuario */}
            {(() => {
              const roleInfo = getUserRoleInfo();
              return (
                <Chip
                  label={roleInfo.label}
                  color={roleInfo.color as any}
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
              );
            })()}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
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
                  sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
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
                  vertical: 'top',
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
  );
};

export default Navbar;