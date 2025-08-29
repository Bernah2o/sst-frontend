import { useState, useEffect, useCallback, useRef } from 'react';
import { AutocompleteOption } from '../components/AutocompleteField';
import api from '../services/api';

export interface UseCargoAutocompleteReturn {
  options: AutocompleteOption[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Cache global para evitar múltiples peticiones
let cargoCache: {
  data: AutocompleteOption[];
  timestamp: number;
  loading: boolean;
} | null = null;

const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const subscribers = new Set<(data: { options: AutocompleteOption[]; loading: boolean; error: string | null }) => void>();

// Función para notificar a todos los suscriptores
const notifySubscribers = (data: { options: AutocompleteOption[]; loading: boolean; error: string | null }) => {
  subscribers.forEach(callback => callback(data));
};

// Función para cargar cargos (singleton)
let loadingPromise: Promise<AutocompleteOption[]> | null = null;

const loadCargos = async (): Promise<AutocompleteOption[]> => {
  // Si ya hay una petición en curso, esperar a que termine
  if (loadingPromise) {
    return loadingPromise;
  }

  // Si hay datos en cache y no han expirado, usarlos
  if (cargoCache && (Date.now() - cargoCache.timestamp < CACHE_TIMEOUT)) {
    return cargoCache.data;
  }

  console.log('🔄 Loading cargos from API...');
  
  // Notificar que está cargando
  notifySubscribers({ options: cargoCache?.data || [], loading: true, error: null });

  loadingPromise = api.get('/admin/config/cargos/active')
    .then(response => {
      const data = response.data.map((cargo: any) => ({
        id: cargo.id,
        label: cargo.nombre_cargo,
        value: cargo,
        description: cargo.periodicidad_emo,
        category: 'Cargo',
      }));

      // Actualizar cache
      cargoCache = {
        data,
        timestamp: Date.now(),
        loading: false,
      };

      console.log(`✅ Cargos loaded successfully: ${data.length} items`);
      
      // Notificar éxito
      notifySubscribers({ options: data, loading: false, error: null });
      
      return data;
    })
    .catch(error => {
      console.error('❌ Error loading cargos:', error);
      
      // Notificar error
      notifySubscribers({ 
        options: cargoCache?.data || [], 
        loading: false, 
        error: 'Error al cargar cargos' 
      });
      
      throw error;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
};

export const useCargoAutocompleteOptimized = (): UseCargoAutocompleteReturn => {
  const [options, setOptions] = useState<AutocompleteOption[]>(cargoCache?.data || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Callback para actualizar el estado cuando hay cambios
  const updateState = useCallback((data: { options: AutocompleteOption[]; loading: boolean; error: string | null }) => {
    if (!mountedRef.current) return;
    
    setOptions(data.options);
    setLoading(data.loading);
    setError(data.error);
  }, []);

  // Función para refetch
  const refetch = useCallback(() => {
    // Limpiar cache y recargar
    cargoCache = null;
    loadCargos();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Suscribirse a cambios
    subscribers.add(updateState);
    
    // Si no hay datos en cache o han expirado, cargar
    if (!cargoCache || (Date.now() - cargoCache.timestamp >= CACHE_TIMEOUT)) {
      loadCargos();
    } else {
      // Usar datos del cache
      setOptions(cargoCache.data);
      setLoading(false);
      setError(null);
    }

    return () => {
      mountedRef.current = false;
      subscribers.delete(updateState);
    };
  }, [updateState]);

  return {
    options,
    loading,
    error,
    refetch,
  };
};

export default useCargoAutocompleteOptimized;