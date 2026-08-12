export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
  }
  
  export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    pagination: {
      page: number;
      pageSize: number;
      totalPages: number;
      totalRecords: number;
    };
    timestamp: string;
  }
  
  export interface ApiErrorResponse {
    success: false;
    message: string;
    errorCode: string;
    statusCode: number;
    details?: Record<string, string[]> | null;
    timestamp: string;
  }