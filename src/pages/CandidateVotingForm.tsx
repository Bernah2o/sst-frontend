import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
  Avatar,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import candidateVotingService from '../services/candidateVotingService';
import {
  CandidateVotingCreate,
  CandidateVotingUpdate,
  CandidateVotingResponse,
  WorkerForVotingResponse,
  CandidateVotingStatus,
} from '../types';

const validationSchema = Yup.object({
  title: Yup.string().required('El título es requerido'),
  committee_type: Yup.string().required('El tipo de comité es requerido'),
  start_date: Yup.date().required('La fecha de inicio es requerida'),
  end_date: Yup.date()
    .required('La fecha de fin es requerida')
    .min(Yup.ref('start_date'), 'La fecha de fin debe ser posterior a la fecha de inicio'),
  max_votes_per_user: Yup.number()
    .min(1, 'Debe permitir al menos 1 voto por usuario')
    .required('El número máximo de votos por usuario es requerido'),
  winner_count: Yup.number()
    .min(1, 'Debe haber al menos 1 ganador')
    .required('El número de ganadores es requerido'),
  candidate_worker_ids: Yup.array()
    .min(1, 'Debe seleccionar al menos un candidato')
    .required('Los candidatos son requeridos'),
});

const CandidateVotingForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [workers, setWorkers] = useState<WorkerForVotingResponse[]>([]);
  const [committeeTypes, setCommitteeTypes] = useState<Array<{ id: number; name: string; description?: string }>>([]);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      committee_type: '',
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
      max_votes_per_user: 1,
      winner_count: 1,
      is_anonymous: true,
      status: CandidateVotingStatus.DRAFT,
      candidate_worker_ids: [] as number[],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        if (isEdit && id) {
          const updateData: CandidateVotingUpdate = {
            title: values.title,
            description: values.description || undefined,
            committee_type: values.committee_type,
            start_date: values.start_date.toISOString(),
            end_date: values.end_date.toISOString(),
            max_votes_per_user: values.max_votes_per_user,
            winner_count: values.winner_count,
            is_anonymous: values.is_anonymous,
            status: values.status,
          };
          await candidateVotingService.updateVoting(parseInt(id), updateData);
        } else {
          const createData: CandidateVotingCreate = {
            title: values.title,
            description: values.description || undefined,
            committee_type: values.committee_type,
            start_date: values.start_date.toISOString(),
            end_date: values.end_date.toISOString(),
            max_votes_per_user: values.max_votes_per_user,
            winner_count: values.winner_count,
            is_anonymous: values.is_anonymous,
            status: values.status,
            candidate_worker_ids: values.candidate_worker_ids,
          };
          await candidateVotingService.createVoting(createData);
        }

        navigate('/candidate-voting/admin');
      } catch (error) {
        console.error('Error saving voting:', error);
        setError('Error al guardar la votación');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [workersData, committeeTypesData] = await Promise.all([
        candidateVotingService.getActiveWorkers(),
        candidateVotingService.getCommitteeTypes(),
      ]);

      setWorkers(workersData);
      setCommitteeTypes(committeeTypesData);

      if (isEdit && id) {
        const votingData = await candidateVotingService.getVotingDetail(parseInt(id));
        formik.setValues({
          title: votingData.title,
          description: votingData.description || '',
          committee_type: typeof votingData.committee_type === 'object' && votingData.committee_type 
            ? votingData.committee_type.name 
            : votingData.committee_type || '',
          start_date: new Date(votingData.start_date),
          end_date: new Date(votingData.end_date),
          max_votes_per_user: votingData.max_votes_per_user,
          winner_count: votingData.winner_count,
          is_anonymous: votingData.is_anonymous,
          status: votingData.status,
          candidate_worker_ids: votingData.candidates.map(c => c.worker_id),
        });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error al cargar los datos iniciales');
    } finally {
      setInitialLoading(false);
    }
  };

  const selectedWorkers = workers.filter(worker => 
    formik.values.candidate_worker_ids.includes(worker.id)
  );

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? 'Editar Votación' : 'Nueva Votación de Candidatos'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Título"
                    name="title"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    error={formik.touched.title && Boolean(formik.errors.title)}
                    helperText={formik.touched.title && formik.errors.title}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={formik.touched.committee_type && Boolean(formik.errors.committee_type)}>
                    <InputLabel>Tipo de Comité</InputLabel>
                    <Select
                      name="committee_type"
                      value={formik.values.committee_type}
                      onChange={formik.handleChange}
                      label="Tipo de Comité"
                      required
                    >
                      {committeeTypes.map((type) => (
                        <MenuItem key={type.id} value={type.name}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                {/* Fechas */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Fechas de Votación
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DateTimePicker
                    label="Fecha de Inicio"
                    value={formik.values.start_date}
                    onChange={(value) => formik.setFieldValue('start_date', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.start_date && Boolean(formik.errors.start_date),
                        helperText: formik.touched.start_date && formik.errors.start_date ? String(formik.errors.start_date) : '',
                        required: true,
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DateTimePicker
                    label="Fecha de Fin"
                    value={formik.values.end_date}
                    onChange={(value) => formik.setFieldValue('end_date', value)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.end_date && Boolean(formik.errors.end_date),
                        helperText: formik.touched.end_date && formik.errors.end_date ? String(formik.errors.end_date) : '',
                        required: true,
                      },
                    }}
                  />
                </Grid>

                {/* Configuración de votación */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Configuración de Votación
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Votos por Usuario"
                    name="max_votes_per_user"
                    type="number"
                    value={formik.values.max_votes_per_user}
                    onChange={formik.handleChange}
                    error={formik.touched.max_votes_per_user && Boolean(formik.errors.max_votes_per_user)}
                    helperText={formik.touched.max_votes_per_user && formik.errors.max_votes_per_user}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Número de Ganadores"
                    name="winner_count"
                    type="number"
                    value={formik.values.winner_count}
                    onChange={formik.handleChange}
                    error={formik.touched.winner_count && Boolean(formik.errors.winner_count)}
                    helperText={formik.touched.winner_count && formik.errors.winner_count}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.is_anonymous}
                        onChange={(e) => formik.setFieldValue('is_anonymous', e.target.checked)}
                        name="is_anonymous"
                      />
                    }
                    label="Votación Anónima"
                  />
                </Grid>

                {/* Selección de candidatos */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Selección de Candidatos
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    multiple
                    options={workers}
                    getOptionLabel={(option) => `${option.first_name} ${option.last_name} - ${option.document_number}`}
                    value={selectedWorkers}
                    onChange={(_, newValue) => {
                      formik.setFieldValue('candidate_worker_ids', newValue.map(worker => worker.id));
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          avatar={<Avatar>{option.first_name[0]}{option.last_name[0]}</Avatar>}
                          label={`${option.first_name} ${option.last_name}`}
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Candidatos"
                        placeholder="Seleccione los candidatos"
                        error={formik.touched.candidate_worker_ids && Boolean(formik.errors.candidate_worker_ids)}
                        helperText={formik.touched.candidate_worker_ids && formik.errors.candidate_worker_ids}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Avatar sx={{ mr: 2 }}>
                          {option.first_name[0]}{option.last_name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {option.first_name} {option.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.document_number} - {option.position} - {option.department}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>

                {/* Botones */}
                <Grid size={{ xs: 12 }}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/candidate-voting/admin')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : (isEdit ? 'Actualizar' : 'Crear')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default CandidateVotingForm;