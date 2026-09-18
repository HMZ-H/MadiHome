import { describe, it, expect, beforeEach } from 'vitest';
import {
  isTokenExpired,
  getTokenExpiration,
  isAuthenticated,
  clearAuthData,
  getUserData,
} from './auth';

function makeJWT(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

beforeEach(() => {
  localStorage.clear();
});

describe('isTokenExpired', () => {
  it('returns false for a token expiring in the future', () => {
    const token = makeJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for a token that already expired', () => {
    const token = makeJWT({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for a malformed token', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
  });
});

describe('getTokenExpiration', () => {
  it('returns expiration in milliseconds', () => {
    const expSeconds = Math.floor(Date.now() / 1000) + 1000;
    const token = makeJWT({ exp: expSeconds });
    expect(getTokenExpiration(token)).toBe(expSeconds * 1000);
  });

  it('returns 0 for invalid token', () => {
    expect(getTokenExpiration('bad')).toBe(0);
  });
});

describe('isAuthenticated', () => {
  it('returns false when no tokens are stored', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('returns false when access token is expired', () => {
    const expired = makeJWT({ exp: Math.floor(Date.now() / 1000) - 60 });
    localStorage.setItem('access_token', expired);
    localStorage.setItem('refresh_token', 'some-refresh');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    expect(isAuthenticated()).toBe(false);
  });

  it('returns true when all tokens are present and valid', () => {
    const valid = makeJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('access_token', valid);
    localStorage.setItem('refresh_token', 'some-refresh');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    expect(isAuthenticated()).toBe(true);
  });

  it('returns false when user data is missing', () => {
    const valid = makeJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem('access_token', valid);
    localStorage.setItem('refresh_token', 'some-refresh');
    expect(isAuthenticated()).toBe(false);
  });
});

describe('clearAuthData', () => {
  it('removes all auth keys from localStorage', () => {
    localStorage.setItem('access_token', 'a');
    localStorage.setItem('refresh_token', 'b');
    localStorage.setItem('user', 'c');

    clearAuthData();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('getUserData', () => {
  it('returns parsed user object', () => {
    const user = { id: 5, first_name: 'Ali', last_name: 'Ben', email: 'a@b.com', role: 'user' };
    localStorage.setItem('user', JSON.stringify(user));
    const result = getUserData();
    expect(result).not.toBeNull();
    expect(result!.id).toBe(5);
    expect(result!.first_name).toBe('Ali');
  });

  it('returns null when no user is stored', () => {
    expect(getUserData()).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem('user', '{bad json');
    expect(getUserData()).toBeNull();
  });
});
