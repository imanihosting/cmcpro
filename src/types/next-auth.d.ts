import { User_role } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Define the structure of the Address object based on your Prisma schema
interface UserAddress {
  streetAddress?: string | null;
  city?: string | null;
  county?: string | null;
  eircode?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: User_role;
      phoneNumber?: string | null;
      address?: UserAddress | null;
      bio?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: User_role;
    phoneNumber?: string | null;
    address?: UserAddress | null;
    bio?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: User_role;
    phoneNumber?: string | null;
    address?: UserAddress | null;
    bio?: string | null;
  }
} 