// API utility functions for MadiHome
import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Create headers with auth token
const createHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Generic API request function with automatic token refresh
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    // If token is expired (401), try to refresh
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      const refreshSuccess = await refreshAccessToken();
      
      if (refreshSuccess) {
        // Retry the request with new token
        const newConfig: RequestInit = {
          ...options,
          headers: {
            ...createHeaders(),
            ...options.headers,
          },
        };
        
        const retryResponse = await fetch(url, newConfig);
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          throw new Error(`API Error ${retryResponse.status}: ${errorText}`);
        }
        
        return await retryResponse.json();
      } else {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Import refresh function
import { refreshAccessToken } from './auth';

// Specific API functions
export const api = {
  // User operations
  getUser: (userId: number) => 
    apiRequest(`/api/users/${userId}`),
    
  updateUser: (userId: number, userData: Record<string, unknown>) =>
    apiRequest(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
    
  // Authentication
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: createHeaders(false), // No auth needed for login
    }),

  register: (userData: Record<string, unknown>) =>
    apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: createHeaders(false), // No auth needed for register
    }),
    
  // Bookings
  getBookings: () =>
    apiRequest('/api/user/bookings'),
    
  createBooking: (bookingData: Record<string, unknown>) =>
    apiRequest('/api/user/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),
    
  // Services
  getServices: () =>
    apiRequest('/api/homecare-services'),

  // AI Assistant
  aiChat: (roomId: number, message: string) =>
    apiRequest<{ reply: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, message }),
    }),
};

// Hook for API calls with loading states
export const useApiCall = <T>() => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const execute = async (apiCall: () => Promise<T>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, execute };
};

