import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { absenteeismService } from '../../services/absenteeismService';
import {
  AbsenteeismResponse,
  EventTypeEnum
} from '../../types/absenteeism';
import { usePermissions } from '../../hooks/usePermissions';

const AbsenteeismDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { canViewWorkersPage, canUpdateWorkers } = usePermissions();
  
  const [absenteeism, setAbsenteeism] = useState<AbsenteeismResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAbsenteeism = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await absenteeismService.getAbsenteeism(parseInt(id));
      setAbsenteeism(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar el registro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewWorkersPage()) {
      loadAbsenteeism();
    }
  }, [id, canViewWorkersPage]);

  const getEventTypeColor = (eventType: EventTypeEnum) => {
    switch (eventType) {
      case EventTypeEnum.ACCIDENTE_TRABAJO:
        return 'error';
      case EventTypeEnum.ENFERMEDAD_LABORAL:
        return 'warning';
      case EventTypeEnum.ACCIDENTE_COMUN:
        return 'info';
      case EventTypeEnum.ENFERMEDAD_GENERAL:
        return 'default';
      default:
        return 'default';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!canViewWorkersPage()) {
    return (
      <Alert severity="error">
        No tienes permisos para ver los registros de absenteeism.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!absenteeism) {
    return (
      <Alert severity="warning">
        No se encontró el registro de absenteeism.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Detalle de Absenteeism
        </Typography>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/absenteeism')}
            sx={{ mr: 1 }}
          >
            Volver
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ mr: 1 }}
          >
            Imprimir
          </Button>
          {canUpdateWorkers() && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/admin/absenteeism/${id}/edit`)}
            >
              Editar
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Información del Trabajador */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Trabajador
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Nombre Completo
                  </Typography>
                  <Typography variant="body1">
                    {absenteeism.worker ? `${absenteeism.worker.first_name} ${absenteeism.worker.last_name}` : 'No especificado'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Cédula
                  </Typography>
                  <Typography variant="body1">
                    {absenteeism.worker?.document_number || 'No especificado'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Cargo
                  </Typography>
                  <Typography variant="body1">
                    {absenteeism.worker?.position || 'No especificado'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Salario Base
                  </Typography>
                  <Typography variant="body1">
                    ${absenteeism.base_salary.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Información del Evento */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Evento
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Mes del Evento</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{absenteeism.event_month}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Tipo de Evento</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={absenteeism.event_type}
                          color={getEventTypeColor(absenteeism.event_type) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Fecha Inicial</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(absenteeism.start_date), 'dd/MM/yyyy', { locale: es })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Fecha Final</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(absenteeism.end_date), 'dd/MM/yyyy', { locale: es })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Información de Incapacidad */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información de Incapacidad
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Días de Incapacidad</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{absenteeism.disability_days}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Prórroga</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{absenteeism.extension}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Total Días de Incapacidad</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {absenteeism.total_disability_days}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Días Cargados</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{absenteeism.charged_days}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Días de Incapacidad o Cargados</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {absenteeism.disability_or_charged_days}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Información Médica */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Médica
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Código Diagnóstico
                  </Typography>
                  <Typography variant="body1">
                    {absenteeism.diagnostic_code || 'No especificado'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Descripción de la Condición de Salud
                  </Typography>
                  <Typography variant="body1">
                    {absenteeism.health_condition_description || 'No especificado'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">
                    {absenteeism.observations || 'Sin observaciones'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Información Salarial */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Salarial
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Salario Base</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${absenteeism.base_salary.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Salario Base Día</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${absenteeism.daily_base_salary.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Costos */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Costos
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Costos Asegurados A.T.</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${absenteeism.insured_costs_at.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Costos Asegurados A.C. - E.G.</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${absenteeism.insured_costs_ac_eg.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Costos Asumidos A.T.</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${absenteeism.assumed_costs_at.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2">Costos Asumidos A.C. - E.G.</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${absenteeism.assumed_costs_ac_eg.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2" fontWeight="bold">Total Costos</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          ${
                            (
                              absenteeism.insured_costs_at +
                              absenteeism.insured_costs_ac_eg +
                              absenteeism.assumed_costs_at +
                              absenteeism.assumed_costs_ac_eg
                            ).toLocaleString()
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Información de Auditoría */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información de Auditoría
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(absenteeism.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Última Actualización
                  </Typography>
                  <Typography variant="body1">
                    {absenteeism.updated_at ? format(new Date(absenteeism.updated_at), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}
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

export default AbsenteeismDetail;