import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import type { AlertColor } from "@mui/material/Alert";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { SelectChangeEvent } from "@mui/material/Select";
import { es } from "date-fns/locale";
import { format, parse } from "date-fns";
import { WorkModality } from "../types";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowBack } from "@mui/icons-material";
import contractorService from "../services/contractorService";
import { cargoService, Cargo } from "../services/cargoService";
import { areaService, Area } from "../services/areaService";
import { DOCUMENT_TYPES, CONTRACT_TYPES } from "../types/contractor";
import { COLOMBIAN_DEPARTMENTS } from "../data/colombianDepartments";
import { COLOMBIAN_CITIES } from "../data/colombianCities";
import seguridadSocialService, { SeguridadSocialOption } from "../services/seguridadSocialService";

// Opciones adicionales
const RISK_LEVELS = ["nivel_1", "nivel_2", "nivel_3", "nivel_4", "nivel_5"] as const;
const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

// Mapeo de tipo_contrato (frontend) a enum esperado por backend (valores de la BD)
const CONTRACT_TYPE_MAP: Record<string, string> = {
  obra_labor: "obra_labor",
  prestacion_servicios: "prestacion_servicios",
  termino_fijo: "fijo",
  termino_indefinido: "indefinido",
};

// Mapeo inverso para mostrar correctamente el valor en el Select al editar
const CONTRACT_TYPE_REVERSE_MAP: Record<string, string> = {
  obra_labor: "obra_labor",
  prestacion_servicios: "prestacion_servicios",
  fijo: "termino_fijo",
  indefinido: "termino_indefinido",
};

const RISK_LEVEL_REVERSE_MAP: Record<string, string> = {
  LEVEL_I: "nivel_1",
  LEVEL_II: "nivel_2", 
  LEVEL_III: "nivel_3",
  LEVEL_IV: "nivel_4",
  LEVEL_V: "nivel_5",
};

const validationSchema = Yup.object({
  tipo_documento: Yup.string().required("Tipo de documento es requerido"),
  numero_documento: Yup.string().required("Número de documento es requerido"),
  primer_nombre: Yup.string().required("Primer nombre es requerido"),
  segundo_nombre: Yup.string(),
  primer_apellido: Yup.string().required("Primer apellido es requerido"),
  segundo_apellido: Yup.string(),
  fecha_nacimiento: Yup.date().required("Fecha de nacimiento es requerida"),
  genero: Yup.string().required("Género es requerido"),
  direccion: Yup.string().required("Dirección es requerida"),
  departamento: Yup.string().required("Departamento es requerido"),
  ciudad: Yup.string().required("Ciudad es requerida"),
  telefono: Yup.string().required("Teléfono es requerido"),
  email: Yup.string()
    .email("Email inválido")
    .required("Email es requerido"),
  profesion: Yup.string().required("Profesión es requerida"),
  cargo: Yup.string().required("Cargo es requerido"),
  area: Yup.string().required("Área es requerida"),
  tipo_contrato: Yup.string().required("Tipo de contrato es requerido"),
  fecha_inicio: Yup.date().required("Fecha de inicio es requerida"),
  fecha_fin: Yup.date().nullable(),

  pais: Yup.string().required("País es requerido"),
  // Campos adicionales
  work_modality: Yup.string().required("Modalidad de trabajo es requerida"),
  contract_value: Yup.number().required("Valor del contrato es requerido"),
  occupation: Yup.string().required("Ocupación es requerida"),
  nivel_riesgo: Yup.string().required("Nivel de riesgo es requerido"),
  eps: Yup.string().nullable(),
  afp: Yup.string().nullable(),
  arl: Yup.string().nullable(),
  grupo_sanguineo: Yup.string().nullable(),
  activo: Yup.boolean().required("El estado activo es requerido"),
});

const ContractorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: "",
    severity: "success",
  });
const [cargos, setCargos] = useState<Cargo[]>([]);
const [areas, setAreas] = useState<Area[]>([]);
const [cities, setCities] = useState<string[]>([]);
const [epsOptions, setEpsOptions] = useState<SeguridadSocialOption[]>([]);
const [afpOptions, setAfpOptions] = useState<SeguridadSocialOption[]>([]);
const [arlOptions, setArlOptions] = useState<SeguridadSocialOption[]>([]);

  const formik = useFormik({
    initialValues: {
      tipo_documento: "",
      numero_documento: "",
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      fecha_nacimiento: null,
      genero: "",
      estado_civil: "",
      direccion: "",
      departamento: "",
      ciudad: "",
      telefono: "",
      email: "",
      profesion: "",
      cargo: "",
      area: "",
      tipo_contrato: "",
      fecha_inicio: null,
      fecha_fin: null,
      pais: "COLOMBIA",
      // Campos adicionales
      work_modality: "",
      contract_value: 0,
      occupation: "",
      nivel_riesgo: "",
      eps: "",
      afp: "",
      arl: "",
      grupo_sanguineo: "",
      activo: true,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      console.log('=== FORM SUBMISSION STARTED ===');
      console.log('Form values:', values);
      console.log('Cargos state:', cargos);
      console.log('Cargos length:', cargos.length);
      
      // Prevent submission if cargos are not loaded
      if (cargos.length === 0) {
        console.error('SUBMISSION BLOCKED: Cargos not loaded');
        setSnackbar({
          open: true,
          message: "Error: Los cargos no se han cargado correctamente. Por favor, recarga la página.",
          severity: "error",
        });
        return;
      }

      // Additional validation: ensure cargo is selected and exists
      if (!values.cargo) {
        console.error('SUBMISSION BLOCKED: No cargo selected');
        setSnackbar({
          open: true,
          message: "Error: Debe seleccionar un cargo.",
          severity: "error",
        });
        return;
      }

      const selectedCargo = cargos.find(c => c.id.toString() === values.cargo);
      if (!selectedCargo) {
        console.error('SUBMISSION BLOCKED: Selected cargo not found in cargos array');
        setSnackbar({
          open: true,
          message: "Error: El cargo seleccionado no es válido. Por favor, seleccione un cargo de la lista.",
          severity: "error",
        });
        return;
      }

      try {
        setLoading(true);
        
        // LOGS ESPECÍFICOS PARA DEBUGGING POSITION
        console.log('=== MAPPING POSITION ===');
        console.log('Cargo value from form:', values.cargo);
        console.log('Selected cargo object:', selectedCargo);
        console.log('Selected cargo nombre_cargo:', selectedCargo?.nombre_cargo);
        console.log('Position will be set to:', selectedCargo.nombre_cargo);
        
        const formattedValues = {
          // Alinear con el esquema que exige el backend (inglés)
          document_type: values.tipo_documento?.toLowerCase(),
          document_number: values.numero_documento,
          first_name: values.primer_nombre,
          last_name: values.primer_apellido,
          second_name: values.segundo_nombre || undefined,
          second_last_name: values.segundo_apellido || undefined,
          birth_date: values.fecha_nacimiento
            ? format(new Date(values.fecha_nacimiento), "yyyy-MM-dd")
            : undefined,
          gender: values.genero?.toLowerCase(),
          email: values.email,
          phone: values.telefono,
          profesion: values.profesion,
          cargo: selectedCargo.nombre_cargo,
          contract_type: values.tipo_contrato ? CONTRACT_TYPE_MAP[values.tipo_contrato] : undefined,
          // Ubicación: el modelo usa 'direccion' pero department/city/country en inglés
          direccion: values.direccion,
          department: values.departamento,
          city: values.ciudad,
          country: values.pais,
          // Relaciones
          area_id: values.area !== "" ? Number(values.area) : undefined,
          is_active: true,
          // Campos adicionales que están en el modelo del backend - CORREGIDOS para coincidir con el modelo
          work_modality: values.work_modality || undefined,
          contract_value: values.contract_value || undefined,
          occupation: values.occupation || undefined,
          risk_level: values.nivel_riesgo || undefined, // CORREGIDO: nivel_riesgo -> risk_level
          eps: values.eps || undefined,
          afp: values.afp || undefined,
          arl: values.arl || undefined,
          blood_type: values.grupo_sanguineo || undefined,
          activo: values.activo,
        };

        console.log('=== FINAL FORMATTED VALUES ===');
        console.log('formattedValues:', formattedValues);
        console.log('cargo field specifically:', formattedValues.cargo);

        if (id) {
          await contractorService.updateContractor(Number(id), formattedValues as any);
          setSnackbar({
            open: true,
            message: "Contratista actualizado exitosamente",
            severity: "success",
          });
        } else {
          await contractorService.createContractor(formattedValues as any);
          setSnackbar({
            open: true,
            message: "Contratista creado exitosamente",
            severity: "success",
          });
        }
        setTimeout(() => {
          navigate("/admin/contractors");
        }, 2000);
      } catch (error: any) {
        console.error("Error al guardar contratista:", error);
        setSnackbar({
          open: true,
          message:
            error.response?.data?.message ||
            "Error al guardar contratista. Por favor intente de nuevo.",
          severity: "error",
        });
      } finally {
        setLoading(false);
        setSubmitting(false);
        console.log('=== FORM SUBMISSION COMPLETED ===');
      }
    },
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('=== LOADING INITIAL DATA ===');
        
        // Cargar cargos y áreas primero
        const [cargosData, areasData] = await Promise.all([
          cargoService.getActiveCargos(),
          areaService.getActiveAreas()
        ]);
        
        console.log('Cargos loaded successfully:', cargosData);
        console.log('Number of cargos:', cargosData.length);
        setCargos(cargosData);
        setAreas(areasData);

        // Si estamos editando, cargar el contratista después de que los cargos y áreas estén disponibles
        if (id) {
          await loadContractor(cargosData);
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    loadInitialData();
  }, [id]);

  // Cargar opciones de Seguridad Social (EPS/AFP/ARL)
  useEffect(() => {
    const loadSeguridadSocialOptions = async () => {
      try {
        const [eps, afp, arl] = await Promise.all([
          seguridadSocialService.getActiveEPSAsOptions(),
          seguridadSocialService.getActiveAFPAsOptions(),
          seguridadSocialService.getActiveARLAsOptions(),
        ]);
        setEpsOptions(eps);
        setAfpOptions(afp);
        setArlOptions(arl);
      } catch (error) {
        console.error("Error al cargar seguridad social:", error);
      }
    };
    loadSeguridadSocialOptions();
  }, []);

  // Función para cargar contratista (ahora recibe cargos como parámetro)
  const loadContractor = async (cargosData: Cargo[]) => {
    try {
      setInitialLoading(true);
      const contractor = await contractorService.getContractor(Number(id));
      
      console.log('=== CONTRACTOR DATA FROM BACKEND ===');
      console.log('Raw contractor data:', contractor);

      // Format dates for form - Mapeo corregido basado en el modelo del backend
      const mappedValues = {
        // Información personal
        tipo_documento: contractor.document_type || "cedula",
        numero_documento: contractor.document_number || "",
        primer_nombre: contractor.first_name || "",
        segundo_nombre: contractor.second_name || "",
        primer_apellido: contractor.last_name || "",
        segundo_apellido: contractor.second_last_name || "",
        fecha_nacimiento: contractor.birth_date
          ? parse(contractor.birth_date, "yyyy-MM-dd", new Date())
          : null,
        genero: contractor.gender ? contractor.gender.toUpperCase() : "",
        
        // Información de contacto
        direccion: contractor.direccion || "",
        departamento: contractor.departamento || "",
        ciudad: contractor.ciudad || "",
        telefono: contractor.phone || "",
        email: contractor.email || "",
        
        // Información laboral
        profesion: contractor.profesion || "",
        cargo: (() => {
          const positionName = contractor.cargo || "";
          const foundCargo = cargosData.find(c => c.nombre_cargo === positionName);
          return foundCargo ? foundCargo.id.toString() : "";
        })(),
        area: contractor.area_id ? contractor.area_id.toString() : "",
        tipo_contrato: contractor.tipo_contrato ? CONTRACT_TYPE_REVERSE_MAP[contractor.tipo_contrato] || contractor.tipo_contrato : "",
        
        // Fechas de contrato
        fecha_inicio: contractor.fecha_de_inicio
          ? parse(contractor.fecha_de_inicio, "yyyy-MM-dd", new Date())
          : null,
        fecha_fin: contractor.fecha_de_finalizacion
          ? parse(contractor.fecha_de_finalizacion, "yyyy-MM-dd", new Date())
          : null,
        
        pais: contractor.pais || "COLOMBIA",
        
        // Campos adicionales - usar nombres correctos del backend
        work_modality: contractor.modalidad_trabajo || "",
        contract_value: contractor.valor_contrato || 0,
        occupation: contractor.ocupacion || "",
        nivel_riesgo: contractor.nivel_riesgo ? RISK_LEVEL_REVERSE_MAP[contractor.nivel_riesgo] || contractor.nivel_riesgo : "",
        
        // Seguridad social
        eps: contractor.eps || "",
        afp: contractor.afp || "",
        arl: contractor.arl || "",
        
        // Información médica
        grupo_sanguineo: contractor.grupo_sanguineo || "",
        
        // Estado
        activo: contractor.activo !== undefined ? contractor.activo : true,
      };

      console.log('=== MAPPED VALUES FOR FORM ===');
      console.log('Mapped values:', mappedValues);
      console.log('Specific fields:');
      console.log('- primer_nombre:', mappedValues.primer_nombre);
      console.log('- segundo_nombre:', mappedValues.segundo_nombre);
      console.log('- primer_apellido:', mappedValues.primer_apellido);
      console.log('- segundo_apellido:', mappedValues.segundo_apellido);
      console.log('- departamento:', mappedValues.departamento);
      console.log('- ciudad:', mappedValues.ciudad);
      console.log('- cargo:', mappedValues.cargo);
      console.log('- tipo_contrato:', mappedValues.tipo_contrato);
      console.log('- nivel_riesgo:', mappedValues.nivel_riesgo);

      formik.setValues(mappedValues as any);

      // Load cities for the selected department
      const department = contractor.departamento;
      if (department) {
        const departmentCities = COLOMBIAN_CITIES[department] || [];
        setCities(departmentCities);
      }
    } catch (error) {
      console.error("Error al cargar contratista:", error);
      setSnackbar({
        open: true,
        message:
          "Error al cargar datos del contratista. Por favor intente de nuevo.",
        severity: "error",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleDepartmentChange = (event: SelectChangeEvent<string>) => {
    const department = event.target.value;
    formik.setFieldValue("departamento", department);
    formik.setFieldValue("ciudad", "");

    // Cargar ciudades por departamento
    const departmentCities = COLOMBIAN_CITIES[department] || [];
    setCities(departmentCities);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (initialLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/admin/contractors")}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            {id ? "Editar Contratista" : "Nuevo Contratista"}
          </Typography>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Información Personal
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.tipo_documento &&
                      Boolean(formik.errors.tipo_documento)
                    }
                  >
                    <InputLabel>Tipo de Documento</InputLabel>
                    <Select
                      name="tipo_documento"
                      value={formik.values.tipo_documento}
                      onChange={formik.handleChange}
                      label="Tipo de Documento"
                    >
                      {DOCUMENT_TYPES.map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formik.touched.tipo_documento && formik.errors.tipo_documento ? String(formik.errors.tipo_documento) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.work_modality &&
                      Boolean(formik.errors.work_modality)
                    }
                  >
                    <InputLabel>Modalidad de Trabajo</InputLabel>
                    <Select
                      name="work_modality"
                      value={formik.values.work_modality}
                      onChange={formik.handleChange}
                      label="Modalidad de Trabajo"
                    >
                      <MenuItem value={WorkModality.ON_SITE}>Presencial</MenuItem>
                      <MenuItem value={WorkModality.REMOTE}>Remoto</MenuItem>
                      <MenuItem value={WorkModality.TELEWORK}>Teletrabajo</MenuItem>
                      <MenuItem value={WorkModality.HOME_OFFICE}>Home Office</MenuItem>
                      <MenuItem value={WorkModality.MOBILE}>Móvil/Itinerante</MenuItem>
                    </Select>
                    <FormHelperText>
                      {formik.touched.work_modality && formik.errors.work_modality ? String(formik.errors.work_modality) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="numero_documento"
                    label="Número de Documento"
                    value={formik.values.numero_documento}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.numero_documento &&
                      Boolean(formik.errors.numero_documento)
                    }
                    helperText={formik.touched.numero_documento && formik.errors.numero_documento ? String(formik.errors.numero_documento) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="primer_nombre"
                    label="Primer Nombre"
                    value={formik.values.primer_nombre}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.primer_nombre &&
                      Boolean(formik.errors.primer_nombre)
                    }
                    helperText={formik.touched.primer_nombre && formik.errors.primer_nombre ? String(formik.errors.primer_nombre) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="segundo_nombre"
                    label="Segundo Nombre"
                    value={formik.values.segundo_nombre}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.segundo_nombre &&
                      Boolean(formik.errors.segundo_nombre)
                    }
                    helperText={formik.touched.segundo_nombre && formik.errors.segundo_nombre ? String(formik.errors.segundo_nombre) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="primer_apellido"
                    label="Primer Apellido"
                    value={formik.values.primer_apellido}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.primer_apellido &&
                      Boolean(formik.errors.primer_apellido)
                    }
                    helperText={formik.touched.primer_apellido && formik.errors.primer_apellido ? String(formik.errors.primer_apellido) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="segundo_apellido"
                    label="Segundo Apellido"
                    value={formik.values.segundo_apellido}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.segundo_apellido &&
                      Boolean(formik.errors.segundo_apellido)
                    }
                    helperText={formik.touched.segundo_apellido && formik.errors.segundo_apellido ? String(formik.errors.segundo_apellido) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={es}
                  >
                    <DatePicker
                      label="Fecha de Nacimiento"
                      value={formik.values.fecha_nacimiento}
                      onChange={(value) => {
                        formik.setFieldValue("fecha_nacimiento", value);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error:
                            formik.touched.fecha_nacimiento &&
                            Boolean(formik.errors.fecha_nacimiento),
                          helperText:
                            formik.touched.fecha_nacimiento && formik.errors.fecha_nacimiento
                              ? String(formik.errors.fecha_nacimiento)
                              : "",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.genero && Boolean(formik.errors.genero)
                    }
                  >
                    <InputLabel>Género</InputLabel>
                    <Select
                      name="genero"
                      value={formik.values.genero}
                      onChange={formik.handleChange}
                      label="Género"
                    >
                      <MenuItem value="MASCULINO">Masculino</MenuItem>
                      <MenuItem value="FEMENINO">Femenino</MenuItem>
                      <MenuItem value="OTRO">Otro</MenuItem>
                    </Select>
                    <FormHelperText>
                      {formik.touched.genero && formik.errors.genero ? String(formik.errors.genero) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>


              </Grid>
            </Box>
          </Box>

          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Información de Contacto
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 12 }}>
                  <TextField
                    fullWidth
                    name="direccion"
                    label="Dirección"
                    value={formik.values.direccion}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.direccion &&
                      Boolean(formik.errors.direccion)
                    }
                    helperText={formik.touched.direccion && formik.errors.direccion ? String(formik.errors.direccion) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.departamento &&
                      Boolean(formik.errors.departamento)
                    }
                  >
                    <InputLabel>Departamento</InputLabel>
                    <Select
                      name="departamento"
                      value={formik.values.departamento}
                      onChange={handleDepartmentChange}
                      label="Departamento"
                    >
                      {COLOMBIAN_DEPARTMENTS.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formik.touched.departamento && formik.errors.departamento ? String(formik.errors.departamento) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.ciudad && Boolean(formik.errors.ciudad)
                    }
                  >
                    <InputLabel>Ciudad</InputLabel>
                    <Select
                      name="ciudad"
                      value={formik.values.ciudad}
                      onChange={formik.handleChange}
                      label="Ciudad"
                      disabled={!formik.values.departamento}
                    >
                      {cities.map((city) => (
                        <MenuItem key={city} value={city}>
                          {city}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formik.touched.ciudad && formik.errors.ciudad ? String(formik.errors.ciudad) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl
                    fullWidth
                    error={formik.touched.pais && Boolean(formik.errors.pais)}
                  >
                    <InputLabel>País</InputLabel>
                    <Select
                      name="pais"
                      value={formik.values.pais}
                      onChange={formik.handleChange}
                      label="País"
                    >
                      <MenuItem value="COLOMBIA">Colombia</MenuItem>
                    </Select>
                    <FormHelperText>
                      {formik.touched.pais && formik.errors.pais ? String(formik.errors.pais) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="telefono"
                    label="Teléfono"
                    value={formik.values.telefono}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.telefono &&
                      Boolean(formik.errors.telefono)
                    }
                    helperText={formik.touched.telefono && formik.errors.telefono ? String(formik.errors.telefono) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.email && Boolean(formik.errors.email)
                    }
                    helperText={formik.touched.email && formik.errors.email ? String(formik.errors.email) : ""}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Información Laboral
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="profesion"
                    label="Profesión"
                    value={formik.values.profesion}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.profesion &&
                      Boolean(formik.errors.profesion)
                    }
                    helperText={formik.touched.profesion && formik.errors.profesion ? String(formik.errors.profesion) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl
                    fullWidth
                    error={formik.touched.cargo && Boolean(formik.errors.cargo)}
                  >
                    <InputLabel>Cargo</InputLabel>
                    <Select
                      name="cargo"
                      value={formik.values.cargo}
                      onChange={(e) => {
                        console.log('=== CARGO SELECTION ===');
                        console.log('Selected cargo ID:', e.target.value);
                        const selectedCargo = cargos.find(c => c.id.toString() === e.target.value);
                        console.log('Selected cargo object:', selectedCargo);
                        console.log('Cargo name:', selectedCargo?.nombre_cargo);
                        formik.handleChange(e);
                      }}
                      label="Cargo"
                      disabled={cargos.length === 0}
                    >
                      {cargos.length === 0 ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Cargando cargos...
                        </MenuItem>
                      ) : (
                        cargos.map((cargo) => (
                          <MenuItem key={cargo.id} value={cargo.id.toString()}>
                            {cargo.nombre_cargo}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    <FormHelperText>
                      {formik.touched.cargo && formik.errors.cargo ? String(formik.errors.cargo) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl
                    fullWidth
                    error={formik.touched.area && Boolean(formik.errors.area)}
                  >
                    <InputLabel>Área</InputLabel>
                    <Select
                      name="area"
                      value={formik.values.area}
                      onChange={formik.handleChange}
                      label="Área"
                    >
                      {areas.map((area) => (
                        <MenuItem key={area.id} value={area.id.toString()}>
                          {area.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formik.touched.area && formik.errors.area ? String(formik.errors.area) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="occupation"
                    label="Ocupación"
                    value={formik.values.occupation}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.occupation &&
                      Boolean(formik.errors.occupation)
                    }
                    helperText={formik.touched.occupation && formik.errors.occupation ? String(formik.errors.occupation) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="contract_value"
                    label="Valor del Contrato"
                    type="number"
                    value={formik.values.contract_value}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.contract_value &&
                      Boolean(formik.errors.contract_value)
                    }
                    helperText={formik.touched.contract_value && formik.errors.contract_value ? String(formik.errors.contract_value) : ""}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.tipo_contrato &&
                      Boolean(formik.errors.tipo_contrato)
                    }
                  >
                    <InputLabel>Tipo de Contrato</InputLabel>
                    <Select
                      name="tipo_contrato"
                      value={formik.values.tipo_contrato}
                      onChange={formik.handleChange}
                      label="Tipo de Contrato"
                    >
                      {CONTRACT_TYPES.map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formik.touched.tipo_contrato && formik.errors.tipo_contrato ? String(formik.errors.tipo_contrato) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={es}
                  >
                    <DatePicker
                      label="Fecha de Inicio"
                      value={formik.values.fecha_inicio}
                      onChange={(value) => {
                        formik.setFieldValue("fecha_inicio", value);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error:
                            formik.touched.fecha_inicio &&
                            Boolean(formik.errors.fecha_inicio),
                          helperText:
                            formik.touched.fecha_inicio && formik.errors.fecha_inicio
                              ? String(formik.errors.fecha_inicio)
                              : "",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={es}
                  >
                    <DatePicker
                      label="Fecha de Fin"
                      value={formik.values.fecha_fin}
                      onChange={(value) => {
                        formik.setFieldValue("fecha_fin", value);
                      }}
                      disabled={formik.values.tipo_contrato === "termino_indefinido"}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error:
                            formik.touched.fecha_fin &&
                            Boolean(formik.errors.fecha_fin),
                          helperText:
                            formik.touched.fecha_fin && formik.errors.fecha_fin
                              ? String(formik.errors.fecha_fin)
                              : "",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Seguridad Social */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Seguridad Social
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={formik.touched.nivel_riesgo && Boolean(formik.errors.nivel_riesgo)}>
                    <InputLabel>Nivel de Riesgo</InputLabel>
                    <Select
                      name="nivel_riesgo"
                      value={formik.values.nivel_riesgo}
                      onChange={formik.handleChange}
                      label="Nivel de Riesgo"
                    >
                      {RISK_LEVELS.map((level) => (
                        <MenuItem key={level} value={level}>{level}</MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formik.touched.nivel_riesgo && formik.errors.nivel_riesgo ? String(formik.errors.nivel_riesgo) : ""}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>EPS</InputLabel>
                    <Select
                      name="eps"
                      value={formik.values.eps}
                      onChange={(e) => {
                        const val = e.target.value as string;
                        formik.setFieldValue("eps", val);
                      }}
                      label="EPS"
                    >
                      {epsOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.label}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>AFP</InputLabel>
                    <Select
                      name="afp"
                      value={formik.values.afp}
                      onChange={(e) => {
                        const val = e.target.value as string;
                        formik.setFieldValue("afp", val);
                      }}
                      label="AFP"
                    >
                      {afpOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.label}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>ARL</InputLabel>
                    <Select
                      name="arl"
                      value={formik.values.arl}
                      onChange={(e) => {
                        const val = e.target.value as string;
                        formik.setFieldValue("arl", val);
                      }}
                      label="ARL"
                    >
                      {arlOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.label}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

              </Grid>
            </Box>
          </Box>

          {/* Salud */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Salud
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Grupo Sanguíneo</InputLabel>
                    <Select
                      name="grupo_sanguineo"
                      value={formik.values.grupo_sanguineo}
                      onChange={formik.handleChange}
                      label="Grupo Sanguíneo"
                    >
                      {BLOOD_TYPES.map((bt) => (
                        <MenuItem key={bt} value={bt}>{bt}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>


              </Grid>
            </Box>
          </Box>



          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Estado del Contratista
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.activo}
                        onChange={(e) => formik.setFieldValue('activo', e.target.checked)}
                        name="activo"
                        color="primary"
                      />
                    }
                    label="Contratista Activo"
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading || cargos.length === 0}
              sx={{ minWidth: 120 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : cargos.length === 0 ? (
                "Cargando..."
              ) : id ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContractorForm;

