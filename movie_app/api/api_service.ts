import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// Config metadata for Interceptors
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime?: number;
      endTime?: number;
    };
  }
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private currentSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.currentSize = 0;
  }


  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const elapsed = now - entry.timestamp;

    if (elapsed >= entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }


  set<T>(key: string, data: T, ttl: number): void {
    if (this.currentSize >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    if (!this.cache.has(key)) {
      this.currentSize++;
    }

    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      this.currentSize--;
    }
    return existed;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  invalidate(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }


  getStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.currentSize,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}


export interface ApiError {
  message: string;
  code?: number;
  details?: any;
  isRetryable: boolean;
}


export interface ApiResponse<T = any> {
  data: T | null;
  error: ApiError | null;
  status: number;
  fromCache: boolean;
}


export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  enableCache?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  cacheManager?: CacheManager;
}


export class ApiClient {
  private instance: AxiosInstance;
  private cache: CacheManager;
  private config: Required<ApiClientConfig>;

  // Default cache TTL values (in milliseconds)
  static readonly CACHE_TTL = {
    SHORT: 5 * 60 * 1000,      // 5 minutes
    MEDIUM: 30 * 60 * 1000,    // 30 minutes
    LONG: 1 * 60 * 60 * 1000,  // 1 hour
    VERY_LONG: 6 * 60 * 60 * 1000, // 6 hours
    DAY: 24 * 60 * 60 * 1000,  // 24 hours
  };

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 10000,
      headers: config.headers || {},
      enableCache: config.enableCache ?? true,
      enableRetry: config.enableRetry ?? true,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      cacheManager: config.cacheManager || new CacheManager(100),
    };

    this.cache = this.config.cacheManager;

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.config.headers,
      },
    });

    this.setupInterceptors();
  }


  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.metadata = config.metadata || {};
        config.metadata.startTime = Date.now();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = Date.now() - (response.config.metadata?.startTime || 0);
        console.log(`API Request completed in ${duration}ms: ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || 0);
        console.error(`API Request failed after ${duration}ms: ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  private generateCacheKey(url: string, params?: any): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${url}:${paramsString}`;
  }


  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    return (
      status === 408 || // Request Timeout
      status === 429 || // Too Many Requests
      status === 500 || // Internal Server Error
      status === 502 || // Bad Gateway
      status === 503 || // Service Unavailable
      status === 504    // Gateway Timeout
    );
  }

  private createApiError(error: AxiosError): ApiError {
    const status = error.response?.status;
    
    let message = 'An unexpected error occurred';
    let isRetryable = false;

    if (error.response) {
      switch (status) {
        case 400:
          message = 'Bad request - invalid parameters';
          isRetryable = false;
          break;
        case 401:
          message = 'Unauthorized - invalid API key';
          isRetryable = false;
          break;
        case 403:
          message = 'Forbidden - access denied';
          isRetryable = false;
          break;
        case 404:
          message = 'Resource not found';
          isRetryable = false;
          break;
        case 429:
          message = 'Rate limit exceeded - please try again later';
          isRetryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = 'Server error - please try again later';
          isRetryable = true;
          break;
        default:
          message = `Request failed with status ${status}`;
          isRetryable = (status ?? 0) >= 500;
      }
    } else if (error.request) {
      message = 'Network error - please check your connection';
      isRetryable = true;
    } else {
      message = error.message || 'Request setup error';
      isRetryable = false;
    }

    return {
      message,
      code: status,
      details: error.response?.data || error.message,
      isRetryable,
    };
  }


  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    let lastError: AxiosError | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;

        if (!this.config.enableRetry || attempt === this.config.maxRetries) {
          throw error;
        }

        if (this.isRetryableError(error)) {
          const delay = this.config.retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`Retrying request (attempt ${attempt + 1}/${this.config.maxRetries}) after ${delay}ms`);
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }


  async get<T>(
    url: string,
    config?: {
      params?: any;
      headers?: Record<string, string>;
      cache?: boolean;
      cacheTTL?: number;
    }
  ): Promise<ApiResponse<T>> {
    const {
      params,
      headers,
      cache = this.config.enableCache,
      cacheTTL = ApiClient.CACHE_TTL.MEDIUM,
    } = config || {};

    const cacheKey = this.generateCacheKey(url, params);

    if (cache) {
      const cachedData = this.cache.get<T>(cacheKey);
      if (cachedData !== null) {
        console.log(`Cache hit for: ${url}`);
        return {
          data: cachedData,
          error: null,
          status: 200,
          fromCache: true,
        };
      }
    }

    try {
      const response = await this.executeWithRetry<T>(() =>
        this.instance.get<T>(url, {
          params,
          headers: { ...this.config.headers, ...headers },
        })
      );

      if (cache && response.data) {
        this.cache.set(cacheKey, response.data, cacheTTL);
      }

      return {
        data: response.data,
        error: null,
        status: response.status,
        fromCache: false,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.createApiError(error),
        status: error.response?.status || 0,
        fromCache: false,
      };
    }
  }


  async post<T>(
    url: string,
    data?: any,
    config?: {
      params?: any;
      headers?: Record<string, string>;
      cache?: boolean;
      cacheTTL?: number;
    }
  ): Promise<ApiResponse<T>> {
    const { params, headers } = config || {};

    try {
      const response = await this.executeWithRetry<T>(() =>
        this.instance.post<T>(url, data, {
          params,
          headers: { ...this.config.headers, ...headers },
        })
      );

      return {
        data: response.data,
        error: null,
        status: response.status,
        fromCache: false,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.createApiError(error),
        status: error.response?.status || 0,
        fromCache: false,
      };
    }
  }

  async put<T>(
    url: string,
    data?: any,
    config?: {
      params?: any;
      headers?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    const { params, headers } = config || {};

    try {
      const response = await this.executeWithRetry<T>(() =>
        this.instance.put<T>(url, data, {
          params,
          headers: { ...this.config.headers, ...headers },
        })
      );

      return {
        data: response.data,
        error: null,
        status: response.status,
        fromCache: false,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.createApiError(error),
        status: error.response?.status || 0,
        fromCache: false,
      };
    }
  }


  async delete<T>(
    url: string,
    config?: {
      params?: any;
      headers?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    const { params, headers } = config || {};

    try {
      const response = await this.executeWithRetry<T>(() =>
        this.instance.delete<T>(url, {
          params,
          headers: { ...this.config.headers, ...headers },
        })
      );

      return {
        data: response.data,
        error: null,
        status: response.status,
        fromCache: false,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.createApiError(error),
        status: error.response?.status || 0,
        fromCache: false,
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }


  invalidateCache(pattern: string): number {
    return this.cache.invalidate(pattern);
  }


  getCacheStats() {
    return this.cache.getStats();
  }

  setHeaders(headers: Record<string, string>): void {
    this.config.headers = { ...this.config.headers, ...headers };
    this.instance.defaults.headers = {
      ...this.instance.defaults.headers,
      ...headers,
    };
  }


  setAuthToken(token: string, type: 'Bearer' | 'Basic' | 'ApiKey' = 'Bearer'): void {
    const authHeader = type === 'ApiKey' ? token : `${type} ${token}`;
    this.setHeaders({ Authorization: authHeader });
  }
}

export const apiClient = new ApiClient({
  enableCache: true,
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
});

export default ApiClient;
