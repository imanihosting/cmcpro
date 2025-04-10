import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers, // If using the useUploadThing hook
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core"; // Adjust path if needed

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Uncomment and use if you need the hook for custom components
// export const { useUploadThing } = generateReactHelpers<OurFileRouter>(); 