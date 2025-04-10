import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust the import path if necessary
import prisma from "@/lib/prisma"; // Import Prisma client
import { User_role } from '@prisma/client'; // Import User_role enum
import { v4 as uuidv4 } from 'uuid'; // Import uuid

const f = createUploadthing({
  /**
   * Log out more information about the error, but don't return it to the client
   * @see https://docs.uploadthing.com/errors#error-formatting
   */
  errorFormatter: (err) => {
    console.log("Error uploading file", err.message);
    console.log("  - Above error caused by:", err.cause);

    return { message: err.message };
  },
});

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique name
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await getServerSession(authOptions);

      // If you throw, the user will not be able to upload
      if (!session?.user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file ufsUrl", file.ufsUrl);

      try {
        // Update the user's profileImage in the database
        await prisma.user.update({
          where: {
            id: metadata.userId,
          },
          data: {
            profileImage: file.ufsUrl,
            updatedAt: new Date(),
          },
        });
        console.log("User profile image updated in database for userId:", metadata.userId);

        // Return the necessary info to the client
        return { uploadedBy: metadata.userId, imageUrl: file.ufsUrl };

      } catch (dbError) {
        console.error("Database update failed after upload:", dbError);
        // Even if DB update fails, the file is already uploaded.
        // Depending on requirements, you might want to delete the file from UploadThing here.
        // For now, we'll still return success to the client but log the error.
        // Throwing an error here might be better to signal failure more clearly.
        // throw new UploadThingError("Failed to update database after upload."); 
        return { uploadedBy: metadata.userId, imageUrl: file.ufsUrl, dbError: "Failed to update profile image in database." };
      }
    }),

  // Route for uploading compliance documents
  documentUploader: f({
    // Define allowed file types and size limit
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      // Only allow logged-in childminders
      if (!session?.user || session.user.role !== User_role.childminder) {
        throw new UploadThingError("Unauthorized: Only childminders can upload documents.");
      }
      // Pass necessary metadata
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("file ufsUrl", file.ufsUrl);
      console.log("file key", file.key);
      console.log("file details", file);

      try {
        // Create a Document record in the database
        const newDocument = await prisma.document.create({
          data: {
            id: uuidv4(), // Generate a UUID for the document
            userId: metadata.userId,
            name: file.name,
            url: file.ufsUrl, // Store the UploadThing URL
            fileKey: file.key, // Store the UploadThing file key for deletion
            fileSize: file.size,
            type: file.type, // Store the MIME type
            status: 'PENDING', // Default status
            updatedAt: new Date(),
            // Set other fields like category, description, etc. based on 
            // potential client input (if added later) or defaults
          }
        });
        console.log("Document record created in database:", newDocument.id);

        // Return information needed by the client (e.g., the new document ID or URL)
        return { 
          documentId: newDocument.id, 
          documentUrl: newDocument.url,
          fileName: newDocument.name
        };

      } catch (dbError) {
        console.error("Database create failed after document upload:", dbError);
        // IMPORTANT: If DB create fails, the file exists in UploadThing but not in our DB.
        // We should attempt to delete the orphaned file from UploadThing.
        try {
          // Import utapi correctly
          const { UTApi } = await import("uploadthing/server");
          const utapi = new UTApi(); // Instantiate UTApi
          await utapi.deleteFiles(file.key);
          console.log("Orphaned file deleted from UploadThing:", file.key);
        } catch (deleteError) {
          console.error("Failed to delete orphaned file from UploadThing:", deleteError);
        }
        // Throw an error to signal failure to the client
        throw new UploadThingError("Failed to save document details to database after upload.");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 