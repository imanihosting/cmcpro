import { FaCalendarAlt, FaFilter } from 'react-icons/fa';

interface EmptyStateProps {
  filtered: boolean;
  onClearFilters: () => void;
  title: string;
  message: string;
}

export default function EmptyState({ filtered, onClearFilters, title, message }: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-white p-8 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
        {filtered ? (
          <FaFilter className="h-6 w-6 text-violet-600" />
        ) : (
          <FaCalendarAlt className="h-6 w-6 text-violet-600" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">
        {message}
      </p>
      {filtered && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 inline-flex items-center rounded-md border border-transparent bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
} 