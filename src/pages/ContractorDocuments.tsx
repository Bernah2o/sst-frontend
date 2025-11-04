import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
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
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tooltip,
  TablePagination,
  Snackbar,
  Grid,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Description as DocumentIcon,
} from "@mui/icons-material";
import contractorService from "../services/contractorService";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  ContractorDocumentResponse,
  ContractorDocumentUpdate,
  ContractorDocumentType,
  ContractorResponse,
  CONTRACTOR_DOCUMENT_TYPES,
} from "../types/contractor";

const ContractorDocuments: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const contractorIdFromUrl = id ? parseInt(id, 10) : null;

  const [documents, setDocuments] = useState<ContractorDocumentResponse[]>([]);
  const [contractors, setContractors] = useState<ContractorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<ContractorDocumentResponse | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<number | "">(
    contractorIdFromUrl || ""
  );

  // Form states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<ContractorDocumentType>("cedula");
  const [documentName, setDocumentName] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");

  // Filter states - si hay ID en la URL, usarlo automáticamente
  const [filterContractor, setFilterContractor] = useState<number | "">(
    contractorIdFromUrl || ""
  );
  const [filterType, setFilterType] = useState<ContractorDocumentType | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  const { dialogState, showConfirmDialog } = useConfirmDialog();

  const documentTypeLabels: Record<ContractorDocumentType, string> = {
    cedula: "Cédula",
    rut: "RUT",
    certificado_bancario: "Certificado Bancario",
    eps: "EPS",
    arl: "ARL",
    pension: "Pensión",
    contrato: "Contrato",
    otro: "Otro",
  };

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contractorService.getContractorDocuments({
        contractor_id: filterContractor || undefined,
        document_type: filterType || undefined,
        search: searchTerm || undefined,
        page: page + 1,
        size: rowsPerPage,
      });
      setDocuments(response.documents);
      setTotalCount(response.total);
    } catch (error) {
      console.error("Error loading documents:", error);
      setError("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  }, [filterContractor, filterType, searchTerm, page, rowsPerPage]);

  const loadContractors = useCallback(async () => {
    try {
      const response = await contractorService.getContractors({ size: 100 });
      setContractors(response?.contractors || []);
    } catch (err) {
      console.error("Error loading contractors:", err);
      setContractors([]);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadContractors();
  }, [
    page,
    rowsPerPage,
    filterContractor,
    filterType,
    searchTerm,
    loadDocuments,
    loadContractors,
  ]);

  // Efecto para actualizar el filtro cuando cambia el ID de la URL
  useEffect(() => {
    if (contractorIdFromUrl) {
      setFilterContractor(contractorIdFromUrl);
      setSelectedContractor(contractorIdFromUrl);
    }
  }, [contractorIdFromUrl]);

  const handleUploadDocument = async () => {
    if (!selectedContractor || !uploadFile || !documentType) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);
      await contractorService.uploadContractorDocument(
        selectedContractor as number,
        uploadFile,
        documentType,
        documentName,
        documentDescription
      );
      setUploadDialogOpen(false);
      resetUploadForm();
      loadDocuments();
      setSuccess("Documento subido exitosamente");
    } catch (error) {
      console.error("Error uploading document:", error);
      setError("Error al subir el documento");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDocument = async () => {
    if (!selectedDocument) return;

    try {
      setLoading(true);
      const updateData: ContractorDocumentUpdate = {
        nombre: documentName,
        descripcion: documentDescription,
        tipo_documento: documentType,
      };

      await contractorService.updateContractorDocument(
        selectedDocument.id,
        updateData
      );
      setSuccess("Documento actualizado exitosamente");
      setEditDialogOpen(false);
      resetEditForm();
      loadDocuments();
    } catch (err) {
      setError("Error al actualizar el documento");
      console.error("Error updating document:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (
    contractorId: number,
    documentId: number
  ) => {
    const confirmed = await showConfirmDialog({
      title: "Eliminar Documento",
      message:
        "¿Está seguro de que desea eliminar este documento? Esta acción no se puede deshacer.",
      severity: "warning",
    });

    if (confirmed) {
      try {
        setLoading(true);
        await contractorService.deleteContractorDocument(
          contractorId,
          documentId
        );
        setSuccess("Documento eliminado exitosamente");
        loadDocuments();
      } catch (err) {
        setError("Error al eliminar el documento");
        console.error("Error deleting document:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadDocument = async (
    contractorId: number,
    documentId: number,
    fileName: string
  ) => {
    try {
      setLoading(true);
      const blob = await contractorService.downloadContractorDocument(
        contractorId,
        documentId
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Error al descargar el documento");
      console.error("Error downloading document:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setSelectedContractor("");
    setDocumentType("cedula");
    setDocumentName("");
    setDocumentDescription("");
  };

  const resetEditForm = () => {
    setSelectedDocument(null);
    setDocumentName("");
    setDocumentDescription("");
    setDocumentType("cedula");
  };

  const openEditDialog = (document: ContractorDocumentResponse) => {
    setSelectedDocument(document);
    setDocumentName(document.nombre);
    setDocumentDescription(document.descripcion || "");
    setDocumentType(document.tipo_documento);
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getContractorName = (contractorId: number) => {
    const contractor = contractors.find((c) => c.id === contractorId);
    if (!contractor) return "Desconocido";
    return `${contractor.first_name} ${contractor.last_name}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <DocumentIcon />
          Documentos de Contratistas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Subir Documento
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Contratista</InputLabel>
                <Select
                  value={filterContractor}
                  onChange={(e) =>
                    setFilterContractor(e.target.value as number | "")
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  {contractors &&
                    contractors.map((contractor) => (
                      <MenuItem key={contractor.id} value={contractor.id}>
                        {getContractorName(contractor.id)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as ContractorDocumentType | "")
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  {CONTRACTOR_DOCUMENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {documentTypeLabels[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilterContractor("");
                  setFilterType("");
                  setSearchTerm("");
                }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de documentos */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Contratista</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Tamaño</TableCell>
                <TableCell>Fecha de Subida</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No se encontraron documentos
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      {getContractorName(document.contractor_id)}
                    </TableCell>
                    <TableCell>{document.nombre || document.archivo}</TableCell>
                    <TableCell>
                      <Chip
                        label={documentTypeLabels[document.tipo_documento]}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {formatFileSize(document.tamano_archivo)}
                    </TableCell>
                    <TableCell>{formatDate(document.fecha_subida)}</TableCell>
                    <TableCell>
                      <Tooltip title="Descargar">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDownloadDocument(
                              document.contractor_id,
                              document.id,
                              document.archivo
                            )
                          }
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(document)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            handleDeleteDocument(
                              document.contractor_id,
                              document.id
                            )
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      {/* Dialog para subir documento */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Subir Documento</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Contratista</InputLabel>
                  <Select
                    value={selectedContractor}
                    onChange={(e) =>
                      setSelectedContractor(e.target.value as number)
                    }
                    label="Contratista"
                  >
                    {contractors &&
                      contractors.map((contractor) => (
                        <MenuItem key={contractor.id} value={contractor.id}>
                          {getContractorName(contractor.id)}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Documento</InputLabel>
                  <Select
                    value={documentType}
                    onChange={(e) =>
                      setDocumentType(e.target.value as ContractorDocumentType)
                    }
                    label="Tipo de Documento"
                  >
                    {Object.entries(documentTypeLabels).map(
                      ([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nombre del Documento (Opcional)"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción (Opcional)"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                >
                  {uploadFile ? uploadFile.name : "Seleccionar Archivo"}
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </Button>
                {uploadFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Archivo seleccionado: {uploadFile.name} (
                    {formatFileSize(uploadFile.size)})
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleUploadDocument} variant="contained">
            Subir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar documento */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Documento</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Documento</InputLabel>
                  <Select
                    value={documentType}
                    onChange={(e) =>
                      setDocumentType(e.target.value as ContractorDocumentType)
                    }
                    label="Tipo de Documento"
                  >
                    {Object.entries(documentTypeLabels).map(
                      ([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nombre del Documento"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditDocument} variant="contained">
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        severity={dialogState.severity}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </Box>
  );
};

export default ContractorDocuments;
