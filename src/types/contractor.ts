export interface ContractorBase {
  // Información Personal (campos que existen en el modelo del backend)
  document_type: string; 
  document_number: string;
  first_name: string;
  last_name: string;
  second_name?: string;
  second_last_name?: string;
  birth_date: string;
  gender: string;
  email: string;
  phone?: string;
  
  // Información Laboral
  contract_type: string;
  position: string;
  profession?: string;
  risk_level: string;
  work_modality?: string;
  occupation?: string;
  contract_value?: number;
  fecha_de_inicio?: string;
  fecha_de_finalizacion?: string;
  
  // Área de trabajo
  area_id?: number;
  
  // Seguridad Social
  eps?: string;
  afp?: string;
  arl?: string;
  
  // Ubicación
  country?: string;
  department?: string;
  city?: string;
  direccion?: string;
  
  // Información Médica (solo blood_type existe en el backend)
  blood_type?: string;
  
  // Estado y observaciones
  is_active?: boolean;
  observations?: string;
  
  // Campos adicionales para compatibilidad con formularios (mapeo español)
  tipo_documento?: string;
  numero_documento?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono?: string;
  profesion?: string;
  cargo?: string;
  tipo_contrato?: string;
  nivel_riesgo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  pais?: string;
  grupo_sanguineo?: string;
  activo?: boolean;
}

export interface ContractorCreate extends ContractorBase {}

export interface ContractorUpdate extends Partial<ContractorBase> {}

export interface ContractorResponse extends ContractorBase {
  id: number;
  created_at: string;
  updated_at: string;
  
  // Campos adicionales que devuelve el backend
  fecha_de_inicio?: string;
  fecha_de_finalizacion?: string;
  observations?: string;
  
  // Campos que realmente devuelve el backend en español
  departamento?: string;
  ciudad?: string;
  cargo?: string;
  profesion?: string;
  tipo_contrato?: string;
  nivel_riesgo?: string;
  modalidad_trabajo?: string;
  valor_contrato?: number;
  ocupacion?: string;


}

export interface ContractorList {
  contractors: ContractorResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ContractorDocument {
  id: number;
  contractor_id: number;
  tipo_documento: ContractorDocumentType;
  nombre: string;
  archivo: string;
  descripcion?: string;
  fecha_subida: string;
  tamano_archivo: number;
  tipo_contenido: string;
}

export interface ContractorDocumentResponse {
  id: number;
  contractor_id: number;
  tipo_documento: ContractorDocumentType;
  nombre: string;
  archivo: string;
  descripcion?: string;
  fecha_subida: string;
  tamano_archivo: number;
  tipo_contenido: string;
  url_descarga?: string;
}

export interface ContractorDocumentUpdate {
  tipo_documento?: ContractorDocumentType;
  nombre?: string;
  descripcion?: string;
}

export interface ContractorContract {
  id: number;
  contractor_id: number;
  numero_contrato: string;
  fecha_inicio: string;
  fecha_fin: string;
  valor_contrato: number;
  descripcion_servicios: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface ContractorContractCreate {
  numero_contrato: string;
  fecha_inicio: string;
  fecha_fin: string;
  valor_contrato: number;
  descripcion_servicios: string;
  estado: string;
}

export interface ContractorContractUpdate extends Partial<ContractorContractCreate> {}

export interface ContractorContractResponse extends ContractorContract {}

// Enums para valores predefinidos
export const DOCUMENT_TYPES = [
  'cedula',
  'cedula_extranjeria',
  'pasaporte',
  'tarjeta_identidad'
] as const;

export const GENDER_OPTIONS = [
  'masculino',
  'femenino',
  'otro'
] as const;

export const MARITAL_STATUS_OPTIONS = [
  'soltero',
  'casado',
  'union_libre',
  'divorciado',
  'viudo'
] as const;

export const EDUCATION_LEVELS = [
  'primaria',
  'bachillerato',
  'tecnico',
  'tecnologo',
  'universitario',
  'especializacion',
  'maestria',
  'doctorado'
] as const;

export const CONTRACT_TYPES = [
  'obra_labor',
  'prestacion_servicios',
  'termino_fijo',
  'termino_indefinido'
] as const;

export const SHIRT_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL'
] as const;

export const PANTS_SIZES = [
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
  '46'
] as const;

export const SHOE_SIZES = [
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46'
] as const;

export const BLOOD_TYPES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-'
] as const;

export const CONTRACTOR_DOCUMENT_TYPES = [
  'cedula',
  'rut',
  'certificado_bancario',
  'eps',
  'arl',
  'pension',
  'contrato',
  'otro'
] as const;

export const CONTRACT_STATUS = [
  'activo',
  'terminado',
  'suspendido',
  'cancelado'
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];
export type Gender = typeof GENDER_OPTIONS[number];
export type MaritalStatus = typeof MARITAL_STATUS_OPTIONS[number];
export type EducationLevel = typeof EDUCATION_LEVELS[number];
export type ContractType = typeof CONTRACT_TYPES[number];
export type ShirtSize = typeof SHIRT_SIZES[number];
export type PantsSize = typeof PANTS_SIZES[number];
export type ShoeSize = typeof SHOE_SIZES[number];
export type BloodType = typeof BLOOD_TYPES[number];
export type ContractorDocumentType = typeof CONTRACTOR_DOCUMENT_TYPES[number];
export type ContractStatus = typeof CONTRACT_STATUS[number];