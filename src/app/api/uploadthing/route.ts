import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  // Apply an UploadThing config as needed - see https://docs.uploadthing.com/getting-started/appdir#apply-configuration
  // config: { ... }, 
}); 