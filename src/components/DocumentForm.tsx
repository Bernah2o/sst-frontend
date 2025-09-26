import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  IconButton,
  Paper,
  FormControlLabel,
  Switch,
  FormHelperText,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  CommitteeDocument,
  CommitteeDocumentCreate,
  CommitteeDocumentUpdate,
  CommitteeDocumentType,
  CommitteeResponse,
} from '../types';
import { logger } from '../utils/logger';

interface DocumentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CommitteeDocumentCreate | CommitteeDocumentUpdate, file?: File) => Promise<void>;
  document?: CommitteeDocument;
  committees: CommitteeResponse[];
  loading?: boolean;
  error?: string;
  defaultCommitteeId?: number;
}

const validationSchema = Yup.object({
  title: Yup.string()
    .required('El título es requerido')
    .max(300, 'El título no puede exceder 300 caracteres'),
  description: Yup.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  document_type: Yup.string()
    .required('El tipo de documento es requerido'),
  committee_id: Yup.mixed()
    .required('El comité es requerido')
    .test('is-valid-committee', 'Debe seleccionar un comité válido', function(value) {
      return value !== '' && value !== 0 && Number(value) > 0;
    }),
  version: Yup.string()
    .max(20, 'La versión no puede exceder 20 caracteres'),
  tags: Yup.string()
    .max(500, 'Las etiquetas no pueden exceder 500 caracteres'),
  expiry_date: Yup.date()
    .nullable()
    .min(new Date(), 'La fecha de expiración debe ser futura'),
});

const DocumentForm: React.FC<DocumentFormProps> = ({
  open,
  onClose,
  onSubmit,
  document,
  committees,
  loading = false,
  error,
  defaultCommitteeId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');

  const isEditing = !!document;

  const formik = useFormik({
    initialValues: {
      title: document?.title || '',
      description: document?.description || '',
      document_type: document?.document_type || CommitteeDocumentType.MEETING_MINUTES,
      committee_id: document?.committee_id || defaultCommitteeId || '',
      version: document?.version || '1.0',
      is_public: document?.is_public || false,
      tags: document?.tags || '',
      expiry_date: document?.expiry_date ? new Date(document.expiry_date).toISOString().split('T')[0] : '',
      notes: document?.notes || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setFileError('');
        
        logger.debug('🔍 DocumentForm - Valores del formulario:', values);
        logger.debug('🔍 DocumentForm - defaultCommitteeId recibido:', defaultCommitteeId);
        logger.debug('🔍 DocumentForm - committee_id en values:', values.committee_id);
        logger.debug('🔍 DocumentForm - committee_id convertido:', Number(values.committee_id));
        
        if (!isEditing && !selectedFile) {
          setFileError('Debe seleccionar un archivo');
          return;
        }

        const documentData = {
          ...values,
          committee_id: Number(values.committee_id),
          expiry_date: values.expiry_date || undefined,
        };

        logger.debug('🔍 DocumentForm - documentData final:', documentData);

        await onSubmit(documentData, selectedFile || undefined);
        handleClose();
      } catch (error) {
        logger.error('Error submitting document:', error);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setSelectedFile(null);
    setFileError('');
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setFileError('El archivo no puede exceder 50MB');
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
      ];

      if (!allowedTypes.includes(file.type)) {
        setFileError('Tipo de archivo no permitido');
        return;
      }

      setSelectedFile(file);
      setFileError('');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: CommitteeDocumentType): string => {
    const labels = {
      [CommitteeDocumentType.MEETING_MINUTES]: 'Actas de Reunión',
      [CommitteeDocumentType.VOTING_RECORD]: 'Registros de Votación',
      [CommitteeDocumentType.ACTIVITY_REPORT]: 'Informes de Actividad',
      [CommitteeDocumentType.PRESENTATION]: 'Presentaciones',
      [CommitteeDocumentType.AGREEMENT]: 'Acuerdos',
      [CommitteeDocumentType.VOTING_RESULTS]: 'Resultados de Votación',
      [CommitteeDocumentType.REPORTS]: 'Informes',
      [CommitteeDocumentType.POLICIES]: 'Políticas',
      [CommitteeDocumentType.OTHER]: 'Otros',
    };
    return labels[type] || type;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <DocumentIcon sx={{ mr: 1 }} />
            {isEditing ? 'Editar Documento' : 'Nuevo Documento'}
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Título */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Título"
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                required
              />
            </Grid>

            {/* Descripción */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>

            {/* Tipo de documento y Comité */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  name="document_type"
                  value={formik.values.document_type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.document_type && Boolean(formik.errors.document_type)}
                  label="Tipo de Documento"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflow: 'auto',
                      },
                    },
                  }}
                >
                  {Object.values(CommitteeDocumentType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {getDocumentTypeLabel(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required error={formik.touched.committee_id && Boolean(formik.errors.committee_id)}>
                <InputLabel>Comité</InputLabel>
                <Select
                  name="committee_id"
                  value={formik.values.committee_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Comité"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflow: 'auto',
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    Seleccionar comité
                  </MenuItem>
                  {committees.map((committee) => (
                    <MenuItem key={committee.id} value={committee.id}>
                      {committee.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.committee_id && formik.errors.committee_id && (
                  <FormHelperText>{formik.errors.committee_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Versión y Fecha de expiración */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Versión"
                name="version"
                value={formik.values.version}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.version && Boolean(formik.errors.version)}
                helperText={formik.touched.version && formik.errors.version}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Expiración"
                name="expiry_date"
                value={formik.values.expiry_date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.expiry_date && Boolean(formik.errors.expiry_date)}
                helperText={formik.touched.expiry_date && formik.errors.expiry_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Etiquetas */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Etiquetas"
                name="tags"
                value={formik.values.tags}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.tags && Boolean(formik.errors.tags)}
                helperText={(formik.touched.tags && formik.errors.tags) || 'Separe las etiquetas con comas'}
                placeholder="etiqueta1, etiqueta2, etiqueta3"
              />
            </Grid>

            {/* Notas */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notas"
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>

            {/* Visibilidad */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_public"
                    checked={formik.values.is_public}
                    onChange={formik.handleChange}
                  />
                }
                label="Documento público"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Los documentos públicos pueden ser vistos por todos los miembros del comité
              </Typography>
            </Grid>

            {/* Carga de archivo */}
            <Grid size={{ xs: 12 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: fileError ? 'error.main' : 'grey.300',
                  backgroundColor: fileError ? 'error.light' : 'grey.50',
                }}
              >
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    sx={{ mb: 1 }}
                  >
                    {isEditing ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                  </Button>
                </label>

                {selectedFile && (
                  <Box mt={2}>
                    <Chip
                      label={`${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
                      onDelete={() => setSelectedFile(null)}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                )}

                {document?.file_path && !selectedFile && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Archivo actual: {document.title}
                    </Typography>
                  </Box>
                )}

                {fileError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {fileError}
                  </Alert>
                )}

                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF
                  <br />
                  Tamaño máximo: 50MB
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DocumentForm;