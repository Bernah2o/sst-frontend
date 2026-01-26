import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as ExamIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  PictureAsPdf as PdfIcon,
  CloudUpload as UploadIcon,
  Clear as ClearIcon,
  PlaylistAdd as FollowUpIcon,
  PlaylistAddCheck as FollowUpActiveIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Pagination,
  Tooltip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { es } from "date-fns/locale";
import React, { useState, useEffect, useCallback } from "react";


import { adminConfigService } from "../services/adminConfigService";
import api, { apiService } from "../services/api";
import { formatDate } from "../utils/dateUtils";
import { suppliersService, Supplier, Doctor } from "../services/suppliersService";
import profesiogramaService, { TipoExamen } from "../services/profesiogramaService";
import AutocompleteField, { AutocompleteOption } from "../components/AutocompleteField";
import { COLOMBIAN_DEPARTMENTS } from "../data/colombianDepartments";
import { COLOMBIAN_CITIES } from "../data/colombianCities";


// Enums que coinciden con el backend

type MedicalAptitude = "apto" | "apto_con_recomendaciones" | "no_apto";

interface OccupationalExamData {
  id: number;
  worker_id: number;
  worker_name?: string; // Campo calculado del frontend
  worker_document?: string; // Campo calculado del frontend
  worker_position?: string; // Campo calculado del frontend - cargo del trabajador
  worker_hire_date?: string; // Fecha de ingreso del trabajador

  // Campos del modelo backend
  tipo_examen_id: number;
  tipo_examen?: TipoExamen;
  exam_date: string;
  departamento?: string;
  ciudad?: string;
  duracion_cargo_actual_meses?: number;
  factores_riesgo_evaluados?: any;
  cargo_id_momento_examen?: number;
  programa?: string;
  occupational_conclusions?: string;
  preventive_occupational_behaviors?: string;
  general_recommendations?: string;
  medical_aptitude_concept: MedicalAptitude;
  observations?: string;
  examining_doctor?: string;
  medical_center?: string;
  pdf_file_path?: string;
  requires_follow_up?: boolean; // Nuevo campo para seguimiento
  
  // Nuevos campos para suppliers
  supplier_id?: number;
  doctor_id?: number;
  supplier?: Supplier;
  doctor?: Doctor;
  
  created_at: string;
  updated_at: string;
  next_exam_date?: string; // Fecha de próximo examen

  // Campos legacy para compatibilidad (se pueden eliminar gradualmente)
  doctor_name?: string;
  doctor_license?: string;

  restrictions?: string;
  certificate_url?: string;
  expires_at?: string;
}

interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  document_number: string;
  email: string;
  position: string;
  department?: string;
  age: number;
  risk_level: string;
  is_active: boolean;
  assigned_role: string;
  is_registered: boolean;
  photo?: string;
  fecha_de_ingreso?: string;
}

// Interface para programas
interface Programa {
  id: number;
  nombre_programa: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const OccupationalExam: React.FC = () => {
  const [exams, setExams] = useState<OccupationalExamData[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tiposExamen, setTiposExamen] = useState<TipoExamen[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<OccupationalExamData | null>(null);
  const [viewingExam, setViewingExam] = useState<OccupationalExamData | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingExam, setDeletingExam] = useState<OccupationalExamData | null>(
    null
  );
  const [filters, setFilters] = useState({
    tipo_examen_id: "",
    worker: "",
    search: "",
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingIndividualReport, setGeneratingIndividualReport] =
    useState(false);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [examSeguimientos, setExamSeguimientos] = useState<{[key: number]: boolean}>({});
  const [formData, setFormData] = useState({
    worker_id: "",
    worker_name: "",
    worker_position: "",
    worker_hire_date: "",
    tipo_examen_id: "" as string | number,
    exam_date: null as Date | null,
    programa: "",
    occupational_conclusions: "",
    preventive_occupational_behaviors: "",
    general_recommendations: "",
    medical_aptitude_concept: "apto" as MedicalAptitude,
    observations: "",
    examining_doctor: "",
    medical_center: "",
    supplier_id: "",
    doctor_id: "",
    restrictions: "",
    next_exam_date: null as Date | null,
    pdf_file_path: null as string | null,
    requires_follow_up: false,
    duracion_cargo_actual_meses: '',
    factores_riesgo_evaluados: [],
    departamento: '',
    ciudad: '',
  });



  const medicalAptitudeTypes = [
    { value: "apto", label: "Apto", color: "success" },
    {
      value: "apto_con_recomendaciones",
      label: "Apto con Recomendaciones",
      color: "warning",
    },
    { value: "no_apto", label: "No Apto", color: "error" },
  ];





  // Función para verificar si existen seguimientos para los exámenes
  const checkExamSeguimientos = useCallback(async (examIds: number[]) => {
    try {
      const seguimientosMap: {[key: number]: boolean} = {};
      
      // Verificar cada examen si tiene seguimiento asociado
      for (const examId of examIds) {
        try {
          const response = await api.get(`/seguimientos?search=${examId}`);
          const seguimientos = response.data || [];
          // Verificar si algún seguimiento está asociado a este examen
          const hasSeguimiento = seguimientos.some((seg: any) => 
            seg.occupational_exam_id === examId
          );
          seguimientosMap[examId] = hasSeguimiento;
        } catch (error) {
          console.error(`Error checking seguimiento for exam ${examId}:`, error);
          seguimientosMap[examId] = false;
        }
      }
      
      setExamSeguimientos(seguimientosMap);
    } catch (error) {
      console.error("Error checking exam seguimientos:", error);
    }
  }, []);

  // Los datos del trabajador ya vienen del backend, no necesitamos enriquecerlos

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");

      if (filters.tipo_examen_id) params.append("tipo_examen_id", filters.tipo_examen_id.toString());
      if (filters.worker) params.append("worker_id", filters.worker);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(
        `/occupational-exams/?${params.toString()}`
      );
      const examsData = response.data.items || [];

      // Los datos del trabajador ya vienen del backend, no necesitamos enriquecerlos
      setExams(examsData);
      // Use the 'pages' field directly from API response instead of calculating
      setTotalPages(
        response.data.pages || Math.ceil((response.data.total || 0) / 20)
      );
      
      // Verificar seguimientos para los exámenes obtenidos
      if (examsData.length > 0) {
        const examIds = examsData.map((exam: OccupationalExamData) => exam.id);
        await checkExamSeguimientos(examIds);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters, checkExamSeguimientos]);

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await api.get("/workers/", {
        params: {
          is_active: true,
        },
      });
      setWorkers(response.data);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const suppliers = await suppliersService.getActiveSuppliers();
      setSuppliers(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  }, []);

  const fetchDoctorsBySupplier = async (supplierId: number) => {
    try {
      const doctors = await suppliersService.getDoctorsBySupplier(supplierId);
      setDoctors(doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  const handleSupplierChange = async (supplierId: string) => {
    setFormData({ 
      ...formData, 
      supplier_id: supplierId,
      doctor_id: "", // Reset doctor selection
      medical_center: supplierId ? suppliers.find(s => s.id.toString() === supplierId)?.name || "" : "",
      examining_doctor: "" // Reset examining doctor
    });
    
    if (supplierId) {
      await fetchDoctorsBySupplier(parseInt(supplierId));
    } else {
      setDoctors([]);
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    const selectedDoctor = doctors.find(d => d.id.toString() === doctorId);
    setFormData({ 
      ...formData, 
      doctor_id: doctorId,
      examining_doctor: selectedDoctor ? suppliersService.formatDoctorName(selectedDoctor) : ""
    });
  };

  const fetchProgramas = useCallback(async () => {
    try {
      const programas = await adminConfigService.getActiveProgramas();
      setProgramas(programas);
    } catch (error) {
      console.error("Error fetching programas:", error);
      setProgramas([]);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea un archivo PDF
      if (file.type !== 'application/pdf') {
        alert('Por favor seleccione un archivo PDF válido');
        return;
      }
      
      // Validar tamaño del archivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. El tamaño máximo permitido es 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Función para previsualizar PDF con autenticación
  const handlePreviewPdf = async (examId: number) => {
    try {
      const response = await api.get(`/occupational-exams/${examId}/pdf`, {
        responseType: 'blob',
      });
      
      // Verificar si la respuesta es válida
      if (!response.data || response.data.size === 0) {
        throw new Error('El archivo PDF está vacío o no existe');
      }
      
      // Crear URL temporal para el blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Abrir en nueva ventana
      window.open(url, '_blank');
      
      // Limpiar URL después de un tiempo
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      console.error('Error previewing PDF:', error);
      
      let errorMessage = 'Error al previsualizar el PDF.';
      if (error.response) {
        console.error('Error response:', error.response);
        if (error.response.status === 404) {
          errorMessage = 'El archivo PDF no fue encontrado.';
        } else if (error.response.status === 403) {
          errorMessage = 'No tiene permisos para acceder a este archivo.';
        } else if (error.response.status === 500) {
          errorMessage = 'Error interno del servidor al obtener el PDF.';
        } else {
          errorMessage = `Error del servidor: ${error.response.status}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  // Función para descargar PDF con autenticación
  const handleDownloadPdf = async (examId: number, workerName?: string) => {
    try {
      const response = await api.get(`/occupational-exams/${examId}/pdf?download=true`, {
        responseType: 'blob',
      });
      
      // Verificar si la respuesta es válida
      if (!response.data || response.data.size === 0) {
        throw new Error('El archivo PDF está vacío o no existe');
      }
      
      // Crear URL temporal para el blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `Examen_Ocupacional_${workerName?.replace(/\s+/g, '_') || examId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      
      let errorMessage = 'Error al descargar el PDF.';
      if (error.response) {
        console.error('Error response:', error.response);
        if (error.response.status === 404) {
          errorMessage = 'El archivo PDF no fue encontrado.';
        } else if (error.response.status === 403) {
          errorMessage = 'No tiene permisos para acceder a este archivo.';
        } else if (error.response.status === 500) {
          errorMessage = 'Error interno del servidor al obtener el PDF.';
        } else {
          errorMessage = `Error del servidor: ${error.response.status}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      worker_id: "",
      worker_name: "",
      worker_position: "",
      worker_hire_date: "",
      tipo_examen_id: "",
      exam_date: null,
      programa: "",
      occupational_conclusions: "",
      preventive_occupational_behaviors: "",
      general_recommendations: "",
      medical_aptitude_concept: "apto",
      observations: "",
      examining_doctor: "",
      medical_center: "",
      supplier_id: "",
      doctor_id: "",

        restrictions: "",
        next_exam_date: null,
        pdf_file_path: null,
        requires_follow_up: false,
    duracion_cargo_actual_meses: '',
    factores_riesgo_evaluados: [],
    departamento: '',
    ciudad: '',
    });
    setSelectedFile(null);
  };

  const handleSaveExam = async () => {
    try {
      const durValue = formData.duracion_cargo_actual_meses;
      if (durValue === null || durValue === undefined || durValue === '') {
        alert("Duración del cargo actual (meses) es obligatoria (Art. 15)");
        return;
      }

      const factores = formData.factores_riesgo_evaluados as any[];
      if (!Array.isArray(factores) || factores.length === 0) {
        alert('Debe incluir al menos un factor de riesgo evaluado (Art. 15)');
        return;
      }

      let pdfFilePath = null;

      // Si hay un archivo PDF seleccionado, subirlo primero
      if (selectedFile) {
        setUploadingPdf(true);
        try {
          const uploadResponse = await apiService.uploadOccupationalExamPdf(selectedFile);
          pdfFilePath = uploadResponse.file_path;
        } catch (error) {
          console.error("Error uploading PDF:", error);
          throw error;
        } finally {
          setUploadingPdf(false);
        }
      }

      const payload: any = {
        ...formData,
        worker_id: parseInt(formData.worker_id),
        exam_date: formData.exam_date?.toISOString().split("T")[0],
        next_exam_date: formData.next_exam_date?.toISOString().split("T")[0],
        pdf_file_path: pdfFilePath || formData.pdf_file_path,
        duracion_cargo_actual_meses: formData.duracion_cargo_actual_meses ? Number(formData.duracion_cargo_actual_meses) : undefined,

        factores_riesgo_evaluados: formData.factores_riesgo_evaluados || [],
      };

      let examResponse;
      if (editingExam) {
        examResponse = await api.put(`/occupational-exams/${editingExam.id}`, payload);
        examResponse.data = { ...editingExam, ...payload };
      } else {
        examResponse = await api.post("/occupational-exams/", payload);
      }

      fetchExams();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving exam:", error);
    }
  };

  const handleDeleteExam = (exam: OccupationalExamData) => {
    setDeletingExam(exam);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteExam = async () => {
    if (!deletingExam) return;

    try {
      await api.delete(`/occupational-exams/${deletingExam.id}`);
      fetchExams();
      setOpenDeleteDialog(false);
      setDeletingExam(null);
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  };

  const handleDownloadCertificate = async (exam: OccupationalExamData) => {
    try {
      const response = await api.get(
        `/occupational-exams/${exam.id}/certificate`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `certificado_${exam.worker_name}_${exam.exam_date}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading certificate:", error);
    }
  };

  const fetchAndSetExamCalculations = async (workerId: string, hireDateStr: string, examDate: Date | null) => {
    if (!examDate) return;

    // Calcular duración si hay fecha de ingreso
    let duracionMesesStr = '';
    if (hireDateStr) {
      const ingreso = new Date(hireDateStr);
      let months = (examDate.getFullYear() - ingreso.getFullYear()) * 12;
      months -= ingreso.getMonth();
      months += examDate.getMonth();
      if (examDate.getDate() < ingreso.getDate()) {
          months--;
      }
      duracionMesesStr = Math.max(0, months).toString();
    }

    try {
      const examDateStr = examDate.toISOString().split('T')[0];
      const response = await api.get(
        `/occupational-exams/calculate-next-exam-date/${workerId}?exam_date=${examDateStr}`
      );
      
      setFormData(prev => ({
        ...prev,
        duracion_cargo_actual_meses: duracionMesesStr ? (duracionMesesStr as any) : prev.duracion_cargo_actual_meses,
        ...(response.data.next_exam_date ? { next_exam_date: new Date(response.data.next_exam_date) } : {}),
        ...(response.data.risk_factors ? { factores_riesgo_evaluados: response.data.risk_factors } : {})
      }));
    } catch (error) {
      console.error('Error calculando info del examen:', error);
      // Aun si falla la API, actualizar la duración calculada
      if (duracionMesesStr) {
        setFormData(prev => ({
          ...prev,
          duracion_cargo_actual_meses: duracionMesesStr as any
        }));
      }
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);

      // Construir parámetros de filtro para el reporte
      const params = new URLSearchParams();
      params.append("format", "pdf"); // Agregar parámetro format=pdf
      params.append("download", "true"); // Agregar parámetro download=true
      if (filters.tipo_examen_id) params.append("tipo_examen_id", filters.tipo_examen_id.toString());
      if (filters.worker) params.append("worker_id", filters.worker);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(
        `/exam-scheduler/generate-report?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      // Crear y descargar el archivo PDF
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      link.setAttribute(
        "download",
        `reporte_examenes_ocupacionales_${timestamp}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando reporte:", error);
      // Aquí podrías agregar una notificación de error al usuario
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSendManualEmail = async (exam: OccupationalExamData) => {
    try {
      setSendingEmail(exam.id);

      const response = await api.post(
        `/exam-scheduler/send-notification-with-pdf/${exam.id}`
      );

      if (response.status === 200) {
        // Aquí podrías agregar una notificación de éxito
      }
    } catch (error) {
      console.error("Error enviando correo:", error);
      // Aquí podrías agregar una notificación de error al usuario
    } finally {
      setSendingEmail(null);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleOpenDialog = (exam?: OccupationalExamData) => {
    if (exam) {
      setEditingExam(exam);

      const formDataToSet = {
        worker_id: exam.worker_id ? exam.worker_id.toString() : "",
        worker_name: exam.worker_name || "",
        worker_position: exam.worker_position || "",
        worker_hire_date: exam.worker_hire_date || "",
        tipo_examen_id: exam.tipo_examen_id || "",
        exam_date: exam.exam_date ? new Date(exam.exam_date) : null,
        programa: exam.programa || "",
        occupational_conclusions: exam.occupational_conclusions || "",
        preventive_occupational_behaviors:
          exam.preventive_occupational_behaviors || "",
        general_recommendations: exam.general_recommendations || "",
        medical_aptitude_concept: exam.medical_aptitude_concept || "apto",
        observations: exam.observations || "",
        examining_doctor: exam.examining_doctor || "",
      medical_center: exam.medical_center || "",
      supplier_id: exam.supplier_id?.toString() || "",
      doctor_id: exam.doctor_id?.toString() || "",
      duracion_cargo_actual_meses: (exam as any).duracion_cargo_actual_meses ? String((exam as any).duracion_cargo_actual_meses) : '',
      factores_riesgo_evaluados: (exam as any).factores_riesgo_evaluados || [],
      departamento: (exam as any).departamento || '',
      ciudad: (exam as any).ciudad || '',

        restrictions: exam.restrictions || "",
        next_exam_date: exam.next_exam_date
          ? new Date(exam.next_exam_date)
          : null,
        pdf_file_path: exam.pdf_file_path ? exam.pdf_file_path.trim().replace(/`/g, '') : null,
        requires_follow_up: exam.requires_follow_up || false,
      };

      setFormData(formDataToSet);
      
      // Si hay un supplier_id, cargar los médicos de ese proveedor
      if (exam.supplier_id) {
        fetchDoctorsBySupplier(exam.supplier_id);
      }
    } else {
      setEditingExam(null);
      setFormData({
        worker_id: "",
        worker_name: "",
        worker_position: "",
        worker_hire_date: "",
        tipo_examen_id: "",
        exam_date: null,
        programa: "",
        occupational_conclusions: "",
        preventive_occupational_behaviors: "",
        general_recommendations: "",
        medical_aptitude_concept: "apto",
        observations: "",
        examining_doctor: "",
        medical_center: "",
        supplier_id: "",
        doctor_id: "",

        restrictions: "",
        next_exam_date: null,
        pdf_file_path: null,
        requires_follow_up: false,
    duracion_cargo_actual_meses: '',
    factores_riesgo_evaluados: [],

    departamento: '',
    ciudad: '',
      });
    }
    
    // Limpiar archivo seleccionado al abrir el diálogo
    setSelectedFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExam(null);
    resetForm();
  };

  const handleViewExam = (exam: OccupationalExamData) => {
    setViewingExam(exam);
    setOpenViewDialog(true);
  };

  // Función para generar PDF de notificación médica individual
  const handleGenerateIndividualReport = async (exam: OccupationalExamData) => {
    try {
      setGeneratingIndividualReport(true);

      // Llamar al endpoint del backend para generar el reporte
      const response = await api.get(
        `/occupational-exams/${exam.id}/medical-recommendation-report`,
        {
          responseType: "blob",
        }
      );

      // Crear y descargar el archivo PDF
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      link.setAttribute(
        "download",
        `notificacion_medica_${exam.worker_name || exam.id}_${timestamp}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating individual report:", error);
    } finally {
      setGeneratingIndividualReport(false);
    }
  };

  // Función para marcar/desmarcar seguimiento
  const handleToggleFollowUp = async (exam: OccupationalExamData) => {
    try {
      console.log("=== DEBUG: Toggle Follow-up ===");
      console.log("Exam before toggle:", exam);
      console.log("Current requires_follow_up:", exam.requires_follow_up);
      console.log("New requires_follow_up will be:", !exam.requires_follow_up);
      
      // Enviar solo el campo que queremos actualizar
      const updateData = {
        requires_follow_up: !exam.requires_follow_up
      };
      
      console.log("Simplified data being sent to API:", updateData);
      console.log("API URL:", `/occupational-exams/${exam.id}`);
      
      const response = await api.put(
        `/occupational-exams/${exam.id}`,
        updateData
      );
      
      console.log("API Response status:", response.status);
      console.log("API Response data:", response.data);
      
      if (response.status === 200) {
        // Actualizar el estado local del examen
        setExams(prevExams => 
          prevExams.map(e => 
            e.id === exam.id 
              ? { ...e, requires_follow_up: !e.requires_follow_up }
              : e
          )
        );
        
        // Mostrar mensaje de éxito
        console.log(
          exam.requires_follow_up 
            ? "Seguimiento desmarcado exitosamente" 
            : "Examen marcado para seguimiento"
        );
        
        console.log("Local state updated successfully");
        
        // Recargar los datos para verificar que se guardó correctamente
        setTimeout(() => {
          fetchExams();
          // También actualizar el estado de seguimientos
          checkExamSeguimientos([exam.id]);
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error toggling follow-up:", error);
      console.error("Error details:", error.response?.data);
      alert("Error al actualizar el estado de seguimiento. Por favor, intente nuevamente.");
    }
  };

  // Función para crear seguimiento médico desde examen ocupacional
  const handleCreateFollowUp = async (exam: OccupationalExamData) => {
    try {
      const payload = {
        worker_id: exam.worker_id,
        programa: exam.programa,
        estado: 'iniciado',
        valoracion_riesgo: 'medio', // Valor por defecto, se puede ajustar
        fecha_inicio: new Date().toISOString().split('T')[0],
        motivo_inclusion: `Seguimiento requerido por examen ocupacional del ${formatDate(exam.exam_date)}`,
        conclusiones_ocupacionales: exam.occupational_conclusions,
        conductas_ocupacionales_prevenir: exam.preventive_occupational_behaviors,
        recomendaciones_generales: exam.general_recommendations,
        observaciones_examen: exam.observations,
        comentario: `Seguimiento creado automáticamente desde examen ocupacional ID: ${exam.id}`
      };

      const response = await api.post('/seguimientos/', payload);
      
      if (response.status === 201) {
        // Marcar el examen como que ya no requiere seguimiento
        await handleToggleFollowUp(exam);
        
        console.log("Seguimiento médico creado exitosamente");
        
        // Opcional: Mostrar notificación de éxito
        alert("Seguimiento médico creado exitosamente. El examen ha sido desmarcado del seguimiento.");
      }
    } catch (error) {
      console.error("Error creating follow-up:", error);
      alert("Error al crear el seguimiento médico. Por favor, intente nuevamente.");
    }
  };

  const isExamExpiring = (exam: OccupationalExamData) => {
    if (!exam.expires_at) return false;
    const expiryDate = new Date(exam.expires_at);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExamExpired = (exam: OccupationalExamData) => {
    if (!exam.expires_at) return false;
    return new Date(exam.expires_at) < new Date();
  };


  const fetchTiposExamen = useCallback(async () => {
    try {
      const tipos = await profesiogramaService.listTiposExamen({ activo: true });
      setTiposExamen(tipos);
    } catch (error) {
      console.error("Error fetching tipos examen:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchWorkers();
      await fetchProgramas();
      await fetchSuppliers();
    fetchTiposExamen();
      await fetchExams();
    };
    loadData();
  }, [page, filters, fetchWorkers, fetchProgramas, fetchSuppliers, fetchExams, fetchTiposExamen]);

  useEffect(() => {
    fetchProgramas();
    fetchSuppliers();
    fetchTiposExamen();
  }, [fetchProgramas, fetchSuppliers, fetchTiposExamen]);

  const tiposExamenFiltrados = tiposExamen.filter((type) =>
    [
      "Examen de Ingreso",
      "Examen Periódico",
      "Examen de Reintegro",
      "Examen de Retiro",
      "Examen Médico Ocupacional",
    ].includes(type.nombre)
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Exámenes Ocupacionales
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Gestión de exámenes médicos ocupacionales de trabajadores
        </Typography>

        {/* Alertas de Exámenes Próximos a Vencer */}
        {exams.some((exam) => isExamExpiring(exam) || isExamExpired(exam)) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Hay {exams.filter((exam) => isExamExpiring(exam)).length} exámenes
              próximos a vencer y{" "}
              {exams.filter((exam) => isExamExpired(exam)).length} exámenes
              vencidos.
            </Typography>
          </Alert>
        )}

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Buscar"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Nombre, documento..."
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Examen</InputLabel>
                  <Select
                    value={filters.tipo_examen_id}
                    onChange={(e) =>
                      handleFilterChange("tipo_examen_id", e.target.value)
                    }
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {tiposExamenFiltrados.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Box display="flex" gap={1}>
                  <Tooltip title="Actualizar">
                    <IconButton onClick={fetchExams}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Nuevo Examen
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={generatingReport ? <RefreshIcon /> : <PdfIcon />}
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    color="primary"
                    title={
                      generatingReport
                        ? "Generando reporte..."
                        : "Generar reporte PDF"
                    }
                  >
                    {generatingReport ? "Generando..." : "Reporte"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Exámenes */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trabajador</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Fecha Examen</TableCell>
                    <TableCell>Centro Médico</TableCell>
                    <TableCell>Concepto de Aptitud Médica</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Próximo Examen</TableCell>
                    <TableCell>Seguimiento</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Cargando exámenes...
                      </TableCell>
                    </TableRow>
                  ) : exams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No se encontraron exámenes
                      </TableCell>
                    </TableRow>
                  ) : (
                    exams.map((exam) => (
                      <TableRow
                        key={exam.id}
                        sx={{
                          backgroundColor: isExamExpired(exam)
                            ? "error.light"
                            : isExamExpiring(exam)
                              ? "warning.light"
                              : "inherit",
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {exam.worker_name || "Trabajador no encontrado"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {exam.worker_document}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={exam.tipo_examen?.nombre || "N/A"}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(exam.exam_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {exam.medical_center}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Dr. {exam.examining_doctor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              exam.medical_aptitude_concept === "apto"
                                ? "Apto"
                                : exam.medical_aptitude_concept ===
                                    "apto_con_recomendaciones"
                                  ? "Apto con Recomendaciones"
                                  : "No Apto"
                            }
                            color={
                              exam.medical_aptitude_concept === "apto"
                                ? "success"
                                : exam.medical_aptitude_concept ===
                                    "apto_con_recomendaciones"
                                  ? "warning"
                                  : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {exam.worker_position || "No especificado"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {exam.next_exam_date
                              ? formatDate(exam.next_exam_date)
                              : "No programado"}
                          </Typography>
                          {exam.expires_at && (
                            <Typography
                              variant="caption"
                              color={
                                isExamExpired(exam)
                                  ? "error"
                                  : isExamExpiring(exam)
                                    ? "warning.main"
                                    : "text.secondary"
                              }
                            >
                              Vence: {formatDate(exam.expires_at)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {examSeguimientos[exam.id] ? (
                              <Chip
                                icon={<FollowUpActiveIcon />}
                                label="Con seguimiento"
                                color="success"
                                size="small"
                              />
                            ) : exam.requires_follow_up ? (
                              <Chip
                                icon={<FollowUpIcon />}
                                label="Requiere seguimiento"
                                color="warning"
                                size="small"
                              />
                            ) : (
                              <Chip
                                label="Sin seguimiento"
                                color="default"
                                size="small"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => handleViewExam(exam)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(exam)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            {exam.certificate_url && (
                              <Tooltip title="Descargar certificado">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDownloadCertificate(exam)
                                  }
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {exam.pdf_file_path &&
                              exam.pdf_file_path.trim() && (
                                <>
                                  <Tooltip title="Previsualizar PDF">
                                    <IconButton
                                      size="small"
                                      onClick={() => handlePreviewPdf(exam.id)}
                                    >
                                      <ViewIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Descargar PDF">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleDownloadPdf(
                                          exam.id,
                                          exam.worker_name,
                                        )
                                      }
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            <Tooltip
                              title={
                                sendingEmail === exam.id
                                  ? "Enviando correo..."
                                  : "Enviar notificación por correo"
                              }
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleSendManualEmail(exam)}
                                disabled={sendingEmail === exam.id}
                                color="primary"
                              >
                                {sendingEmail === exam.id ? (
                                  <RefreshIcon />
                                ) : (
                                  <EmailIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title={
                                exam.requires_follow_up
                                  ? "Desmarcar seguimiento"
                                  : "Marcar para seguimiento"
                              }
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleToggleFollowUp(exam)}
                                color={
                                  exam.requires_follow_up
                                    ? "warning"
                                    : "default"
                                }
                              >
                                {exam.requires_follow_up ? (
                                  <FollowUpActiveIcon />
                                ) : (
                                  <FollowUpIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                            {exam.requires_follow_up && (
                              <Tooltip title="Crear seguimiento médico">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCreateFollowUp(exam)}
                                  color="success"
                                >
                                  <AddIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteExam(exam)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog para Crear/Editar Examen */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingExam
              ? "Editar Examen Ocupacional"
              : "Nuevo Examen Ocupacional"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <AutocompleteField
                  label="Trabajador *"
                  placeholder="Buscar trabajador por nombre o documento..."
                  required
                  value={
                    formData.worker_id
                      ? {
                          id: formData.worker_id,
                          label: formData.worker_name || "",
                          value: workers.find(
                            (w) => w.id.toString() === formData.worker_id,
                          ),
                        }
                      : null
                  }
                  onChange={async (
                    selectedOption:
                      | AutocompleteOption
                      | AutocompleteOption[]
                      | null,
                  ) => {
                    if (selectedOption && !Array.isArray(selectedOption)) {
                      const selectedWorker = selectedOption.value;

                      setFormData({
                        ...formData,
                        worker_id: selectedWorker.id.toString(),
                        worker_name: `${selectedWorker.first_name} ${selectedWorker.last_name}`,
                        worker_position: selectedWorker.position || "",
                        worker_hire_date: selectedWorker.fecha_de_ingreso || "",
                        // Limpiar campos calculados antes de recalcular
                        duracion_cargo_actual_meses: "",
                        next_exam_date: null,
                      });

                      if (formData.exam_date) {
                        await fetchAndSetExamCalculations(
                          selectedWorker.id.toString(),
                          selectedWorker.fecha_de_ingreso || "",
                          formData.exam_date,
                        );
                      }
                    } else {
                      setFormData({
                        ...formData,
                        worker_id: "",
                        worker_name: "",
                        worker_position: "",
                        worker_hire_date: "",
                        duracion_cargo_actual_meses: "",
                        next_exam_date: null,
                        factores_riesgo_evaluados: [],
                      });
                    }
                  }}
                  autocompleteOptions={{
                    staticOptions: workers.map((worker) => ({
                      id: worker.id,
                      label: `${worker.first_name} ${worker.last_name}`,
                      value: worker,
                      description: `${worker.document_number} - ${worker.position || "Sin cargo"}`,
                      category: worker.position || "Sin cargo",
                    })),
                    minSearchLength: 0,
                    searchDelay: 200,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre del Trabajador"
                  value={formData.worker_name || ""}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Se asigna automáticamente al seleccionar el trabajador"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Cargo"
                  value={formData.worker_position || ""}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Se asigna automáticamente al seleccionar el trabajador"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha de Ingreso del Trabajador"
                  value={
                    formData.worker_hire_date
                      ? formatDate(formData.worker_hire_date)
                      : ""
                  }
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Se asigna automáticamente al seleccionar el trabajador"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Examen</InputLabel>
                  <Select
                    value={formData.tipo_examen_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipo_examen_id: e.target.value,
                      })
                    }
                  >
                    {tiposExamenFiltrados.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Fecha del Examen *"
                  value={formData.exam_date}
                  onChange={async (date) => {
                    setFormData((prev) => ({ ...prev, exam_date: date }));

                    if (date && formData.worker_id) {
                      await fetchAndSetExamCalculations(
                        formData.worker_id,
                        formData.worker_hire_date,
                        date,
                      );
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    value={(formData as any).departamento || ""}
                    label="Departamento"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departamento: e.target.value,
                        ciudad: "", // Reset city when department changes
                      })
                    }
                  >
                    {COLOMBIAN_DEPARTMENTS.map((dep) => (
                      <MenuItem key={dep} value={dep}>
                        {dep}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Ciudad</InputLabel>
                  <Select
                    value={(formData as any).ciudad || ""}
                    label="Ciudad"
                    onChange={(e) =>
                      setFormData({ ...formData, ciudad: e.target.value })
                    }
                    disabled={!(formData as any).departamento}
                  >
                    {(
                      ((formData as any).departamento &&
                        COLOMBIAN_CITIES[(formData as any).departamento]) ||
                      []
                    ).map((city: string) => (
                      <MenuItem key={city} value={city}>
                        {city}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Centro Médico *</InputLabel>
                  <Select
                    value={formData.supplier_id}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Seleccionar centro médico</em>
                    </MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem
                        key={supplier.id}
                        value={supplier.id.toString()}
                      >
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Médico Examinador</InputLabel>
                  <Select
                    value={formData.doctor_id}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    disabled={!formData.supplier_id}
                  >
                    <MenuItem value="">
                      <em>Seleccionar médico</em>
                    </MenuItem>
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id.toString()}>
                        {suppliersService.formatDoctorName(doctor)}
                        {doctor.specialty && ` - ${doctor.specialty}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Programa</InputLabel>
                  <Select
                    value={formData.programa}
                    onChange={(e) =>
                      setFormData({ ...formData, programa: e.target.value })
                    }
                  >
                    <MenuItem value="">
                      <em>Seleccionar programa</em>
                    </MenuItem>
                    {programas.map((programa) => (
                      <MenuItem
                        key={programa.id}
                        value={programa.nombre_programa}
                      >
                        {programa.nombre_programa}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Concepto de Aptitud Médica</InputLabel>
                  <Select
                    value={formData.medical_aptitude_concept}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medical_aptitude_concept: e.target
                          .value as MedicalAptitude,
                      })
                    }
                  >
                    {medicalAptitudeTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Duración Cargo Actual (Meses) *"
                  type="number"
                  value={(formData as any).duracion_cargo_actual_meses || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duracion_cargo_actual_meses: e.target.value,
                    })
                  }
                  InputProps={{
                    readOnly: true,
                    style: { backgroundColor: "#f5f5f5" },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Factores de Riesgo (Según Profesiograma)
                </Typography>

                {(formData as any).factores_riesgo_evaluados &&
                (formData as any).factores_riesgo_evaluados.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                          <TableCell>
                            <strong>Factor de Riesgo</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Categoría</strong>
                          </TableCell>
                          <TableCell align="center">
                            <strong>Nivel Exp.</strong>
                          </TableCell>
                          <TableCell align="center">
                            <strong>Horas</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(formData as any).factores_riesgo_evaluados.map(
                          (factor: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{factor.nombre}</TableCell>
                              <TableCell>{factor.categoria}</TableCell>
                              <TableCell align="center">
                                {factor.nivel_exposicion}
                              </TableCell>
                              <TableCell align="center">
                                {factor.tiempo_exposicion_horas}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info" variant="outlined">
                    No se encontraron factores de riesgo asociados al
                    profesiograma de este cargo.
                  </Alert>
                )}
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Conclusiones Ocupacionales"
                  multiline
                  rows={3}
                  value={formData.occupational_conclusions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      occupational_conclusions: e.target.value,
                    })
                  }
                  helperText="Conclusiones específicas del examen ocupacional"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Comportamientos Preventivos Ocupacionales"
                  multiline
                  rows={3}
                  value={formData.preventive_occupational_behaviors}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preventive_occupational_behaviors: e.target.value,
                    })
                  }
                  helperText="Recomendaciones de comportamientos preventivos"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Recomendaciones Generales"
                  multiline
                  rows={3}
                  value={formData.general_recommendations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      general_recommendations: e.target.value,
                    })
                  }
                  helperText="Recomendaciones generales para el trabajador"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={3}
                  value={formData.observations}
                  onChange={(e) =>
                    setFormData({ ...formData, observations: e.target.value })
                  }
                />
              </Grid>

              <Grid size={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requires_follow_up}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requires_follow_up: e.target.checked,
                        })
                      }
                      color="warning"
                      disabled={
                        editingExam ? !!examSeguimientos[editingExam.id] : false
                      }
                    />
                  }
                  label="Requiere seguimiento médico"
                />
                {editingExam && !!examSeguimientos[editingExam.id] && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 4, display: "block" }}
                  >
                    Este examen ya tiene un seguimiento médico asociado
                  </Typography>
                )}
              </Grid>

              {/* Componente de carga de archivos PDF */}
              <Grid size={12}>
                <Box sx={{ border: "1px dashed #ccc", borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Archivo PDF del Examen
                  </Typography>

                  {/* Mostrar PDF existente si hay uno */}
                  {formData.pdf_file_path &&
                    formData.pdf_file_path.trim() &&
                    !selectedFile && (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            Este examen ya tiene un archivo PDF asociado.
                          </Typography>
                        </Alert>
                        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => {
                              if (editingExam) {
                                handlePreviewPdf(editingExam.id);
                              }
                            }}
                            size="small"
                          >
                            Previsualizar PDF
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => {
                              if (editingExam) {
                                handleDownloadPdf(
                                  editingExam.id,
                                  editingExam.worker_name,
                                );
                              }
                            }}
                            size="small"
                          >
                            Descargar PDF
                          </Button>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Puede seleccionar un nuevo archivo para reemplazar el
                          existente.
                        </Typography>
                      </Box>
                    )}

                  {!selectedFile ? (
                    <Box sx={{ textAlign: "center" }}>
                      <input
                        accept="application/pdf"
                        style={{ display: "none" }}
                        id="pdf-upload-button"
                        type="file"
                        onChange={handleFileSelect}
                      />
                      <label htmlFor="pdf-upload-button">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<UploadIcon />}
                          sx={{ mb: 1 }}
                        >
                          {formData.pdf_file_path
                            ? "Reemplazar archivo PDF"
                            : "Seleccionar archivo PDF"}
                        </Button>
                      </label>
                      <Typography variant="body2" color="text.secondary">
                        Tamaño máximo: 10MB. Solo archivos PDF.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PdfIcon color="error" />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedFile(null)}
                        color="error"
                      >
                        <ClearIcon />
                      </IconButton>
                    </Box>
                  )}

                  {uploadingPdf && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress />
                      <Typography variant="caption" color="text.secondary">
                        Subiendo archivo...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid size={12}>
                <DatePicker
                  label="Próximo Examen"
                  value={formData.next_exam_date}
                  onChange={(date) =>
                    setFormData({ ...formData, next_exam_date: date })
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText:
                        "Se calcula automáticamente basado en la periodicidad del cargo del trabajador",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleSaveExam}
              variant="contained"
              disabled={
                !formData.worker_id ||
                !formData.exam_date ||
                !formData.medical_center
              }
            >
              {editingExam ? "Actualizar" : "Crear"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Ver Detalles del Examen */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Detalles del Examen Ocupacional</DialogTitle>
          <DialogContent>
            {viewingExam && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Información del Trabajador
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <PersonIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary="Nombre"
                              secondary={viewingExam.worker_name}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Documento"
                              secondary={viewingExam.worker_document}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Información del Examen
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <ExamIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary="Tipo"
                              secondary={
                                viewingExam.tipo_examen?.nombre || "N/A"
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Fecha"
                              secondary={formatDate(viewingExam.exam_date)}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Centro Médico"
                              secondary={viewingExam.medical_center}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Médico Examinador"
                              secondary={
                                viewingExam.examining_doctor ||
                                "No especificado"
                              }
                            />
                          </ListItem>
                          {viewingExam.programa && (
                            <ListItem>
                              <ListItemText
                                primary="Programa"
                                secondary={viewingExam.programa}
                              />
                            </ListItem>
                          )}
                          <ListItem>
                            <ListItemText
                              primary="Concepto de Aptitud Médica"
                              secondary={
                                medicalAptitudeTypes.find(
                                  (t) =>
                                    t.value ===
                                    viewingExam.medical_aptitude_concept,
                                )?.label || viewingExam.medical_aptitude_concept
                              }
                            />
                          </ListItem>
                          {/* Campos legacy para compatibilidad */}
                          {viewingExam.doctor_name && (
                            <ListItem>
                              <ListItemText
                                primary="Médico (Legacy)"
                                secondary={`Dr. ${viewingExam.doctor_name} - Lic: ${viewingExam.doctor_license}`}
                              />
                            </ListItem>
                          )}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  {(viewingExam.observations || viewingExam.next_exam_date) && (
                    <Grid size={12}>
                      <Card variant="outlined">
                        <CardContent>
                          {viewingExam.observations && (
                            <Box mb={2}>
                              <Typography variant="subtitle2">
                                Observaciones:
                              </Typography>
                              <Typography variant="body2">
                                {viewingExam.observations}
                              </Typography>
                            </Box>
                          )}
                          {viewingExam.next_exam_date && (
                            <Box>
                              <Typography variant="subtitle2">
                                Próximo Examen:
                              </Typography>
                              <Typography variant="body2">
                                {formatDate(viewingExam.next_exam_date)}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Nuevos campos del backend */}
                  {(viewingExam.occupational_conclusions ||
                    viewingExam.preventive_occupational_behaviors ||
                    viewingExam.general_recommendations) && (
                    <Grid size={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Evaluación Médica Ocupacional
                          </Typography>
                          {viewingExam.occupational_conclusions && (
                            <Box mb={2}>
                              <Typography variant="subtitle2" color="primary">
                                Conclusiones Ocupacionales:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap" }}
                              >
                                {viewingExam.occupational_conclusions}
                              </Typography>
                            </Box>
                          )}
                          {viewingExam.preventive_occupational_behaviors && (
                            <Box mb={2}>
                              <Typography
                                variant="subtitle2"
                                color="warning.main"
                              >
                                Comportamientos Preventivos Ocupacionales:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap" }}
                              >
                                {viewingExam.preventive_occupational_behaviors}
                              </Typography>
                            </Box>
                          )}
                          {viewingExam.general_recommendations && (
                            <Box>
                              <Typography variant="subtitle2" color="info.main">
                                Recomendaciones Generales:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap" }}
                              >
                                {viewingExam.general_recommendations}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {viewingExam?.certificate_url && (
              <Button
                startIcon={<DownloadIcon />}
                onClick={() =>
                  viewingExam && handleDownloadCertificate(viewingExam)
                }
              >
                Descargar Certificado
              </Button>
            )}
            <Button
              onClick={() =>
                viewingExam && handleGenerateIndividualReport(viewingExam)
              }
              variant="outlined"
              color="secondary"
              startIcon={<PrintIcon />}
              disabled={generatingIndividualReport}
            >
              {generatingIndividualReport
                ? "Generando..."
                : "Generar Notificación Médica"}
            </Button>
            <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <DeleteIcon color="error" />
              Confirmar Eliminación
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              ¿Está seguro de que desea eliminar este examen ocupacional?
            </Typography>
            {deletingExam && (
              <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Trabajador:</strong>{" "}
                  {deletingExam.worker_name || "No especificado"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Tipo de examen:</strong>{" "}
                  {deletingExam.tipo_examen?.nombre || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Fecha:</strong> {formatDate(deletingExam.exam_date)}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              <strong>Advertencia:</strong> Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteExam}
              color="error"
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default OccupationalExam;
