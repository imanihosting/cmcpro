import { FaSearch } from 'react-icons/fa';

interface EmptyStateProps {
  message?: string;
  suggestion?: string;
  onReset?: () => void;
  isSearched: boolean;
}

export default function EmptyState({
  message = 'No childminders found',
  suggestion = 'Try adjusting your search filters for more results',
  onReset,
  isSearched
}: EmptyStateProps) {
  if (!isSearched) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <FaSearch className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Search for Childminders</h3>
        <p className="mt-2 text-sm text-gray-500">
          Use the search filters above to find childminders that match your needs
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
        <FaSearch className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{message}</h3>
      <p className="mt-2 text-sm text-gray-500">{suggestion}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
} 