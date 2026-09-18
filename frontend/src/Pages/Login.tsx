import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.message && errorData.message.includes('verify your email')) {
          setError('Please verify your email before logging in. Check your email for the verification link.');
          return;
        }
        throw new Error(errorData.message || 'Login failed');
      }

      const result = await response.json();
      console.log('Login successful:', result);
      console.log('Login - User photo:', result.user?.photo);
      
      // Store tokens and user data
      if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('refresh_token', result.refresh_token);
        localStorage.setItem('user', JSON.stringify(result.user));
        console.log('Login - Stored user in localStorage:', result.user);
      }
      
      // Redirect based on actual user role from backend response
      if (result.user && result.user.role === 'doctor') {
        window.location.href = '/doctor-dashboard';
      } else if (result.user && result.user.role === 'super_admin') {
        window.location.href = '/super-admin-dashboard';
      } else {
        window.location.href = '/patient-dashboard';
      }
      
    } catch (err) {
      setError(`Login failed: ${err instanceof Error ? err.message : 'Please check your credentials.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your MadiHome account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-lg p-8">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            

            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-primary hover:text-emerald-700 font-medium">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-emerald-700 font-semibold">
                Sign up here
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Didn't receive verification email?{' '}
              <button 
                type="button"
                onClick={() => {
                  const email = prompt('Enter your email address to resend verification:');
                  if (email) {
                    // TODO: Implement resend verification email
                    alert('Verification email will be sent to ' + email);
                  }
                }}
                className="text-primary hover:text-emerald-700 font-semibold"
              >
                Resend verification email
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

