import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

const isProd = process.env.NODE_ENV === "production";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  (isProd ? "" : "dev-placeholder-not-a-real-client-id.apps.googleusercontent.com");
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET || (isProd ? "" : "dev-placeholder-not-a-real-secret");

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "demo-credentials",
      name: "Demo account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const teeEndpoint = getTeeEndpoint();
        try {
          const loginUrl = `${teeEndpoint}/api/auth/user/login`;
          const res = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = (await res.json()) as {
            userId: string;
            name: string;
            email: string;
          };
          return {
            id: data.userId,
            email: data.email,
            name: data.name,
          };
        } catch {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user?.email) {
        return true;
      }
      try {
        const teeEndpoint = getTeeEndpoint();
        const response = await fetch(`${teeEndpoint}/api/auth/user/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name || "User",
            email: user.email,
            password: "google-oauth",
          }),
        });

        if (!response.ok && response.status !== 400) {
          console.error("Failed to register user in backend");
        }
      } catch (error) {
        console.error("Backend registration error:", error instanceof Error ? error.message : "unknown");
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.provider = account?.provider ?? "credentials";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || "";
        session.user.email = token.email as string | null;
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
};
