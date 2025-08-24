export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface MessageResponse {
  message: string;
  success: boolean;
  data?: any;
}

export interface ErrorResponse {
  message: string;
  error_code?: string;
  details?: any;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  size: number;
}