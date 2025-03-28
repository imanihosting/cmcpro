import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PaginationInfo } from '../types';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { total, page, limit, pages } = pagination;
  
  // Don't show pagination if there's only 1 page
  if (pages <= 1) {
    return null;
  }
  
  // Generate page buttons with ellipsis for large page counts
  const renderPageButtons = () => {
    const buttons = [];
    
    // Always show first page
    buttons.push(
      <button
        key={1}
        onClick={() => onPageChange(1)}
        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
          page === 1 
            ? 'bg-violet-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600' 
            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
        }`}
      >
        1
      </button>
    );
    
    // Add ellipsis if needed
    if (page > 3) {
      buttons.push(
        <span key="ellipsis-start" className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">
          ...
        </span>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      if (i <= 1 || i >= pages) continue; // Skip if already included as first or last page
      
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
            page === i 
              ? 'bg-violet-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600' 
              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis if needed
    if (page < pages - 2) {
      buttons.push(
        <span key="ellipsis-end" className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">
          ...
        </span>
      );
    }
    
    // Always show last page if it's not the same as first page
    if (pages > 1) {
      buttons.push(
        <button
          key={pages}
          onClick={() => onPageChange(pages)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
            page === pages 
              ? 'bg-violet-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600' 
              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
          }`}
        >
          {pages}
        </button>
      );
    }
    
    return buttons;
  };
  
  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 ${
            page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 ${
            page === pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
            <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
        
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Previous</span>
              <FaChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {renderPageButtons()}
            
            <button
              onClick={() => onPageChange(Math.min(pages, page + 1))}
              disabled={page === pages}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                page === pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Next</span>
              <FaChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
} 