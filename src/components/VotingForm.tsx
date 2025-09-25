import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  VotingCreate,
  VotingUpdate,
  Voting,
  Meeting,
  VotingStatus,
} from '../types';

interface VotingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VotingCreate | VotingUpdate) => Promise<void>;
  voting?: Voting;
  meetings: Meeting[];
  loading?: boolean;
  error?: string | null;
}

const validationSchema = Yup.object({
  meeting_id: Yup.number()
    .required('La reunión es obligatoria')
    .min(1, 'Debe seleccionar una reunión válida'),
  title: Yup.string()
    .required('El título es obligatorio')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: Yup.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  voting_type: Yup.string()
    .required('El tipo de votación es obligatorio')
    .oneOf(['simple', 'qualified', 'secret'], 'Tipo de votación inválido'),
  start_time: Yup.date()
    .required('La fecha de inicio es obligatoria')
    .min(new Date(), 'La fecha de inicio debe ser futura'),
  end_time: Yup.date()
    .required('La fecha de fin es obligatoria')
    .min(Yup.ref('start_time'), 'La fecha de fin debe ser posterior a la de inicio'),
  quorum_percentage: Yup.number()
    .when('requires_quorum', {
      is: true,
      then: (schema) => schema
        .required('El porcentaje de quórum es obligatorio')
        .min(1, 'El quórum debe ser al menos 1%')
        .max(100, 'El quórum no puede exceder 100%'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

const VotingForm: React.FC<VotingFormProps> = ({
  open,
  onClose,
  onSubmit,
  voting,
  meetings,
  loading = false,
  error = null,
}) => {
  const [submitLoading, setSubmitLoading] = useState(false);
  const isEditing = !!voting;

  const formik = useFormik({
    initialValues: {
      meeting_id: voting?.meeting_id || 0,
      title: voting?.title || '',
      description: voting?.description || '',
      voting_type: voting?.voting_type || 'simple',
      start_time: voting?.start_time ? new Date(voting.start_time) : new Date(),
      end_time: voting?.end_time ? new Date(voting.end_time) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: voting?.status || VotingStatus.DRAFT,
      is_anonymous: voting?.is_anonymous || false,
      requires_quorum: voting?.requires_quorum || false,
      quorum_percentage: voting?.quorum_percentage || 50,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSubmitLoading(true);
      try {
        const submitData = {
          ...values,
          start_time: values.start_time.toISOString(),
          end_time: values.end_time.toISOString(),
        };
        await onSubmit(submitData);
        formik.resetForm();
        onClose();
      } catch (err) {
        console.error('Voting form submission error:', err);
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const getVotingTypeLabel = (type: string): string => {
    switch (type) {
      case 'simple':
        return 'Mayoría Simple';
      case 'qualified':
        return 'Mayoría Calificada';
      case 'secret':
        return 'Votación Secreta';
      default:
        return type;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Votación' : 'Nueva Votación'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth error={formik.touched.meeting_id && !!formik.errors.meeting_id}>
                  <InputLabel>Reunión *</InputLabel>
                  <Select
                    name="meeting_id"
                    value={formik.values.meeting_id || ''}
                    label="Reunión *"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    <MenuItem value="">Seleccionar reunión</MenuItem>
                    {meetings.map((meeting) => (
                      <MenuItem key={meeting.id} value={meeting.id}>
                        {meeting.title} - {new Date(meeting.meeting_date).toLocaleDateString()}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.meeting_id && formik.errors.meeting_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {formik.errors.meeting_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  name="title"
                  label="Título *"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.title && !!formik.errors.title}
                  helperText={formik.touched.title && formik.errors.title}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="description"
                  label="Descripción"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && !!formik.errors.description}
                  helperText={formik.touched.description && formik.errors.description}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={formik.touched.voting_type && !!formik.errors.voting_type}>
                  <InputLabel>Tipo de Votación *</InputLabel>
                  <Select
                    name="voting_type"
                    value={formik.values.voting_type}
                    label="Tipo de Votación *"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    <MenuItem value="simple">{getVotingTypeLabel('simple')}</MenuItem>
                    <MenuItem value="qualified">{getVotingTypeLabel('qualified')}</MenuItem>
                    <MenuItem value="secret">{getVotingTypeLabel('secret')}</MenuItem>
                  </Select>
                  {formik.touched.voting_type && formik.errors.voting_type && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {formik.errors.voting_type}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label="Fecha de Inicio *"
                  value={formik.values.start_time}
                  onChange={(value) => formik.setFieldValue('start_time', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.start_time && !!formik.errors.start_time,
                      helperText: formik.touched.start_time && formik.errors.start_time ? String(formik.errors.start_time) : '',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label="Fecha de Fin *"
                  value={formik.values.end_time}
                  onChange={(value) => formik.setFieldValue('end_time', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.end_time && !!formik.errors.end_time,
                      helperText: formik.touched.end_time && formik.errors.end_time ? String(formik.errors.end_time) : '',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="is_anonymous"
                      checked={formik.values.is_anonymous}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Votación Anónima"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="requires_quorum"
                      checked={formik.values.requires_quorum}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Requiere Quórum"
                />
              </Grid>

              {formik.values.requires_quorum && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    name="quorum_percentage"
                    label="Porcentaje de Quórum (%)"
                    value={formik.values.quorum_percentage}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.quorum_percentage && !!formik.errors.quorum_percentage}
                    helperText={formik.touched.quorum_percentage && formik.errors.quorum_percentage}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={submitLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitLoading || loading}
              startIcon={submitLoading ? <CircularProgress size={20} /> : null}
            >
              {submitLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default VotingForm;