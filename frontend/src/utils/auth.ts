// Auth utility functions for token management

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  gender: string;
  birthday: string;
  address: string;
  is_verified: boolean;
  created_at: string;
}

// Check if access token is expired
export function isTokenExpired(token: string): boolean {
  try {
    // Decode JWT token (without verification for client-side check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if we can't parse
  }
}

// Get token expiration time
export function getTokenExpiration(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return 0;
  }
}

// Check if user is authenticated with valid tokens
export function isAuthenticated(): boolean {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const user = localStorage.getItem('user');

  if (!accessToken || !refreshToken || !user) {
    return false;
  }

  // Check if access token is expired
  if (isTokenExpired(accessToken)) {
    console.log('Access token expired');
    return false;
  }

  return true;
}

// Clear all auth data
export function clearAuthData(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

// Get user data from localStorage
export function getUserData(): User | null {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return false;
    }

    const response = await fetch('http://localhost:8080/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      return true;
    } else {
      // Refresh token is invalid, clear auth data
      clearAuthData();
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearAuthData();
    return false;
  }
}

// Validate tokens and refresh if needed
export async function validateAndRefreshTokens(): Promise<boolean> {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (!accessToken || !refreshToken) {
    return false;
  }

  // If access token is still valid, return true
  if (!isTokenExpired(accessToken)) {
    return true;
  }

  // Access token is expired, try to refresh
  console.log('Access token expired, attempting to refresh...');
  return await refreshAccessToken();
}

// Auto-logout when tokens expire
export function setupTokenExpirationHandler(): void {
  const accessToken = localStorage.getItem('access_token');
  
  if (!accessToken) {
    return;
  }

  const expirationTime = getTokenExpiration(accessToken);
  const currentTime = Date.now();
  const timeUntilExpiry = expirationTime - currentTime;

  if (timeUntilExpiry > 0) {
    // Set timeout to clear auth data when token expires
    setTimeout(() => {
      console.log('Token expired, clearing auth data');
      clearAuthData();
      // Redirect to login page
      window.location.href = '/login';
    }, timeUntilExpiry);
  } else {
    // Token is already expired
    clearAuthData();
    window.location.href = '/login';
  }
}

// Check session validity on app startup
export async function checkSessionOnStartup(): Promise<boolean> {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const user = localStorage.getItem('user');

  // If no tokens or user data, not authenticated
  if (!accessToken || !refreshToken || !user) {
    clearAuthData();
    return false;
  }

  // Check if access token is expired
  if (isTokenExpired(accessToken)) {
    console.log('Access token expired on startup, attempting refresh...');
    
    // Try to refresh the token
    const refreshSuccess = await refreshAccessToken();
    if (!refreshSuccess) {
      console.log('Token refresh failed, clearing auth data');
      clearAuthData();
      return false;
    }
  }

  return true;
}
