import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/">
            <Logo size="lg" variant="full" className="mx-auto mb-6" />
          </Link>
          
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Registration Successful!
          </h2>
          
          <p className="text-lg text-gray-600 mb-6">
            Your account has been created successfully.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Email Verification Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Verify Your Email Address
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                </p>
                <div className="bg-blue-100 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <strong>Can't find the email?</strong> Check your spam folder or wait a few minutes for it to arrive.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">What's Next?</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    1
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Check your email inbox</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    2
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Click the verification link in the email</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    3
                  </div>
                </div>
                <p className="ml-3 text-gray-700">Return here and sign in to your account</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            <Link
              to="/login"
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
            >
              Go to Sign In
            </Link>
            
            <button
              onClick={() => {
                const email = prompt('Enter your email address to resend verification:');
                if (email) {
                  // TODO: Implement resend verification email API call
                  alert('Verification email will be sent to ' + email);
                }
              }}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Resend Verification Email
            </button>
          </div>
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
