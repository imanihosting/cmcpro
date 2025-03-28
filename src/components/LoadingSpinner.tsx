import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  fullPage = false,
  text
}) => {
  const sizeClass = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3',
  }[size];
  
  const spinnerElement = (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${sizeClass} animate-spin rounded-full border-solid border-violet-600 border-t-transparent`} 
        role="status" 
        aria-label="Loading"
      />
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
  
  if (fullPage) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
        {spinnerElement}
      </div>
    );
  }
  
  return spinnerElement;
};

export default LoadingSpinner; 