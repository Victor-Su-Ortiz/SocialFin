import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_CONFIG = {
  // Base URL from environment variable
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/no',

  // API endpoints
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    USER_PROFILE: '/user/profile',
  },

  // Request timeout
  TIMEOUT: 10000, // 10 seconds
};

// API Helper class
export class ApiClient {
  private static token: string | null = null;

  // Initialize token from storage
  static async init() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      this.token = token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  // Set auth token
  static async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('authToken', token);
    } else {
      await AsyncStorage.removeItem('authToken');
    }
  }

  // Get auth token
  static getToken() {
    return this.token;
  }

  // Make authenticated request
  static async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Auth methods
  static async login(email: string, password: string) {
    const response = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token) {
      await this.setToken(data.token);
    }

    return data;
  }

  static async register(email: string, password: string, firstName: string) {
    const response = await this.request(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ email, password, first_name: firstName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    if (data.token) {
      await this.setToken(data.token);
    }

    return data;
  }

  static async logout() {
    try {
      await this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.setToken(null);
    }
  }
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response types
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
  };
  message?: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}
