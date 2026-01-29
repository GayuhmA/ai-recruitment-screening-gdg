import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string;
      accessToken: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    organizationId: string;
    accessToken: string;
    fullName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organizationId: string;
    accessToken: string;
    googleAccessToken?: string;
  }
}
