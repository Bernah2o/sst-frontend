import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { committeeService } from '../services/committeeService';
import { committeePermissionService } from '../services/committeePermissionService';
import {
  Committee,
  CommitteeCreate,
  CommitteeUpdate,
  CommitteeType,
} from '../types';

const CommitteeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [committeeTypes, setCommitteeTypes] = useState<{ id: number; name: string; committee_type: CommitteeType }[]>([]);

  const loadCommitteeTypes = useCallback(async () => {
    try {
      const types = await committeeService.getCommitteeTypesFromBackend();
      setCommitteeTypes(types);
    } catch (err) {
      console.error('Error loading committee types:', err);
    }
  }, []);

  const checkCreatePermission = useCallback(async () => {
    try {
      // For creating committees, any authenticated user should be able to create
      // The backend will handle any specific restrictions if needed
      setHasPermission(true);
    } catch (err) {
      setHasPermission(false);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const loadCommittee = useCallback(async (committeeId: number) => {
    try {
      setInitialLoading(true);
      setError(null);

      // Check permissions
      const canEdit = await committeePermissionService.canEdit(committeeId);
      if (!canEdit) {
        setError('No tienes permisos para editar este comité');
        setHasPermission(false);
        return;
      }

      setHasPermission(true);

      // Load committee data
      const committeeData = await committeeService.getCommittee(committeeId);
      setCommittee(committeeData);

      // Note: Form values will be set via useEffect when committee data changes
    } catch (err) {
      setError('Error al cargar los datos del comité');
      console.error('Committee loading error:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load committee types first
    loadCommitteeTypes();
    
    if (isEditing && id) {
      const committeeId = parseInt(id);
      if (isNaN(committeeId) || committeeId <= 0) {
        setError('El identificador del comité no es válido. Por favor, verifica la URL e intenta nuevamente.');
        setInitialLoading(false);
        return;
      }
      loadCommittee(committeeId);
    } else {
      // Check if user can create committees (has edit permission on any committee)
      checkCreatePermission();
    }
  }, [id, isEditing, loadCommitteeTypes, loadCommittee, checkCreatePermission]);

  // Create dynamic validation schema based on loaded committee types
  const validationSchema = React.useMemo(() => {
    const validCommitteeTypes = committeeTypes.map(type => type.committee_type);
    
    return Yup.object({
      name: Yup.string()
        .required('El nombre es requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
      committee_type: Yup.string()
        .required('El tipo de comité es requerido')
        .oneOf(validCommitteeTypes.length > 0 ? validCommitteeTypes : Object.values(CommitteeType), 'Tipo de comité inválido'),
      description: Yup.string()
        .required('La descripción es requerida')
        .min(10, 'La descripción debe tener al menos 10 caracteres')
        .max(500, 'La descripción no puede exceder 500 caracteres'),
      establishment_date: Yup.string()
        .required('La fecha de establecimiento es requerida'),
      meeting_frequency_days: Yup.number()
        .required('La frecuencia de reuniones es requerida')
        .min(1, 'La frecuencia debe ser al menos 1 día')
        .max(365, 'La frecuencia no puede exceder 365 días')
        .integer('La frecuencia debe ser un número entero'),
      quorum_percentage: Yup.number()
        .required('El porcentaje de quórum es requerido')
        .min(1, 'El quórum debe ser al menos 1%')
        .max(100, 'El quórum no puede exceder 100%'),
      is_active: Yup.boolean(),
    });
  }, [committeeTypes]);

  const formik = useFormik({
    initialValues: {
      name: '',
      committee_type: '' as CommitteeType,
      description: '',
      establishment_date: '',
      meeting_frequency_days: 30,
      quorum_percentage: 50,
      is_active: true,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        // Find the committee_type_id based on the selected committee_type
        const selectedCommitteeType = committeeTypes.find(
          type => type.committee_type === values.committee_type
        );

        if (!selectedCommitteeType) {
          setError('Tipo de comité no válido');
          setLoading(false);
          return;
        }

        if (isEditing && committee) {
          // Update existing committee
          const updateData: CommitteeUpdate = {
            name: values.name,
            committee_type: values.committee_type,
            committee_type_id: selectedCommitteeType.id,
            description: values.description,
            establishment_date: values.establishment_date,
            meeting_frequency_days: values.meeting_frequency_days,
            quorum_percentage: values.quorum_percentage,
            is_active: values.is_active,
          };
          await committeeService.updateCommittee(committee.id, updateData);
        } else {
          // Create new committee
          const createData: CommitteeCreate = {
            name: values.name,
            committee_type: values.committee_type,
            committee_type_id: selectedCommitteeType.id,
            description: values.description,
            establishment_date: values.establishment_date,
            meeting_frequency_days: values.meeting_frequency_days,
            quorum_percentage: values.quorum_percentage,
            is_active: values.is_active,
          };
          await committeeService.createCommittee(createData);
        }

        navigate('/admin/committees');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al guardar el comité');
        console.error('Committee save error:', err);
      } finally {
        setLoading(false);
      }
    },
  });

  // Set form values when committee data is loaded
  useEffect(() => {
    if (committee && isEditing) {
      formik.setValues({
        name: committee.name,
        committee_type: committee.committee_type,
        description: committee.description || '',
        establishment_date: committee.establishment_date || '',
        meeting_frequency_days: committee.meeting_frequency_days || 30,
        quorum_percentage: committee.quorum_percentage || 50,
        is_active: committee.is_active,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committee, isEditing]);

  const getCommitteeTypeLabel = (type: CommitteeType): string => {
    switch (type) {
      case CommitteeType.CONVIVENCIA:
        return 'Comité de Convivencia';
      case CommitteeType.COPASST:
        return 'COPASST (Comité Paritario de Seguridad y Salud en el Trabajo)';
      default:
        return type;
    }
  };

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!hasPermission) {
    return (
      <Box p={3}>
        <Alert severity="error">
          No tienes permisos para {isEditing ? 'editar este comité' : 'crear comités'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/committees')}
          sx={{ mt: 2 }}
        >
          Volver a Comités
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/admin/committees')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Editar Comité' : 'Crear Nuevo Comité'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Committee Name */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Nombre del Comité"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  required
                />
              </Grid>

              {/* Committee Type */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl 
                  fullWidth 
                  error={formik.touched.committee_type && Boolean(formik.errors.committee_type)}
                  required
                >
                  <InputLabel id="committee-type-label">Tipo de Comité</InputLabel>
                  <Select
                    labelId="committee-type-label"
                    id="committee_type"
                    name="committee_type"
                    value={formik.values.committee_type}
                    label="Tipo de Comité"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {committeeTypes.map((type) => (
                      <MenuItem key={type.id} value={type.committee_type}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.committee_type && formik.errors.committee_type && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                      {formik.errors.committee_type}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Establishment Date */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  id="establishment_date"
                  name="establishment_date"
                  label="Fecha de Establecimiento"
                  type="date"
                  value={formik.values.establishment_date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.establishment_date && Boolean(formik.errors.establishment_date)}
                  helperText={formik.touched.establishment_date && formik.errors.establishment_date}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>

              {/* Meeting Frequency */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  id="meeting_frequency_days"
                  name="meeting_frequency_days"
                  label="Frecuencia de Reuniones (días)"
                  type="number"
                  value={formik.values.meeting_frequency_days}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.meeting_frequency_days && Boolean(formik.errors.meeting_frequency_days)}
                  helperText={
                    formik.touched.meeting_frequency_days && formik.errors.meeting_frequency_days
                      ? formik.errors.meeting_frequency_days
                      : 'Número de días entre reuniones (ej: 30 para reuniones mensuales)'
                  }
                  inputProps={{
                    min: 1,
                    max: 365,
                  }}
                  required
                />
              </Grid>

              {/* Quorum Percentage */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  id="quorum_percentage"
                  name="quorum_percentage"
                  label="Porcentaje de Quórum (%)"
                  type="number"
                  value={formik.values.quorum_percentage}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.quorum_percentage && Boolean(formik.errors.quorum_percentage)}
                  helperText={
                    formik.touched.quorum_percentage && formik.errors.quorum_percentage
                      ? formik.errors.quorum_percentage
                      : 'Porcentaje mínimo de miembros requerido para sesionar'
                  }
                  inputProps={{
                    min: 1,
                    max: 100,
                    step: 0.1,
                  }}
                  required
                />
              </Grid>

              {/* Active Status */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      id="is_active"
                      name="is_active"
                      checked={formik.values.is_active}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Comité Activo"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Los comités inactivos no aparecerán en las listas principales
                </Typography>
              </Grid>

              {/* Description */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  id="description"
                  name="description"
                  label="Descripción"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={
                    formik.touched.description && formik.errors.description
                      ? formik.errors.description
                      : 'Describe el propósito y objetivos del comité'
                  }
                  required
                />
              </Grid>

              {/* Committee Type Information */}
              {formik.values.committee_type && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>{getCommitteeTypeLabel(formik.values.committee_type)}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {formik.values.committee_type === CommitteeType.CONVIVENCIA && (
                        'El Comité de Convivencia se encarga de promover la convivencia laboral y prevenir el acoso laboral en la organización.'
                      )}
                      {formik.values.committee_type === CommitteeType.COPASST && (
                        'El COPASST es un organismo de promoción y vigilancia de las normas y reglamentos de seguridad y salud en el trabajo.'
                      )}
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid size={{ xs: 12 }}>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/committees')}
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
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      isEditing ? 'Actualizar Comité' : 'Crear Comité'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información Importante
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Una vez creado el comité, podrás agregar miembros y configurar permisos específicos.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Los miembros del comité tendrán acceso a las funcionalidades según sus roles asignados.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Puedes cambiar el estado del comité entre activo e inactivo en cualquier momento.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • La descripción será visible para todos los miembros del comité.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CommitteeForm;