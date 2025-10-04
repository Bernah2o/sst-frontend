import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Grid,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { committeeMemberService } from '../services/committeeMemberService';
import { committeeService } from '../services/committeeService';
import { committeePermissionService } from '../services/committeePermissionService';
import { userService } from '../services/userService';
import {
  CommitteeMember,
  Committee,
  CommitteeRole,
  CommitteeMemberCreate,
  CommitteeMemberUpdate,
  User,
} from '../types';

interface MemberFormData {
  user_id: number | null;
  role: CommitteeRole;
  start_date: string;
  notes: string;
}

const MemberManagement: React.FC = () => {
  const navigate = useNavigate();
  const { id: committeeId } = useParams<{ id: string }>();
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<MemberFormData>({
    user_id: null,
    role: CommitteeRole.MEMBER,
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [permissions, setPermissions] = useState({
    canView: false,
    canEdit: false,
    canManageMembers: false,
  });

  const loadInitialData = useCallback(async () => {
    if (!committeeId) {
      setError('ID de comité no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const id = parseInt(committeeId);
      
      if (isNaN(id) || id <= 0) {
        setError('El identificador del comité no es válido. Por favor, verifica la URL e intenta nuevamente.');
        return;
      }

      // Check permissions first
      const canView = await committeePermissionService.canView(id);
      const canEdit = await committeePermissionService.canEdit(id);
      const canManageMembers = await committeePermissionService.canManageMembers(id);

      setPermissions({
        canView,
        canEdit,
        canManageMembers,
      });

      if (!canView) {
        setError('No tienes permisos para ver este comité');
        return;
      }

      // Load committee, members and users data
      const [committeeData, membersData, usersData] = await Promise.all([
        committeeService.getCommittee(id),
        committeeMemberService.getCommitteeMembers(id),
        userService.getUsers({ page_size: 1000 }), // Get all users for selection
      ]);

      setCommittee(committeeData);
      setMembers(membersData);
      setUsers(usersData.items || usersData);
    } catch (err) {
      setError('Hubo un problema al cargar la información de miembros. Por favor, intenta recargar la página o contacta al soporte técnico si el problema persiste.');
    } finally {
      setLoading(false);
    }
  }, [committeeId]);

  useEffect(() => {
    loadInitialData();
  }, [committeeId, loadInitialData]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: CommitteeMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleEditClick = () => {
    if (selectedMember) {
      setFormData({
      user_id: selectedMember.user_id,
      role: selectedMember.role,
      start_date: selectedMember.start_date || new Date().toISOString().split('T')[0],
      notes: selectedMember.notes || '',
    });
      setEditDialogOpen(true);
      setAnchorEl(null); // Solo cerrar el menú, no limpiar selectedMember
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    // No llamar handleMenuClose() aquí para preservar selectedMember
    setAnchorEl(null); // Solo cerrar el menú sin limpiar selectedMember
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedMember(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedMember) {
      try {
        await committeeMemberService.removeMember(selectedMember.id);
        setDeleteDialogOpen(false);
        setSelectedMember(null);
        loadInitialData();
      } catch (err) {
        setError('Error al eliminar el miembro');
      }
    }
  };

  const handleAddMember = () => {
    setFormData({
      user_id: null,
      role: CommitteeRole.MEMBER,
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setAddDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.user_id || !committeeId) {
      setError('Por favor selecciona un usuario');
      return;
    }

    try {
      setFormLoading(true);
      const id = parseInt(committeeId);

      if (editDialogOpen && selectedMember) {
        // Update existing member - only send fields that can be updated
        const roleId = await committeeMemberService.getRoleId(formData.role);
        const updateData: CommitteeMemberUpdate = {
          role_id: roleId,
          start_date: formData.start_date,
          notes: formData.notes,
        };
        await committeeMemberService.updateCommitteeMember(selectedMember.id, updateData);
      } else {
        // Add new member - get role_id first
        const roleId = await committeeMemberService.getRoleId(formData.role);
        const createData: CommitteeMemberCreate = {
          committee_id: id,
          user_id: formData.user_id,
          role: formData.role,
          role_id: roleId,
          is_active: true,
          start_date: formData.start_date,
          notes: formData.notes,
        };
        await committeeMemberService.createCommitteeMember(createData);
      }

      // Close dialogs and reload data
      setAddDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedMember(null);
      loadInitialData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el miembro');
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleLabel = (role: CommitteeRole): string => {
    const roleLabels = {
      [CommitteeRole.PRESIDENT]: 'Presidente',
      [CommitteeRole.VICE_PRESIDENT]: 'Vicepresidente',
      [CommitteeRole.SECRETARY]: 'Secretario',
      [CommitteeRole.MEMBER]: 'Miembro',
      [CommitteeRole.ALTERNATE]: 'Suplente',
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: CommitteeRole): 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning' => {
    const roleColors = {
      [CommitteeRole.PRESIDENT]: 'error' as const,
      [CommitteeRole.VICE_PRESIDENT]: 'warning' as const,
      [CommitteeRole.SECRETARY]: 'info' as const,
      [CommitteeRole.MEMBER]: 'primary' as const,
      [CommitteeRole.ALTERNATE]: 'secondary' as const,
    };
    return roleColors[role] || 'default';
  };

  // Get available users (not already members)
  const availableUsers = users.filter(user => 
    !members.some(member => member.user_id === user.id && member.is_active)
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const activeMembers = members.filter(m => m.is_active);
  const paginatedMembers = activeMembers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/admin/committees')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Gestión de Miembros - {committee?.name}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total de Miembros
              </Typography>
              <Typography variant="h4">
                {activeMembers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Presidentes
              </Typography>
              <Typography variant="h4">
                {activeMembers.filter(m => m.role === CommitteeRole.PRESIDENT).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Secretarios
              </Typography>
              <Typography variant="h4">
                {activeMembers.filter(m => m.role === CommitteeRole.SECRETARY).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Miembros Activos
              </Typography>
              <Typography variant="h4">
                {activeMembers.filter(m => m.role === CommitteeRole.MEMBER).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Lista de Miembros
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddMember}
          disabled={!permissions.canManageMembers}
        >
          Agregar Miembro
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Miembro</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Fecha de Nombramiento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: getRoleColor(member.role) }}>
                          <GroupIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {member.user ? `${member.user.first_name} ${member.user.last_name}` : 'Usuario no disponible'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.user?.email || 'Email no disponible'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(member.role)}
                        color={getRoleColor(member.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {member.start_date ? new Date(member.start_date).toLocaleDateString('es-ES') : 'No especificado'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.is_active ? 'Activo' : 'Inactivo'}
                        color={member.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, member)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        No hay miembros activos en este comité
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={activeMembers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Menu de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {permissions.canManageMembers && (
          <MenuItem onClick={handleEditClick}>
            <EditIcon sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        {permissions.canManageMembers && (
          <MenuItem onClick={handleDeleteClick}>
            <DeleteIcon sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        )}
        {!permissions.canManageMembers && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No tienes permisos para gestionar miembros
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar a este miembro del comité?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar/editar miembro */}
      <Dialog 
        open={addDialogOpen || editDialogOpen} 
        onClose={() => {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          setSelectedMember(null);
          setError(null);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {editDialogOpen ? 'Editar Miembro' : 'Agregar Nuevo Miembro'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* User Selection */}
            <Autocomplete
              options={editDialogOpen ? users : availableUsers}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
              value={users.find(u => u.id === formData.user_id) || null}
              onChange={(_, newValue) => {
                setFormData(prev => ({ ...prev, user_id: newValue?.id || null }));
              }}
              disabled={editDialogOpen} // Can't change user when editing
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Usuario"
                  required
                  fullWidth
                  margin="normal"
                />
              )}
            />

            {/* Role Selection */}
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.role}
                label="Rol"
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as CommitteeRole }))}
              >
                {Object.values(CommitteeRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Start Date */}
            <TextField
              fullWidth
              type="date"
              label="Fecha de Inicio"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            {/* Notes */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notas"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              margin="normal"
              placeholder="Información adicional sobre el nombramiento..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
              setSelectedMember(null);
              setError(null);
            }}
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={formLoading || !formData.user_id}
          >
            {formLoading ? (
              <CircularProgress size={20} />
            ) : (
              editDialogOpen ? 'Actualizar' : 'Agregar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberManagement;