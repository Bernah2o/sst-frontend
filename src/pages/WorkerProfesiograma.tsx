import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import {
  Warning as WarningIcon,
  MedicalServices as MedicalIcon,
  Block as BlockIcon,
  ArrowBack as BackIcon,
  Timer as TimerIcon,
  Security as SecurityIcon,
  Vaccines as VaccinesIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';

import profesiogramaService, { Profesiograma, ProfesiogramaExamen, FactorRiesgo, TipoExamen, CriterioExclusion } from '../services/profesiogramaService';
import api from '../services/api';

// Función auxiliar para traducir niveles de riesgo
const getRiskColor = (level: string) => {
  switch (level) {
    case 'muy_alto': return 'error';
    case 'alto': return 'warning';
    case 'medio': return 'info';
    case 'bajo': return 'success';
    default: return 'default';
  }
};

const WorkerProfesiograma: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();


  const [profesiograma, setProfesiograma] = useState<Profesiograma | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [cargoName, setCargoName] = useState('');
  const [loading, setLoading] = useState(true);

  const [factoresById, setFactoresById] = useState<Record<number, FactorRiesgo>>({});
  const [tiposExamenById, setTiposExamenById] = useState<Record<number, TipoExamen>>({});
  const [criteriosById, setCriteriosById] = useState<Record<number, CriterioExclusion>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [workerRes, profData, factoresData, tiposExamenData, criteriosData] = await Promise.all([
          api.get(`/workers/${workerId}`),
          profesiogramaService.getWorkerProfesiograma(Number(workerId)),
          profesiogramaService.listFactoresRiesgo({ activo: true }),
          profesiogramaService.listTiposExamen({ activo: true }),
          profesiogramaService.listCriteriosExclusion(),
        ]);
        const workerData = workerRes.data;
        setWorkerName(`${workerData.first_name} ${workerData.last_name}`);
        setCargoName(workerData.position || 'Sin cargo asignado');
        setProfesiograma(profData);
        setFactoresById(Object.fromEntries(factoresData.map((x) => [x.id, x])));
        setTiposExamenById(Object.fromEntries(tiposExamenData.map((x) => [x.id, x])));
        setCriteriosById(Object.fromEntries(criteriosData.map((x) => [x.id, x])));

      } catch (error) {
        console.error(error);
        // No mostrar error si es solo que no existe profesiograma
      } finally {
        setLoading(false);
      }
    };

    if (workerId) {
      loadData();
    }
  }, [workerId]);

  // Agrupar exámenes por tipo de evaluación
  const groupExamsByType = (exams: ProfesiogramaExamen[]) => {
    const grouped = {
      ingreso: [] as ProfesiogramaExamen[],
      periodico: [] as ProfesiogramaExamen[],
      retiro: [] as ProfesiogramaExamen[],
      otros: [] as ProfesiogramaExamen[]
    };

    exams.forEach(ex => {
      if (ex.tipo_evaluacion === 'ingreso') grouped.ingreso.push(ex);
      else if (ex.tipo_evaluacion === 'periodico') grouped.periodico.push(ex);
      else if (ex.tipo_evaluacion === 'retiro') grouped.retiro.push(ex);
      else grouped.otros.push(ex);
    });

    return grouped;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const examGroups = profesiograma ? groupExamsByType(profesiograma.examenes || []) : null;

  const criterios =
    (profesiograma as any)?.criterios_exclusion ||
    (((profesiograma as any)?.criterios_exclusion_ids || []) as number[])
      .map((id) => criteriosById[id])
      .filter(Boolean);

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
        variant="outlined"
      >
        Volver
      </Button>

      {/* Header mejorado con información del trabajador */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mr: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '2rem'
                }}
              >
                <PersonIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {workerName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon fontSize="small" />
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {cargoName}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid sx={{ textAlign: { xs: 'left', md: 'right' } }} size={{ xs: 12, md: 4 }}>
            <Typography variant="overline" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
              Profesiograma Ocupacional
            </Typography>
            {profesiograma && (
              <Chip
                label={`Versión ${profesiograma.version}`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
                size="medium"
              />
            )}
          </Grid>
        </Grid>
      </Paper>

      {!profesiograma ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography color="error" variant="h5" gutterBottom>
            No hay un profesiograma configurado
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Este cargo aún no tiene un profesiograma asignado. Por favor, configure el profesiograma en el módulo de gestión de cargos.
          </Typography>
        </Paper>
      ) : (
          <Box sx={{ mt: 2 }}>
            {/* Sección de Riesgos mejorada */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <WarningIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Matriz de Riesgos y Peligros
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {(((profesiograma as any).profesiograma_factores || (profesiograma as any).factores) || []).map((pf: any, index: number) => {
                  const riskColorMap: Record<string, string> = {
                    'muy_alto': '#d32f2f',
                    'alto': '#f57c00',
                    'medio': '#fbc02d',
                    'bajo': '#388e3c'
                  };
                  const riskColor = riskColorMap[pf.nivel_exposicion] || '#757575';

                  return (
                    <Grid key={index} size={{ xs: 12, lg: 6 }}>
                      <Card
                        elevation={3}
                        sx={{
                          borderLeft: `5px solid ${riskColor}`,
                          height: '100%',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateY(-4px)' }
                        }}
                      >
                        <CardHeader
                          avatar={
                            <Avatar sx={{ bgcolor: riskColor }}>
                              <WarningIcon />
                            </Avatar>
                          }
                          title={
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {pf.factor_riesgo?.nombre || factoresById[pf.factor_riesgo_id]?.nombre || `Factor ${pf.factor_riesgo_id}`}
                            </Typography>
                          }
                          subheader={
                            <Chip
                              label={pf.factor_riesgo?.categoria || factoresById[pf.factor_riesgo_id]?.categoria || ''}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          }
                          action={
                            <Chip
                              label={`RIESGO ${pf.nivel_exposicion.toUpperCase().replace('_', ' ')}`}
                              sx={{
                                bgcolor: riskColor,
                                color: 'white',
                                fontWeight: 700
                              }}
                            />
                          }
                        />
                        <CardContent>
                          {/* Información básica */}
                          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Stack spacing={1}>
                              <Box display="flex" alignItems="center">
                                <TimerIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Exposición: {pf.tiempo_exposicion_horas} horas/día
                                </Typography>
                              </Box>
                              {(pf.proceso || pf.actividad || pf.tarea) && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {pf.proceso && `Proceso: ${pf.proceso}`}
                                    {pf.proceso && pf.actividad && ' • '}
                                    {pf.actividad && `Actividad: ${pf.actividad}`}
                                    {pf.tarea && ` • Tarea: ${pf.tarea}`}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>

                          {/* GTC 45 Table */}
                          {(pf.nd != null || pf.ne != null || pf.nc != null) && (
                            <Accordion defaultExpanded sx={{ mb: 2 }}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  📊 Evaluación GTC 45
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell><strong>ND</strong></TableCell>
                                        <TableCell><strong>NE</strong></TableCell>
                                        <TableCell><strong>NP</strong></TableCell>
                                        <TableCell><strong>NC</strong></TableCell>
                                        <TableCell><strong>NR</strong></TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>{pf.nd ?? '-'}</TableCell>
                                        <TableCell>{pf.ne ?? '-'}</TableCell>
                                        <TableCell>{pf.np ?? '-'}</TableCell>
                                        <TableCell>{pf.nc ?? '-'}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{pf.nr ?? '-'}</TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                                {(pf.nivel_intervencion || pf.aceptabilidad) && (
                                  <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                      <strong>Nivel de Intervención:</strong> {pf.nivel_intervencion || 'No definido'}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Aceptabilidad:</strong> {pf.aceptabilidad || 'No definido'}
                                    </Typography>
                                  </Alert>
                                )}
                              </AccordionDetails>
                            </Accordion>
                          )}

                          {/* Jerarquía de controles ESIAE */}
                          {(pf.eliminacion || pf.sustitucion || pf.controles_ingenieria || pf.controles_administrativos || pf.senalizacion || pf.epp_requerido) && (
                            <Accordion sx={{ mb: 2 }}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  🛡️ Jerarquía de Controles (ESIAE)
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Stack spacing={1.5}>
                                  {pf.eliminacion && (
                                    <Box>
                                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                                        E - ELIMINACIÓN
                                      </Typography>
                                      <Typography variant="body2">{pf.eliminacion}</Typography>
                                    </Box>
                                  )}
                                  {pf.sustitucion && (
                                    <Box>
                                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                                        S - SUSTITUCIÓN
                                      </Typography>
                                      <Typography variant="body2">{pf.sustitucion}</Typography>
                                    </Box>
                                  )}
                                  {pf.controles_ingenieria && (
                                    <Box>
                                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                                        I - INGENIERÍA
                                      </Typography>
                                      <Typography variant="body2">{pf.controles_ingenieria}</Typography>
                                    </Box>
                                  )}
                                  {pf.controles_administrativos && (
                                    <Box>
                                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                                        A - ADMINISTRATIVOS
                                      </Typography>
                                      <Typography variant="body2">{pf.controles_administrativos}</Typography>
                                    </Box>
                                  )}
                                  {pf.senalizacion && (
                                    <Box>
                                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                                        E - SEÑALIZACIÓN
                                      </Typography>
                                      <Typography variant="body2">{pf.senalizacion}</Typography>
                                    </Box>
                                  )}
                                  {pf.epp_requerido && (
                                    <Box sx={{ p: 1.5, bgcolor: '#fff3e0', borderRadius: 1 }}>
                                      <Box display="flex" alignItems="center">
                                        <SecurityIcon sx={{ mr: 1, color: 'warning.main' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                                          EPP REQUERIDO
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {pf.epp_requerido}
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                              </AccordionDetails>
                            </Accordion>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>

            {/* Sección de Exámenes Médicos Ocupacionales mejorada */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <MedicalIcon sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Exámenes Médicos Ocupacionales
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Resolución 1843 de 2025 (anteriormente Res. 2346/2007)
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Exámenes de Ingreso */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    elevation={3}
                    sx={{
                      height: '100%',
                      borderTop: '4px solid #2196f3',
                      bgcolor: '#f5faff'
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: '#2196f3' }}>
                          <AssignmentIcon />
                        </Avatar>
                      }
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Pre-Ingreso / Ingreso
                        </Typography>
                      }
                      subheader="Antes de iniciar labores"
                    />
                    <CardContent>
                      {examGroups?.ingreso && examGroups.ingreso.length > 0 ? (
                        <List dense>
                          {examGroups.ingreso.map((ex, idx) => (
                            <ListItem
                              key={idx}
                              sx={{
                                mb: 1,
                                bgcolor: 'white',
                                borderRadius: 1,
                                border: '1px solid #e0e0e0'
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {ex.tipo_examen?.nombre || tiposExamenById[(ex as any).tipo_examen_id]?.nombre || `Examen ${(ex as any).tipo_examen_id}`}
                                  </Typography>
                                }
                                secondary={
                                  <Chip
                                    label={ex.obligatorio ? 'Obligatorio' : 'Opcional'}
                                    size="small"
                                    color={ex.obligatorio ? 'primary' : 'default'}
                                    icon={ex.obligatorio ? <CheckIcon /> : <InfoIcon />}
                                    sx={{ mt: 0.5 }}
                                  />
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Alert severity="info">
                          No hay exámenes de ingreso configurados
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Exámenes Periódicos */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    elevation={3}
                    sx={{
                      height: '100%',
                      borderTop: '4px solid #ff9800',
                      bgcolor: '#fffde7'
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: '#ff9800' }}>
                          <TimerIcon />
                        </Avatar>
                      }
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Periódicos
                        </Typography>
                      }
                      subheader="Seguimiento continuo"
                    />
                    <CardContent>
                      {examGroups?.periodico && examGroups.periodico.length > 0 ? (
                        <List dense>
                          {examGroups.periodico.map((ex, idx) => (
                            <ListItem
                              key={idx}
                              sx={{
                                mb: 1,
                                bgcolor: 'white',
                                borderRadius: 1,
                                border: '1px solid #e0e0e0'
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {ex.tipo_examen?.nombre || tiposExamenById[(ex as any).tipo_examen_id]?.nombre || `Examen ${(ex as any).tipo_examen_id}`}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                      label={`Cada ${ex.periodicidad_meses} meses`}
                                      size="small"
                                      color="warning"
                                      icon={<TimerIcon />}
                                    />
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Alert severity="info">
                          No hay exámenes periódicos configurados
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Exámenes de Retiro */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    elevation={3}
                    sx={{
                      height: '100%',
                      borderTop: '4px solid #f44336',
                      bgcolor: '#fff5f5'
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: '#f44336' }}>
                          <HospitalIcon />
                        </Avatar>
                      }
                      title={
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Egreso / Retiro
                        </Typography>
                      }
                      subheader="Al finalizar contrato"
                    />
                    <CardContent>
                      {examGroups?.retiro && examGroups.retiro.length > 0 ? (
                        <List dense>
                          {examGroups.retiro.map((ex, idx) => (
                            <ListItem
                              key={idx}
                              sx={{
                                mb: 1,
                                bgcolor: 'white',
                                borderRadius: 1,
                                border: '1px solid #e0e0e0'
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {ex.tipo_examen?.nombre || tiposExamenById[(ex as any).tipo_examen_id]?.nombre || `Examen ${(ex as any).tipo_examen_id}`}
                                  </Typography>
                                }
                                secondary={
                                  <Chip
                                    label="Al finalizar contrato"
                                    size="small"
                                    color="error"
                                    sx={{ mt: 0.5 }}
                                  />
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Alert severity="info">
                          No hay exámenes de egreso configurados
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            {/* Sección de Inmunizaciones mejorada */}
            {profesiograma.inmunizaciones && profesiograma.inmunizaciones.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <VaccinesIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Vacunación / Inmunizaciones
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {profesiograma.inmunizaciones.map((inm, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Card
                        elevation={2}
                        sx={{
                          height: '100%',
                          borderLeft: '4px solid #1976d2',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateY(-2px)' }
                        }}
                      >
                        <CardHeader
                          avatar={
                            <Avatar sx={{ bgcolor: '#1976d2' }}>
                              <VaccinesIcon />
                            </Avatar>
                          }
                          title={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {inm.inmunizacion?.nombre || inm.inmunizacion_id}
                            </Typography>
                          }
                        />
                        {inm.inmunizacion?.descripcion && (
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              {inm.inmunizacion?.descripcion}
                            </Typography>
                            {(inm.inmunizacion as any)?.esquema && (
                              <Box sx={{ mt: 1, p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  Esquema: {(inm.inmunizacion as any).esquema}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* Criterios de Exclusión mejorados */}
            {criterios && criterios.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <BlockIcon sx={{ fontSize: 32, color: 'error.main', mr: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Contraindicaciones / Criterios de Exclusión
                  </Typography>
                </Box>

                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Estas son las condiciones médicas que pueden contraindicar el desempeño del cargo o requerir evaluación adicional.
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  {criterios.map((c: any, index: number) => (
                    <Grid key={index} size={{ xs: 12, md: 6 }}>
                      <Card
                        elevation={1}
                        sx={{
                          borderLeft: '4px solid #f44336',
                          bgcolor: '#fff5f5'
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'start' }}>
                            <CancelIcon sx={{ color: 'error.main', mr: 1, mt: 0.5 }} />
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {c.nombre}
                              </Typography>
                              {c.descripcion && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {c.descripcion}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* Información adicional del profesiograma */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <InfoIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Información Adicional del Cargo
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {profesiograma.posicion_predominante && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Posición Predominante
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {profesiograma.posicion_predominante}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {profesiograma.periodicidad_emo_meses && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Periodicidad EMO
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Cada {profesiograma.periodicidad_emo_meses} meses
                        </Typography>
                        {profesiograma.periodicidad_emo_meses > 12 && profesiograma.justificacion_periodicidad_emo && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                              <strong>Justificación:</strong> {profesiograma.justificacion_periodicidad_emo}
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {profesiograma.nivel_riesgo_cargo && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Nivel de Riesgo del Cargo
                        </Typography>
                        <Chip
                          label={profesiograma.nivel_riesgo_cargo.toUpperCase().replace('_', ' ')}
                          color={getRiskColor(profesiograma.nivel_riesgo_cargo) as any}
                          sx={{ fontWeight: 700 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {profesiograma.descripcion_actividades && (
                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Descripción de Actividades
                        </Typography>
                        <Typography variant="body2">
                          {profesiograma.descripcion_actividades}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Observaciones */}
            {profesiograma.observaciones && (
              <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f9fbe7', borderLeft: '4px solid #fdd835' }}>
                <Box sx={{ display: 'flex', alignItems: 'start' }}>
                  <InfoIcon sx={{ color: '#f57f17', mr: 2, mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Observaciones Generales
                    </Typography>
                    <Typography variant="body1">
                      {profesiograma.observaciones}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Footer informativo */}
            <Paper elevation={1} sx={{ p: 2, bgcolor: '#e8eaf6', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Profesiograma generado conforme a la Resolución 1843 de 2025 del Ministerio del Trabajo
                <br />
                Metodología GTC 45:2012 para identificación de peligros y valoración de riesgos
              </Typography>
            </Paper>
          </Box>
        )}
    </Box>
  );
};

export default WorkerProfesiograma;
