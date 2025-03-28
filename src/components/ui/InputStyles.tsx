/**
 * Input style constants for consistent styling throughout the application
 * Use these classes for form inputs, textareas, and select elements
 */

// Base input style with good text visibility
export const inputBaseClass = 
  "block w-full rounded-lg border border-gray-300 py-2 px-4 " + 
  "text-gray-900 font-medium shadow-sm bg-white " + 
  "transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

// Input with icon on the left
export const inputWithIconClass = 
  "block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 " + 
  "text-gray-900 font-medium shadow-sm bg-white " + 
  "transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

// Select dropdown style
export const selectBaseClass = 
  "block w-full rounded-lg border border-gray-300 py-2 px-4 " + 
  "text-gray-900 font-medium shadow-sm appearance-none " +
  "bg-white transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

// Select with icon on the left
export const selectWithIconClass = 
  "block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 " + 
  "text-gray-900 font-medium shadow-sm appearance-none " +
  "bg-white transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

// Textarea style
export const textareaClass = 
  "block w-full rounded-lg border border-gray-300 py-2 px-4 " + 
  "text-gray-900 font-medium shadow-sm resize-none bg-white " + 
  "transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

// Textarea with icon on the left
export const textareaWithIconClass = 
  "block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 " + 
  "text-gray-900 font-medium shadow-sm resize-none bg-white " + 
  "transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

// Checkbox style
export const checkboxClass = 
  "h-4 w-4 rounded border-gray-300 text-violet-600 " +
  "transition-colors focus:ring-violet-500";

// Disabled state styles
export const disabledClass = "bg-gray-50 text-gray-500 cursor-not-allowed";

// Error state styles
export const errorClass = "border-red-500 focus:border-red-500 focus:ring-red-500";

// Helper function to combine input classes
export function combineInputClasses(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
} 