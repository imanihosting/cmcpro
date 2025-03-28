import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-gradient-to-br from-violet-900/90 via-violet-800/90 to-purple-800/90 backdrop-blur-sm">
      <div className="relative flex flex-col items-center">
        <div className="h-24 w-24 animate-spin rounded-full border-b-2 border-t-2 border-violet-300"></div>
        <div className="absolute h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-violet-100" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        <div className="absolute h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-white" style={{ animationDuration: '0.5s' }}></div>
        
        <div className="mt-6 text-center">
          <p className="text-lg font-medium text-white">Loading</p>
          <p className="text-sm text-white/70">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
} 