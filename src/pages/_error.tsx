import { NextPageContext } from 'next';
import Link from 'next/link';
import { FaExclamationCircle, FaHome } from 'react-icons/fa';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 flex items-center justify-center rounded-full bg-red-100 text-red-600">
            <FaExclamationCircle className="h-10 w-10" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {statusCode ? `An error ${statusCode} occurred` : 'An error occurred'}
        </h1>
        <p className="text-gray-600 mb-6">
          We apologize for the inconvenience. Please try again later or return to the homepage.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2 bg-violet-600 text-white font-medium rounded-md hover:bg-violet-700 transition-colors"
        >
          <FaHome className="mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 