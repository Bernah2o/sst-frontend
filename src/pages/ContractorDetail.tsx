import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  LocalHospital as MedicalIcon,
  Security as SecurityIcon,
  Description as DocumentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

import contractorService from '../services/contractorService';
import areaService, { Area } from '../services/areaService';
import { ContractorResponse } from '../types/contractor';

const ContractorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contractor, setContractor] = useState<ContractorResponse | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('ID de contratista no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [contractorData, areasData] = await Promise.all([
          contractorService.getContractor(parseInt(id)),
          areaService.getActiveAreas(),
        ]);
        
        setContractor(contractorData);
        setAreas(areasData);
      } catch (err) {
        console.error('Error loading contractor details:', err);
        setError('Error al cargar los detalles del contratista');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const getAreaName = (areaId: number | null | undefined): string => {
    if (!areaId) return 'No asignada';
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : `Área ${areaId}`;
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const formatContractType = (contractType: string | null | undefined): string => {
    if (!contractType) return 'No especificado';
    return contractType.replace(/_/g, ' ').toUpperCase();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !contractor) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || 'Contratista no encontrado'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/contractors')}
          sx={{ mt: 2 }}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/admin/contractors')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Detalles del Contratista
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/contractors/edit/${contractor.id}`)}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            startIcon={<DocumentIcon />}
            onClick={() => navigate('/admin/contractors/documents')}
          >
            Documentos
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Información Personal */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6">Información Personal</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nombre Completo
                  </Typography>
                  <Typography variant="body1">
                    {`${contractor.first_name || ''} ${contractor.second_name || ''} ${contractor.last_name || ''} ${contractor.second_last_name || ''}`.replace(/\s+/g, ' ').trim() || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de Documento
                  </Typography>
                  <Typography variant="body1">
                    {contractor.document_type || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Número de Documento
                  </Typography>
                  <Typography variant="body1">
                    {contractor.document_number || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {contractor.email || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <PhoneIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Teléfono
                  </Typography>
                  <Typography variant="body1">
                    {contractor.phone || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <CalendarIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Fecha de Nacimiento
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(contractor.birth_date)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Género
                  </Typography>
                  <Typography variant="body1">
                    {contractor.gender ? 
                      contractor.gender.charAt(0).toUpperCase() + contractor.gender.slice(1).toLowerCase() : 
                      'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={contractor.is_active ? 'Activo' : 'Inactivo'}
                    color={contractor.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Información Laboral */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <WorkIcon />
                </Avatar>
                <Typography variant="h6">Información Laboral</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cargo
                  </Typography>
                  <Typography variant="body1">
                    {contractor.cargo || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Profesión
                  </Typography>
                  <Typography variant="body1">
                    {contractor.profesion || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Área de Trabajo
                  </Typography>
                  <Typography variant="body1">
                    {getAreaName(contractor.area_id)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de Contrato
                  </Typography>
                  <Chip
                    label={formatContractType(contractor.contract_type || contractor.tipo_contrato)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nivel de Riesgo
                  </Typography>
                  <Typography variant="body1">
                    {contractor.risk_level || contractor.nivel_riesgo || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Modalidad de Trabajo
                  </Typography>
                  <Typography variant="body1">
                    {contractor.work_modality || contractor.modalidad_trabajo || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ocupación
                  </Typography>
                  <Typography variant="body1">
                    {contractor.occupation || contractor.ocupacion || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Valor del Contrato
                  </Typography>
                  <Typography variant="body1">
                    {contractor.contract_value || contractor.valor_contrato ? 
                      `$${(contractor.contract_value || contractor.valor_contrato)!.toLocaleString()}` : 
                      'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Inicio
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(contractor.fecha_de_inicio)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Finalización
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(contractor.fecha_de_finalizacion)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Información de Ubicación */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <LocationIcon />
                </Avatar>
                <Typography variant="h6">Información de Ubicación</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Typography variant="body1">
                    {contractor.direccion || 'No especificada'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ciudad
                  </Typography>
                  <Typography variant="body1">
                    {contractor.ciudad || 'No especificada'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Departamento
                  </Typography>
                  <Typography variant="body1">
                    {contractor.departamento || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    País
                  </Typography>
                  <Typography variant="body1">
                    {contractor.country || 'No especificado'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>





        {/* Información de Seguridad Social */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <SecurityIcon />
                </Avatar>
                <Typography variant="h6">Seguridad Social</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    EPS
                  </Typography>
                  <Typography variant="body1">
                    {contractor.eps || 'No especificada'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ARL
                  </Typography>
                  <Typography variant="body1">
                    {contractor.arl || 'No especificada'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    AFP
                  </Typography>
                  <Typography variant="body1">
                    {contractor.afp || 'No especificada'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Observaciones */}
        {contractor.observations && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Observaciones
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {contractor.observations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Información de Sistema */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Sistema
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(contractor.created_at)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Última Actualización
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(contractor.updated_at)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractorDetail;