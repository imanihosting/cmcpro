import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Pagination as PaginationType } from '../types';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, hasNextPage, hasPreviousPage } = pagination;

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];
    
    // If we have fewer pages than the max, show all
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Otherwise, show a subset of pages
    const halfMaxPages = Math.floor(maxPagesToShow / 2);
    
    // Current page is near the start
    if (page <= halfMaxPages) {
      for (let i = 1; i <= maxPagesToShow - 1; i++) {
        pages.push(i);
      }
      pages.push(totalPages);
      return pages;
    }
    
    // Current page is near the end
    if (page > totalPages - halfMaxPages) {
      pages.push(1);
      for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Current page is in the middle
    pages.push(1);
    for (let i = page - 1; i <= page + 1; i++) {
      pages.push(i);
    }
    pages.push(totalPages);
    return pages;
  };

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px flex w-0 flex-1">
        <button
          onClick={() => hasPreviousPage && onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className={`inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium ${
            hasPreviousPage
              ? 'text-gray-500 hover:border-gray-300 hover:text-gray-700'
              : 'cursor-not-allowed text-gray-300'
          }`}
        >
          <FaChevronLeft className="mr-3 h-4 w-4" aria-hidden="true" />
          Previous
        </button>
      </div>
      
      <div className="hidden md:-mt-px md:flex">
        {pageNumbers.map((pageNumber, index) => {
          // Add ellipsis between non-consecutive page numbers
          const showEllipsis = index > 0 && pageNumber > pageNumbers[index - 1] + 1;
          
          return (
            <div key={pageNumber} className="flex items-center">
              {showEllipsis && (
                <span className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500">
                  ...
                </span>
              )}
              <button
                onClick={() => onPageChange(pageNumber)}
                className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                  page === pageNumber
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {pageNumber}
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="-mt-px flex w-0 flex-1 justify-end">
        <button
          onClick={() => hasNextPage && onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={`inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium ${
            hasNextPage
              ? 'text-gray-500 hover:border-gray-300 hover:text-gray-700'
              : 'cursor-not-allowed text-gray-300'
          }`}
        >
          Next
          <FaChevronRight className="ml-3 h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
} 