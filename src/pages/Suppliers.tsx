import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { suppliersService, Supplier, Doctor } from '../services/suppliersService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [openSupplierDialog, setOpenSupplierDialog] = useState(false);
  const [openDoctorDialog, setOpenDoctorDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [supplierTypes, setSupplierTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    supplier_type: '',
    is_active: true
  });
  const [openDeleteSupplierDialog, setOpenDeleteSupplierDialog] = useState(false);
  const [openDeleteDoctorDialog, setOpenDeleteDoctorDialog] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    nit: '',
    supplier_type: 'medical_center' as 'medical_center' | 'laboratory' | 'clinic' | 'hospital' | 'other',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    is_active: true
  });

  const [doctorForm, setDoctorForm] = useState({
    supplier_id: 0,
    first_name: '',
    last_name: '',
    medical_license: '',
    specialty: '',
    phone: '',
    email: '',
    is_active: true
  });

  // Especialidades enfocadas en SST
  const sstSpecialties = [
    'Médico Especialista en Salud Ocupacional',
    'Médico Especialista en Medicina del Trabajo',
    'Médico General con Especialización en SST',
    'Médico Especialista en Medicina Preventiva y del Trabajo',
    'Médico Especialista en Epidemiología Ocupacional',
    'Médico Especialista en Toxicología Ocupacional',
    'Médico Especialista en Ergonomía',
    'Médico Especialista en Higiene Industrial',
    'Médico General'
  ];

  useEffect(() => {
    fetchSuppliers();
    fetchDoctors();
    fetchSupplierTypes();
  }, [filters]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await suppliersService.getSuppliers(filters);
      setSuppliers(data);
    } catch (error) {
      setError('Error al cargar proveedores');
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await suppliersService.getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchSupplierTypes = async () => {
    try {
      const types = await suppliersService.getSupplierTypes();
      setSupplierTypes(types);
    } catch (error) {
      console.error('Error fetching supplier types:', error);
    }
  };

  const handleSupplierSubmit = async () => {
    try {
      setLoading(true);
      if (selectedSupplier) {
        // Actualizar proveedor existente
        await suppliersService.updateSupplier(selectedSupplier.id, supplierForm);
        setSuccess('Proveedor actualizado exitosamente');
      } else {
        // Crear nuevo proveedor
        await suppliersService.createSupplier(supplierForm);
        setSuccess('Proveedor creado exitosamente');
      }
      setOpenSupplierDialog(false);
      resetSupplierForm();
      fetchSuppliers();
    } catch (error) {
      setError('Error al guardar proveedor');
      console.error('Error saving supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSubmit = async () => {
    try {
      setLoading(true);
      if (selectedDoctor) {
        // Actualizar médico existente
        await suppliersService.updateDoctor(selectedDoctor.id, doctorForm);
        setSuccess('Médico actualizado exitosamente');
      } else {
        // Crear nuevo médico
        await suppliersService.createDoctor(doctorForm);
        setSuccess('Médico creado exitosamente');
      }
      setOpenDoctorDialog(false);
      resetDoctorForm();
      fetchDoctors();
    } catch (error) {
      setError('Error al guardar médico');
      console.error('Error saving doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setOpenDeleteSupplierDialog(true);
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    
    try {
      await suppliersService.deleteSupplier(supplierToDelete.id);
      setSuccess('Proveedor eliminado exitosamente');
      fetchSuppliers();
    } catch (error) {
      setError('Error al eliminar proveedor');
      console.error('Error deleting supplier:', error);
    } finally {
      setOpenDeleteSupplierDialog(false);
      setSupplierToDelete(null);
    }
  };

  const handleDeleteDoctor = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setOpenDeleteDoctorDialog(true);
  };

  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    
    try {
      await suppliersService.deleteDoctor(doctorToDelete.id);
      setSuccess('Médico eliminado exitosamente');
      fetchDoctors();
    } catch (error) {
      setError('Error al eliminar médico');
      console.error('Error deleting doctor:', error);
    } finally {
      setOpenDeleteDoctorDialog(false);
      setDoctorToDelete(null);
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      nit: '',
      supplier_type: 'medical_center',
      address: '',
      phone: '',
      email: '',
      contact_person: '',
      is_active: true
    });
    setSelectedSupplier(null);
  };

  const resetDoctorForm = () => {
    setDoctorForm({
      supplier_id: 0,
      first_name: '',
      last_name: '',
      medical_license: '',
      specialty: '',
      phone: '',
      email: '',
      is_active: true
    });
    setSelectedDoctor(null);
  };

  const openEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      nit: supplier.nit || '',
      supplier_type: supplier.supplier_type,
      address: supplier.address || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      contact_person: supplier.contact_person || '',
      is_active: supplier.is_active
    });
    setOpenSupplierDialog(true);
  };

  const openEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDoctorForm({
      supplier_id: doctor.supplier_id,
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      medical_license: doctor.medical_license || '',
      specialty: doctor.specialty || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      is_active: doctor.is_active
    });
    setOpenDoctorDialog(true);
  };

  const openViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setOpenViewDialog(true);
  };

  const getSupplierTypeLabel = (type: string) => {
    return suppliersService.getSupplierTypeLabel(type);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Proveedores
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Proveedores" />
          <Tab label="Médicos" />
        </Tabs>

        {/* Tab Panel - Proveedores */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Tipo de Proveedor</InputLabel>
                <Select
                  value={filters.supplier_type}
                  label="Tipo de Proveedor"
                  onChange={(e) => setFilters({ ...filters, supplier_type: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {supplierTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {getSupplierTypeLabel(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.is_active}
                    onChange={(e) => setFilters({ ...filters, is_active: e.target.checked })}
                  />
                }
                label="Solo activos"
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetSupplierForm();
                setOpenSupplierDialog(true);
              }}
            >
              Nuevo Proveedor
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={getSupplierTypeLabel(supplier.supplier_type)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.is_active ? 'Activo' : 'Inactivo'}
                        color={supplier.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openViewSupplier(supplier)}
                        title="Ver detalles"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openEditSupplier(supplier)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSupplier(supplier)}
                        title="Eliminar"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab Panel - Médicos */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Médicos Registrados</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetDoctorForm();
                setOpenDoctorDialog(true);
              }}
            >
              Nuevo Médico
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Especialidad</TableCell>
                  <TableCell>Licencia</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{`${doctor.first_name} ${doctor.last_name}`}</TableCell>
                    <TableCell>{doctor.specialty || '-'}</TableCell>
                    <TableCell>{doctor.medical_license || '-'}</TableCell>
                    <TableCell>{doctor.supplier?.name || '-'}</TableCell>
                    <TableCell>{doctor.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={doctor.is_active ? 'Activo' : 'Inactivo'}
                        color={doctor.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openEditDoctor(doctor)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDoctor(doctor)}
                        title="Eliminar"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Dialog para crear/editar proveedor */}
      <Dialog open={openSupplierDialog} onClose={() => setOpenSupplierDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                fullWidth
                label="Nombre"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="NIT"
                value={supplierForm.nit}
                onChange={(e) => setSupplierForm({ ...supplierForm, nit: e.target.value })}
                required
              />
            </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
               <FormControl fullWidth required>
                <InputLabel>Tipo de Proveedor</InputLabel>
                <Select
                  value={supplierForm.supplier_type}
                  label="Tipo de Proveedor"
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplier_type: e.target.value as any })}
                >
                  <MenuItem value="medical_center">Centro Médico</MenuItem>
                  <MenuItem value="laboratory">Laboratorio</MenuItem>
                  <MenuItem value="clinic">Clínica</MenuItem>
                  <MenuItem value="hospital">ips</MenuItem>
                  <MenuItem value="other">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
                <Grid size={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                fullWidth
                label="Teléfono"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                fullWidth
                label="Email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Persona de Contacto"
                value={supplierForm.contact_person}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
              />
            </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                control={
                  <Switch
                    checked={supplierForm.is_active}
                    onChange={(e) => setSupplierForm({ ...supplierForm, is_active: e.target.checked })}
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSupplierDialog(false)}>Cancelar</Button>
          <Button onClick={handleSupplierSubmit} variant="contained" disabled={loading}>
            {selectedSupplier ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar médico */}
      <Dialog open={openDoctorDialog} onClose={() => setOpenDoctorDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDoctor ? 'Editar Médico' : 'Nuevo Médico'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Proveedor</InputLabel>
                <Select
                  value={doctorForm.supplier_id}
                  label="Proveedor"
                  onChange={(e) => setDoctorForm({ ...doctorForm, supplier_id: Number(e.target.value) })}
                >
                  {suppliers.filter(s => s.is_active).map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
               <TextField
                fullWidth
                label="Nombres"
                value={doctorForm.first_name}
                onChange={(e) => setDoctorForm({ ...doctorForm, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Apellidos"
                value={doctorForm.last_name}
                onChange={(e) => setDoctorForm({ ...doctorForm, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Especialidad SST</InputLabel>
                <Select
                  value={doctorForm.specialty}
                  label="Especialidad SST"
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                >
                  {sstSpecialties.map((specialty) => (
                    <MenuItem key={specialty} value={specialty}>
                      {specialty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Licencia Médica"
                value={doctorForm.medical_license}
                onChange={(e) => setDoctorForm({ ...doctorForm, medical_license: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Teléfono"
                value={doctorForm.phone}
                onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
               <FormControlLabel
                control={
                  <Switch
                    checked={doctorForm.is_active}
                    onChange={(e) => setDoctorForm({ ...doctorForm, is_active: e.target.checked })}
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDoctorDialog(false)}>Cancelar</Button>
          <Button onClick={handleDoctorSubmit} variant="contained" disabled={loading}>
            {selectedDoctor ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver detalles del proveedor */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalles del Proveedor</DialogTitle>
        <DialogContent>
          {selectedSupplier && (
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Typography variant="h6" gutterBottom>
                      <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {selectedSupplier.name}
                    </Typography>
                    <Chip
                      label={getSupplierTypeLabel(selectedSupplier.supplier_type)}
                      color="primary"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Divider />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Dirección
                    </Typography>
                    <Typography variant="body1">
                      {selectedSupplier.address || 'No especificada'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Persona de Contacto
                    </Typography>
                    <Typography variant="body1">
                      {selectedSupplier.contact_person || 'No especificada'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Teléfono
                    </Typography>
                    <Typography variant="body1">
                      {selectedSupplier.phone || 'No especificado'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {selectedSupplier.email || 'No especificado'}
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="body2" color="textSecondary">
                      Estado
                    </Typography>
                    <Chip
                      label={selectedSupplier.is_active ? 'Activo' : 'Inactivo'}
                      color={selectedSupplier.is_active ? 'success' : 'default'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar proveedor */}
      <Dialog
        open={openDeleteSupplierDialog}
        onClose={() => setOpenDeleteSupplierDialog(false)}
        aria-labelledby="delete-supplier-dialog-title"
        aria-describedby="delete-supplier-dialog-description"
      >
        <DialogTitle id="delete-supplier-dialog-title">
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-supplier-dialog-description">
            ¿Está seguro de que desea eliminar el proveedor <strong>{supplierToDelete?.name}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteSupplierDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDeleteSupplier} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar médico */}
      <Dialog
        open={openDeleteDoctorDialog}
        onClose={() => setOpenDeleteDoctorDialog(false)}
        aria-labelledby="delete-doctor-dialog-title"
        aria-describedby="delete-doctor-dialog-description"
      >
        <DialogTitle id="delete-doctor-dialog-title">
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-doctor-dialog-description">
            ¿Está seguro de que desea eliminar al médico <strong>{doctorToDelete ? `${doctorToDelete.first_name} ${doctorToDelete.last_name}` : ''}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDoctorDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDeleteDoctor} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars para mensajes */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Suppliers;