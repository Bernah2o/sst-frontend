// Enums
export enum UserRole {
  ADMIN = "admin",
  TRAINER = "trainer",
  EMPLOYEE = "employee",
  SUPERVISOR = "supervisor",
}

export enum Gender {
  MALE = "masculino",
  FEMALE = "femenino",
  OTHER = "otro",
}

export enum DocumentType {
  CEDULA = "cedula",
  PASSPORT = "pasaporte",
  OTHER = "otro",
  SPECIAL_PERMIT = "permiso_especial_permanencia",
}

export enum ContractType {
  INDEFINITE = "indefinido",
  FIXED = "fijo",
  SERVICES = "prestacion_servicios",
  WORK_LABOR = "obra_labor",
}

export enum WorkModality {
  ON_SITE = "trabajo_presencial",
  REMOTE = "trabajo_remoto",
  TELEWORK = "teletrabajo",
  HOME_OFFICE = "trabajo_en_casa",
  MOBILE = "trabajo_movil_itinerante",
}

export enum RiskLevel {
  LEVEL_I = "nivel_1",
  LEVEL_II = "nivel_2",
  LEVEL_III = "nivel_3",
  LEVEL_IV = "nivel_4",
  LEVEL_V = "nivel_5",
}

export enum BloodType {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
}

// Reinduction Enums
export enum ReinductionStatus {
  PENDING = "pending",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  OVERDUE = "overdue",
  EXEMPTED = "exempted",
}

// Seguimiento Enums
export enum EstadoSeguimiento {
  INICIADO = "iniciado",
  TERMINADO = "terminado",
}

export enum ValoracionRiesgo {
  BAJO = "bajo",
  MEDIO = "medio",
  ALTO = "alto",
  MUY_ALTO = "muy_alto",
}

// Audit Enums
export enum AuditAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
  LOGOUT = "logout",
  EXPORT = "export",
  IMPORT = "import",
  DOWNLOAD = "download",
  UPLOAD = "upload",
  APPROVE = "approve",
  REJECT = "reject",
  SUBMIT = "submit",
  COMPLETE = "complete",
  CANCEL = "cancel",
}

// Occupational Exam Enums
export enum ExamType {
  INGRESO = "examen_ingreso",
  PERIODICO = "examen_periodico",
  REINTEGRO = "examen_reintegro",
  RETIRO = "examen_retiro",
}

export enum MedicalAptitude {
  APTO = "apto",
  APTO_CON_RECOMENDACIONES = "apto_con_recomendaciones",
  NO_APTO = "no_apto",
}

// User Progress Enums
export enum MaterialProgressStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SKIPPED = "skipped",
}

// Course Enums
export enum CourseType {
  INDUCTION = "induction",
  REINDUCTION = "reinduction",
  SPECIALIZED = "specialized",
  MANDATORY = "mandatory",
  OPTIONAL = "optional",
  TRAINING = "training",
  ENTERTAINMENT = "entertainment",
}

export enum CourseStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum MaterialType {
  PDF = "pdf",
  VIDEO = "video",
  PRESENTATION = "presentation",
  DOCUMENT = "document",
  LINK = "link",
  QUIZ = "quiz",
}

// Survey Enums
export enum SurveyStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  CLOSED = "closed",
  ARCHIVED = "archived",
}

export enum SurveyQuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  SINGLE_CHOICE = "single_choice",
  TEXT = "text",
  TEXTAREA = "textarea",
  RATING = "rating",
  YES_NO = "yes_no",
  SCALE = "scale",
}

export enum UserSurveyStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  EXPIRED = "expired",
}

// Report Enums
export enum ExportFormat {
  CSV = "csv",
  EXCEL = "excel",
  PDF = "pdf",
  JSON = "json",
}

// User Schemas
export interface UserBase {
  email: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  phone?: string;
  department?: string;
  position?: string;
  role: UserRole;
  notes?: string;
}

export interface UserCreate extends UserBase {
  password: string;
  hire_date?: string;
  custom_role_id?: number;
}

export interface UserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  document_type?: string;
  document_number?: string;
  phone?: string;
  department?: string;
  position?: string;
  role?: UserRole;
  custom_role_id?: number;
  is_active?: boolean;
  notes?: string;
  hire_date?: string;
}

export interface UserResponse extends UserBase {
  id: number;
  is_active: boolean;
  is_verified: boolean;
  profile_picture?: string;
  hire_date?: string;
  custom_role_id?: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
  full_name: string;
  custom_role?: {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    is_active: boolean;
  };
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  phone?: string;
  department?: string;
  position?: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: any;
}

export interface TokenData {
  user_id?: number;
  email?: string;
  role?: UserRole;
}

export interface PasswordReset {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface EmailVerification {
  token: string;
}

export interface UserProfile {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
  role?: UserRole;
  department?: string;
  position?: string;
}

export interface UserStats {
  total_courses_completed: number;
  total_evaluations_passed: number;
  total_certificates_earned: number;
  average_score: number;
  last_activity?: string;
}

// Legacy interface for backward compatibility
export interface User extends UserResponse {
  hashed_password?: string; // Only for backend, not exposed in frontend
  password_reset_token?: string;
  password_reset_expires?: string;
  email_verification_token?: string;
  email_verification_expires?: string;
  full_name: string;
  worker_id?: number; // ID del trabajador asociado
  // Campos legacy para compatibilidad
  nombre: string;
  apellido: string;
  rol: UserRole;
  activo: boolean;
  fecha_creacion: string;
}

// Legacy interfaces for backward compatibility
export interface LoginRequest extends UserLogin {}
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Tipos para los cursos
export interface Curso {
  id: number;
  title: string;
  description: string;
  course_type: string;
  status: string;
  duration_hours: number;
  passing_score: number;
  max_attempts: number;
  is_mandatory: boolean;
  thumbnail?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
  order_index: number;
  // Campos legacy para compatibilidad
  titulo: string;
  descripcion: string;
  duracion_horas: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface CursoCreate {
  titulo: string;
  descripcion: string;
  duracion_horas: number;
  fecha_inicio: string;
  fecha_fin: string;
}

// Tipos para las inscripciones
export interface Inscripcion {
  id: number;
  usuario_id: number;
  curso_id: number;
  fecha_inscripcion: string;
  completado: boolean;
  calificacion?: number;
  usuario?: User;
  curso?: Curso;
}

// Tipos para asistencia (alineados con schemas del backend)
export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  EXCUSED = "excused",
  PARTIAL = "partial",
}

export enum AttendanceType {
  IN_PERSON = "in_person",
  VIRTUAL = "virtual",
  HYBRID = "hybrid",
  SELF_PACED = "self_paced",
}

export interface AttendanceBase {
  user_id: number;
  course_id: number;
  session_date: string;
  status: AttendanceStatus;
  attendance_type: AttendanceType;
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  scheduled_duration_minutes?: number;
  completion_percentage: number;
  location?: string;
  ip_address?: string;
  device_info?: string;
  notes?: string;
}

export interface AttendanceCreate extends AttendanceBase {}

export interface AttendanceUpdate {
  status?: AttendanceStatus;
  attendance_type?: AttendanceType;
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  scheduled_duration_minutes?: number;
  completion_percentage?: number;
  location?: string;
  ip_address?: string;
  device_info?: string;
  notes?: string;
  verified_by?: number;
  verified_at?: string;
}

export interface AttendanceResponse extends AttendanceBase {
  id: number;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  attendance_percentage: number;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
}

export interface CourseInfo {
  id: number;
  title: string;
}

export interface AttendanceListResponse {
  id: number;
  user_id: number;
  course_id: number;
  enrollment_id?: number;
  session_id?: number;
  session_date: string;
  status: AttendanceStatus;
  attendance_type: AttendanceType;
  check_in_time?: string;
  check_out_time?: string;
  duration_minutes?: number;
  scheduled_duration_minutes?: number;
  completion_percentage: number;
  location?: string;
  ip_address?: string;
  device_info?: string;
  notes?: string;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  user?: UserInfo;
  course?: CourseInfo;
}

// Attendance Summary Schemas
export interface AttendanceSummary {
  user_id: number;
  course_id: number;
  total_sessions: number;
  attended_sessions: number;
  attendance_rate: number;
  total_hours: number;
  completed_hours: number;
  completion_rate: number;
}

export interface CourseAttendanceSummary {
  course_id: number;
  course_title: string;
  total_enrolled: number;
  total_sessions: number;
  average_attendance_rate: number;
  average_completion_rate: number;
}

// Bulk Attendance Registration Schemas
export interface BulkAttendanceCreate {
  course_id: number;
  session_id?: number;
  session_date: string;
  user_ids: number[];
  status: AttendanceStatus;
  attendance_type: AttendanceType;
  location?: string;
  notes?: string;
  send_notifications: boolean;
}

export interface BulkAttendanceResponse {
  message: string;
  created_count: number;
  skipped_count: number;
  errors: string[];
}

export interface AttendanceNotificationData {
  user_name: string;
  user_email: string;
  course_title: string;
  session_title: string;
  session_date: string;
  session_time: string;
  location?: string;
  status: string;
}

export interface AttendanceStats {
  total?: number; // Mantener para compatibilidad
  total_attendance?: number; // Campo que devuelve el backend
  present: number;
  absent: number;
  late: number;
  excused: number;
  partial: number;
  attendance_rate?: number;
}

// Tipos para notificaciones (alineados con schemas del backend)
export enum NotificationType {
  EMAIL = "email",
  SMS = "sms",
  IN_APP = "in_app",
  PUSH = "push",
  COURSE_UPDATE = "course_update",
  ASSIGNMENT_DUE = "assignment_due",
  GRADE_POSTED = "grade_posted",
  ANNOUNCEMENT = "announcement",
  REMINDER = "reminder",
  SYSTEM_ALERT = "system_alert",
  MESSAGE = "message",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SUCCESS = "success",
  CURSO = "curso",
  EVALUACION = "evaluacion",
  EVENTO = "evento",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  READ = "read",
  UNREAD = "unread",
  ARCHIVED = "archived",
  FAVORITE = "favorite",
}

export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface NotificationBase {
  user_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  scheduled_at?: string;
  additional_data?: string;
}

export interface NotificationResponse extends NotificationBase {
  id: number;
  status: NotificationStatus;
  sent_at?: string;
  read_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  course_reminders: boolean;
  evaluation_reminders: boolean;
  certificate_notifications: boolean;
  survey_invitations: boolean;
}

// Tipos para certificados (alineados con schemas del backend)
export enum CertificateStatus {
  PENDING = "pending",
  ISSUED = "issued",
  VALID = "valid",
  ACTIVE = "active",
  REVOKED = "revoked",
  EXPIRED = "expired",
}

export interface CertificateBase {
  user_id: number;
  course_id: number;
  title: string;
  description?: string;
  score_achieved?: number;
  completion_date: string;
  expiry_date?: string;
  template_used?: string;
  additional_data?: string;
}

export interface CertificateResponse extends CertificateBase {
  id: number;
  certificate_number: string;
  status: CertificateStatus;
  issue_date: string;
  file_path?: string;
  verification_code?: string;
  issued_by?: number;
  revoked_by?: number;
  revoked_at?: string;
  revocation_reason?: string;
  created_at: string;
  updated_at: string;
  is_valid: boolean;
  is_expired: boolean;
}

// Evaluation Enums
export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  OPEN_TEXT = "open_text",
  MATCHING = "matching",
  ORDERING = "ordering",
}

export enum EvaluationStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum UserEvaluationStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  EXPIRED = "expired",
}

// Answer Schemas
export interface AnswerBase {
  answer_text: string;
  is_correct: boolean;
  order_index: number;
  explanation?: string;
}

export interface AnswerCreate extends AnswerBase {
  question_id: number;
}

export interface AnswerUpdate {
  answer_text?: string;
  is_correct?: boolean;
  order_index?: number;
  explanation?: string;
}

export interface AnswerResponse extends AnswerBase {
  id: number;
  question_id: number;
  created_at: string;
  updated_at: string;
}

// Question Schemas
export interface QuestionBase {
  question_text: string;
  question_type: QuestionType;
  points: number;
  order_index: number;
  explanation?: string;
  image_url?: string;
  required: boolean;
}

export interface QuestionCreateForEvaluation {
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer?: string;
  points: number;
  order_index: number;
  explanation?: string;
  image_url?: string;
  required: boolean;
}

export interface QuestionCreate extends QuestionBase {
  evaluation_id: number;
  answers: AnswerBase[];
}

export interface QuestionUpdate {
  question_text?: string;
  question_type?: QuestionType;
  points?: number;
  order_index?: number;
  explanation?: string;
  image_url?: string;
  required?: boolean;
}

export interface QuestionResponse extends QuestionBase {
  id: number;
  evaluation_id: number;
  answers: AnswerResponse[];
  created_at: string;
  updated_at: string;
}

// User Answer Schemas
export interface UserAnswerBase {
  question_id: number;
  answer_text?: string;
  selected_answer_ids?: string; // JSON array
  time_spent_seconds?: number;
}

export interface UserAnswerCreate extends UserAnswerBase {
  user_evaluation_id: number;
}

export interface UserAnswerResponse extends UserAnswerBase {
  id: number;
  user_evaluation_id: number;
  is_correct: boolean;
  points_earned: number;
  answered_at: string;
}

// User Evaluation Schemas
export interface UserEvaluationBase {
  user_id: number;
  evaluation_id: number;
  attempt_number: number;
}

export interface UserEvaluationCreate extends UserEvaluationBase {}

export interface UserEvaluationUpdate {
  status?: UserEvaluationStatus;
  score?: number;
  total_points?: number;
  max_points?: number;
  time_spent_minutes?: number;
  passed?: boolean;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
}

export interface UserEvaluationResponse {
  id: number;
  user_id: number;
  evaluation_id: number;
  enrollment_id?: number;
  attempt_number: number;
  status: UserEvaluationStatus;
  score?: number;
  total_points?: number;
  max_points?: number;
  percentage?: number;
  time_spent_minutes?: number;
  passed: boolean;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Evaluation Schemas
export interface EvaluationBase {
  title: string;
  description?: string;
  instructions?: string;
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts: number;
  randomize_questions: boolean;
  show_results_immediately: boolean;
  allow_review: boolean;
  expires_at?: string;
}

export interface EvaluationCreate extends EvaluationBase {
  course_id: number;
  questions: QuestionCreateForEvaluation[];
}

export interface EvaluationUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  time_limit_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
  randomize_questions?: boolean;
  show_results_immediately?: boolean;
  allow_review?: boolean;
  status?: EvaluationStatus;
  expires_at?: string;
}

export interface EvaluationResponse extends EvaluationBase {
  id: number;
  course_id: number;
  status: EvaluationStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  questions: QuestionResponse[];
}

export interface EvaluationListResponse {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  status: EvaluationStatus;
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts: number;
  created_at: string;
  published_at?: string;
}

// Evaluation Submission Schema
export interface EvaluationSubmission {
  user_answers: UserAnswerBase[];
}

export enum CertificateType {
  COMPLETION = "completion",
  ACHIEVEMENT = "achievement",
  PARTICIPATION = "participation",
  EXCELLENCE = "excellence",
}

// Tipos para la API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Tipos para formularios
export interface FormErrors {
  [key: string]: string[];
}

// Tipos para el estado de la aplicación
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface AppState {
  auth: AuthState;
  loading: boolean;
  error: string | null;
}

// Worker interfaces based on backend schema
export interface WorkerBase {
  photo?: string;
  gender: Gender;
  document_type: DocumentType;
  document_number: string;
  first_name: string;
  last_name: string;
  birth_date: string; // date in backend
  email: string;
  phone?: string;
  contract_type: ContractType;
  work_modality?: WorkModality;
  profession?: string;
  risk_level: RiskLevel;
  position: string;
  occupation?: string;
  salary_ibc?: number;
  fecha_de_ingreso?: string; // date in backend
  fecha_de_retiro?: string; // date in backend
  eps_id?: number;
  afp_id?: number;
  arl_id?: number;
  country: string; // required in backend with default "Colombia"
  department?: string;
  city?: string;
  blood_type?: BloodType;
  observations?: string;
  is_active: boolean; // required in backend with default true
  assigned_role: UserRole; // required in backend with default EMPLOYEE
}

export interface Worker extends WorkerBase {
  id: number;
  age: number; // Calculated automatically in backend
  full_name: string; // Calculated automatically in backend
  contracts: WorkerContract[]; // List of contracts
  is_registered: boolean;
  user_id?: number;
  created_at: string;
  updated_at: string;
  // Relaciones de seguridad social
  eps?: SeguridadSocialResponse;
  afp?: SeguridadSocialResponse;
  arl?: SeguridadSocialResponse;
  // Legacy fields for compatibility
  cedula: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  cargo: string;
  departamento?: string;
  fecha_ingreso: string;
  activo: boolean;
}

export interface WorkerCreate extends WorkerBase {
  // All fields inherited from WorkerBase
  // birth_date is required for creation
  birth_date: string; // required date field
}

export interface WorkerUpdate {
  photo?: string;
  gender?: Gender;
  document_type?: DocumentType;
  document_number?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string; // date field
  email?: string;
  phone?: string;
  contract_type?: ContractType;
  work_modality?: WorkModality;
  profession?: string;
  risk_level?: RiskLevel;
  position?: string;
  occupation?: string;
  salary_ibc?: number;
  fecha_de_ingreso?: string; // date field
  fecha_de_retiro?: string; // date field
  eps_id?: number;
  afp_id?: number;
  arl_id?: number;
  country?: string;
  department?: string;
  city?: string;
  blood_type?: BloodType;
  observations?: string;
  is_active?: boolean;
  assigned_role?: UserRole;
}

export interface WorkerList {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  document_number: string;
  email: string;
  position: string;
  department?: string;
  age: number;
  risk_level: RiskLevel;
  is_active: boolean;
  assigned_role: UserRole;
  is_registered: boolean;
  photo?: string;
}

export interface WorkerContractBase {
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface WorkerContractCreate extends WorkerContractBase {}

export interface WorkerContractUpdate {
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface WorkerContract extends WorkerContractBase {
  id: number;
  worker_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Reinduction Types
export interface ReinductionRecord {
  id: number;
  worker_id: number;
  year: number;
  due_date: string;
  status: ReinductionStatus;
  assigned_course_id?: number;
  enrollment_id?: number;
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
  exemption_reason?: string;
  first_notification_sent?: string;
  reminder_notification_sent?: string;
  overdue_notification_sent?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  is_overdue: boolean;
  days_until_due: number;
  needs_notification: boolean;
  worker_name?: string;
  course_title?: string;
  enrollment_status?: string;
}

export interface ReinductionRecordCreate {
  worker_id: number;
  year: number;
  due_date: string;
  status?: ReinductionStatus;
  assigned_course_id?: number;
  scheduled_date?: string;
  notes?: string;
  exemption_reason?: string;
}

export interface ReinductionRecordUpdate {
  status?: ReinductionStatus;
  assigned_course_id?: number;
  enrollment_id?: number;
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
  exemption_reason?: string;
}

export interface ReinductionConfig {
  id: number;
  first_notification_days: number;
  reminder_notification_days: number;
  grace_period_days: number;
  default_reinduction_course_id?: number;
  auto_enroll_enabled: boolean;
  auto_check_enabled: boolean;
  auto_notification_enabled: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: number;
  default_course_title?: string;
}

export interface WorkerReinductionSummary {
  worker_id: number;
  worker_name: string;
  fecha_de_ingreso: string;
  years_in_company: number;
  current_year_record?: ReinductionRecord;
  total_reinducciones: number;
  completed_reinducciones: number;
  pending_reinducciones: number;
  overdue_reinducciones: number;
  next_due_date?: string;
}

// Seguimiento Types
export interface Seguimiento {
  id: number;
  worker_id: number;
  programa: string;
  nombre_trabajador: string;
  cedula: string;
  cargo: string;
  fecha_ingreso?: string;
  estado: EstadoSeguimiento;
  valoracion_riesgo?: ValoracionRiesgo;
  fecha_inicio?: string;
  fecha_final?: string;
  observacion?: string;
  motivo_inclusion?: string;
  conclusiones_ocupacionales?: string;
  conductas_ocupacionales_prevenir?: string;
  recomendaciones_generales?: string;
  observaciones_examen?: string;
  comentario?: string;
  created_at: string;
  updated_at: string;
}

export interface SeguimientoCreate {
  worker_id: number;
  programa: string;
  nombre_trabajador: string;
  cedula: string;
  cargo: string;
  fecha_ingreso?: string;
  estado?: EstadoSeguimiento;
  valoracion_riesgo?: ValoracionRiesgo;
  fecha_inicio?: string;
  fecha_final?: string;
  observacion?: string;
  motivo_inclusion?: string;
  conclusiones_ocupacionales?: string;
  conductas_ocupacionales_prevenir?: string;
  recomendaciones_generales?: string;
  observaciones_examen?: string;
  comentario?: string;
}

export interface SeguimientoUpdate {
  estado?: EstadoSeguimiento;
  valoracion_riesgo?: ValoracionRiesgo;
  fecha_inicio?: string;
  fecha_final?: string;
  observacion?: string;
  motivo_inclusion?: string;
  conclusiones_ocupacionales?: string;
  conductas_ocupacionales_prevenir?: string;
  recomendaciones_generales?: string;
  observaciones_examen?: string;
  comentario?: string;
}

// Audit Types
export interface AuditLog {
  id: number;
  user_id?: number;
  action: AuditAction;
  resource_type: string;
  resource_id?: number;
  resource_name?: string;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: string;
  user_email?: string;
  user_name?: string;
}

// Occupational Exam Types
export interface OccupationalExam {
  id: number;
  worker_id: number;
  exam_type: ExamType;
  exam_date: string;
  programa?: string;
  occupational_conclusions?: string;
  preventive_occupational_behaviors?: string;
  general_recommendations?: string;
  medical_aptitude_concept: MedicalAptitude;
  observations?: string;
  examining_doctor?: string;
  medical_center?: string;
  pdf_file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface OccupationalExamCreate {
  worker_id: number;
  exam_type: ExamType;
  exam_date: string;
  programa?: string;
  occupational_conclusions?: string;
  preventive_occupational_behaviors?: string;
  general_recommendations?: string;
  medical_aptitude_concept: MedicalAptitude;
  observations?: string;
  examining_doctor?: string;
  medical_center?: string;
}

export interface OccupationalExamUpdate {
  exam_type?: ExamType;
  exam_date?: string;
  programa?: string;
  occupational_conclusions?: string;
  preventive_occupational_behaviors?: string;
  general_recommendations?: string;
  medical_aptitude_concept?: MedicalAptitude;
  observations?: string;
  examining_doctor?: string;
  medical_center?: string;
}

// User Progress Types
export interface UserMaterialProgress {
  id: number;
  user_id: number;
  enrollment_id: number;
  material_id: number;
  status: MaterialProgressStatus;
  progress_percentage: number;
  last_position: number;
  time_spent_seconds: number;
  notes?: string;
  started_at?: string;
  completed_at?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export interface UserModuleProgress {
  id: number;
  user_id: number;
  enrollment_id: number;
  module_id: number;
  status: MaterialProgressStatus;
  progress_percentage: number;
  materials_completed: number;
  total_materials: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Session Types
export interface Session {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  max_capacity?: number;
  is_active: boolean;
  duration_minutes: number;
  is_past: boolean;
  is_current: boolean;
  attendance_count: number;
  created_at: string;
  updated_at: string;
  course?: any;
}

export interface SessionCreate {
  course_id: number;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  max_capacity?: number;
  is_active?: boolean;
}

export interface SessionUpdate {
  title?: string;
  description?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_capacity?: number;
  is_active?: boolean;
}

// Admin Config Types
// Tipo para periodicidad EMO
export type PeriodicidadEMO =
  | "anual"
  | "semestral"
  | "trimestral"
  | "bianual"
  | "mensual"
  | "quincenal"
  | "semanal";

export interface AdminConfig {
  id: number;
  category: string;
  display_name: string;
  emo_periodicity?: PeriodicidadEMO;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminConfigCreate {
  category: string;
  display_name: string;
  emo_periodicity?: PeriodicidadEMO;
  is_active?: boolean;
}

export interface AdminConfigUpdate {
  display_name?: string;
  emo_periodicity?: PeriodicidadEMO;
  is_active?: boolean;
}

export interface Programas {
  id: number;
  nombre_programa: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Survey Types
// Survey Schemas
export interface SurveyBase {
  title: string;
  description?: string;
  instructions?: string;
  is_anonymous: boolean;
  allow_multiple_responses: boolean;
  closes_at?: string;
  expires_at?: string;
}

export interface SurveyCreate extends SurveyBase {
  course_id?: number;
}

export interface SurveyUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  is_anonymous?: boolean;
  allow_multiple_responses?: boolean;
  closes_at?: string;
  expires_at?: string;
  status?: SurveyStatus;
}

export interface SurveyResponse extends SurveyBase {
  id: number;
  course_id?: number;
  status: SurveyStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  questions: SurveyQuestionResponse[];
}

export interface SurveyListResponse {
  id: number;
  title: string;
  description?: string;
  course_id?: number;
  status: SurveyStatus;
  is_anonymous: boolean;
  allow_multiple_responses: boolean;
  closes_at?: string;
  expires_at?: string;
  created_at: string;
  published_at?: string;
}

// Survey Question Schemas
export interface SurveyQuestionBase {
  question_text: string;
  question_type: SurveyQuestionType;
  options?: string; // JSON array
  is_required: boolean;
  order_index: number;
  min_value?: number;
  max_value?: number;
  placeholder_text?: string;
}

export interface SurveyQuestionCreate extends SurveyQuestionBase {
  survey_id: number;
}

export interface SurveyQuestionUpdate {
  question_text?: string;
  question_type?: SurveyQuestionType;
  options?: string;
  is_required?: boolean;
  order_index?: number;
  min_value?: number;
  max_value?: number;
  placeholder_text?: string;
}

export interface SurveyQuestionResponse extends SurveyQuestionBase {
  id: number;
  survey_id: number;
  created_at: string;
  updated_at: string;
}

// User Survey Answer Schemas
export interface UserSurveyAnswerBase {
  question_id: number;
  answer_text?: string;
  answer_value?: number;
  selected_options?: string; // JSON array
}

export interface UserSurveyAnswerCreate extends UserSurveyAnswerBase {
  user_survey_id: number;
}

export interface UserSurveyAnswerResponse extends UserSurveyAnswerBase {
  id: number;
  user_survey_id: number;
  answered_at: string;
}

// User Survey Schemas
export interface UserSurveyBase {
  user_id: number;
  survey_id: number;
}

export interface UserSurveyCreate extends UserSurveyBase {
  anonymous_token?: string;
}

export interface UserSurveyUpdate {
  status?: UserSurveyStatus;
  started_at?: string;
  completed_at?: string;
}

export interface UserSurveyResponse extends UserSurveyBase {
  id: number;
  status: UserSurveyStatus;
  started_at?: string;
  completed_at?: string;
  anonymous_token?: string;
  created_at: string;
  updated_at: string;
  answers: UserSurveyAnswerResponse[];
}

// Survey Results Schemas
export interface AnswerDetail {
  question_id: number;
  question_text: string;
  question_type: string;
  answer_text?: string;
  answer_value?: number;
  selected_options?: string;
  display_value: string;
  is_answered: boolean;
}

export interface EmployeeResponse {
  user_id: number;
  employee_name: string;
  employee_email: string;
  cargo?: string;
  telefono?: string;
  submission_date?: string;
  submission_status: string;
  response_time_minutes?: number;
  answers: AnswerDetail[];
  completion_percentage: number;
}

export interface SurveyDetailedResults {
  survey_id: number;
  survey_title: string;
  survey_description?: string;
  course_title?: string;
  total_responses: number;
  completed_responses: number;
  completion_rate: number;
  questions: SurveyQuestionResponse[];
  employee_responses: EmployeeResponse[];
}

export interface SurveyPresentation {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  is_anonymous: boolean;
  allow_multiple_responses: boolean;
  questions: SurveyQuestionResponse[];
  closes_at?: string;
  expires_at?: string;
}

// Legacy interfaces for backward compatibility
export interface Survey extends SurveyResponse {}
export interface SurveyQuestion extends SurveyQuestionResponse {}
export interface UserSurvey extends UserSurveyResponse {}

// Course Module and Material Types
// Course Material Schemas
export interface CourseMaterialBase {
  title: string; // max_length=255
  description?: string;
  material_type: MaterialType;
  file_path?: string; // max_length=500
  file_url?: string; // max_length=500
  file_size?: number;
  mime_type?: string; // max_length=100
  duration_seconds?: number;
  order_index: number; // default=0
  is_downloadable: boolean; // default=true
  is_required: boolean; // default=true
}

export interface CourseMaterialCreate extends CourseMaterialBase {
  module_id: number;
}

export interface CourseMaterialUpdate {
  title?: string;
  description?: string;
  material_type?: MaterialType;
  file_path?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  order_index?: number;
  is_downloadable?: boolean;
  is_required?: boolean;
}

export interface CourseMaterialResponse extends CourseMaterialBase {
  id: number;
  module_id: number;
  created_at: string; // datetime
  updated_at: string; // datetime
  completed?: boolean;
  progress_percentage?: number;
  status?: string;
}

// Course Module Schemas
export interface CourseModuleBase {
  title: string; // max_length=255
  description?: string;
  order_index: number; // default=0
  duration_minutes?: number;
  is_required: boolean; // default=true
}

export interface CourseModuleCreate extends CourseModuleBase {}

export interface CourseModuleUpdate {
  title?: string;
  description?: string;
  order_index?: number;
  duration_minutes?: number;
  is_required?: boolean;
}

export interface CourseModuleResponse extends CourseModuleBase {
  id: number;
  course_id: number;
  materials: CourseMaterialResponse[]; // List of materials
  created_at: string; // datetime
  updated_at: string; // datetime
}

// Course Schemas
export interface CourseBase {
  title: string; // max_length=255
  description?: string;
  course_type: CourseType;
  duration_hours?: number;
  passing_score: number; // default=70.0
  max_attempts: number; // default=3
  is_mandatory: boolean; // default=false
  thumbnail?: string; // max_length=255
  expires_at?: string; // datetime field
  order_index: number; // default=0
}

export interface CourseCreate extends CourseBase {}

export interface CourseUpdate {
  title?: string;
  description?: string;
  course_type?: CourseType;
  status?: CourseStatus;
  duration_hours?: number;
  passing_score?: number;
  max_attempts?: number;
  is_mandatory?: boolean;
  thumbnail?: string;
  expires_at?: string;
  order_index?: number;
}

export interface CourseResponse extends CourseBase {
  id: number;
  status: CourseStatus;
  created_by: number;
  created_at: string; // datetime
  updated_at: string; // datetime
  published_at?: string; // datetime
  modules: CourseModuleResponse[]; // List of modules
}

export interface CourseListResponse {
  id: number;
  title: string;
  description?: string;
  course_type: CourseType;
  status: CourseStatus;
  duration_hours?: number;
  passing_score: number;
  max_attempts: number;
  is_mandatory: boolean;
  thumbnail?: string;
  expires_at?: string;
  order_index: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface UserCourseResponse {
  id: number;
  title: string;
  description?: string;
  course_type: CourseType;
  status: CourseStatus;
  duration_hours?: number;
  is_mandatory: boolean;
  thumbnail?: string;
  created_at: string;
  published_at?: string;
  modules: CourseModuleResponse[];
  // User-specific fields
  progress: number;
  enrolled_at?: string;
  completed: boolean;
}

// Seguridad Social Types
export interface SeguridadSocialResponse {
  id: number;
  tipo: string;
  nombre: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Legacy interfaces for backward compatibility
export interface CourseModule extends CourseModuleResponse {}
export interface CourseMaterial extends CourseMaterialResponse {
  // User progress information
  completed?: boolean;
  progress_percentage?: number;
  status?: string;
}
