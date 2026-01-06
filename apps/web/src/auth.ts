import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { AppRole } from '@ts-fullstack-learning/shared/auth/roles';
import { APP_ROLES } from '@ts-fullstack-learning/shared/auth/roles';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

function getDevUsers() {
  return [
    {
      id: 'u_platform_owner',
      name: 'Platform Owner',
      email: 'owner@local.dev',
      role: APP_ROLES.PLATFORM_OWNER,
      password: 'owner',
    },
    {
      id: 'u_merchant',
      name: 'Merchant',
      email: 'merchant@local.dev',
      role: APP_ROLES.MERCHANT,
      password: 'merchant',
    },
  ];
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  // Make NextAuth and middleware use the same secret
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');

        if (!email || !password) return null;

        const found = getDevUsers().find(
          (u) => u.email.toLowerCase() === email && u.password === password,
        );

        if (!found) return null;

        const user: AppUser = {
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role,
        };

        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AppUser;
        (token as JWT & { userId?: string; role?: AppRole }).userId = u.id;
        (token as JWT & { userId?: string; role?: AppRole }).role = u.role;
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as JWT & { userId?: string; role?: AppRole };

      if (session.user) {
        (session.user as { id?: string; role?: AppRole }).id = t.userId;
        (session.user as { id?: string; role?: AppRole }).role = t.role;
      }

      return session;
    },
  },
};
