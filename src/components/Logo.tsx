"use client";

import { Baby } from "lucide-react";

export default function Logo() {
  return (
    <div
      className="flex items-center space-x-2 text-2xl font-bold hover:opacity-90 transition-opacity"
      aria-label="ChildMinderConnect Home"
    >
      <Baby className="h-8 w-8 text-blue-600" />
      <span className="bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">
        ChildMinderConnect
      </span>
    </div>
  );
} 