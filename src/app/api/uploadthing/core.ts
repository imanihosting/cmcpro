import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust the import path if necessary
import prisma from "@/lib/prisma"; // Import Prisma client

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
      console.log("file url", file.url);

      try {
        // Update the user's profileImage in the database
        await prisma.user.update({
          where: {
            id: metadata.userId,
          },
          data: {
            profileImage: file.url, // Save the URL returned by UploadThing
            updatedAt: new Date(),
          },
        });
        console.log("User profile image updated in database for userId:", metadata.userId);

        // Return the necessary info to the client
        return { uploadedBy: metadata.userId, imageUrl: file.url };

      } catch (dbError) {
        console.error("Database update failed after upload:", dbError);
        // Even if DB update fails, the file is already uploaded.
        // Depending on requirements, you might want to delete the file from UploadThing here.
        // For now, we'll still return success to the client but log the error.
        // Throwing an error here might be better to signal failure more clearly.
        // throw new UploadThingError("Failed to update database after upload."); 
        return { uploadedBy: metadata.userId, imageUrl: file.url, dbError: "Failed to update profile image in database." };
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 