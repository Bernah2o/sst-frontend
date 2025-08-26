import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { format, differenceInDays } from 'date-fns';

import { absenteeismService } from '../../services/absenteeismService';
import { workerService } from '../../services/workerService';
import {
  AbsenteeismCreate,
  AbsenteeismUpdate,
  AbsenteeismResponse,
  EventTypeEnum,
  MonthEnum,
  EVENT_TYPE_OPTIONS,
  MONTH_OPTIONS
} from '../../types/absenteeism';
import { Worker, WorkerList } from '../../types/worker';
import { usePermissions } from '../../hooks/usePermissions';

interface AbsenteeismFormProps {
  mode: 'create' | 'edit';
}

const validationSchema = Yup.object({
  event_month: Yup.string().required('El mes del evento es requerido'),
  worker_id: Yup.number().required('El trabajador es requerido'),
  event_type: Yup.string().required('El tipo de evento es requerido'),
  start_date: Yup.date().required('La fecha inicial es requerida'),
  end_date: Yup.date()
    .required('La fecha final es requerida')
    .min(Yup.ref('start_date'), 'La fecha final debe ser posterior a la fecha inicial'),
  disability_days: Yup.number()
    .min(0, 'Los días de incapacidad no pueden ser negativos')
    .required('Los días de incapacidad son requeridos'),
  extension: Yup.number().min(0, 'La prórroga no puede ser negativa').default(0),
  charged_days: Yup.number().min(0, 'Los días cargados no pueden ser negativos').default(0),
  diagnostic_code: Yup.string(),
  health_condition_description: Yup.string(),
  observations: Yup.string(),
  insured_costs_at: Yup.number().min(0, 'Los costos no pueden ser negativos').default(0),
  insured_costs_ac_eg: Yup.number().min(0, 'Los costos no pueden ser negativos').default(0),
  assumed_costs_at: Yup.number().min(0, 'Los costos no pueden ser negativos').default(0),
  assumed_costs_ac_eg: Yup.number().min(0, 'Los costos no pueden ser negativos').default(0)
});

const AbsenteeismForm: React.FC<AbsenteeismFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { canUpdateWorkers } = usePermissions();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workers, setWorkers] = useState<WorkerList[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerList | null>(null);
  const [absenteeism, setAbsenteeism] = useState<AbsenteeismResponse | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const isEditMode = mode === 'edit';
  const canSubmit = canUpdateWorkers();

  const formik = useFormik<AbsenteeismCreate | AbsenteeismUpdate>({
    initialValues: {
      event_month: MonthEnum.ENERO,
      worker_id: 0,
      event_type: EventTypeEnum.ACCIDENTE_TRABAJO,
      start_date: '',
      end_date: '',
      disability_days: 0,
      extension: 0,
      charged_days: 0,
      diagnostic_code: '',
      health_condition_description: '',
      observations: '',
      insured_costs_at: 0,
      insured_costs_ac_eg: 0,
      assumed_costs_at: 0,
      assumed_costs_ac_eg: 0
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        if (isEditMode && id) {
          await absenteeismService.updateAbsenteeism(parseInt(id), values as AbsenteeismUpdate);
        } else {
          await absenteeismService.createAbsenteeism(values as AbsenteeismCreate);
        }
        
        navigate('/admin/absenteeism');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al guardar el registro');
      } finally {
        setLoading(false);
      }
    }
  });

  // Cargar trabajadores
  const loadWorkers = async (search?: string) => {
    try {
      setLoadingWorkers(true);
      const response = await workerService.getWorkers(1, 100, { search });
      setWorkers(response.items);
    } catch (err) {
      console.error('Error loading workers:', err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  // Cargar datos del absenteeism en modo edición
  const loadAbsenteeism = async () => {
    if (!isEditMode || !id) return;
    
    try {
      setLoading(true);
      const data = await absenteeismService.getAbsenteeism(parseInt(id));
      setAbsenteeism(data);
      
      // Encontrar el trabajador seleccionado
      if (data.worker) {
        const worker = workers.find(w => w.id === data.worker!.id);
        if (worker) {
          setSelectedWorker(worker);
        }
      }
      
      // Llenar el formulario
      formik.setValues({
        event_month: data.event_month,
        worker_id: data.worker?.id || 0,
        event_type: data.event_type,
        start_date: format(new Date(data.start_date), 'yyyy-MM-dd'),
        end_date: format(new Date(data.end_date), 'yyyy-MM-dd'),
        disability_days: data.disability_days,
        extension: data.extension,
        charged_days: data.charged_days,
        diagnostic_code: data.diagnostic_code || '',
        health_condition_description: data.health_condition_description || '',
        observations: data.observations || '',
        insured_costs_at: data.insured_costs_at,
        insured_costs_ac_eg: data.insured_costs_ac_eg,
        assumed_costs_at: data.assumed_costs_at,
        assumed_costs_ac_eg: data.assumed_costs_ac_eg
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar el registro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    if (workers.length > 0) {
      loadAbsenteeism();
    }
  }, [workers, id, isEditMode]);

  // Calcular días automáticamente cuando cambian las fechas
  useEffect(() => {
    if (formik.values.start_date && formik.values.end_date) {
      const startDate = new Date(formik.values.start_date);
      const endDate = new Date(formik.values.end_date);
      const days = differenceInDays(endDate, startDate) + 1;
      
      if (days > 0 && days !== formik.values.disability_days) {
        formik.setFieldValue('disability_days', days);
      }
    }
  }, [formik.values.start_date, formik.values.end_date]);

  const handleWorkerChange = (worker: WorkerList | null) => {
    setSelectedWorker(worker);
    if (worker) {
      formik.setFieldValue('worker_id', worker.id);
    } else {
      formik.setFieldValue('worker_id', 0);
    }
  };

  if (!canSubmit) {
    return (
      <Alert severity="error">
        No tienes permisos para {isEditMode ? 'editar' : 'crear'} registros de absenteeism.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Editar' : 'Crear'} Registro de Absenteeism
        </Typography>
        <Button
          startIcon={<CancelIcon />}
          onClick={() => navigate('/admin/absenteeism')}
        >
          Cancelar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Información básica */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Información Básica
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={formik.touched.event_month && Boolean(formik.errors.event_month)}>
                  <InputLabel>Mes del Evento</InputLabel>
                  <Select
                    name="event_month"
                    value={formik.values.event_month}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {MONTH_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={formik.touched.event_type && Boolean(formik.errors.event_type)}>
                  <InputLabel>Tipo de Evento</InputLabel>
                  <Select
                    name="event_type"
                    value={formik.values.event_type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {EVENT_TYPE_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={workers}
                  getOptionLabel={(option) => `${option.first_name} ${option.last_name} - ${option.cedula}`}
                  value={selectedWorker}
                  onChange={(_, newValue) => handleWorkerChange(newValue)}
                  loading={loadingWorkers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Trabajador"
                      error={formik.touched.worker_id && Boolean(formik.errors.worker_id)}
                      helperText={formik.touched.worker_id && formik.errors.worker_id}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingWorkers ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {selectedWorker && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Cédula"
                      value={selectedWorker.cedula}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Cargo"
                      value={selectedWorker.position || 'No especificado'}
                      disabled
                    />
                  </Grid>
                </>
              )}

              {/* Período de incapacidad */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Período de Incapacidad
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha Inicial"
                  type="date"
                  name="start_date"
                  value={formik.values.start_date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.start_date && Boolean(formik.errors.start_date)}
                  helperText={formik.touched.start_date && formik.errors.start_date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha Final"
                  type="date"
                  name="end_date"
                  value={formik.values.end_date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.end_date && Boolean(formik.errors.end_date)}
                  helperText={formik.touched.end_date && formik.errors.end_date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Días de Incapacidad"
                  type="number"
                  name="disability_days"
                  value={formik.values.disability_days}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.disability_days && Boolean(formik.errors.disability_days)}
                  helperText={formik.touched.disability_days && formik.errors.disability_days}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Prórroga"
                  type="number"
                  name="extension"
                  value={formik.values.extension}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.extension && Boolean(formik.errors.extension)}
                  helperText={formik.touched.extension && formik.errors.extension}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Días Cargados"
                  type="number"
                  name="charged_days"
                  value={formik.values.charged_days}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.charged_days && Boolean(formik.errors.charged_days)}
                  helperText={formik.touched.charged_days && formik.errors.charged_days}
                />
              </Grid>

              {/* Información médica */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Información Médica
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Código Diagnóstico"
                  name="diagnostic_code"
                  value={formik.values.diagnostic_code}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.diagnostic_code && Boolean(formik.errors.diagnostic_code)}
                  helperText={formik.touched.diagnostic_code && formik.errors.diagnostic_code}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Descripción de la Condición de Salud"
                  name="health_condition_description"
                  value={formik.values.health_condition_description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.health_condition_description && Boolean(formik.errors.health_condition_description)}
                  helperText={formik.touched.health_condition_description && formik.errors.health_condition_description}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  name="observations"
                  value={formik.values.observations}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  multiline
                  rows={3}
                  error={formik.touched.observations && Boolean(formik.errors.observations)}
                  helperText={formik.touched.observations && formik.errors.observations}
                />
              </Grid>

              {/* Costos */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Costos
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Costos Asegurados A.T."
                  type="number"
                  name="insured_costs_at"
                  value={formik.values.insured_costs_at}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.insured_costs_at && Boolean(formik.errors.insured_costs_at)}
                  helperText={formik.touched.insured_costs_at && formik.errors.insured_costs_at}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Costos Asegurados A.C. - E.G."
                  type="number"
                  name="insured_costs_ac_eg"
                  value={formik.values.insured_costs_ac_eg}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.insured_costs_ac_eg && Boolean(formik.errors.insured_costs_ac_eg)}
                  helperText={formik.touched.insured_costs_ac_eg && formik.errors.insured_costs_ac_eg}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Costos Asumidos A.T."
                  type="number"
                  name="assumed_costs_at"
                  value={formik.values.assumed_costs_at}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.assumed_costs_at && Boolean(formik.errors.assumed_costs_at)}
                  helperText={formik.touched.assumed_costs_at && formik.errors.assumed_costs_at}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Costos Asumidos A.C. - E.G."
                  type="number"
                  name="assumed_costs_ac_eg"
                  value={formik.values.assumed_costs_ac_eg}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.assumed_costs_ac_eg && Boolean(formik.errors.assumed_costs_ac_eg)}
                  helperText={formik.touched.assumed_costs_ac_eg && formik.errors.assumed_costs_ac_eg}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>

              {/* Información del salario (solo lectura) */}
              {selectedWorker && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Información Salarial
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Salario Base"
                      value={`$${selectedWorker.base_salary?.toLocaleString() || '0'}`}
                      disabled
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Salario Base Día"
                      value={`$${((selectedWorker.base_salary || 0) / 30).toLocaleString()}`}
                      disabled
                    />
                  </Grid>
                </>
              )}

              {/* Botones */}
              <Grid size={{ xs: 12 }}>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Button
                    onClick={() => navigate('/admin/absenteeism')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading || !formik.isValid}
                  >
                    {loading ? <CircularProgress size={20} /> : (isEditMode ? 'Actualizar' : 'Crear')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AbsenteeismForm;