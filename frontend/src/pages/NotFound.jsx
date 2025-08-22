import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-24 w-24 bg-white rounded-full flex items-center justify-center mb-8">
            <i className="fas fa-exclamation-triangle text-4xl text-purple-600"></i>
          </div>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
          <p className="text-xl text-purple-100 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <i className="fas fa-home mr-2"></i>
              Go to Dashboard
            </Link>
            <div>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Go Back
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-purple-100">
            Need help?{' '}
            <a
              href="mailto:support@workitu.com"
              className="font-medium text-white hover:text-purple-100 underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;


