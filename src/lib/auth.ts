import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import { db } from "@/lib/db";
import { User_role, User_subscriptionStatus } from "@prisma/client";
import { sendNotificationEmail } from "./msGraph";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

// Add these type declarations to extend the default types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: User_role;
      image?: string | null;
      subscriptionStatus: User_subscriptionStatus;
      trialEndDate?: Date | null;
      trialActivated?: boolean;
      phoneNumber?: string | null;
      bio?: string | null;
      address?: {
        streetAddress?: string | null;
        city?: string | null;
        county?: string | null;
        eircode?: string | null;
      } | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: User_role;
    image?: string | null;
    subscriptionStatus: User_subscriptionStatus;
    trialEndDate?: Date | null;
    trialActivated?: boolean;
    phoneNumber?: string | null;
    bio?: string | null;
    address?: {
      streetAddress?: string | null;
      city?: string | null;
      county?: string | null;
      eircode?: string | null;
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    role: User_role;
    image?: string | null;
    subscriptionStatus: User_subscriptionStatus;
    trialEndDate?: Date | null;
    trialActivated?: boolean;
    phoneNumber?: string | null;
    bio?: string | null;
    address?: {
      streetAddress?: string | null;
      city?: string | null;
      county?: string | null;
      eircode?: string | null;
    } | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
          // @ts-ignore - Prisma client needs regeneration to recognize Address
          include: {
            Address: true
          }
        });

        if (!user) {
          return null;
        }

        if (!user.hashed_password) {
          return null;
        }

        const passwordMatch = await compare(
          credentials.password,
          user.hashed_password
        );

        if (!passwordMatch) {
          return null;
        }

        // Check subscription status
        if (user.subscriptionStatus === "FREE" && !user.trialActivated) {
          // Allow user to continue if they're in trial period or have a subscription
          // This is just a check, you can modify as needed
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || null,
          role: user.role,
          image: user.image || user.profileImage || null,
          subscriptionStatus: user.subscriptionStatus,
          trialEndDate: user.trialEndDate,
          trialActivated: user.trialActivated,
          phoneNumber: user.phoneNumber,
          bio: user.bio,
          // @ts-ignore - Prisma client needs regeneration to recognize Address
          address: user.Address ? {
            // @ts-ignore
            streetAddress: user.Address.streetAddress,
            // @ts-ignore
            city: user.Address.city,
            // @ts-ignore
            county: user.Address.county,
            // @ts-ignore
            eircode: user.Address.eircode,
          } : null,
        };
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.image = token.image;
        session.user.subscriptionStatus = token.subscriptionStatus;
        session.user.trialEndDate = token.trialEndDate;
        session.user.trialActivated = token.trialActivated;
        session.user.phoneNumber = token.phoneNumber;
        session.user.bio = token.bio;
        session.user.address = token.address;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscriptionStatus = user.subscriptionStatus;
        token.trialEndDate = user.trialEndDate;
        token.trialActivated = user.trialActivated;
        token.phoneNumber = (user as any).phoneNumber;
        token.bio = (user as any).bio;
        token.address = (user as any).address;
      }

      // On subsequent requests, fetch the user from DB
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email || "",
        },
        // @ts-ignore - Prisma client needs regeneration to recognize Address
        include: {
          Address: true // Ensure Address is included
        }
      });

      if (!dbUser) {
        return token;
      }

      // Update token with the latest DB data
      return {
        ...token,
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        image: dbUser.profileImage || dbUser.image,
        subscriptionStatus: dbUser.subscriptionStatus,
        trialEndDate: dbUser.trialEndDate,
        trialActivated: dbUser.trialActivated,
        phoneNumber: dbUser.phoneNumber,
        bio: dbUser.bio,
        // @ts-ignore - Prisma client needs regeneration to recognize Address
        address: dbUser.Address ? {
          // @ts-ignore
          streetAddress: dbUser.Address.streetAddress,
          // @ts-ignore
          city: dbUser.Address.city,
          // @ts-ignore
          county: dbUser.Address.county,
          // @ts-ignore
          eircode: dbUser.Address.eircode,
        } : null,
      };
    },
  },
};

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  // Database operations need to be adjusted for the actual schema
  try {
    const existingToken = await db.passwordResetToken.findFirst({
      where: { email }
    });

    if (existingToken) {
      await db.passwordResetToken.delete({
        where: { id: existingToken.id }
      });
    }

    const passwordResetToken = await db.passwordResetToken.create({
      data: {
        id: uuidv4(),
        email,
        token,
        expires
      }
    });

    return passwordResetToken;
  } catch (error) {
    console.error("Error generating reset token:", error);
    throw new Error("Failed to generate reset token");
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const passwordResetToken = await generatePasswordResetToken(email);

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${passwordResetToken.token}`;

    const content = `
      <p>You have requested to reset your password.</p>
      <p>Click the button below to reset your password:</p>
      <p><a href="${resetLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    await sendNotificationEmail(user, "Reset Your Password", content);

    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: "Failed to send reset email" };
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: { token }
    });

    if (!passwordResetToken) {
      return { success: false, error: "Invalid token" };
    }

    const hasExpired = new Date(passwordResetToken.expires) < new Date();

    if (hasExpired) {
      await db.passwordResetToken.delete({
        where: { id: passwordResetToken.id }
      });
      return { success: false, error: "Token has expired" };
    }

    const user = await db.user.findUnique({
      where: { email: passwordResetToken.email }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: { hashed_password: hashedPassword }
    });

    await db.passwordResetToken.delete({
      where: { id: passwordResetToken.id }
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}; 