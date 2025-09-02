import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Visibility,
  People,
  Schedule,
  FolderOpen,
  Description,
  CloudUpload,
  Link as LinkIcon,
  Quiz,
  CheckCircle,
  VideoLibrary,
  PictureAsPdf,
  LibraryBooks,
  PlayArrow,
  Warning,
  Error,
} from "@mui/icons-material";
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
  TablePagination,
  IconButton,
  Chip,
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
  Card,
  CardContent,
  CardActions,
  Divider,
  FormControlLabel,
  Switch,
  Grid,
  LinearProgress,
} from "@mui/material";
import React, { useState, useEffect } from "react";

import PDFViewer from '../components/PDFViewerNew';
import UppercaseTextField from "../components/UppercaseTextField";
import { getApiUrl } from "../config/env";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { formatDate } from "../utils/dateUtils";

import api from "./../services/api";
import {
  Curso,
  CourseType,
  CourseStatus,
  MaterialType,
  CourseMaterial,
  CourseModule,
  CourseBase,
  CourseCreate,
  CourseUpdate,
  CourseResponse,
  CourseListResponse,
  CourseMaterialBase,
  CourseMaterialCreate,
  CourseMaterialUpdate,
  CourseMaterialResponse,
  CourseModuleBase,
  CourseModuleCreate,
  CourseModuleUpdate,
  CourseModuleResponse,
} from "./../types";

// Los enums ahora se importan desde types/index.ts

// Interfaz local que extiende CourseResponse para compatibilidad legacy
interface Course extends CourseResponse {
  // Campos legacy para compatibilidad
  titulo?: string;
  descripcion?: string;
  duracion_horas?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
}

// Interfaces de formularios que extienden las interfaces base
interface ModuleFormData extends CourseModuleBase {
  // Todos los campos ya están definidos en CourseModuleBase
}

interface MaterialFormData extends CourseMaterialBase {
  // Todos los campos ya están definidos en CourseMaterialBase
}

interface CourseFormData extends CourseBase {
  // Campo adicional necesario
  status: CourseStatus;
  // Campos legacy para compatibilidad
  titulo: string;
  descripcion: string;
  duracion_horas: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

const CoursesManagement: React.FC = () => {
  const { user } = useAuth();
  const {
    canCreateCourses,
    canUpdateCourses,
    canDeleteCourses,
    canCreateModules,
    canReadModules,
    canUpdateModules,
    canDeleteModules,
    canCreateMaterials,
    canReadMaterials,
    canUpdateMaterials,
    canDeleteMaterials,
  } = usePermissions();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCourses, setTotalCourses] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    course_type: CourseType.TRAINING,
    status: CourseStatus.DRAFT,
    duration_hours: 0,
    passing_score: 70.0,
    max_attempts: 3,
    is_mandatory: false,
    thumbnail: "",
    expires_at: "",
    order_index: 0,
    // Campos legacy
    titulo: "",
    descripcion: "",
    duracion_horas: 0,
    fecha_inicio: new Date().toISOString().split("T")[0],
    fecha_fin: new Date().toISOString().split("T")[0],
    activo: true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Estados para gestión de módulos
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingModule, setEditingModule] =
    useState<CourseModuleResponse | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModuleResponse[]>(
    []
  );
  const [moduleFormData, setModuleFormData] = useState<ModuleFormData>({
    title: "",
    description: "",
    order_index: 0,
    duration_minutes: 0,
    is_required: true,
  });

  // Estados para gestión de materiales
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [selectedModule, setSelectedModule] =
    useState<CourseModuleResponse | null>(null);
  const [editingMaterial, setEditingMaterial] =
    useState<CourseMaterialResponse | null>(null);
  const [moduleMaterials, setModuleMaterials] = useState<
    CourseMaterialResponse[]
  >([]);
  const [materialFormData, setMaterialFormData] = useState<MaterialFormData>({
    title: "",
    description: "",
    material_type: MaterialType.PDF,
    order_index: 0,
    is_downloadable: true,
    is_required: true,
  });

  // Estados para previsualización de contenido
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState<{
    type: "pdf" | "url" | "video" | "youtube";
    content: string;
    title: string;
  }>({ type: "pdf", content: "", title: "" });

  // Estados para diálogos de error
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  // Estados para diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Estados para diálogos de edición
  const [openModuleEditDialog, setOpenModuleEditDialog] = useState(false);
  const [openMaterialEditDialog, setOpenMaterialEditDialog] = useState(false);

  // Estados para diálogo de confirmación de eliminación
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Estados para diálogo de confirmación de eliminación de módulo
  const [openDeleteModuleDialog, setOpenDeleteModuleDialog] = useState(false);
  const [moduleToDelete, setModuleToDelete] =
    useState<CourseModuleResponse | null>(null);

  // Estados para diálogo de confirmación de eliminación de material
  const [openDeleteMaterialDialog, setOpenDeleteMaterialDialog] =
    useState(false);
  const [materialToDelete, setMaterialToDelete] =
    useState<CourseMaterialResponse | null>(null);

  // Estados para subida de archivos
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
    url: string;
  } | null>(null);

  // Función helper para construir URLs de previsualización
  const getPreviewUrl = (content: string): string => {
    const apiUrl = getApiUrl();
    const baseUrl = apiUrl.replace('/api/v1', '');
    return content.startsWith('http') 
      ? content 
      : `${baseUrl}/uploads/${content.replace(/^\/uploads\//, '')}`;
  };

  // Función para manejar la subida de archivos
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploadingFile(true);
    try {
      // Simular la subida del archivo y mostrar la información
      setUploadedFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      });
      
      // Actualizar el tipo de material basado en el archivo
      const fileType = file.type;
      let materialType = MaterialType.PDF;
      
      if (fileType.startsWith('video/')) {
        materialType = MaterialType.VIDEO;
      } else if (fileType === 'application/pdf') {
        materialType = MaterialType.PDF;
      }
      
      setMaterialFormData(prev => ({
        ...prev,
        material_type: materialType,
        title: prev.title || file.name.split('.')[0] // Usar nombre del archivo como título si está vacío
      }));
      
      showSnackbar("Archivo cargado. Complete la información y haga clic en CREAR.", "success");
    } catch (error) {
      showErrorDialog(
        "Error al subir archivo",
        "No se pudo subir el archivo. Por favor, intente nuevamente."
      );
      showSnackbar("Error al subir archivo", "error");
    } finally {
      setUploadingFile(false);
    }
  };

  // Efectos para monitorear cambios en los estados
  useEffect(() => {
    // Monitorear cambios en selectedFile
  }, [selectedFile]);

  useEffect(() => {
    // Monitorear cambios en selectedModule
  }, [selectedModule]);

  useEffect(() => {
    // Monitorear cambios en selectedCourse
  }, [selectedCourse]);

  useEffect(() => {
    if (user?.role === "employee") {
      fetchEnrolledCourses();
    } else {
      fetchCourses();
    }
  }, [page, rowsPerPage, searchTerm, user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/courses", {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: searchTerm || undefined,
        },
      });
      // Mapear campos del backend a campos legacy del frontend
      const mappedCourses = (response.data.items || []).map((course: any) => ({
        ...course,
        // Campos del nuevo schema
        id: course.id,
        title: course.title || "",
        description: course.description || "",
        course_type: course.course_type || CourseType.TRAINING,
        status: course.status || CourseStatus.DRAFT,
        duration_hours: course.duration_hours || 0,
        passing_score: course.passing_score || 70.0,
        max_attempts: course.max_attempts || 3,
        is_mandatory: course.is_mandatory || false,
        thumbnail: course.thumbnail || "",
        expires_at: course.expires_at || "",
        order_index: course.order_index || 0,
        created_by: course.created_by,
        created_at: course.created_at || "",
        updated_at: course.updated_at || "",
        published_at: course.published_at || "",
        modules: course.modules || [],
        // Campos legacy para compatibilidad
        titulo: course.title || "",
        descripcion: course.description || "",
        duracion_horas: course.duration_hours || 0,
        fecha_inicio: course.created_at || "",
        fecha_fin: course.expires_at || "",
        activo: course.status === "published",
        fecha_creacion: course.created_at || "",
      }));
      setCourses(mappedCourses);
      setTotalCourses(response.data.total || 0);
    } catch (error) {
      showErrorDialog(
        "Error al cargar cursos",
        "No se pudieron cargar los cursos. Por favor, verifique su conexión e intente nuevamente."
      );
      showSnackbar("No se pudieron cargar los cursos. Verifique su conexión e intente nuevamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/enrollments/my-enrollments", {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: searchTerm || undefined,
        },
      });
      setEnrolledCourses(response.data.items || []);
      setTotalCourses(response.data.total || 0);
    } catch (error) {
      showErrorDialog(
        "Error al cargar mis cursos",
        "No se pudieron cargar sus cursos inscritos. Por favor, verifique su conexión e intente nuevamente."
      );
      showSnackbar("No se pudieron cargar sus cursos inscritos. Verifique su conexión e intente nuevamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setFormData({
      title: "",
      description: "",
      course_type: CourseType.TRAINING,
      status: CourseStatus.DRAFT,
      duration_hours: 0,
      passing_score: 70.0,
      max_attempts: 3,
      is_mandatory: false,
      thumbnail: "",
      expires_at: "",
      order_index: 0,
      // Campos legacy
      titulo: "",
      descripcion: "",
      duracion_horas: 0,
      fecha_inicio: new Date().toISOString().split("T")[0],
      fecha_fin: new Date().toISOString().split("T")[0],
      activo: true,
    });
    setOpenDialog(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      course_type: course.course_type || CourseType.TRAINING,
      status: course.status || CourseStatus.DRAFT,
      duration_hours: course.duration_hours || 0,
      passing_score: course.passing_score || 70.0,
      max_attempts: course.max_attempts || 3,
      is_mandatory: course.is_mandatory || false,
      thumbnail: course.thumbnail || "",
      expires_at: course.expires_at ? course.expires_at.split("T")[0] : "",
      order_index: course.order_index || 0,
      // Campos legacy
      titulo: course.titulo || course.title || "",
      descripcion: course.descripcion || course.description || "",
      duracion_horas: course.duracion_horas || course.duration_hours || 0,
      fecha_inicio: course.fecha_inicio
        ? course.fecha_inicio.split("T")[0]
        : course.created_at
        ? course.created_at.split("T")[0]
        : "",
      fecha_fin: course.fecha_fin
        ? course.fecha_fin.split("T")[0]
        : course.expires_at
        ? course.expires_at.split("T")[0]
        : "",
      activo:
        course.activo !== undefined
          ? course.activo
          : course.status === "published",
    });
    setOpenDialog(true);
  };

  const handleSaveCourse = async () => {
    // Validaciones para cursos que requieren encuesta, evaluación y certificación
    const requiresFullProcess =
      [CourseType.INDUCTION, CourseType.REINDUCTION].includes(
        formData.course_type
      ) || formData.is_mandatory;

    if (requiresFullProcess && formData.status === CourseStatus.PUBLISHED) {
      // Si es un curso existente, validar que tenga encuestas y evaluaciones
      if (editingCourse?.id) {
        try {
          const response = await api.get(
            `/courses/${editingCourse.id}/validation`
          );
          const validation = response.data;

          if (!validation.can_publish) {
            const missingItems = validation.missing_requirements.filter(
              (item: string | null) => item !== null
            );
            const missingText = missingItems
              .map((item: string) => {
                return item === "surveys" ? "encuestas" : "evaluaciones";
              })
              .join(" y ");

            const errorMessage = `Este curso requiere ${missingText} asociadas y publicadas antes de poder ser publicado. Por favor, cree y publique las ${missingText} necesarias primero.`;

            showSnackbar(errorMessage, "error");
            return;
          }
          // Si la validación es exitosa, continuar con el guardado
          await handleSaveCourseAfterConfirm();
          return;
        } catch (error) {
          showSnackbar("Error al validar los requisitos del curso", "error");
          return;
        }
      } else {
        // Para cursos nuevos, mostrar advertencia informativa
        const warningMessage =
          "Los cursos de Inducción, Reinducción y obligatorios requieren encuesta y evaluación antes de ser publicados. La certificación se generará automáticamente cuando los trabajadores completen el curso. Recuerde crear y publicar las encuestas y evaluaciones después de guardar el curso.";

        showSnackbar(warningMessage, "error");

        showConfirmDialog(
          "Confirmar publicación",
          warningMessage + "\n\n¿Desea continuar con la publicación?",
          () => {
            handleSaveCourseAfterConfirm();
          }
        );
        return;
      }
    }

    // Si no requiere confirmación, guardar directamente
    await handleSaveCourseAfterConfirm();
  };

  const handleSaveCourseAfterConfirm = async () => {
    try {
      // Mapear datos del formulario al formato del backend
      const backendData = {
        title: formData.title || formData.titulo,
        description: formData.description || formData.descripcion,
        course_type: formData.course_type,
        status: formData.status,
        duration_hours: formData.duration_hours || formData.duracion_horas,
        passing_score: formData.passing_score,
        max_attempts: formData.max_attempts,
        is_mandatory: formData.is_mandatory,
        thumbnail: formData.thumbnail,
        expires_at: formData.expires_at
          ? new Date(formData.expires_at).toISOString()
          : formData.fecha_fin
          ? new Date(formData.fecha_fin).toISOString()
          : null,
        order_index: formData.order_index,
      };

      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, backendData);
        showSnackbar("Curso actualizado exitosamente", "success");
      } else {
        await api.post("/courses", backendData);
        showSnackbar("Curso creado exitosamente", "success");
      }
      setOpenDialog(false);
      fetchCourses();
    } catch (error) {
      showErrorDialog(
        "Error al guardar curso",
        "No se pudo guardar el curso. Por favor, verifique los datos ingresados e intente nuevamente."
      );
      showSnackbar("Error al guardar curso", "error");
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await api.delete(`/courses/${courseToDelete.id}`);
      showSnackbar("Curso eliminado exitosamente", "success");
      fetchCourses();
    } catch (error: any) {
      // Manejar error específico cuando hay trabajadores asignados
      if (error.response?.status === 400 && error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes("empleado(s) asignado(s)")) {
          showErrorDialog("No se puede eliminar el curso", errorMessage);
          showSnackbar(errorMessage, "error");
        } else {
          showErrorDialog("Error al eliminar curso", errorMessage);
          showSnackbar("Error al eliminar curso: " + errorMessage, "error");
        }
      } else {
        showErrorDialog(
          "Error al eliminar curso",
          "No se pudo eliminar el curso. Por favor, intente nuevamente."
        );
        showSnackbar("Error al eliminar curso", "error");
      }
    } finally {
      setOpenDeleteDialog(false);
      setCourseToDelete(null);
    }
  };

  const handleGenerateAttendanceReport = async (course: Course) => {
    try {
      const response = await api.get(
        `/courses/${course.id}/attendance-report`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `reporte_asistencia_${(
          course.titulo ||
          course.title ||
          "curso"
        ).replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar("Reporte de asistencia generado exitosamente", "success");
    } catch (error: any) {
      if (error.response?.status === 400) {
        showErrorDialog(
          "Reporte no disponible",
          "Los reportes de asistencia solo están disponibles para cursos OPCIONALES y de TRAINING"
        );
        showSnackbar(
          "Los reportes de asistencia solo están disponibles para cursos OPCIONALES y de TRAINING",
          "error"
        );
      } else if (error.response?.status === 404) {
        showErrorDialog(
          "Sin datos para el reporte",
          "No se encontraron trabajadores inscritos en este curso"
        );
        showSnackbar(
          "No se encontraron trabajadores inscritos en este curso",
          "error"
        );
      } else {
        showErrorDialog(
          "Error al generar reporte",
          "No se pudo generar el reporte de asistencia. Por favor, intente nuevamente."
        );
        showSnackbar("Error al generar el reporte de asistencia", "error");
      }
    }
  };

  const cancelDeleteCourse = () => {
    setOpenDeleteDialog(false);
    setCourseToDelete(null);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  // Función para mostrar diálogos de error
  const showErrorDialog = (title: string, message: string) => {
    setErrorDialog({ open: true, title, message });
  };

  // Función para mostrar diálogos de confirmación
  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  // Funciones para gestión de módulos
  const handleOpenModules = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const response = await api.get(`/courses/${course.id}/modules`);
      setCourseModules(response.data);
    } catch (error) {
      showErrorDialog(
        "Módulos no disponibles",
        "No se pudieron cargar los módulos del curso. Verifique su conexión e intente nuevamente."
      );
      setCourseModules([]);
    }
    setOpenModuleDialog(true);
  };

  const handleCreateModule = () => {
    setEditingModule(null);
    setModuleFormData({
      title: "",
      description: "",
      order_index: courseModules.length,
      duration_minutes: undefined,
      is_required: true,
    });
    setOpenModuleEditDialog(true);
  };

  const handleEditModule = (module: CourseModule) => {
    setEditingModule(module);
    setModuleFormData({
      title: module.title,
      description: module.description || "",
      order_index: module.order_index,
      duration_minutes: module.duration_minutes,
      is_required: module.is_required,
    });
    setOpenModuleEditDialog(true);
  };

  const handleSaveModule = async () => {
    if (!selectedCourse) return;

    try {
      const moduleData = {
        ...moduleFormData,
        course_id: selectedCourse.id,
      };

      if (editingModule) {
        await api.put(`/courses/modules/${editingModule.id}`, moduleFormData);
        showSnackbar("Módulo actualizado exitosamente", "success");
      } else {
        await api.post(`/courses/${selectedCourse.id}/modules`, moduleFormData);
        showSnackbar("Módulo creado exitosamente", "success");
      }

      // Recargar módulos
      const response = await api.get(`/courses/${selectedCourse.id}/modules`);
      setCourseModules(response.data);

      // Cerrar diálogo y limpiar formulario
      setOpenModuleEditDialog(false);
      setEditingModule(null);
      setModuleFormData({
        title: "",
        description: "",
        order_index: 0,
        duration_minutes: undefined,
        is_required: true,
      });
    } catch (error) {
      showErrorDialog(
        "Error al guardar módulo",
        "No se pudo guardar el módulo. Por favor, verifique los datos ingresados e intente nuevamente."
      );
      showSnackbar("Error al guardar módulo", "error");
    }
  };

  const handleDeleteModule = (module: CourseModuleResponse) => {
    setModuleToDelete(module);
    setOpenDeleteModuleDialog(true);
  };

  const confirmDeleteModule = async () => {
    if (!moduleToDelete || !selectedCourse) return;

    try {
      await api.delete(`/courses/modules/${moduleToDelete.id}`);
      showSnackbar("Módulo eliminado exitosamente", "success");

      // Recargar módulos
      const response = await api.get(`/courses/${selectedCourse.id}/modules`);
      setCourseModules(response.data);
    } catch (error) {
      showErrorDialog(
        "Error al eliminar módulo",
        "No se pudo eliminar el módulo. Por favor, intente nuevamente."
      );
      showSnackbar("Error al eliminar módulo", "error");
    } finally {
      setOpenDeleteModuleDialog(false);
      setModuleToDelete(null);
    }
  };

  const cancelDeleteModule = () => {
    setOpenDeleteModuleDialog(false);
    setModuleToDelete(null);
  };

  // Funciones para gestión de materiales de curso
  const handleOpenCourseMaterials = async (course: Course) => {
    setSelectedCourse(course);
    try {
      // Obtener todos los módulos del curso y sus materiales
      const modulesResponse = await api.get(`/courses/${course.id}/modules`);
      const modules = modulesResponse.data;

      // Obtener materiales de todos los módulos
      const allMaterials: CourseMaterial[] = [];
      for (const module of modules) {
        try {
          const materialsResponse = await api.get(
            `/courses/modules/${module.id}/materials`
          );
          allMaterials.push(...materialsResponse.data);
        } catch (error) {
          console.warn(
            `Error loading materials for module ${module.id}:`,
            error
          );
        }
      }

      setModuleMaterials(allMaterials);
      setCourseModules(modules);
    } catch (error) {
      showErrorDialog(
        "Materiales no disponibles",
        "No se pudieron cargar los materiales del curso. Verifique su conexión e intente nuevamente."
      );
      setModuleMaterials([]);
      setCourseModules([]);
    }
    setOpenMaterialDialog(true);
  };

  // Funciones para gestión de materiales de módulo
  const handleOpenMaterials = async (module: CourseModule) => {
    setSelectedModule(module);
    
    // Buscar y establecer el curso correspondiente al módulo
    const modulesCourse = courses.find(course => course.id === module.course_id);
    if (modulesCourse) {
      setSelectedCourse(modulesCourse);
    }
    
    try {
      const response = await api.get(`/courses/modules/${module.id}/materials`);
      setModuleMaterials(response.data);
    } catch (error) {
      showErrorDialog(
        "Materiales no disponibles",
        "No se pudieron cargar los materiales del módulo. Verifique su conexión e intente nuevamente."
      );
      setModuleMaterials([]);
    }
    setOpenMaterialDialog(true);
  };

  const handleCreateMaterial = () => {
    // Validar que selectedModule y selectedCourse estén establecidos
    if (!selectedModule || !selectedCourse) {
      showSnackbar("Debe seleccionar un módulo y curso. Intente abrir los materiales del módulo primero.", "error");
      return;
    }
    
    setEditingMaterial(null);
    setMaterialFormData({
      title: "",
      description: "",
      material_type: MaterialType.PDF,
      file_url: "",
      order_index: moduleMaterials.length,
      is_downloadable: true,
      is_required: true,
    });
    setOpenMaterialEditDialog(true);
  };

  const handleEditMaterial = (material: CourseMaterial) => {
    // Asegurar que selectedModule y selectedCourse estén establecidos
    // Si no están establecidos, buscarlos basándose en el material
    if (!selectedModule || !selectedCourse) {
      // Buscar el módulo que contiene este material
      const foundModule = courseModules.find((module: CourseModuleResponse) => 
        module.materials?.some((mat: CourseMaterialResponse) => mat.id === material.id)
      );
      
      if (foundModule && selectedCourse) {
        setSelectedModule(foundModule);
      } else if (foundModule && courses.length > 0) {
        // Si no hay curso seleccionado, buscar el curso que contiene este módulo
        const foundCourse = courses.find((course: Course) => 
          course.modules?.some((mod: CourseModuleResponse) => mod.id === foundModule.id)
        );
        if (foundCourse) {
          setSelectedCourse(foundCourse);
          setSelectedModule(foundModule);
        }
      }
    }
    
    setEditingMaterial(material);
    setMaterialFormData({
      title: material.title,
      description: material.description || "",
      material_type: material.material_type,
      order_index: material.order_index,
      is_downloadable: material.is_downloadable,
      is_required: material.is_required,
    });

    // Si el material tiene archivo, mostrar la información
    if (material.file_url) {
      setUploadedFileInfo({
        name: material.title, // Usar el título como nombre
        size: 0, // Tamaño no disponible en el nuevo schema
        type: "", // Tipo no disponible en el nuevo schema
        url: material.file_url,
      });
    } else {
      setUploadedFileInfo(null);
    }

    setOpenMaterialEditDialog(true);
  };

  const handleMaterialComplete = async (material: CourseMaterial) => {
    try {
      // Primero iniciar el progreso del material si no existe
      try {
        await api.post(`/progress/material/${material.id}/start`);
      } catch (startError: any) {
        // Si el material ya está iniciado, continuar con el completado
        if (startError.response?.status !== 400) {
          throw startError;
        }
      }

      // Luego marcar como completado
      await api.post(`/progress/material/${material.id}/complete`);
      showSnackbar("Material marcado como completado", "success");

      // Actualizar el estado del material en la interfaz
      const updatedMaterials = moduleMaterials.map(m => {
        if (m.id === material.id) {
          return { ...m, completed: true };
        }
        return m;
      });
      setModuleMaterials(updatedMaterials);

      // Verificar si el curso está completado después de marcar el material
      if (selectedCourse) {
        try {
          const progressResponse = await api.get(`/progress/course/${selectedCourse.id}`);
          const courseProgress = progressResponse.data;
          
          // Si el curso está completado (100% de progreso)
          if (courseProgress.overall_progress === 100) {
            // Obtener el ID de la inscripción del usuario en este curso
            try {
              const enrollmentResponse = await api.get(`/enrollments/my-enrollments?course_id=${selectedCourse.id}`);
              const enrollments = enrollmentResponse.data.items || [];
              
              if (enrollments.length > 0) {
                const enrollmentId = enrollments[0].id;
                // Actualizar el estado de la inscripción a completado usando el endpoint correcto
                await api.put(`/enrollments/${enrollmentId}`, {
                  status: "COMPLETED",
                  progress: 100
                });
              } else {
                console.error('No se encontró la inscripción para este curso');
              }
            } catch (enrollmentError) {
              console.error('Error al obtener la inscripción:', enrollmentError);
            }
            
            showSnackbar("¡Curso completado! Ahora puedes acceder a la encuesta", "success");
            
            // Verificar si hay encuestas disponibles para este curso
            const surveysResponse = await api.get(`/surveys/?course_id=${selectedCourse.id}`);
            const availableSurveys = surveysResponse.data.items || [];
            
            if (availableSurveys.length > 0) {
              // Habilitar encuestas para el usuario
              await api.post(`/surveys/enable-for-user/${selectedCourse.id}`);
            }
          }
        } catch (progressError) {
          console.error("Error verificando progreso del curso:", progressError);
        }
      }

      // Recargar materiales para actualizar el estado completo desde el servidor
      if (selectedModule) {
        const response = await api.get(
          `/courses/modules/${selectedModule.id}/materials`
        );
        // Combinar los datos del servidor con el estado local actualizado
        const serverMaterials = response.data;
        const updatedFromServer = serverMaterials.map((serverMaterial: CourseMaterial) => {
          // Buscar si ya tenemos este material marcado como completado localmente
          const localMaterial = updatedMaterials.find(m => m.id === serverMaterial.id);
          if (localMaterial && localMaterial.completed) {
            return { ...serverMaterial, completed: true };
          }
          return serverMaterial;
        });
        setModuleMaterials(updatedFromServer);
      } else if (selectedCourse) {
        // Si estamos viendo materiales de todo el curso, recargar todos
        const modulesResponse = await api.get(
          `/courses/${selectedCourse.id}/modules`
        );
        const modules = modulesResponse.data;

        const allMaterials: CourseMaterial[] = [];
        for (const module of modules) {
          try {
            const materialsResponse = await api.get(
              `/courses/modules/${module.id}/materials`
            );
            // Combinar con el estado local actualizado
            const moduleMats = materialsResponse.data.map((serverMaterial: CourseMaterial) => {
              // Buscar si ya tenemos este material marcado como completado localmente
              const localMaterial = updatedMaterials.find(m => m.id === serverMaterial.id);
              if (localMaterial && localMaterial.completed) {
                return { ...serverMaterial, completed: true };
              }
              return serverMaterial;
            });
            allMaterials.push(...moduleMats);
          } catch (error) {
            console.warn(
              `Error loading materials for module ${module.id}:`,
              error
            );
          }
        }
        setModuleMaterials(allMaterials);
      }
    } catch (error: any) {
      console.error("Error completing material:", error);
      showSnackbar("Error al marcar material como completado", "error");
    }
  };

  const handleSaveMaterial = async () => {

    
    // Validación mejorada: intentar recuperar selectedModule y selectedCourse si no están disponibles
    if (!selectedModule || !selectedCourse) {

      
      // Si estamos editando un material, intentar recuperar el contexto
      if (editingMaterial) {
  
        
        // Buscar el módulo que contiene este material
         const foundModule = courseModules.find((module: CourseModuleResponse) => 
           module.materials?.some((mat: CourseMaterialResponse) => mat.id === editingMaterial.id)
         );
        
        if (foundModule) {
          setSelectedModule(foundModule);
          
          // Buscar el curso que contiene este módulo
           if (!selectedCourse) {
             const foundCourse = courses.find((course: Course) => 
               course.modules?.some((mod: CourseModuleResponse) => mod.id === foundModule.id)
             );
            if (foundCourse) {
              setSelectedCourse(foundCourse);
              
              // Reintentar el guardado después de establecer el contexto
              setTimeout(() => handleSaveMaterial(), 100);
              return;
            }
          } else {
            // Solo faltaba el módulo, reintentar
            setTimeout(() => handleSaveMaterial(), 100);
            return;
          }
        }
      }
      
      showSnackbar("Error: Debe seleccionar un módulo y curso. Intente abrir los materiales del módulo primero.", "error");
      return;
    }

    // Si estamos editando un material existente, permitir todas las operaciones
    if (editingMaterial) {
      // Validar que el título no esté vacío
      if (!materialFormData.title.trim()) {
        showSnackbar("Por favor, ingresa un título para el material", "error");
        return;
      }
    } else {
      // Validar que el título no esté vacío
      if (!materialFormData.title.trim()) {
        showSnackbar("Por favor, ingresa un título para el material", "error");
        return;
      }

      // Validar según el tipo de material
      if (materialFormData.material_type === MaterialType.LINK) {
        // Para enlaces, validar que se haya ingresado una URL
        if (!materialFormData.file_url) {
          showSnackbar("Por favor, ingresa una URL para el enlace", "error");
          return;
        }
      } else {
        // Para archivos PDF y VIDEO, validar que se haya subido un archivo
        if (!uploadedFileInfo || !selectedFile) {
          showSnackbar("Por favor, sube un archivo antes de crear el material", "error");
          return;
        }
      }
    }

    try {
      if (editingMaterial) {
        // Actualizar material existente
        const materialData = {
          title: materialFormData.title,
          description: materialFormData.description,
          material_type: materialFormData.material_type,
          order_index: materialFormData.order_index,
          is_downloadable: materialFormData.is_downloadable,
          is_required: materialFormData.is_required,
          file_url: materialFormData.material_type === MaterialType.LINK ? materialFormData.file_url : undefined,
        };
        
        const updateResponse = await api.put(`/courses/materials/${editingMaterial.id}`, materialData);
        showSnackbar("Material actualizado exitosamente", "success");
      } else {
        // Crear nuevo material
        if (materialFormData.material_type === MaterialType.LINK) {
          // Para enlaces, usar la API de materiales
          const materialData = {
            title: materialFormData.title,
            description: materialFormData.description,
            material_type: materialFormData.material_type,
            order_index: materialFormData.order_index,
            is_downloadable: materialFormData.is_downloadable,
            is_required: materialFormData.is_required,
            module_id: selectedModule.id,
            file_url: materialFormData.file_url,
          };
          
          const linkResponse = await api.post(`/courses/modules/${selectedModule.id}/materials`, materialData);
        } else {
          // Para archivos PDF y VIDEO, usar la API de subida de archivos
          if (!selectedFile) {
            showSnackbar("No hay archivo seleccionado", "error");
            return;
          }
          
          const formData = new FormData();
          formData.append("file", selectedFile);
          
          const response = await api.post(`/files/course-material/${selectedModule.id}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          
          // Actualizar el título y descripción si es necesario
          if (materialFormData.title !== selectedFile.name.split('.')[0] || materialFormData.description) {
            const materialId = response.data.material_id;
            
            const updateData = {
              title: materialFormData.title,
              description: materialFormData.description,
              order_index: materialFormData.order_index,
              is_downloadable: materialFormData.is_downloadable,
              is_required: materialFormData.is_required,
            };
            
            const updateResponse = await api.put(`/courses/materials/${materialId}`, updateData);
          }
        }
        
        showSnackbar("Material creado exitosamente", "success");
      }

      // Recargar materiales
      const response = await api.get(
        `/courses/modules/${selectedModule.id}/materials`
      );
      setModuleMaterials(response.data);


      // Cerrar diálogo y limpiar formulario
      setOpenMaterialEditDialog(false);
      setEditingMaterial(null);
      setMaterialFormData({
        title: "",
        description: "",
        material_type: MaterialType.PDF,
        file_url: "",
        order_index: 0,
        is_downloadable: true,
        is_required: true,
      });
      setUploadedFileInfo(null);
      setSelectedFile(null);
      
    } catch (error: any) {
      
      showErrorDialog(
        "Error al guardar material",
        "No se pudo guardar el material. Por favor, verifique los datos ingresados e intente nuevamente."
      );
      showSnackbar("Error al guardar material", "error");
    }
  };

  const handleDeleteMaterial = (material: CourseMaterialResponse) => {
    setMaterialToDelete(material);
    setOpenDeleteMaterialDialog(true);
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) {
      return;
    }

    // Validación mejorada: intentar recuperar selectedModule y selectedCourse si no están disponibles
    if (!selectedModule || !selectedCourse) {
      
      // Buscar el módulo que contiene este material
      const foundModule = courseModules.find((module: CourseModuleResponse) => 
        module.materials?.some((mat: CourseMaterialResponse) => mat.id === materialToDelete.id)
      );
      
      if (foundModule) {

        setSelectedModule(foundModule);
        
        // Buscar el curso que contiene este módulo
        if (!selectedCourse) {
          const foundCourse = courses.find((course: Course) => 
            course.modules?.some((mod: CourseModuleResponse) => mod.id === foundModule.id)
          );
          if (foundCourse) {
            setSelectedCourse(foundCourse);
            
            // Reintentar la eliminación después de establecer el contexto
            setTimeout(() => confirmDeleteMaterial(), 100);
            return;
          }
        } else {
          // Solo faltaba el módulo, reintentar
          setTimeout(() => confirmDeleteMaterial(), 100);
          return;
        }
      }
      
      showSnackbar("Error: No se puede eliminar el material. Intente abrir los materiales del módulo primero.", "error");
      return;
    }

    try {
      await api.delete(`/courses/materials/${materialToDelete.id}`);
      showSnackbar("Material eliminado exitosamente", "success");

      // Recargar materiales
      const response = await api.get(
        `/courses/modules/${selectedModule.id}/materials`
      );
      setModuleMaterials(response.data);
    } catch (error) {
      showErrorDialog(
        "Error al eliminar material",
        "No se pudo eliminar el material. Por favor, intente nuevamente."
      );
      showSnackbar("Error al eliminar material", "error");
    } finally {
      setOpenDeleteMaterialDialog(false);
      setMaterialToDelete(null);
    }
  };

  const cancelDeleteMaterial = () => {
    setOpenDeleteMaterialDialog(false);
    setMaterialToDelete(null);
  };

  // Función para detectar y convertir URLs de YouTube
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  // Funciones para previsualización de contenido
  const handlePreviewMaterial = (material: CourseMaterialResponse) => {
    
    if (material.material_type === MaterialType.PDF && material.file_url) {
      const newPreviewContent = {
         type: "pdf" as const,
         content: material.file_url,
         title: material.title,
       };
      setPreviewContent(newPreviewContent);
      setOpenPreviewDialog(true);
    } else if (
      material.material_type === MaterialType.VIDEO &&
      material.file_url
    ) {
      const newPreviewContent = {
         type: "video" as const,
         content: material.file_url,
         title: material.title,
       };
      setPreviewContent(newPreviewContent);
      setOpenPreviewDialog(true);
    } else if (
      material.material_type === MaterialType.LINK &&
      material.file_url
    ) {
      // Verificar si es un enlace de YouTube
      const youtubeEmbedUrl = getYouTubeEmbedUrl(material.file_url);
      if (youtubeEmbedUrl) {
        const newPreviewContent = {
           type: "youtube" as const,
           content: youtubeEmbedUrl,
           title: material.title,
         };

        setPreviewContent(newPreviewContent);
      } else {

        const newPreviewContent = {
           type: "url" as const,
           content: material.file_url,
           title: material.title,
         };

        setPreviewContent(newPreviewContent);
      }
      setOpenPreviewDialog(true);
    } else {

      showSnackbar(
        "Este tipo de material no se puede previsualizar o no tiene URL/archivo configurado",
        "error"
      );
    }

  };

  const handleClosePreview = () => {
    setOpenPreviewDialog(false);
    setPreviewContent({ type: "pdf", content: "", title: "" });
  };

  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case MaterialType.PDF:
        return <PictureAsPdf />;
      case MaterialType.VIDEO:
        return <VideoLibrary />;
      case MaterialType.LINK:
        return <LinkIcon />;
      default:
        return <Description />;
    }
  };

  const getStatusColor = (course: Course | Curso) => {
    // Handle new Course interface
    if ("status" in course && course.status) {
      switch (course.status) {
        case CourseStatus.DRAFT:
          return "default";
        case CourseStatus.PUBLISHED:
          return "success";
        case CourseStatus.ARCHIVED:
          return "secondary";
        default:
          return "default";
      }
    }

    // Handle legacy Curso interface
    const legacyCourse = course as Curso;
    const now = new Date();
    const startDate = legacyCourse.fecha_inicio
      ? new Date(legacyCourse.fecha_inicio)
      : null;
    const endDate = legacyCourse.fecha_fin
      ? new Date(legacyCourse.fecha_fin)
      : null;

    if (!legacyCourse.activo) return "default";
    if (startDate && now < startDate) return "info";
    if (endDate && now > endDate) return "secondary";
    return "success";
  };

  const getStatusLabel = (course: Course | Curso) => {
    // Handle new Course interface
    if ("status" in course && course.status) {
      switch (course.status) {
        case CourseStatus.DRAFT:
          return "Borrador";
        case CourseStatus.PUBLISHED:
          return "Publicado";
        case CourseStatus.ARCHIVED:
          return "Archivado";
        default:
          return "Desconocido";
      }
    }

    // Handle legacy Curso interface
    const legacyCourse = course as Curso;
    const now = new Date();
    const startDate = legacyCourse.fecha_inicio
      ? new Date(legacyCourse.fecha_inicio)
      : null;
    const endDate = legacyCourse.fecha_fin
      ? new Date(legacyCourse.fecha_fin)
      : null;

    if (!legacyCourse.activo) return "Inactivo";
    if (startDate && now < startDate) return "Próximo";
    if (endDate && now > endDate) return "Finalizado";
    return "En Curso";
  };

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Duración</TableCell>
            <TableCell>Fecha Inicio</TableCell>
            <TableCell>Fecha Fin</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Cargando cursos...
              </TableCell>
            </TableRow>
          ) : courses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No se encontraron cursos
              </TableCell>
            </TableRow>
          ) : (
            (courses || []).map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <Typography variant="subtitle2">{course.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {course.descripcion
                      ? course.descripcion.substring(0, 50) + "..."
                      : "Sin descripción"}
                  </Typography>
                </TableCell>
                <TableCell>{course.duracion_horas}h</TableCell>
                <TableCell>
                  {course.fecha_inicio
                    ? formatDate(course.fecha_inicio)
                    : "Sin fecha"}
                </TableCell>
                <TableCell>
                  {course.fecha_fin
                    ? formatDate(course.fecha_fin)
                    : "Sin fecha"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(course)}
                    color={getStatusColor(course) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {canUpdateCourses() && (
                    <IconButton
                      color="primary"
                      onClick={() => handleEditCourse(course)}
                      size="small"
                      title="Editar curso"
                    >
                      <Edit />
                    </IconButton>
                  )}
                  {(canCreateModules() || canReadModules()) && (
                    <IconButton
                      color="secondary"
                      onClick={() => handleOpenModules(course)}
                      size="small"
                      title="Gestionar módulos"
                    >
                      <FolderOpen />
                    </IconButton>
                  )}
                  {(canCreateMaterials() || canReadMaterials()) && (
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenCourseMaterials(course)}
                      size="small"
                      title="Gestionar materiales"
                    >
                      <LibraryBooks />
                    </IconButton>
                  )}
                  {(course.course_type === CourseType.OPTIONAL ||
                    course.course_type === CourseType.ENTERTAINMENT) && (
                    <IconButton
                      color="info"
                      onClick={() => handleGenerateAttendanceReport(course)}
                      size="small"
                      title="Generar reporte de asistencia"
                    >
                      <PictureAsPdf />
                    </IconButton>
                  )}
                  {canDeleteCourses() && (
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteCourse(course)}
                      size="small"
                      title="Eliminar curso"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={totalCourses}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Filas por página:"
      />
    </TableContainer>
  );

  const renderCardView = () => (
    <Grid container spacing={3}>
      {(courses || []).map((course) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {course.titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {course.descripcion || "Sin descripción"}
              </Typography>
              <Box sx={{ mt: 2, mb: 1 }}>
                <Chip
                  label={getStatusLabel(course)}
                  color={getStatusColor(course) as any}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`${course.duracion_horas}h`}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Typography variant="caption" display="block">
                {course.fecha_inicio && course.fecha_fin
                  ? `${formatDate(course.fecha_inicio)} - ${formatDate(
                      course.fecha_fin
                    )}`
                  : "Fechas no definidas"}
              </Typography>
            </CardContent>
            <CardActions>
              {canUpdateCourses() && (
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => handleEditCourse(course)}
                >
                  Editar
                </Button>
              )}
              {(canCreateModules() || canReadModules()) && (
                <Button
                  size="small"
                  startIcon={<FolderOpen />}
                  onClick={() => handleOpenModules(course)}
                >
                  Módulos
                </Button>
              )}
              {(canCreateMaterials() || canReadMaterials()) && (
                <Button
                  size="small"
                  startIcon={<LibraryBooks />}
                  onClick={() => handleOpenCourseMaterials(course)}
                >
                  Materiales
                </Button>
              )}
              {(course.course_type === CourseType.OPTIONAL ||
                course.course_type === CourseType.ENTERTAINMENT) && (
                <Button
                  size="small"
                  color="info"
                  startIcon={<PictureAsPdf />}
                  onClick={() => handleGenerateAttendanceReport(course)}
                >
                  PDF
                </Button>
              )}
              {canDeleteCourses() && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleDeleteCourse(course)}
                >
                  Eliminar
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Vista específica para empleados
  const renderEmployeeView = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mis Cursos
      </Typography>

      {/* Barra de búsqueda para empleados */}
      <Box sx={{ mb: 3 }}>
        <UppercaseTextField
          placeholder="Buscar mis cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ minWidth: 300 }}
        />
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchEnrolledCourses}
          sx={{ ml: 2 }}
        >
          Actualizar
        </Button>
      </Box>

      {/* Lista de cursos inscritos */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <Typography>Cargando cursos...</Typography>
        </Box>
      ) : enrolledCourses.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No tienes cursos asignados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contacta a tu supervisor para obtener acceso a cursos
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {enrolledCourses.map((enrollment) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={enrollment.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {enrollment.course?.title || "Curso sin título"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {enrollment.course?.description || "Sin descripción"}
                  </Typography>

                  {/* Progreso del curso */}
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Progreso</Typography>
                      <Typography variant="body2">
                        {Math.round(enrollment.progress || 0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={enrollment.progress || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Estado del curso */}
                  <Box
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}
                  >
                    {(() => {
                      const status: string = (
                        enrollment.status || ""
                      ).toLowerCase();
                      const isCompleted =
                        status === "completed" ||
                        (enrollment.progress || 0) >= 100;
                      const isInProgress =
                        status === "active" ||
                        status === "in_progress" ||
                        ((enrollment.progress || 0) > 0 &&
                          (enrollment.progress || 0) < 100);
                      const label = isCompleted
                        ? "Completado"
                        : isInProgress
                        ? "En Progreso"
                        : "No Iniciado";
                      const color: any = isCompleted
                        ? "success"
                        : isInProgress
                        ? "primary"
                        : "default";
                      const icon = isCompleted ? (
                        <CheckCircle />
                      ) : isInProgress ? (
                        <PlayArrow />
                      ) : undefined;
                      return (
                        <Chip
                          label={label}
                          color={color}
                          size="small"
                          icon={icon}
                        />
                      );
                    })()}
                    {enrollment.course?.duration_hours && (
                      <Chip
                        label={`${enrollment.course.duration_hours}h`}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Fechas */}
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    Inscrito:{" "}
                    {enrollment.enrolled_at
                      ? formatDate(enrollment.enrolled_at)
                      : "N/A"}
                  </Typography>
                  {enrollment.completed_at && (
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      Completado: {formatDate(enrollment.completed_at)}
                    </Typography>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      (enrollment.status || "").toLowerCase() === "completed" ||
                      (enrollment.progress || 0) >= 100 ? (
                        <Visibility />
                      ) : (
                        <PlayArrow />
                      )
                    }
                    onClick={() => {
                      // Navegar al curso
                      if (enrollment.course?.id) {
                        window.location.href = `/employee/courses/${enrollment.course.id}`;
                      } else {
                        console.error('Course ID is undefined for enrollment:', enrollment);
                      }
                    }}
                  >
                    {(enrollment.status || "").toLowerCase() === "completed" ||
                    (enrollment.progress || 0) >= 100
                      ? "Revisar"
                      : "Continuar"}
                  </Button>
                  {enrollment.course?.modules &&
                    enrollment.course.modules.length > 0 && (
                      <Button
                        size="small"
                        startIcon={<FolderOpen />}
                        onClick={() => {
                          // Mostrar módulos del curso
                          setSelectedCourse(enrollment.course);
                          setCourseModules(enrollment.course.modules || []);
                          setOpenModuleDialog(true);
                        }}
                      >
                        Módulos ({enrollment.course.modules.length})
                      </Button>
                    )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {user?.role === "employee" ? (
        renderEmployeeView()
      ) : (
        <>
          <Typography variant="h4" gutterBottom>
            Gestión de Cursos
          </Typography>

          {/* Barra de herramientas */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <TextField
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            {canCreateCourses() && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateCourse}
              >
                Nuevo Curso
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchCourses}
            >
              Actualizar
            </Button>
            <FormControl size="small">
              <InputLabel>Vista</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) =>
                  setViewMode(e.target.value as "table" | "cards")
                }
                label="Vista"
              >
                <MenuItem value="table">Tabla</MenuItem>
                <MenuItem value="cards">Tarjetas</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Contenido principal */}
          {viewMode === "table" ? renderTableView() : renderCardView()}
        </>
      )}

      {/* Dialog para crear/editar curso */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCourse ? "Editar Curso" : "Crear Nuevo Curso"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                label="Título"
                value={formData.title || formData.titulo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    titulo: e.target.value,
                  })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Descripción"
                value={formData.description || formData.descripcion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                    descripcion: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Curso</InputLabel>
                <Select
                  value={formData.course_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_type: e.target.value as CourseType,
                    })
                  }
                  label="Tipo de Curso"
                >
                  <MenuItem value={CourseType.INDUCTION}>Inducción</MenuItem>
                  <MenuItem value={CourseType.REINDUCTION}>
                    Reinducción
                  </MenuItem>
                  <MenuItem value={CourseType.MANDATORY}>Obligatorio</MenuItem>
                  <MenuItem value={CourseType.OPTIONAL}>Opcional</MenuItem>
                  <MenuItem value={CourseType.TRAINING}>Entrenamiento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as CourseStatus,
                    })
                  }
                  label="Estado"
                >
                  <MenuItem value={CourseStatus.DRAFT}>Borrador</MenuItem>
                  <MenuItem value={CourseStatus.PUBLISHED}>Publicado</MenuItem>
                  <MenuItem value={CourseStatus.ARCHIVED}>Archivado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Duración (horas)"
                type="number"
                value={formData.duration_hours || formData.duracion_horas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_hours: parseInt(e.target.value),
                    duracion_horas: parseInt(e.target.value),
                  })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Puntaje Mínimo (%)"
                type="number"
                value={formData.passing_score}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passing_score: parseFloat(e.target.value),
                  })
                }
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Intentos Máximos"
                type="number"
                value={formData.max_attempts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_attempts: parseInt(e.target.value),
                  })
                }
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Orden"
                type="number"
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_index: parseInt(e.target.value),
                  })
                }
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Fecha de Expiración"
                type="date"
                value={formData.expires_at || formData.fecha_fin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expires_at: e.target.value,
                    fecha_fin: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="URL de Miniatura"
                value={formData.thumbnail}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnail: e.target.value })
                }
                fullWidth
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_mandatory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_mandatory: e.target.checked,
                      })
                    }
                  />
                }
                label="Curso Obligatorio"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveCourse} variant="contained">
            {editingCourse ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para gestionar módulos */}
      <Dialog
        open={openModuleDialog}
        onClose={() => setOpenModuleDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Gestionar Módulos - {selectedCourse?.title}
          {canCreateModules() && (
            <Button
              onClick={handleCreateModule}
              variant="contained"
              size="small"
              startIcon={<Add />}
              sx={{ float: "right" }}
            >
              Nuevo Módulo
            </Button>
          )}
        </DialogTitle>
        <DialogContent>
          {courseModules && courseModules.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Duración (min)</TableCell>
                  <TableCell>Orden</TableCell>
                  <TableCell>Requerido</TableCell>
                  <TableCell>Materiales</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courseModules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {module.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {module.description || "Sin descripción"}
                      </Typography>
                    </TableCell>
                    <TableCell>{module.duration_minutes || 0}</TableCell>
                    <TableCell>{module.order_index}</TableCell>
                    <TableCell>
                      <Chip
                        label={module.is_required ? "Sí" : "No"}
                        color={module.is_required ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Description />}
                        onClick={() => handleOpenMaterials(module)}
                      >
                        {module.materials?.length || 0} materiales
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      {canUpdateModules() && (
                        <IconButton
                          color="primary"
                          onClick={() => handleEditModule(module)}
                          size="small"
                          title="Editar módulo"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {canDeleteModules() && (
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteModule(module)}
                          size="small"
                          title="Eliminar módulo"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 4 }}
            >
              No hay módulos creados. Haga clic en "Nuevo Módulo" para comenzar.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModuleDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar módulo */}
      <Dialog
        open={openModuleEditDialog}
        onClose={() => {
          setOpenModuleEditDialog(false);
          setEditingModule(null);
          setModuleFormData({
            title: "",
            description: "",
            order_index: 0,
            duration_minutes: undefined,
            is_required: true,
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingModule ? "Editar Módulo" : "Crear Nuevo Módulo"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                label="Título"
                value={moduleFormData.title}
                onChange={(e) =>
                  setModuleFormData({
                    ...moduleFormData,
                    title: e.target.value,
                  })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Descripción"
                value={moduleFormData.description}
                onChange={(e) =>
                  setModuleFormData({
                    ...moduleFormData,
                    description: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Duración (minutos)"
                type="number"
                value={moduleFormData.duration_minutes || ""}
                onChange={(e) =>
                  setModuleFormData({
                    ...moduleFormData,
                    duration_minutes: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Orden"
                type="number"
                value={moduleFormData.order_index}
                onChange={(e) =>
                  setModuleFormData({
                    ...moduleFormData,
                    order_index: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={moduleFormData.is_required}
                    onChange={(e) =>
                      setModuleFormData({
                        ...moduleFormData,
                        is_required: e.target.checked,
                      })
                    }
                  />
                }
                label="Módulo Requerido"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenModuleEditDialog(false);
              setEditingModule(null);
              setModuleFormData({
                title: "",
                description: "",
                order_index: 0,
                duration_minutes: undefined,
                is_required: true,
              });
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveModule} variant="contained">
            {editingModule ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para gestionar materiales */}
      <Dialog
        open={openMaterialDialog}
        onClose={() => {
          setOpenMaterialDialog(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Gestionar Materiales - {selectedModule?.title}
          {canCreateMaterials() && (
            <Button
              onClick={handleCreateMaterial}
              variant="contained"
              size="small"
              startIcon={<Add />}
              sx={{ float: "right" }}
            >
              Nuevo Material
            </Button>
          )}
        </DialogTitle>
        <DialogContent>
          {moduleMaterials && moduleMaterials.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Orden</TableCell>
                  <TableCell>Requerido</TableCell>
                  <TableCell>Descargable</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {moduleMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getMaterialIcon(material.material_type)}
                        <Typography variant="caption">
                          {material.material_type.toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {material.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {material.description || "Sin descripción"}
                      </Typography>
                    </TableCell>
                    <TableCell>{material.order_index}</TableCell>
                    <TableCell>
                      <Chip
                        label={material.is_required ? "Sí" : "No"}
                        color={material.is_required ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={material.is_downloadable ? "Sí" : "No"}
                        color={material.is_downloadable ? "info" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user?.role === 'admin' ? (
                        <Chip
                          label="N/A"
                          color="default"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label={material.completed ? "Completado" : "Pendiente"}
                          color={material.completed ? "success" : "warning"}
                          size="small"
                          icon={material.completed ? <CheckCircle /> : undefined}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="info"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePreviewMaterial(material);
                        }}
                        size="small"
                        title="Previsualizar contenido"
                        disabled={
                          !(
                            material.material_type === MaterialType.PDF &&
                            material.file_url
                          ) &&
                          !(
                            material.material_type === MaterialType.VIDEO &&
                            material.file_url
                          ) &&
                          !(
                            material.material_type === MaterialType.LINK &&
                            material.file_url
                          )
                        }
                      >
                        <Visibility />
                      </IconButton>
                      {canUpdateMaterials() && (
                        <IconButton
                          color="primary"
                          onClick={() => handleEditMaterial(material)}
                          size="small"
                          title="Editar material"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {canDeleteMaterials() && (
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteMaterial(material)}
                          size="small"
                          title="Eliminar material"
                        >
                          <Delete />
                        </IconButton>
                      )}
                      {user?.role !== 'admin' && (
                        <IconButton
                          color="success"
                          onClick={() => handleMaterialComplete(material)}
                          size="small"
                          title="Marcar como completado"
                        >
                          <CheckCircle />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 4 }}
            >
              No hay materiales creados. Haga clic en "Nuevo Material" para
              comenzar.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaterialDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar material */}
      <Dialog
        open={openMaterialEditDialog}
        onClose={() => {
          setOpenMaterialEditDialog(false);
          setEditingMaterial(null);
          setMaterialFormData({
            title: "",
            description: "",
            material_type: MaterialType.PDF,
            file_url: "",
            order_index: 0,
            is_downloadable: true,
            is_required: true,
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingMaterial ? "Editar Material" : "Crear Nuevo Material"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                label="Título"
                value={materialFormData.title}
                onChange={(e) =>
                  setMaterialFormData({
                    ...materialFormData,
                    title: e.target.value,
                  })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Descripción"
                value={materialFormData.description}
                onChange={(e) =>
                  setMaterialFormData({
                    ...materialFormData,
                    description: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Material</InputLabel>
                <Select
                  value={materialFormData.material_type}
                  onChange={(e) =>
                    setMaterialFormData({
                      ...materialFormData,
                      material_type: e.target.value as MaterialType,
                    })
                  }
                  label="Tipo de Material"
                >
                  <MenuItem value={MaterialType.PDF}>PDF</MenuItem>
                  <MenuItem value={MaterialType.VIDEO}>Video</MenuItem>
                  <MenuItem value={MaterialType.LINK}>Enlace</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Orden"
                type="number"
                value={materialFormData.order_index}
                onChange={(e) =>
                  setMaterialFormData({
                    ...materialFormData,
                    order_index: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            {/* Campos específicos según el tipo de material */}
            {materialFormData.material_type === MaterialType.LINK ? (
              <Grid size={12}>
                <TextField
                  label="URL del Enlace"
                  value={materialFormData.file_url || ""}
                  onChange={(e) =>
                    setMaterialFormData({
                      ...materialFormData,
                      file_url: e.target.value,
                    })
                  }
                  fullWidth
                  placeholder="https://ejemplo.com/recurso"
                  required
                />
              </Grid>
            ) : (
              <>
                {/* Botón de subida de archivos para PDF y Video */}
                {(materialFormData.material_type === MaterialType.PDF ||
                  materialFormData.material_type === MaterialType.VIDEO) && (
                  <Grid size={12}>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUpload />}
                          disabled={uploadingFile}
                          sx={{ minWidth: 200 }}
                        >
                          {uploadingFile ? "Subiendo..." : "Subir Archivo"}
                          <input
                            type="file"
                            hidden
                            accept={
                              materialFormData.material_type ===
                              MaterialType.PDF
                                ? ".pdf"
                                : "video/*"
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFile(file);
                                handleFileUpload(file);
                              }
                            }}
                          />
                        </Button>
                        {uploadingFile && (
                          <LinearProgress sx={{ flexGrow: 1 }} />
                        )}
                      </Box>

                      {/* Mostrar información del archivo subido */}
                      {uploadedFileInfo && (
                        <Card
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: "success.light",
                            color: "success.contrastText",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <CheckCircle color="success" />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: "bold" }}
                              >
                                Archivo subido exitosamente
                              </Typography>
                              <Typography variant="body2">
                                <strong>Nombre:</strong> {uploadedFileInfo.name}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Tamaño:</strong>{" "}
                                {(uploadedFileInfo.size / 1024 / 1024).toFixed(
                                  2
                                )}{" "}
                                MB
                              </Typography>
                              <Typography variant="body2">
                                <strong>Tipo:</strong> {uploadedFileInfo.type}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setUploadedFileInfo(null)}
                              sx={{
                                color: "success.main",
                                borderColor: "success.main",
                              }}
                            >
                              Cambiar
                            </Button>
                          </Box>
                        </Card>
                      )}
                    </Box>
                  </Grid>
                )}
              </>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={materialFormData.is_required}
                    onChange={(e) =>
                      setMaterialFormData({
                        ...materialFormData,
                        is_required: e.target.checked,
                      })
                    }
                  />
                }
                label="Material Requerido"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={materialFormData.is_downloadable}
                    onChange={(e) =>
                      setMaterialFormData({
                        ...materialFormData,
                        is_downloadable: e.target.checked,
                      })
                    }
                  />
                }
                label="Descargable"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenMaterialEditDialog(false);
              setEditingMaterial(null);
              setMaterialFormData({
                title: "",
                description: "",
                material_type: MaterialType.PDF,
                file_url: "",
                order_index: 0,
                is_downloadable: true,
                is_required: true,
              });
              setUploadedFileInfo(null);
              setSelectedFile(null);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={() => {
            handleSaveMaterial();
          }} variant="contained">
            {editingMaterial ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para previsualización de contenido */}
      <Dialog
        open={openPreviewDialog}
        onClose={() => {
          handleClosePreview();
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: "80vh" },
        }}
      >
        <DialogTitle>Previsualización: {previewContent.title}</DialogTitle>
        <DialogContent sx={{ p: 0, height: "100%" }}>
          {previewContent.type === "pdf" ? (
            <Box sx={{ width: "100%", height: "100%" }}>
              <PDFViewer
                url={getPreviewUrl(previewContent.content)}
                title={previewContent.title}
              />
            </Box>
          ) : previewContent.type === "video" ? (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
              }}
            >
              <video
                controls
                width="100%"
                height="auto"
                style={{ maxHeight: "100%", maxWidth: "100%" }}
                title={previewContent.title}
              >
                <source
                  src={previewContent.content.startsWith('/uploads/') ? previewContent.content : `/uploads/${previewContent.content}`}
                  type="video/mp4"
                />
                <source
                  src={previewContent.content.startsWith('/uploads/') ? previewContent.content : `/uploads/${previewContent.content}`}
                  type="video/webm"
                />
                <source
                  src={previewContent.content.startsWith('/uploads/') ? previewContent.content : `/uploads/${previewContent.content}`}
                  type="video/ogg"
                />
                Tu navegador no soporta el elemento de video.
              </video>
            </Box>
          ) : previewContent.type === "youtube" ? (
            <Box sx={{ width: "100%", height: "100%" }}>
              <iframe
                src={previewContent.content}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title={previewContent.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          ) : previewContent.type === "url" ? (
            <Box sx={{ width: "100%", height: "100%" }}>
              <iframe
                src={previewContent.content}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title={previewContent.title}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography>No se puede previsualizar este contenido</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={cancelDeleteCourse}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="warning" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              📋 Requisito previo:
            </Typography>
            <Typography variant="body2">
              Antes de eliminar este curso, debe{" "}
              <strong>desasociar a todos los trabajadores</strong> que estén
              inscritos. El sistema no permitirá la eliminación si hay empleados
              asignados al curso.
            </Typography>
          </Alert>

          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              ⚠️ ADVERTENCIA: Esta acción es irreversible
            </Typography>
          </Alert>

          <Typography variant="body1" gutterBottom>
            ¿Está seguro de que desea eliminar el curso{" "}
            <strong>"{courseToDelete?.title || courseToDelete?.titulo}"</strong>
            ?
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, mb: 2 }}
          >
            Al eliminar este curso, también se eliminarán automáticamente:
          </Typography>

          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography
              component="li"
              variant="body2"
              color="error"
              sx={{ mb: 0.5 }}
            >
              <Error fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
              Todas las <strong>encuestas</strong> asociadas al curso
            </Typography>
            <Typography
              component="li"
              variant="body2"
              color="error"
              sx={{ mb: 0.5 }}
            >
              <Error fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
              Todas las <strong>evaluaciones</strong> del curso
            </Typography>
            <Typography
              component="li"
              variant="body2"
              color="error"
              sx={{ mb: 0.5 }}
            >
              <Error fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
              Todas las <strong>inscripciones de trabajadores</strong> al curso
            </Typography>
            <Typography
              component="li"
              variant="body2"
              color="error"
              sx={{ mb: 0.5 }}
            >
              <Error fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
              Todos los <strong>certificados</strong> emitidos para este curso
            </Typography>
            <Typography
              component="li"
              variant="body2"
              color="error"
              sx={{ mb: 0.5 }}
            >
              <Error fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
              Todo el <strong>progreso de los estudiantes</strong> en el curso
            </Typography>
            <Typography component="li" variant="body2" color="error">
              <Error fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
              Todos los <strong>módulos y materiales</strong> del curso
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Esta acción afectará todo el flujo de trabajo relacionado con este
              curso y no se puede deshacer.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={cancelDeleteCourse}
            variant="outlined"
            color="primary"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteCourse}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Eliminar Definitivamente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar módulo */}
      <Dialog
        open={openDeleteModuleDialog}
        onClose={cancelDeleteModule}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="warning" />
          Confirmar Eliminación de Módulo
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Está seguro de que desea eliminar el módulo{" "}
            <strong>"{moduleToDelete?.title}"</strong>?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Esta acción eliminará permanentemente el módulo y todos sus
              materiales asociados. Esta acción no se puede deshacer.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={cancelDeleteModule}
            variant="outlined"
            color="primary"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteModule}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Eliminar Módulo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar material */}
      <Dialog
        open={openDeleteMaterialDialog}
        onClose={cancelDeleteMaterial}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="warning" />
          Confirmar Eliminación de Material
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Está seguro de que desea eliminar el material{" "}
            <strong>"{materialToDelete?.title}"</strong>?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Esta acción eliminará permanentemente el material. Esta acción no
              se puede deshacer.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={cancelDeleteMaterial}
            variant="outlined"
            color="primary"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteMaterial}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Eliminar Material
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
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CoursesManagement;
