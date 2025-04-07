"use client";

import { Baby } from "lucide-react";

export default function Logo() {
  return (
    <div
      className="flex items-center space-x-2 font-bold hover:opacity-90 transition-opacity"
      aria-label="ChildMinderConnect Home"
    >
      <Baby className="h-7 w-7 text-blue-600" />
      <span className="bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent text-xl md:text-2xl hidden sm:inline">
        ChildMinderConnect
      </span>
      <span className="bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent text-base sm:hidden">
        ChildMinderConnect
      </span>
    </div>
  );
}