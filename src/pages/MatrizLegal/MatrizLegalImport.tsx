/**
 * Página de Importación de Matriz Legal.
 * Permite cargar archivos Excel para actualizar la matriz legal.
 */

import React, { useState } from "react";
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
  Checkbox,
  FormControlLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  ArrowBack as BackIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import matrizLegalService, { MatrizLegalImportacionPreview } from "../../services/matrizLegalService";

// Mensajes de progreso para mostrar durante la importación
const mensajesProgreso = [
  "Leyendo archivo Excel...",
  "Validando estructura de datos...",
  "Procesando normas legales...",
  "Verificando duplicados...",
  "Guardando en base de datos...",
  "Detectando aplicabilidad automática...",
  "Finalizando importación...",
];

const MatrizLegalImport: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MatrizLegalImportacionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [sobrescribir, setSobrescribir] = useState(false);

  // Estados para el progreso de importación
  const [importing, setImporting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  // Efecto para contar el tiempo transcurrido durante la importación
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    let messageTimer: NodeJS.Timeout;

    if (importing) {
      // Contador de tiempo
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // Rotación de mensajes cada 3 segundos
      messageTimer = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % mensajesProgreso.length);
      }, 3000);
    } else {
      setElapsedTime(0);
      setCurrentMessage(0);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (messageTimer) clearInterval(messageTimer);
    };
  }, [importing]);

  // Formatear tiempo transcurrido
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setActiveStep(1);
      // Auto-fetch preview
      handlePreview(event.target.files[0]);
    }
  };

  const handlePreview = async (selectedFile: File) => {
    try {
      setLoading(true);
      const data = await matrizLegalService.previewImport(selectedFile);
      setPreview(data);
    } catch (error) {
      console.error("Error generating preview:", error);
      enqueueSnackbar("Error al leer el archivo. Verifique el formato.", { variant: "error" });
      setFile(null);
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);
      setActiveStep(2); // Paso de procesamiento
      const result = await matrizLegalService.importExcel(file, sobrescribir);

      enqueueSnackbar(`Importación completada: ${result.normas_nuevas} nuevas, ${result.normas_actualizadas} actualizadas`, { variant: "success" });
      setActiveStep(4); // Final step (Resultados)
    } catch (error) {
      console.error("Error importing:", error);
      enqueueSnackbar("Error al importar el archivo.", { variant: "error" });
      setActiveStep(1); // Volver a previsualización
    } finally {
      setImporting(false);
    }
  };

  const steps = ["Seleccionar Archivo", "Validación y Previsualización", "Procesando", "Resultados"];

  return (
    <Box p={3}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate("/admin/matriz-legal")}
        sx={{ mb: 2 }}
      >
        Volver al Dashboard
      </Button>

      <Typography variant="h4" gutterBottom>
        Importar Matriz Legal
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
             <input
                accept=".xlsx, .xls"
                style={{ display: "none" }}
                id="raised-button-file"
                type="file"
                onChange={handleFileSelect}
            />
            <label htmlFor="raised-button-file">
                <Button variant="contained" component="span" startIcon={<UploadIcon />} size="large">
                    Seleccionar Archivo Excel
                </Button>
            </label>
            <Typography variant="caption" sx={{ mt: 2, color: "text.secondary" }}>
              Formatos soportados: .xlsx, .xls
            </Typography>
            
            <Alert severity="info" sx={{ mt: 4, maxWidth: 600 }}>
              <Typography variant="subtitle2" gutterBottom>Instrucciones:</Typography>
              <ul>
                <li>El archivo debe contener las columnas requeridas (Norma, Año, Descripción, etc.).</li>
                <li>La primera fila se considera como encabezado.</li>
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
                    <Button color="error" size="small" onClick={() => { setFile(null); setPreview(null); setActiveStep(0); }} sx={{ ml: "auto" }}>
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
                                <Typography color="textSecondary">Normas Nuevas</Typography>
                                <Typography variant="h4" color="success.main">{preview.normas_nuevas_preview}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                     <Grid size={{ xs: 12, md: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary">Normas Existentes</Typography>
                                <Typography variant="h4" color="warning.main">{preview.normas_existentes_preview}</Typography>
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

                 {/* Información de diagnóstico de columnas */}
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
                                                <TableCell>{mapeado || "-"}</TableCell>
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
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: "block" }}>
                            Columnas requeridas: clasificacion_norma, tema_general, anio, tipo_numero_raw (o tipo_norma + numero_norma)
                        </Typography>
                    </AccordionDetails>
                 </Accordion>
                
                 <Box display="flex" flexDirection="column" gap={2} alignItems="flex-start" sx={{ mt: 2 }}>
                     <FormControlLabel
                        control={
                            <Checkbox 
                                checked={sobrescribir} 
                                onChange={(e) => setSobrescribir(e.target.checked)} 
                            />
                        }
                        label="Sobrescribir información de normas existentes (Actualizar datos)"
                     />

                     <Button 
                        variant="contained" 
                        color="primary" 
                        size="large" 
                        onClick={handleImport}
                        startIcon={<UploadIcon />}
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
            <Box sx={{ position: "relative", display: "inline-flex", mb: 3 }}>
              <CircularProgress size={100} thickness={2} />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="h6" component="div" color="primary">
                  {formatTime(elapsedTime)}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h5" gutterBottom color="primary">
              Importando Matriz Legal
            </Typography>

            <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
              {mensajesProgreso[currentMessage]}
            </Typography>

            {preview && (
              <Card sx={{ mt: 2, minWidth: 300 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Procesando archivo
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {file?.name}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">Total de filas:</Typography>
                    <Typography variant="body2" fontWeight="bold">{preview.total_filas.toLocaleString()}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">Normas nuevas:</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">{preview.normas_nuevas_preview.toLocaleString()}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Normas existentes:</Typography>
                    <Typography variant="body2" color="warning.main" fontWeight="bold">{preview.normas_existentes_preview.toLocaleString()}</Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Alert severity="info" sx={{ mt: 3, maxWidth: 500 }}>
              <Typography variant="body2">
                Este proceso puede tardar varios minutos dependiendo del tamaño del archivo.
                Por favor, no cierre esta ventana.
              </Typography>
            </Alert>
          </Box>
        )}

         {/* Paso 4: Resultados */}
         {activeStep === 4 && (
             <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                 <SuccessIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                 <Typography variant="h5" gutterBottom>¡Importación Exitosa!</Typography>
                 <Typography color="textSecondary" paragraph>
                     La matriz legal se ha actualizado correctamente.
                 </Typography>
                 <Button variant="outlined" onClick={() => navigate("/admin/matriz-legal")}>
                     Volver al Dashboard
                 </Button>
             </Box>
         )}

      </Paper>
    </Box>
  );
};


export default MatrizLegalImport;
