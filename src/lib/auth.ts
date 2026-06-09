import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

export const ADMIN_EMAILS = ["ritikshah6633@gmail.com"];

export const authOptions: NextAuthOptions = {
  // @auth/drizzle-adapter v1 is typed for Auth.js v5; cast each table to suppress
  // the sessionToken primary-key type mismatch against our legacy Prisma-created schema
  adapter: DrizzleAdapter(db, {
    usersTable:              users              as any,
    accountsTable:           accounts           as any,
    sessionsTable:           sessions           as any,
    verificationTokensTable: verificationTokens as any,
  }) as any,
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id      = user.id;
        token.role    = (user as any).role ?? "free";
        token.isAdmin = ADMIN_EMAILS.includes(user.email ?? "");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id      = token.id      as string;
        (session.user as any).role    = token.role    as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
