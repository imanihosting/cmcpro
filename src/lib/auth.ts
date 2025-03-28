import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { db } from "@/lib/db";
import { User_role, User_subscriptionStatus } from "@prisma/client";

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
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: User_role;
    image?: string | null;
    subscriptionStatus: User_subscriptionStatus;
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
          image: user.image || null,
          subscriptionStatus: user.subscriptionStatus,
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
      }
      return session;
    },
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email || "",
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.subscriptionStatus = user.subscriptionStatus;
        }
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        image: dbUser.image,
        subscriptionStatus: dbUser.subscriptionStatus,
      };
    },
  },
}; 