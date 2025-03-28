import { FaAngleLeft, FaAngleRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PaginationInfo } from '../types';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, pages, total } = pagination;
  
  // If there's only one page, don't show pagination
  if (pages <= 1) {
    return null;
  }
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    // Always show at most 5 page numbers
    const MAX_PAGES = 5;
    
    let startPage = Math.max(1, page - Math.floor(MAX_PAGES / 2));
    let endPage = startPage + MAX_PAGES - 1;
    
    if (endPage > pages) {
      endPage = pages;
      startPage = Math.max(1, endPage - MAX_PAGES + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  // Handle previous and next page navigation
  const goToPrevPage = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };
  
  const goToNextPage = () => {
    if (page < pages) {
      onPageChange(page + 1);
    }
  };
  
  // Handle first and last page navigation
  const goToFirstPage = () => {
    if (page > 1) {
      onPageChange(1);
    }
  };
  
  const goToLastPage = () => {
    if (page < pages) {
      onPageChange(pages);
    }
  };
  
  // Generate page numbers
  const pageNumbers = getPageNumbers();
  const showStartEllipsis = pageNumbers[0] > 1;
  const showEndEllipsis = pageNumbers[pageNumbers.length - 1] < pages;
  
  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-gray-700">
        <span>
          Showing <span className="font-medium">{total === 0 ? 0 : (page - 1) * pagination.limit + 1}</span> to{' '}
          <span className="font-medium">{Math.min(page * pagination.limit, total)}</span> of{' '}
          <span className="font-medium">{total}</span> bookings
        </span>
      </div>
      
      <div className="flex space-x-1">
        {/* First Page Button */}
        <button
          onClick={goToFirstPage}
          disabled={page === 1}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronLeft className="h-3 w-3" />
          <FaChevronLeft className="h-3 w-3 -ml-1" />
        </button>
        
        {/* Previous Page Button */}
        <button
          onClick={goToPrevPage}
          disabled={page === 1}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaAngleLeft className="h-4 w-4" />
        </button>
        
        {/* Start Ellipsis */}
        {showStartEllipsis && (
          <button
            onClick={() => onPageChange(1)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            1
          </button>
        )}
        
        {showStartEllipsis && pageNumbers[0] > 2 && (
          <span className="inline-flex items-center px-1 text-gray-500">...</span>
        )}
        
        {/* Page Numbers */}
        {pageNumbers.map(pageNumber => (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`inline-flex items-center rounded-md border ${
              pageNumber === page
                ? 'border-violet-500 bg-violet-50 text-violet-600'
                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
            } px-3 py-1 text-sm font-medium`}
          >
            {pageNumber}
          </button>
        ))}
        
        {/* End Ellipsis */}
        {showEndEllipsis && pageNumbers[pageNumbers.length - 1] < pages - 1 && (
          <span className="inline-flex items-center px-1 text-gray-500">...</span>
        )}
        
        {showEndEllipsis && (
          <button
            onClick={() => onPageChange(pages)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            {pages}
          </button>
        )}
        
        {/* Next Page Button */}
        <button
          onClick={goToNextPage}
          disabled={page === pages}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaAngleRight className="h-4 w-4" />
        </button>
        
        {/* Last Page Button */}
        <button
          onClick={goToLastPage}
          disabled={page === pages}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronRight className="h-3 w-3" />
          <FaChevronRight className="h-3 w-3 -ml-1" />
        </button>
      </div>
    </div>
  );
} 