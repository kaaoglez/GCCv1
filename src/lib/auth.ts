import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  // Required for reverse proxy (Caddy on port 4000 → Next.js on port 3000)
  useSecureCookies: false,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password || !user.isActive) return null;

        // Simple password comparison (plain text for seed data)
        if (user.password !== credentials.password) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On first login: copy all user fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }
      // On session update (e.g. after profile save): update image in token
      if (trigger === 'update' && session?.image) {
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        if (token.image) {
          session.user.image = token.image as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: undefined, // We handle login via modal
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'gcc-dev-secret-change-in-production',
};
