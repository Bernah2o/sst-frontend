import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  // Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Alert,
  TablePagination,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  // Add,
  Edit,
  Delete,
  Visibility,
  Slideshow,
  Publish,
  Unpublished,
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import interactiveLessonApi from "../services/interactiveLessonApi";
import { InteractiveLessonListItem } from "../types/interactiveLesson";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import ConfirmDialog from "../components/ConfirmDialog";

const InteractiveLessons: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<InteractiveLessonListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const { dialogState, showConfirmDialog } = useConfirmDialog();

  // El API pagina (20 por defecto): antes solo se pedía la primera página y
  // las lecciones a partir de la 21 no aparecían.
  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await interactiveLessonApi.getLessons({
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setLessons(data.items);
      setTotal(data.total ?? data.items.length);
    } catch (error) {
      console.error("Error loading lessons:", error);
      setFeedback({ severity: "error", message: "No se pudieron cargar las lecciones." });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const handleDelete = async (id: number) => {
    const lesson = lessons.find((l) => l.id === id);
    const confirmed = await showConfirmDialog({
      title: "Eliminar Lección",
      message: `¿Estás seguro de que deseas eliminar la lección "${lesson?.title}"? Esta acción no se puede deshacer.`,
      severity: "error",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      try {
        await interactiveLessonApi.deleteLesson(id);
        // Si era el último de la página, volver a la anterior
        if (lessons.length === 1 && page > 0) {
          setPage((p) => p - 1);
        } else {
          loadLessons();
        }
      } catch (error) {
        console.error("Error deleting lesson:", error);
      }
    }
  };

  // Publicar la lección convierte el curso en interactivo (reemplaza los
  // materiales tradicionales); pasarla a borrador lo devuelve al tradicional.
  const handleToggleStatus = async (lesson: InteractiveLessonListItem) => {
    const publishing = lesson.status !== "published";
    const courseName = lesson.course_title ? `"${lesson.course_title}"` : "el curso";
    const confirmed = await showConfirmDialog({
      title: publishing ? "Publicar lección" : "Pasar a borrador",
      message: publishing
        ? `Al publicar "${lesson.title}", ${courseName} se mostrará como curso interactivo: esta lección reemplaza los materiales tradicionales (PDF, videos) y será obligatoria para completarlo. Las encuestas y la evaluación final siguen aplicando. El avance de quienes están cursándolo se recalculará.`
        : `Al pasar "${lesson.title}" a borrador, ${courseName} vuelve a su contenido tradicional (materiales) si no tiene otras lecciones publicadas. El avance de quienes están cursándolo se recalculará.`,
      severity: "warning",
      confirmText: publishing ? "Publicar" : "Pasar a borrador",
      cancelText: "Cancelar",
    });
    if (!confirmed) return;

    setTogglingId(lesson.id);
    try {
      const updated = publishing
        ? await interactiveLessonApi.publishLesson(lesson.id)
        : await interactiveLessonApi.unpublishLesson(lesson.id);
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, status: updated.status } : l)),
      );
      setFeedback({
        severity: "success",
        message: publishing
          ? `Lección publicada: ${courseName} ahora es un curso interactivo.`
          : `Lección en borrador: ${courseName} vuelve al contenido tradicional.`,
      });
    } catch (error: any) {
      console.error("Error changing lesson status:", error);
      setFeedback({
        severity: "error",
        message: error?.response?.data?.detail || "No se pudo cambiar el estado de la lección",
      });
    } finally {
      setTogglingId(null);
    }
  };

  if (loading && lessons.length === 0 && total === 0) {
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

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Slideshow fontSize="large" color="primary" />
          Lecciones Interactivas
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={statusFilter}
          onChange={(_, value) => {
            if (!value) return;
            setStatusFilter(value);
            setPage(0);
          }}
          aria-label="Filtrar por estado"
        >
          <ToggleButton value="all">Todas</ToggleButton>
          <ToggleButton value="published">Publicadas</ToggleButton>
          <ToggleButton value="draft">Borradores</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ opacity: loading ? 0.6 : 1, transition: "opacity 120ms" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Curso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Slides</TableCell>
              <TableCell align="center">Actividades</TableCell>
              <TableCell>Duración Est.</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {statusFilter === "all"
                    ? "No se encontraron lecciones. Gestiona las lecciones desde el detalle de cada curso/módulo."
                    : "No hay lecciones con este estado."}
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {lesson.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {lesson.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{lesson.course_title || "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lesson.status === "published"
                        ? "Curso interactivo (reemplaza los materiales)"
                        : "Curso tradicional (materiales)"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        lesson.status === "published" ? "Publicado" : "Borrador"
                      }
                      color={
                        lesson.status === "published" ? "success" : "warning"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{lesson.slides_count}</TableCell>
                  <TableCell align="center">
                    {lesson.activities_count}
                  </TableCell>
                  <TableCell>
                    {lesson.estimated_duration_minutes
                      ? `${lesson.estimated_duration_minutes} min`
                      : "N/A"}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{ display: "flex", justifyContent: "center", gap: 1 }}
                    >
                      <Tooltip
                        title={
                          lesson.status === "published"
                            ? "Pasar a borrador (volver al curso tradicional)"
                            : "Publicar (reemplaza los materiales del curso)"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color={lesson.status === "published" ? "warning" : "success"}
                            disabled={togglingId === lesson.id}
                            onClick={() => handleToggleStatus(lesson)}
                          >
                            {togglingId === lesson.id ? (
                              <CircularProgress size={18} />
                            ) : lesson.status === "published" ? (
                              <Unpublished fontSize="small" />
                            ) : (
                              <Publish fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Vista Previa">
                        <IconButton
                          size="small"
                          onClick={() =>
                            window.open(
                              `/admin/lesson/${lesson.id}/preview`,
                              "_blank",
                            )
                          }
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            navigate(`/admin/lesson/${lesson.id}/edit`)
                          }
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(lesson.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[20, 50, 100]}
          labelRowsPerPage="Lecciones por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>
      <ConfirmDialog {...dialogState} />
    </Box>
  );
};

export default InteractiveLessons;
