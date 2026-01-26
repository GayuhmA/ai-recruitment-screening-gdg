import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    
    // Email/Password Provider (for custom backend)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call your backend API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          
          // Return user object that will be stored in JWT
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.email,
            role: data.user.role,
            organizationId: data.user.organizationId,
            accessToken: data.accessToken,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Initial sign in with credentials
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.accessToken = user.accessToken;
      }

      // Google OAuth sign in
      if (account?.provider === "google" && profile?.email) {
        try {
          // Call backend to create/get user with Google account
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name || profile.email,
              googleId: profile.sub,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Store backend user data in token
            token.id = data.user.id;
            token.role = data.user.role;
            token.organizationId = data.user.organizationId;
            token.accessToken = data.accessToken;
            token.email = data.user.email;
            token.name = data.user.fullName;
          } else {
            console.error("Failed to authenticate with backend:", await response.text());
          }
        } catch (error) {
          console.error("Error calling backend Google auth:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // Allow all sign ins
      return true;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
