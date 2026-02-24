import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useEffect, useState, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

import ResponsiveTable from "../components/ResponsiveTable";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  masterDocumentService,
  MasterDocument,
} from "../services/masterDocumentService";
import { formatDate } from "../utils/dateUtils";
import { logger } from "../utils/logger";

const DOCUMENT_TYPES = [
  { label: "PROCEDIMIENTO", code: "PR" },
  { label: "PROCESO", code: "PC" },
  { label: "MANUAL", code: "MA" },
  { label: "INSTRUCTIVO", code: "IN" },
  { label: "FORMATO", code: "FO" },
  { label: "FICHA TÉCNICA", code: "FT" },
  { label: "GUÍA", code: "GU" },
  { label: "PROTOCOLO", code: "PT" },
  { label: "MATERIAL EDUCATIVO", code: "ME" },
  { label: "REGLAMENTO", code: "RG" },
  { label: "POLÍTICA", code: "PO" },
  { label: "PROGRAMA", code: "PG" },
  { label: "MATRIZ", code: "MT" },
  { label: "CAPACITACIÓN", code: "CP" },
  { label: "ACTA", code: "AC" },
];

const LOCATION_TYPES = ["PC ADMINISTRADOR", "DIGITAL"];

const MasterDocuments: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [documents, setDocuments] = useState<MasterDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    tipo_documento: "",
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<MasterDocument | null>(
    null,
  );

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<MasterDocument | null>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await masterDocumentService.getDocuments({
        search: filters.search,
        tipo_documento: filters.tipo_documento,
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      });
      // Handle both array response and paginated response if service changes
      // For now assuming array based on service implementation, but let's be safe
      if (Array.isArray(result)) {
        setDocuments(result);
      } else {
        // @ts-ignore - in case service returns object with items
        setDocuments(result.items || []);
      }
    } catch (error) {
      logger.error("Error fetching master documents:", error);
      enqueueSnackbar("Error al cargar los documentos", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [filters, page, rowsPerPage, enqueueSnackbar]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Form handling
  const formik = useFormik({
    initialValues: {
      tipo_documento: "",
      nombre_documento: "",
      version: "",
      codigo: "",
      fecha: "",
      ubicacion: "",
    },
    validationSchema: Yup.object({
      tipo_documento: Yup.string().required(
        "El tipo de documento es requerido",
      ),
      nombre_documento: Yup.string().required("El nombre es requerido"),
      codigo: Yup.string().required("El código es requerido"),
      version: Yup.string(),
      ubicacion: Yup.string(),
      fecha: Yup.date().nullable(),
    }),
    onSubmit: async (values) => {
      try {
        if (currentDocument) {
          // @ts-ignore
          await masterDocumentService.updateDocument(
            currentDocument.id,
            values,
          );
          enqueueSnackbar("Documento actualizado exitosamente", {
            variant: "success",
          });
        } else {
          // @ts-ignore
          await masterDocumentService.createDocument(values);
          enqueueSnackbar("Documento creado exitosamente", {
            variant: "success",
          });
        }
        setOpenDialog(false);
        fetchDocuments();
      } catch (error: any) {
        logger.error("Error saving document:", error);
        const errorMsg =
          error.response?.data?.detail || "Error al guardar el documento";

        // Si es error de duplicado (409) o menciona código, mostrar error en el campo
        if (
          error.response?.status === 409 ||
          errorMsg.toLowerCase().includes("código")
        ) {
          formik.setFieldError("codigo", errorMsg);
        }

        enqueueSnackbar(errorMsg, { variant: "error" });
      }
    },
    enableReinitialize: true,
  });

  const handleOpenDialog = (document?: MasterDocument) => {
    if (document) {
      setCurrentDocument(document);
      formik.setValues({
        tipo_documento: document.tipo_documento,
        nombre_documento: document.nombre_documento,
        version: document.version || "",
        codigo: document.codigo,
        fecha: document.fecha ? document.fecha.split("T")[0] : "",
        ubicacion: document.ubicacion || "",
      });
    } else {
      setCurrentDocument(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleDeleteClick = (document: MasterDocument) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
      try {
        await masterDocumentService.deleteDocument(documentToDelete.id);
        enqueueSnackbar("Documento eliminado exitosamente", {
          variant: "success",
        });
        fetchDocuments();
      } catch (error) {
        logger.error("Error deleting document:", error);
        enqueueSnackbar("Error al eliminar el documento", { variant: "error" });
      }
    }
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleDownloadPdf = async () => {
    try {
      await masterDocumentService.downloadPdf({
        search: filters.search,
        tipo_documento: filters.tipo_documento,
      });
      enqueueSnackbar("PDF generado exitosamente", { variant: "success" });
    } catch (error) {
      logger.error("Error generating PDF:", error);
      enqueueSnackbar("Error al generar el PDF", { variant: "error" });
    }
  };

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Listado Maestro de Documentos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Documento
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Buscar"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              fullWidth
              size="small"
              options={DOCUMENT_TYPES}
              getOptionLabel={(option) => option.label}
              value={
                DOCUMENT_TYPES.find(
                  (t) => t.label === filters.tipo_documento,
                ) || null
              }
              onChange={(_, newValue) => {
                setFilters((prev) => ({
                  ...prev,
                  tipo_documento: newValue ? newValue.label : "",
                }));
                setPage(0);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo de Documento"
                  name="tipo_documento"
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", gap: 2 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchDocuments}
              variant="outlined"
            >
              Refrescar
            </Button>
            <Button
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPdf}
              variant="outlined"
              color="secondary"
            >
              PDF
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Versión</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Chip
                        label={doc.codigo}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{doc.nombre_documento}</TableCell>
                    <TableCell>{doc.tipo_documento}</TableCell>
                    <TableCell>{doc.version}</TableCell>
                    <TableCell>
                      {doc.fecha ? formatDate(doc.fecha) : "-"}
                    </TableCell>
                    <TableCell>
                      {doc.ubicacion && (
                        <Tooltip title={doc.ubicacion}>
                          <DescriptionIcon color="action" fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.is_active ? "Activo" : "Inactivo"}
                        color={doc.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(doc)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(doc)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No se encontraron documentos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </ResponsiveTable>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={documents.length < rowsPerPage ? documents.length : -1} // Temporary until we have real count
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
          />
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentDocument ? "Editar Documento" : "Nuevo Documento"}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Código"
                  name="codigo"
                  value={formik.values.codigo}
                  onChange={formik.handleChange}
                  error={formik.touched.codigo && Boolean(formik.errors.codigo)}
                  helperText={formik.touched.codigo && formik.errors.codigo}
                  disabled={false}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  fullWidth
                  options={DOCUMENT_TYPES}
                  getOptionLabel={(option) => option.label}
                  value={
                    DOCUMENT_TYPES.find(
                      (t) => t.label === formik.values.tipo_documento,
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    formik.setFieldValue(
                      "tipo_documento",
                      newValue ? newValue.label : "",
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tipo de Documento"
                      name="tipo_documento"
                      error={
                        formik.touched.tipo_documento &&
                        Boolean(formik.errors.tipo_documento)
                      }
                      helperText={
                        formik.touched.tipo_documento &&
                        formik.errors.tipo_documento
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Nombre del Documento"
                  name="nombre_documento"
                  value={formik.values.nombre_documento}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.nombre_documento &&
                    Boolean(formik.errors.nombre_documento)
                  }
                  helperText={
                    formik.touched.nombre_documento &&
                    formik.errors.nombre_documento
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Versión"
                  name="version"
                  value={formik.values.version}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.version && Boolean(formik.errors.version)
                  }
                  helperText={formik.touched.version && formik.errors.version}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha"
                  name="fecha"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.fecha}
                  onChange={formik.handleChange}
                  error={formik.touched.fecha && Boolean(formik.errors.fecha)}
                  helperText={formik.touched.fecha && formik.errors.fecha}
                />
              </Grid>
              <Grid size={12}>
                <Autocomplete
                  fullWidth
                  options={LOCATION_TYPES}
                  value={formik.values.ubicacion || null}
                  onChange={(_, newValue) => {
                    formik.setFieldValue("ubicacion", newValue || "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ubicación"
                      name="ubicacion"
                      error={
                        formik.touched.ubicacion &&
                        Boolean(formik.errors.ubicacion)
                      }
                      helperText={
                        formik.touched.ubicacion && formik.errors.ubicacion
                      }
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Guardar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar Documento"
        message={`¿Está seguro que desea eliminar el documento "${documentToDelete?.nombre_documento}"? Esta acción no se puede deshacer.`}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
};

export default MasterDocuments;
