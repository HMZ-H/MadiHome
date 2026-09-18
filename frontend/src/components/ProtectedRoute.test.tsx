import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

function makeJWT(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-sig`;
}

function renderWithRouter(element: React.ReactElement, initialPath = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

function setAuth(role = 'user') {
  const token = makeJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
  localStorage.setItem('access_token', token);
  localStorage.setItem('refresh_token', 'refresh');
  localStorage.setItem('user', JSON.stringify({ id: 1, role }));
}

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithRouter(
      <ProtectedRoute><div>Secret</div></ProtectedRoute>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    setAuth();
    renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
    );
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('renders children when role matches allowedRoles', () => {
    setAuth('doctor');
    renderWithRouter(
      <ProtectedRoute allowedRoles={['doctor', 'admin']}><div>Doctor Area</div></ProtectedRoute>
    );
    expect(screen.getByText('Doctor Area')).toBeInTheDocument();
  });

  it('redirects to / when role does not match allowedRoles', () => {
    setAuth('user');
    renderWithRouter(
      <ProtectedRoute allowedRoles={['doctor']}><div>Doctor Only</div></ProtectedRoute>
    );
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('allows any role when allowedRoles is not specified', () => {
    setAuth('super_admin');
    renderWithRouter(
      <ProtectedRoute><div>Any Role</div></ProtectedRoute>
    );
    expect(screen.getByText('Any Role')).toBeInTheDocument();
  });
});
