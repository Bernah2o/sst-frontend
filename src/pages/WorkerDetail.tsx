import {
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Description as DocumentIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  EventNote as NovedadesIcon,
  BeachAccess as VacationsIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import WorkerNovedades from "./WorkerNovedades";
import WorkerVacations from "./WorkerVacations";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirmDialog } from "../hooks/useConfirmDialog";

interface WorkerInfo {
  id: number;
  full_name: string;
  document_number: string;
  email: string;
  position: string;
  department: string;
  is_active: boolean;
  user_id: number | null;
}

interface Course {
  enrollment_id: number;
  course_id: number;
  course_title: string;
  enrollment_date: string | null;
  completion_date: string | null;
  status: string;
  progress_percentage: number;
}

interface Survey {
  user_survey_id: number;
  survey_id: number;
  survey_title: string;
  completed_at: string | null;
  status: string;
}

interface Evaluation {
  user_evaluation_id: number;
  evaluation_id: number;
  evaluation_title: string;
  score: number | null;
  max_points: number | null;
  passed: boolean | null;
  completed_at: string | null;
  status: string;
}

interface WorkerDocument {
  id: number;
  title: string;
  description?: string;
  category: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: number;
  uploader_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkerDetailData {
  worker: WorkerInfo;
  courses: Course[];
  surveys: Survey[];
  evaluations: Evaluation[];
  documents: WorkerDocument[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WorkerDetail: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workerData, setWorkerData] = useState<WorkerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [reassignType, setReassignType] = useState<
    "course" | "survey" | "evaluation"
  >("course");
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reassigning, setReassigning] = useState(false);
  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [documentCategory, setDocumentCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Hook para el diálogo de confirmación
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (workerId) {
      fetchWorkerData();
    }
  }, [workerId]);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/workers/${workerId}/detailed-info`);
      setWorkerData(response.data);

      // Fetch documents separately
      if (workerId) {
        await fetchDocuments();
      }
    } catch (error: any) {
      console.error("Error fetching worker data:", error);
      setError(
        error.response?.data?.detail ||
          "No se pudieron cargar los datos del trabajador. Verifique su conexión e intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/workers/${workerId}/documents`);
      setDocuments(response.data);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      // Don't set error state for documents, just log it
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenReassignDialog = async (
    type: "course" | "survey" | "evaluation"
  ) => {
    setReassignType(type);
    setSelectedItem(null);

    try {
      let endpoint = "";
      switch (type) {
        case "course":
          endpoint = "/courses";
          break;
        case "survey":
          endpoint = "/surveys";
          break;
        case "evaluation":
          endpoint = "/evaluations";
          break;
      }

      const response = await api.get(endpoint);
      // Los endpoints devuelven PaginatedResponse con campo 'items'
      setAvailableItems(response.data.items || []);
      setOpenReassignDialog(true);
    } catch (error) {
      console.error("Error fetching available items:", error);
      setAvailableItems([]); // Fallback a array vacío en caso de error
    }
  };

  const handleReassign = async () => {
    if (!selectedItem || !workerId) return;

    try {
      setReassigning(true);
      let endpoint = "";
      let itemId = "";

      switch (reassignType) {
        case "course":
          endpoint = `/workers/${workerId}/reassign-course`;
          itemId = selectedItem.id;
          break;
        case "survey":
          endpoint = `/workers/${workerId}/reassign-survey`;
          itemId = selectedItem.id;
          break;
        case "evaluation":
          endpoint = `/workers/${workerId}/reassign-evaluation`;
          itemId = selectedItem.id;
          break;
      }

      await api.post(endpoint, null, {
        params: {
          [`${reassignType}_id`]: itemId,
        },
      });

      setOpenReassignDialog(false);
      fetchWorkerData(); // Refresh data
    } catch (error: any) {
      console.error("Error reassigning:", error);
      setError(error.response?.data?.detail || "Error al reasignar");
    } finally {
      setReassigning(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !documentTitle || !documentCategory || !workerId)
      return;

    try {
      setUploadingDocument(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", documentTitle);
      formData.append("category", documentCategory);
      if (documentDescription) {
        formData.append("description", documentDescription);
      }

      await api.post(`/workers/${workerId}/documents`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setOpenUploadDialog(false);
      setDocumentTitle("");
      setDocumentDescription("");
      setDocumentCategory("");
      setSelectedFile(null);
      await fetchDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      setError(error.response?.data?.detail || "Error al subir el documento");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (doc: WorkerDocument) => {
    try {
      const response = await api.get(
        `/workers/${workerId}/documents/${doc.id}/download`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading document:", error);
      setError(
        error.response?.data?.detail || "Error al descargar el documento"
      );
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    const confirmed = await showConfirmDialog({
      title: "Eliminar documento",
      message: "¿Está seguro de que desea eliminar este documento? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      severity: "error"
    });

    if (!confirmed) return;

    try {
      await api.delete(`/workers/${workerId}/documents/${documentId}`);
      await fetchDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      setError(
        error.response?.data?.detail || "Error al eliminar el documento"
      );
    }
  };

  const handlePreviewDocument = (doc: WorkerDocument) => {
    window.open(doc.file_url, "_blank");
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (
    status: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    if (!status) return "default";
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "enrolled":
        return "primary";
      case "in_progress":
        return "warning";
      case "unknown":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No completado";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  if (!workerData) {
    return (
      <Box p={3}>
        <Alert severity="warning">No se encontraron datos del trabajador</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Detalle del Trabajador
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchWorkerData}
          variant="outlined"
        >
          Actualizar
        </Button>
      </Box>

      {/* Worker Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Información Personal
              </Typography>
              <Typography>
                <strong>Nombre:</strong> {workerData.worker.full_name}
              </Typography>
              <Typography>
                <strong>Documento:</strong> {workerData.worker.document_number}
              </Typography>
              <Typography>
                <strong>Email:</strong> {workerData.worker.email}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Información Laboral
              </Typography>
              <Typography>
                <strong>Cargo:</strong> {workerData.worker.position}
              </Typography>
              <Typography>
                <strong>Departamento:</strong> {workerData.worker.department}
              </Typography>
              <Box mt={1}>
                <Chip
                  label={workerData.worker.is_active ? "Activo" : "Inactivo"}
                  color={workerData.worker.is_active ? "success" : "error"}
                  size="small"
                />
                {!workerData.worker.user_id && (
                  <Chip
                    label="Sin usuario vinculado"
                    color="warning"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              label={`Cursos (${workerData.courses.length})`}
              icon={<SchoolIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Encuestas (${workerData.surveys.length})`}
              icon={<QuizIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Evaluaciones (${workerData.evaluations.length})`}
              icon={<AssignmentIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Documentos (${documents.length})`}
              icon={<DocumentIcon />}
              iconPosition="start"
            />
            <Tab
              label="Novedades"
              icon={<NovedadesIcon />}
              iconPosition="start"
            />
            <Tab
              label="Vacaciones"
              icon={<VacationsIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Courses Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Cursos Asignados</Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenReassignDialog("course")}
              disabled={!workerData.worker.user_id}
            >
              Asignar Curso
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Curso</TableCell>
                  <TableCell>Fecha de Inscripción</TableCell>
                  <TableCell>Fecha de Finalización</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Progreso</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workerData.courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay cursos asignados
                    </TableCell>
                  </TableRow>
                ) : (
                  workerData.courses.map((course) => (
                    <TableRow key={course.enrollment_id}>
                      <TableCell>{course.course_title}</TableCell>
                      <TableCell>
                        {formatDate(course.enrollment_date)}
                      </TableCell>
                      <TableCell>
                        {formatDate(course.completion_date)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={course.status || "N/A"}
                          color={getStatusColor(course.status || "unknown")}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{course.progress_percentage}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Surveys Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Encuestas Asignadas</Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenReassignDialog("survey")}
              disabled={!workerData.worker.user_id}
            >
              Asignar Encuesta
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Encuesta</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha de Finalización</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workerData.surveys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No hay encuestas asignadas
                    </TableCell>
                  </TableRow>
                ) : (
                  workerData.surveys.map((survey) => (
                    <TableRow key={survey.user_survey_id}>
                      <TableCell>{survey.survey_title}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            survey.status === "completed"
                              ? "Completada"
                              : "Pendiente"
                          }
                          color={
                            survey.status === "completed"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(survey.completed_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Evaluations Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Evaluaciones Asignadas</Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenReassignDialog("evaluation")}
              disabled={!workerData.worker.user_id}
            >
              Asignar Evaluación
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Evaluación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Puntuación</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Fecha de Finalización</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workerData.evaluations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay evaluaciones asignadas
                    </TableCell>
                  </TableRow>
                ) : (
                  workerData.evaluations.map((evaluation) => (
                    <TableRow key={evaluation.user_evaluation_id}>
                      <TableCell>{evaluation.evaluation_title}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            evaluation.status === "completed"
                              ? "Completada"
                              : "Pendiente"
                          }
                          color={
                            evaluation.status === "completed"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {evaluation.score !== null &&
                        evaluation.max_points !== null
                          ? `${evaluation.score}/${evaluation.max_points}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {evaluation.passed !== null ? (
                          <Chip
                            label={evaluation.passed ? "Aprobada" : "Reprobada"}
                            color={evaluation.passed ? "success" : "error"}
                            size="small"
                          />
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(evaluation.completed_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Documentos del Trabajador</Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setOpenUploadDialog(true)}
            >
              Subir Documento
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Archivo</TableCell>
                  <TableCell>Tamaño</TableCell>
                  <TableCell>Subido por</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay documentos subidos
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {doc.title}
                        </Typography>
                        {doc.description && (
                          <Typography variant="caption" color="text.secondary">
                            {doc.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.category}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{doc.file_name}</TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>{doc.uploader_name || "N/A"}</TableCell>
                      <TableCell>{formatDate(doc.created_at)}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handlePreviewDocument(doc)}
                            title="Previsualizar"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Descargar"
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDocument(doc.id)}
                            title="Eliminar"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Novedades Tab */}
        <TabPanel value={tabValue} index={4}>
          <WorkerNovedades workerId={workerId!} />
        </TabPanel>

        {/* Vacaciones Tab */}
        <TabPanel value={tabValue} index={5}>
          <WorkerVacations
            workerId={workerId!}
            isAdmin={user?.role === "admin"}
          />
        </TabPanel>
      </Card>

      {/* Reassign Dialog */}
      <Dialog
        open={openReassignDialog}
        onClose={() => setOpenReassignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Asignar{" "}
          {reassignType === "course"
            ? "Curso"
            : reassignType === "survey"
            ? "Encuesta"
            : "Evaluación"}
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            options={availableItems}
            getOptionLabel={(option) => option.title}
            value={selectedItem}
            onChange={(event, newValue) => setSelectedItem(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Seleccionar ${
                  reassignType === "course"
                    ? "curso"
                    : reassignType === "survey"
                    ? "encuesta"
                    : "evaluación"
                }`}
                fullWidth
                margin="normal"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReassignDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleReassign}
            variant="contained"
            disabled={!selectedItem || reassigning}
          >
            {reassigning ? <CircularProgress size={20} /> : "Asignar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Subir Documento</DialogTitle>
        <DialogContent>
          <TextField
            label="Título del documento"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Descripción (opcional)"
            value={documentDescription}
            onChange={(e) => setDocumentDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
          <Autocomplete
            options={[
              "Identificación",
              "Contrato",
              "Certificados",
              "Exámenes Médicos",
              "Capacitaciones",
              "Otrosí",
              "Otros",
            ]}
            value={documentCategory}
            onChange={(event, newValue) => setDocumentCategory(newValue || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Categoría"
                fullWidth
                margin="normal"
                required
              />
            )}
          />
          <Box mt={2}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                {selectedFile ? selectedFile.name : "Seleccionar archivo"}
              </Button>
            </label>
          </Box>
          {selectedFile && (
            <Typography variant="caption" color="text.secondary" mt={1}>
              Tamaño: {formatFileSize(selectedFile.size)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenUploadDialog(false);
              setDocumentTitle("");
              setDocumentDescription("");
              setDocumentCategory("");
              setSelectedFile(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            disabled={
              !selectedFile ||
              !documentTitle ||
              !documentCategory ||
              uploadingDocument
            }
          >
            {uploadingDocument ? <CircularProgress size={20} /> : "Subir"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        severity={dialogState.severity}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </Box>
  );
};

export default WorkerDetail;
