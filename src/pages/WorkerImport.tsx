/**
 * Página de Importación Masiva de Trabajadores desde plantilla Excel.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Cancel as ErrorIcon,
  ArrowBack as BackIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import workerImportService, { WorkerImportPreview, WorkerImportResult } from '../services/workerImportService';

const mensajesProgreso = [
  'Leyendo archivo Excel...',
  'Validando trabajadores...',
  'Verificando duplicados...',
  'Creando trabajadores...',
  'Finalizando importación...',
];

const WorkerImport: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<WorkerImportPreview | null>(null);
  const [result, setResult] = useState<WorkerImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    let messageTimer: NodeJS.Timeout;

    if (importing) {
      timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
      messageTimer = setInterval(
        () => setCurrentMessage((prev) => (prev + 1) % mensajesProgreso.length),
        3000,
      );
    } else {
      setElapsedTime(0);
      setCurrentMessage(0);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (messageTimer) clearInterval(messageTimer);
    };
  }, [importing]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await workerImportService.downloadTemplate();
      workerImportService.downloadBlob(blob, 'plantilla_trabajadores.xlsx');
    } catch (error) {
      enqueueSnackbar('Error al descargar la plantilla', { variant: 'error' });
    }
  };

  const handlePreview = async (selectedFile: File) => {
    try {
      setLoading(true);
      const data = await workerImportService.previewImport(selectedFile);
      setPreview(data);
    } catch (error) {
      enqueueSnackbar('Error al leer el archivo. Verifique el formato.', { variant: 'error' });
      setFile(null);
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selected = event.target.files[0];
      setFile(selected);
      setActiveStep(1);
      handlePreview(selected);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);
      setActiveStep(2);
      const data = await workerImportService.importWorkers(file);
      setResult(data);
      enqueueSnackbar(`Importación completada: ${data.creados} creados, ${data.fallidos} con error`, {
        variant: data.fallidos > 0 ? 'warning' : 'success',
      });
      setActiveStep(3);
    } catch (error) {
      enqueueSnackbar('Error al importar el archivo.', { variant: 'error' });
      setActiveStep(1);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setActiveStep(0);
  };

  const steps = ['Seleccionar Archivo', 'Validación y Previsualización', 'Procesando', 'Resultados'];

  return (
    <Box p={3}>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/workers')} sx={{ mb: 2 }}>
        Volver a Trabajadores
      </Button>

      <Typography variant="h4" gutterBottom>
        Importar Trabajadores desde Excel
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Paso 0: Selección de Archivo */}
        {activeStep === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{ mb: 3 }}
            >
              Descargar Plantilla
            </Button>

            <input
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
              id="worker-import-file"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="worker-import-file">
              <Button variant="contained" component="span" startIcon={<UploadIcon />} size="large">
                Seleccionar Archivo Excel
              </Button>
            </label>
            <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
              Formatos soportados: .xlsx, .xls
            </Typography>

            <Alert severity="info" sx={{ mt: 4, maxWidth: 600 }}>
              <Typography variant="subtitle2" gutterBottom>Instrucciones:</Typography>
              <ul>
                <li>Descargue la plantilla para ver las columnas y los valores válidos (hoja "Instrucciones").</li>
                <li>La primera fila del archivo debe ser el encabezado.</li>
                <li>Los trabajadores importados quedan como "Empleado" — el rol se asigna después manualmente si hace falta.</li>
                <li>No se envían correos de invitación automáticamente; puede hacerlo después por trabajador.</li>
              </ul>
            </Alert>
          </Box>
        )}

        {/* Paso 1: Preview */}
        {activeStep === 1 && (
          <Box>
            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Analizando archivo...</Typography>
              </Box>
            ) : preview ? (
              <>
                <Box display="flex" alignItems="center" sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <FileIcon sx={{ mr: 2 }} />
                  <Typography variant="h6">{file?.name}</Typography>
                  <Button color="error" size="small" onClick={handleReset} sx={{ ml: 'auto' }}>
                    Cancelar
                  </Button>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Total Filas Detectadas</Typography>
                        <Typography variant="h4">{preview.total_filas}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Filas Válidas</Typography>
                        <Typography variant="h4" color="success.main">{preview.filas_validas}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Filas con Error</Typography>
                        <Typography variant="h4" color="error.main">{preview.filas_con_error}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {preview.errores_validacion.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2">Se encontraron problemas en algunas filas:</Typography>
                    <List dense>
                      {preview.errores_validacion.slice(0, 5).map((err, i) => (
                        <ListItem key={i}>
                          <ListItemText primary={`Fila ${err.fila}: ${err.error}`} />
                        </ListItem>
                      ))}
                      {preview.errores_validacion.length > 5 && (
                        <ListItem>
                          <ListItemText primary={`... y ${preview.errores_validacion.length - 5} errores más.`} />
                        </ListItem>
                      )}
                    </List>
                    <Typography variant="caption">Estas filas serán ignoradas durante la importación.</Typography>
                  </Alert>
                )}

                {preview.duplicados_en_archivo.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2">Documentos/emails repetidos dentro del mismo archivo:</Typography>
                    <List dense>
                      {preview.duplicados_en_archivo.slice(0, 5).map((err, i) => (
                        <ListItem key={i}>
                          <ListItemText primary={`Fila ${err.fila}: ${err.error}`} />
                        </ListItem>
                      ))}
                      {preview.duplicados_en_archivo.length > 5 && (
                        <ListItem>
                          <ListItemText primary={`... y ${preview.duplicados_en_archivo.length - 5} más.`} />
                        </ListItem>
                      )}
                    </List>
                  </Alert>
                )}

                <Accordion sx={{ mb: 3 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Diagnóstico de Columnas Detectadas</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Esta información ayuda a verificar que las columnas del Excel se están reconociendo correctamente.
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Columna en Excel</TableCell>
                            <TableCell>Mapeo Interno</TableCell>
                            <TableCell>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {preview.columnas_detectadas.map((col, idx) => {
                            const mapeado = preview.columnas_mapeadas?.[col];
                            return (
                              <TableRow key={idx}>
                                <TableCell>{col}</TableCell>
                                <TableCell>{mapeado || '-'}</TableCell>
                                <TableCell>
                                  {mapeado ? (
                                    <Chip label="OK" color="success" size="small" />
                                  ) : (
                                    <Chip label="Sin mapear" color="default" size="small" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                <Box display="flex" justifyContent="flex-start" sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleImport}
                    startIcon={<UploadIcon />}
                    disabled={preview.filas_validas === 0}
                  >
                    Confirmar Importación
                  </Button>
                </Box>
              </>
            ) : null}
          </Box>
        )}

        {/* Paso 2: Procesando importación */}
        {activeStep === 2 && importing && (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <CircularProgress size={100} thickness={2} />
              <Box
                sx={{
                  top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Typography variant="h6" component="div" color="primary">
                  {formatTime(elapsedTime)}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h5" gutterBottom color="primary">
              Importando Trabajadores
            </Typography>

            <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
              {mensajesProgreso[currentMessage]}
            </Typography>

            <Alert severity="info" sx={{ mt: 3, maxWidth: 500 }}>
              <Typography variant="body2">
                Este proceso puede tardar un momento dependiendo del tamaño del archivo.
                Por favor, no cierre esta ventana.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Paso 3: Resultados */}
        {activeStep === 3 && result && (
          <Box>
            <Box display="flex" flexDirection="column" alignItems="center" py={2} sx={{ mb: 3 }}>
              <SuccessIcon color={result.fallidos === 0 ? 'success' : 'warning'} sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>Importación Finalizada</Typography>
              <Box display="flex" gap={2} sx={{ mt: 1 }}>
                <Chip label={`${result.creados} creados`} color="success" />
                <Chip label={`${result.fallidos} con error`} color={result.fallidos > 0 ? 'error' : 'default'} />
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fila</TableCell>
                    <TableCell>Documento</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell>Mensaje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.resultados.map((r) => (
                    <TableRow key={r.fila} sx={{ bgcolor: r.success ? undefined : 'error.50' }}>
                      <TableCell>{r.fila}</TableCell>
                      <TableCell>{r.document_number || '-'}</TableCell>
                      <TableCell>{r.full_name || '-'}</TableCell>
                      <TableCell align="center">
                        {r.success ? (
                          <SuccessIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>{r.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="center" gap={2} sx={{ mt: 4 }}>
              <Button variant="outlined" onClick={handleReset}>
                Importar Otro Archivo
              </Button>
              <Button variant="contained" onClick={() => navigate('/admin/workers')}>
                Volver a Trabajadores
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WorkerImport;
