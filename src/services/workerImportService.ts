import api from './api';

export interface WorkerImportRowError {
  fila: number;
  error: string;
  campo?: string | null;
}

export interface WorkerImportPreview {
  total_filas: number;
  filas_validas: number;
  filas_con_error: number;
  errores_validacion: WorkerImportRowError[];
  duplicados_en_archivo: WorkerImportRowError[];
  columnas_detectadas: string[];
  columnas_mapeadas: Record<string, string | null>;
  muestra_datos: Record<string, unknown>[];
}

export interface WorkerImportRowResult {
  fila: number;
  document_number?: string | null;
  full_name?: string | null;
  success: boolean;
  message: string;
  worker_id?: number | null;
}

export interface WorkerImportResult {
  total_filas: number;
  creados: number;
  fallidos: number;
  resultados: WorkerImportRowResult[];
}

class WorkerImportService {
  async previewImport(file: File): Promise<WorkerImportPreview> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/workers/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async importWorkers(file: File): Promise<WorkerImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/workers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async downloadTemplate(): Promise<Blob> {
    const res = await api.get('/workers/import/template', { responseType: 'blob' });
    return res.data;
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const workerImportService = new WorkerImportService();
export default workerImportService;
