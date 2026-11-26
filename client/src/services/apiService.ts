
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'
).replace(/\/+$/, '');

// ==========================================
// TYPES
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string;
}

// ==========================================
// API ERROR
// ==========================================

export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number = 0
  ) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// ==========================================
// API REQUEST
// ==========================================

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Device-Name': 'SmartCool AI Website',
    };

    if (options.accessToken) {
      headers.Authorization =
        `Bearer ${options.accessToken}`;
    }

    const path = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const response = await fetch(
      `${API_URL}${path}`,
      {
        method: options.method || 'GET',

        headers,

        body:
          options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,

        signal: controller.signal,
      }
    );

    let result: ApiResponse<T>;

    try {
      result = await response.json();
    } catch {
      throw new ApiError(
        'Backend trả về dữ liệu không hợp lệ.',
        response.status
      );
    }

    if (!response.ok || !result.success) {
      throw new ApiError(
        result.message ||
          'Yêu cầu không thành công.',
        response.status
      );
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new ApiError(
        'Kết nối quá thời gian. Vui lòng thử lại.'
      );
    }

    throw new ApiError(
      'Không thể kết nối đến máy chủ SmartCool AI.'
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// HEALTH CHECK
// ==========================================

export async function checkBackendConnection() {
  return apiRequest<unknown>('/health');
}
