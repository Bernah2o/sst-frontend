import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formato de fecha estándar para la aplicación: DD/MM/YYYY
 */
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT_12H = 'dd/MM/yyyy hh:mm a';
export const TIME_FORMAT_12H = 'hh:mm a';

/**
 * Formatea una fecha al formato DD/MM/YYYY
 * @param date - Fecha a formatear (string ISO, Date object, o null/undefined)
 * @returns Fecha formateada como DD/MM/YYYY o 'N/A' si la fecha es inválida
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'N/A';
    }
    
    return format(dateObj, DATE_FORMAT, { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Formatea una fecha y hora al formato DD/MM/YYYY HH:mm
 * @param date - Fecha a formatear (string ISO, Date object, o null/undefined)
 * @returns Fecha y hora formateada como DD/MM/YYYY HH:mm o 'N/A' si la fecha es inválida
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'N/A';
    }
    
    return format(dateObj, DATETIME_FORMAT, { locale: es });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'N/A';
  }
};

/**
 * Formatea una fecha y hora al formato DD/MM/YYYY hh:mm a (12 horas)
 */
export const formatDateTime12h = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    if (!isValid(dateObj)) return 'N/A';
    return format(dateObj, DATETIME_FORMAT_12H, { locale: es });
  } catch (error) {
    console.error('Error formatting datetime 12h:', error);
    return 'N/A';
  }
};

/**
 * Formatea solo la hora al formato HH:mm
 * @param date - Fecha a formatear (string ISO, Date object, o null/undefined)
 * @returns Hora formateada como HH:mm o 'N/A' si la fecha es inválida
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'N/A';
    }
    
    return format(dateObj, TIME_FORMAT, { locale: es });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'N/A';
  }
};

/**
 * Formatea solo la hora al formato hh:mm a (12 horas)
 */
export const formatTime12h = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    if (!isValid(dateObj)) return 'N/A';
    return format(dateObj, TIME_FORMAT_12H, { locale: es });
  } catch (error) {
    console.error('Error formatting time 12h:', error);
    return 'N/A';
  }
};

/**
 * Convierte una fecha al formato ISO string para envío al backend
 * @param date - Fecha a convertir
 * @returns String en formato ISO o null si la fecha es inválida
 */
export const toISOString = (date: Date | null | undefined): string | null => {
  if (!date || !isValid(date)) return null;
  return date.toISOString();
};

/**
 * Convierte una fecha al formato YYYY-MM-DD para campos de tipo date
 * @param date - Fecha a convertir
 * @returns String en formato YYYY-MM-DD o '' si la fecha es inválida
 */
export const toDateInputValue = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error converting to date input value:', error);
    return '';
  }
};

/**
 * Configuración de localización para componentes de Material-UI
 */
export const getLocalizationConfig = () => ({
  locale: es,
  dateFormats: {
    dayOfMonth: 'd',
    fullDate: 'dd/MM/yyyy',
    fullDateTime: 'dd/MM/yyyy HH:mm',
    fullTime: 'HH:mm',
    hours12: 'hh:mm a',
    hours24: 'HH:mm',
    keyboardDate: 'dd/MM/yyyy',
    keyboardDateTime: 'dd/MM/yyyy HH:mm',
    monthAndDate: 'dd/MM',
    monthAndYear: 'MM/yyyy',
    monthShort: 'MMM',
    weekday: 'EEEE',
    weekdayShort: 'EEE',
    normalDate: 'dd/MM/yyyy',
    normalDateWithWeekday: 'EEE, dd/MM/yyyy',
    shortDate: 'dd/MM/yy',
    year: 'yyyy'
  }
});

/**
 * Parsea una fecha de tipo 'YYYY-MM-DD' como fecha local sin desfase de huso horario.
 * Si la cadena incluye tiempo o zona (p.ej. ISO completo), usa parseISO.
 */
export const parseDateOnlyToLocal = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return isValid(date) ? date : null;
  const s = String(date).trim();
  // Maneja exclusivamente fecha sin hora: 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const local = new Date(y, m - 1, d);
    return isValid(local) ? local : null;
  }
  // Para ISO con hora/zona, delegar a parseISO
  try {
    const dt = parseISO(s);
    return isValid(dt) ? dt : null;
  } catch {
    return null;
  }
};
