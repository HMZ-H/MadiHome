import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Logo from '../components/Logo';

export default function EmailVerificationSuccess() {
  const { token } = useParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      if (token === 'invalid') {
        setVerificationStatus('error');
        setMessage('Invalid verification token. The link may be expired or already used.');
      } else if (token === 'error') {
        setVerificationStatus('error');
        setMessage('Failed to verify your email. Please try again or contact support.');
      } else {
        // If we reach here, the backend has already verified the email successfully
        setVerificationStatus('success');
        setMessage('Your email has been verified successfully!');
      }
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/">
            <Logo size="lg" variant="full" className="mx-auto mb-6" />
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {verificationStatus === 'loading' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Verifying Your Email...
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-800">
                    Your account is now active and ready to use!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Link
                  to="/login"
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                >
                  Sign In to Your Account
                </Link>
                
                <Link
                  to="/"
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block"
                >
                  Go to Homepage
                </Link>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-red-800">
                    The verification link may be expired or invalid. Please try registering again.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Link
                  to="/register"
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                >
                  Register Again
                </Link>
                
                <Link
                  to="/login"
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block"
                >
                  Try Signing In
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="mailto:support@madihome.com" className="text-primary hover:text-blue-700 font-semibold">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
