import { useState, useEffect, useCallback, useRef } from 'react';

import { AutocompleteOption } from '../components/AutocompleteField';
import api from '../services/api';

export interface UseAutocompleteOptions {
  // Configuración de búsqueda
  minSearchLength?: number;
  searchDelay?: number;
  caseSensitive?: boolean;
  
  // Datos
  staticOptions?: AutocompleteOption[];
  apiEndpoint?: string;
  
  // Transformación de datos
  transformResponse?: (data: any[]) => AutocompleteOption[];
  
  // Cache
  enableCache?: boolean;
  cacheTimeout?: number; // en milisegundos
}

export interface UseAutocompleteReturn {
  options: AutocompleteOption[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearCache: () => void;
  refetch: () => void;
}

// Cache global para resultados de búsqueda
const searchCache = new Map<string, { data: AutocompleteOption[]; timestamp: number }>();

export const useAutocomplete = ({
  minSearchLength = 1,
  searchDelay = 300,
  caseSensitive = false,
  staticOptions = [],
  apiEndpoint,
  transformResponse,
  enableCache = true,
  cacheTimeout = 5 * 60 * 1000, // 5 minutos
}: UseAutocompleteOptions = {}): UseAutocompleteReturn => {
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Función para filtrar opciones estáticas
  const filterStaticOptions = useCallback((term: string): AutocompleteOption[] => {
    if (!term || term.length < minSearchLength) return [];
    
    const searchValue = caseSensitive ? term : term.toLowerCase();
    
    return staticOptions.filter(option => {
      const label = caseSensitive ? option.label : option.label.toLowerCase();
      const description = option.description ? 
        (caseSensitive ? option.description : option.description.toLowerCase()) : '';
      
      return label.includes(searchValue) || description.includes(searchValue);
    });
  }, [staticOptions, minSearchLength, caseSensitive]);
  
  // Función para obtener datos de la API
  const fetchApiOptions = useCallback(async (term: string): Promise<AutocompleteOption[]> => {
    if (!apiEndpoint) return [];
    
    // Verificar cache
    const cacheKey = `${apiEndpoint}:${term}`;
    if (enableCache && searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cacheTimeout) {
        return cached.data;
      } else {
        searchCache.delete(cacheKey);
      }
    }
    
    // Cancelar petición anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await api.get(apiEndpoint, {
        params: { search: term, limit: 50 },
        signal: abortControllerRef.current.signal,
      });
      
      let data: AutocompleteOption[] = [];
      
      if (transformResponse) {
        data = transformResponse(response.data.data || response.data);
      } else {
        // Transformación por defecto
        const rawData = response.data.data || response.data;
        data = Array.isArray(rawData) ? rawData.map((item: any, index: number) => ({
          id: item.id || index,
          label: item.name || item.label || item.title || String(item),
          value: item,
          description: item.description || item.email || undefined,
          category: item.category || item.type || undefined,
        })) : [];
      }
      
      // Guardar en cache
      if (enableCache) {
        searchCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return [];
      }
      throw error;
    }
  }, [apiEndpoint, transformResponse, enableCache, cacheTimeout]);
  
  // Función principal de búsqueda
  const performSearch = useCallback(async (term: string) => {
    // Si minSearchLength es 0 y tenemos opciones estáticas, mostrar todas cuando no hay término
    if (term.length < minSearchLength) {
      if (minSearchLength === 0 && staticOptions.length > 0 && !apiEndpoint) {
        setOptions(staticOptions);
      } else {
        setOptions([]);
      }
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let results: AutocompleteOption[] = [];
      
      if (apiEndpoint) {
        // Buscar en API
        results = await fetchApiOptions(term);
      } else {
        // Buscar en opciones estáticas
        results = filterStaticOptions(term);
      }
      
      setOptions(results);
    } catch (error: any) {
      console.error('Error en búsqueda de autocompletado:', error);
      setError(error.message || 'No se pudieron buscar las opciones. Verifique su conexión e intente nuevamente.');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [minSearchLength, apiEndpoint, fetchApiOptions, filterStaticOptions, staticOptions]);
  
  // Efecto inicial para cargar opciones estáticas cuando minSearchLength es 0
  useEffect(() => {
    if (minSearchLength === 0 && staticOptions.length > 0 && !apiEndpoint && searchTerm === '') {
      setOptions(staticOptions);
    }
  }, [minSearchLength, staticOptions, apiEndpoint, searchTerm]);

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, searchDelay);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchDelay, performSearch]);
  
  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // Función para limpiar cache
  const clearCache = useCallback(() => {
    searchCache.clear();
  }, []);
  
  // Función para refetch
  const refetch = useCallback(() => {
    if (searchTerm) {
      performSearch(searchTerm);
    }
  }, [searchTerm, performSearch]);
  
  return {
    options,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    clearCache,
    refetch,
  };
};

// Hook especializado para usuarios
export const useUserAutocomplete = () => {
  return useAutocomplete({
    apiEndpoint: '/users/search',
    transformResponse: (data: any[]) => data.map(user => ({
      id: user.id,
      label: `${user.first_name} ${user.last_name}`,
      value: user,
      description: user.email,
      category: user.role?.display_name || 'Usuario',
    })),
  });
};

// Hook especializado para trabajadores
export const useWorkerAutocomplete = () => {
  return useAutocomplete({
    apiEndpoint: '/workers/search',
    transformResponse: (data: any[]) => data.map(worker => ({
      id: worker.id,
      label: `${worker.first_name} ${worker.last_name}`,
      value: worker,
      description: `${worker.document_number} - ${worker.cargo?.name || 'Sin cargo'}`,
      category: worker.cargo?.name || 'Trabajador',
    })),
  });
};

// Hook especializado para cursos
export const useCourseAutocomplete = () => {
  return useAutocomplete({
    apiEndpoint: '/courses/search',
    transformResponse: (data: any[]) => data.map(course => ({
      id: course.id,
      label: course.name,
      value: course,
      description: course.description,
      category: course.category || 'Curso',
    })),
  });
};

// Hook especializado para cargos
export const useCargoAutocomplete = () => {
  const result = useAutocomplete({
    apiEndpoint: '/admin/config/cargos/active',
    minSearchLength: 0, // Permitir carga inicial sin término de búsqueda
    transformResponse: (data: any[]) => data.map(cargo => ({
      id: cargo.id,
      label: cargo.nombre_cargo,
      value: cargo,
      description: cargo.periodicidad_emo,
      category: 'Cargo',
    })),
  });
  
  // Cargar datos inicialmente solo una vez
  useEffect(() => {
    result.setSearchTerm('');
  }, []); // Dependencias vacías para ejecutar solo una vez
  
  return result;
};
  
export default useAutocomplete;