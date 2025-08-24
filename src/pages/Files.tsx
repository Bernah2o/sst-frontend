import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateUtils';
import api from '../services/api';

interface FileItem {
  id: string;
  filename: string;
  size: number;
  course_id?: string;
  course_name?: string;
  material_type?: string;
  description?: string;
  created_at: string;
}

interface Course {
  id: string;
  name: string;
}

const Files: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingFile, setDeletingFile] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
    fetchCourses();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/files/');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los archivos',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;

    try {
      setUploadProgress(0);
      const formData = new FormData();
      
      Array.from(selectedFiles).forEach((file) => {
        formData.append('files', file);
      });
      
      if (selectedCourseForUpload) {
        formData.append('course_id', selectedCourseForUpload);
      }
      if (materialType) {
        formData.append('material_type', materialType);
      }
      if (description) {
        formData.append('description', description);
      }

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        },
      });

      setSnackbar({
        open: true,
        message: 'Archivos subidos exitosamente',
        severity: 'success',
      });
      
      setUploadDialogOpen(false);
      setSelectedFiles(null);
      setSelectedCourseForUpload('');
      setMaterialType('');
      setDescription('');
      setUploadProgress(0);
      fetchFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      setSnackbar({
        open: true,
        message: 'Error al subir los archivos',
        severity: 'error',
      });
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setSnackbar({
        open: true,
        message: 'Error al descargar el archivo',
        severity: 'error',
      });
    }
  };

  const handleDelete = (file: FileItem) => {
    setDeletingFile(file);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteFile = async () => {
    if (deletingFile) {
      try {
        await api.delete(`/files/${deletingFile.id}`);
        setSnackbar({
          open: true,
          message: 'Archivo eliminado exitosamente',
          severity: 'success',
        });
        fetchFiles();
        setOpenDeleteDialog(false);
        setDeletingFile(null);
      } catch (error) {
        console.error('Error deleting file:', error);
        setSnackbar({
          open: true,
          message: 'Error al eliminar el archivo',
          severity: 'error',
        });
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.filename
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === '' || file.course_id === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Archivos
      </Typography>

      {/* Filtros y búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Buscar archivos"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por curso</InputLabel>
                <Select
                  value={selectedCourse}
                  label="Filtrar por curso"
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <MenuItem value="">Todos los cursos</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Subir Archivos
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchFiles}
                >
                  Actualizar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de archivos */}
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre del archivo</TableCell>
                      <TableCell>Curso</TableCell>
                      <TableCell>Tamaño</TableCell>
                      <TableCell>Fecha de subida</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>{file.filename}</TableCell>
                        <TableCell>{file.course_name || 'Sin curso'}</TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>
                          {formatDateTime(file.created_at)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleDownload(file.id, file.filename)}
                            color="primary"
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(file)}
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
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Dialog para subir archivos */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Subir Archivos</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{
                  height: 100,
                  borderStyle: 'dashed',
                  '&:hover': {
                    borderStyle: 'dashed',
                  },
                }}
              >
                Seleccionar archivos
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
              </Button>
            </Grid>
            
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Curso (Opcional)</InputLabel>
                <Select
                  value={selectedCourseForUpload}
                  label="Curso (Opcional)"
                  onChange={(e) => setSelectedCourseForUpload(e.target.value)}
                >
                  <MenuItem value="">Sin curso específico</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Material</InputLabel>
                <Select
                  value={materialType}
                  label="Tipo de Material"
                  onChange={(e) => setMaterialType(e.target.value)}
                >
                  <MenuItem value="">Seleccionar tipo</MenuItem>
                  <MenuItem value="presentation">Presentación</MenuItem>
                  <MenuItem value="document">Documento</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="exercise">Ejercicio</MenuItem>
                  <MenuItem value="other">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={12}>
              <TextField
                fullWidth
                label="Descripción (Opcional)"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
            
            {uploadProgress > 0 && (
              <Grid size={12}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" color="text.secondary" align="center">
                  {uploadProgress}%
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFiles || uploadProgress > 0}
          >
            Subir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete File Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            ¿Está seguro de que desea eliminar el archivo "{deletingFile?.filename}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDeleteFile} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Files;