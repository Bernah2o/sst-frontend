export enum MonthEnum {
  ENERO = 'ENERO',
  FEBRERO = 'FEBRERO',
  MARZO = 'MARZO',
  ABRIL = 'ABRIL',
  MAYO = 'MAYO',
  JUNIO = 'JUNIO',
  JULIO = 'JULIO',
  AGOSTO = 'AGOSTO',
  SEPTIEMBRE = 'SEPTIEMBRE',
  OCTUBRE = 'OCTUBRE',
  NOVIEMBRE = 'NOVIEMBRE',
  DICIEMBRE = 'DICIEMBRE'
}

export enum EventTypeEnum {
  ACCIDENTE_TRABAJO = 'ACCIDENTE_TRABAJO',
  ENFERMEDAD_LABORAL = 'ENFERMEDAD_LABORAL',
  ACCIDENTE_COMUN = 'ACCIDENTE_COMUN',
  ENFERMEDAD_GENERAL = 'ENFERMEDAD_GENERAL',
  ENFERMEDAD_LEVE = 'ENFERMEDAD LEVE'
}

export interface WorkerBasicInfo {
  id: number;
  document_number: string;
  first_name: string;
  last_name: string;
  position: string;
  salary_ibc?: number;
}

export interface AbsenteeismBase {
  event_month: MonthEnum;
  worker_id: number;
  event_type: EventTypeEnum;
  start_date: string;
  end_date: string;
  disability_days: number;
  extension?: number;
  charged_days?: number;
  disability_or_charged_days: number;
  diagnostic_code: string;
  health_condition_description: string;
  observations?: string;
  insured_costs_at?: number;
  insured_costs_ac_eg?: number;
  assumed_costs_at?: number;
  assumed_costs_ac_eg?: number;
}

export interface AbsenteeismCreate extends AbsenteeismBase {}

export interface AbsenteeismUpdate {
  event_month?: MonthEnum;
  worker_id?: number;
  event_type?: EventTypeEnum;
  start_date?: string;
  end_date?: string;
  disability_days?: number;
  extension?: number;
  charged_days?: number;
  disability_or_charged_days?: number;
  diagnostic_code?: string;
  health_condition_description?: string;
  observations?: string;
  insured_costs_at?: number;
  insured_costs_ac_eg?: number;
  assumed_costs_at?: number;
  assumed_costs_ac_eg?: number;
}

export interface AbsenteeismResponse {
  id: number;
  event_month: MonthEnum;
  worker_id: number;
  worker?: WorkerBasicInfo;
  cedula: string;
  position: string;
  event_type: EventTypeEnum;
  start_date: string;
  end_date: string;
  disability_days: number;
  extension: number;
  total_disability_days: number;
  charged_days: number;
  disability_or_charged_days: number;
  diagnostic_code: string;
  health_condition_description: string;
  observations?: string;
  base_salary: number;
  daily_base_salary: number;
  insured_costs_at: number;
  insured_costs_ac_eg: number;
  assumed_costs_at: number;
  assumed_costs_ac_eg: number;
  created_at: string;
  updated_at?: string;
}

export interface AbsenteeismListResponse {
  id: number;
  event_month: MonthEnum;
  worker_name: string;
  cedula: string;
  position: string;
  event_type: EventTypeEnum;
  start_date: string;
  end_date: string;
  total_disability_days: number;
  base_salary: number;
  created_at: string;
}

export interface AbsenteeismStats {
  total_records: number;
  total_disability_days: number;
  total_costs: number;
  by_event_type: Record<string, number>;
  by_month: Record<string, number>;
}

export interface AbsenteeismFilters {
  worker_id?: number;
  event_type?: EventTypeEnum;
  event_month?: MonthEnum;
  start_date_from?: string;
  start_date_to?: string;
  year?: number;
}

// Opciones para los selects
export const MONTH_OPTIONS = [
  { value: MonthEnum.ENERO, label: 'Enero' },
  { value: MonthEnum.FEBRERO, label: 'Febrero' },
  { value: MonthEnum.MARZO, label: 'Marzo' },
  { value: MonthEnum.ABRIL, label: 'Abril' },
  { value: MonthEnum.MAYO, label: 'Mayo' },
  { value: MonthEnum.JUNIO, label: 'Junio' },
  { value: MonthEnum.JULIO, label: 'Julio' },
  { value: MonthEnum.AGOSTO, label: 'Agosto' },
  { value: MonthEnum.SEPTIEMBRE, label: 'Septiembre' },
  { value: MonthEnum.OCTUBRE, label: 'Octubre' },
  { value: MonthEnum.NOVIEMBRE, label: 'Noviembre' },
  { value: MonthEnum.DICIEMBRE, label: 'Diciembre' }
];

export const EVENT_TYPE_OPTIONS = [
  { value: EventTypeEnum.ACCIDENTE_TRABAJO, label: 'Accidente de Trabajo' },
  { value: EventTypeEnum.ENFERMEDAD_LABORAL, label: 'Enfermedad Laboral' },
  { value: EventTypeEnum.ACCIDENTE_COMUN, label: 'Accidente Común' },
  { value: EventTypeEnum.ENFERMEDAD_GENERAL, label: 'Enfermedad General' },
  { value: EventTypeEnum.ENFERMEDAD_LEVE, label: 'Enfermedad Leve' }
];