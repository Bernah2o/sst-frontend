import React from 'react';
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
  Box,
  Grid,
  CircularProgress,
  Alert,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Activity, ActivityCreate, ActivityUpdate, ActivityPriority, ActivityStatus, CommitteeMember } from '../types';

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityCreate | ActivityUpdate) => Promise<void>;
  activity?: Activity;
  members: CommitteeMember[];
  loading?: boolean;
  error?: string | null;
}

const validationSchema = Yup.object({
  title: Yup.string()
    .required('El título es requerido')
    .max(300, 'El título no puede exceder 300 caracteres'),
  description: Yup.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  priority: Yup.string()
    .oneOf(['low', 'medium', 'high', 'critical'], 'Prioridad inválida')
    .required('La prioridad es requerida'),
  status: Yup.string()
    .oneOf(['pending', 'in_progress', 'completed', 'cancelled', 'overdue'], 'Estado inválido')
    .required('El estado es requerido'),
  assigned_to: Yup.number()
    .nullable(),
  due_date: Yup.date()
    .nullable()
    .min(new Date(), 'La fecha de vencimiento debe ser futura'),
  progress_percentage: Yup.number()
    .min(0, 'El progreso no puede ser menor a 0%')
    .max(100, 'El progreso no puede ser mayor a 100%')
    .required('El porcentaje de progreso es requerido'),
});

const ActivityForm: React.FC<ActivityFormProps> = ({
  open,
  onClose,
  onSubmit,
  activity,
  members,
  loading = false,
  error = null,
}) => {
  const isEditing = !!activity;

  const formik = useFormik({
    initialValues: {
      title: activity?.title || '',
      description: activity?.description || '',
      priority: activity?.priority || ActivityPriority.MEDIUM,
      status: activity?.status || ActivityStatus.PENDING,
      assigned_to: activity?.assigned_to || null,
      due_date: activity?.due_date ? new Date(activity.due_date) : null,
      progress_percentage: activity?.progress_percentage || 0,
      notes: activity?.notes || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const submitData = {
          ...values,
          due_date: values.due_date ? values.due_date.toISOString().split('T')[0] : undefined,
          assigned_to: values.assigned_to || undefined,
        };
        await onSubmit(submitData);
        onClose();
      } catch (err) {
        // Error is handled by parent component
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const getPriorityLabel = (priority: ActivityPriority): string => {
    switch (priority) {
      case ActivityPriority.LOW:
        return 'Baja';
      case ActivityPriority.MEDIUM:
        return 'Media';
      case ActivityPriority.HIGH:
        return 'Alta';
      case ActivityPriority.CRITICAL:
        return 'Crítica';
      default:
        return priority;
    }
  };

  const getStatusLabel = (status: ActivityStatus): string => {
    switch (status) {
      case ActivityStatus.PENDING:
        return 'Pendiente';
      case ActivityStatus.IN_PROGRESS:
        return 'En Progreso';
      case ActivityStatus.COMPLETED:
        return 'Completada';
      case ActivityStatus.CANCELLED:
        return 'Cancelada';
      case ActivityStatus.OVERDUE:
        return 'Vencida';
      default:
        return status;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Actividad' : 'Nueva Actividad'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                   <TextField
                     fullWidth
                     label="Título *"
                     name="title"
                     value={formik.values.title}
                     onChange={formik.handleChange}
                     onBlur={formik.handleBlur}
                     error={formik.touched.title && Boolean(formik.errors.title)}
                     helperText={formik.touched.title && formik.errors.title}
                   />
                 </Grid>

                 <Grid size={{ xs: 12 }}>
                   <TextField
                     fullWidth
                     label="Descripción"
                     name="description"
                     value={formik.values.description}
                     onChange={formik.handleChange}
                     onBlur={formik.handleBlur}
                     error={formik.touched.description && Boolean(formik.errors.description)}
                     helperText={formik.touched.description && formik.errors.description}
                     multiline
                     rows={3}
                   />
                 </Grid>

                 <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={formik.touched.priority && Boolean(formik.errors.priority)}>
                    <InputLabel>Prioridad *</InputLabel>
                    <Select
                      name="priority"
                      value={formik.values.priority}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      label="Prioridad *"
                    >
                      <MenuItem value={ActivityPriority.LOW}>{getPriorityLabel(ActivityPriority.LOW)}</MenuItem>
                      <MenuItem value={ActivityPriority.MEDIUM}>{getPriorityLabel(ActivityPriority.MEDIUM)}</MenuItem>
                      <MenuItem value={ActivityPriority.HIGH}>{getPriorityLabel(ActivityPriority.HIGH)}</MenuItem>
                      <MenuItem value={ActivityPriority.CRITICAL}>{getPriorityLabel(ActivityPriority.CRITICAL)}</MenuItem>
                    </Select>
                    {formik.touched.priority && formik.errors.priority && (
                      <FormHelperText>{formik.errors.priority}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                 <Grid size={{ xs: 12, md: 6 }}>
                   <FormControl fullWidth error={formik.touched.status && Boolean(formik.errors.status)}>
                     <InputLabel>Estado *</InputLabel>
                     <Select
                       name="status"
                       value={formik.values.status}
                       onChange={formik.handleChange}
                       onBlur={formik.handleBlur}
                       label="Estado *"
                     >
                       <MenuItem value={ActivityStatus.PENDING}>{getStatusLabel(ActivityStatus.PENDING)}</MenuItem>
                       <MenuItem value={ActivityStatus.IN_PROGRESS}>{getStatusLabel(ActivityStatus.IN_PROGRESS)}</MenuItem>
                       <MenuItem value={ActivityStatus.COMPLETED}>{getStatusLabel(ActivityStatus.COMPLETED)}</MenuItem>
                       <MenuItem value={ActivityStatus.CANCELLED}>{getStatusLabel(ActivityStatus.CANCELLED)}</MenuItem>
                     </Select>
                     {formik.touched.status && formik.errors.status && (
                       <FormHelperText>{formik.errors.status}</FormHelperText>
                     )}
                   </FormControl>
                 </Grid>

                 <Grid size={{ xs: 12, md: 6 }}>
                   <FormControl fullWidth>
                     <InputLabel>Asignado a</InputLabel>
                     <Select
                       name="assigned_to"
                       value={formik.values.assigned_to || ''}
                       onChange={formik.handleChange}
                       onBlur={formik.handleBlur}
                       label="Asignado a"
                     >
                       <MenuItem value="">Sin asignar</MenuItem>
                       {members.filter(m => m.is_active).map((member) => (
                         <MenuItem key={member.id} value={member.user?.id}>
                           {member.user ? `${member.user.first_name} ${member.user.last_name}` : 'Usuario no disponible'}
                         </MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Grid>

                 <Grid size={{ xs: 12, md: 6 }}>
                   <DatePicker
                     label="Fecha de vencimiento"
                     value={formik.values.due_date}
                     onChange={(date) => formik.setFieldValue('due_date', date)}
                     slotProps={{
                       textField: {
                         fullWidth: true,
                         error: formik.touched.due_date && Boolean(formik.errors.due_date),
                         helperText: formik.touched.due_date && formik.errors.due_date,
                       },
                     }}
                   />
                 </Grid>

                 <Grid size={{ xs: 12, md: 6 }}>
                   <TextField
                     fullWidth
                     label="Progreso (%)"
                     name="progress_percentage"
                     type="number"
                     value={formik.values.progress_percentage}
                     onChange={formik.handleChange}
                     onBlur={formik.handleBlur}
                     error={formik.touched.progress_percentage && Boolean(formik.errors.progress_percentage)}
                     helperText={formik.touched.progress_percentage && formik.errors.progress_percentage}
                     inputProps={{ min: 0, max: 100 }}
                   />
                 </Grid>

                 <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Notas"
                    name="notes"
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !formik.isValid}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ActivityForm;