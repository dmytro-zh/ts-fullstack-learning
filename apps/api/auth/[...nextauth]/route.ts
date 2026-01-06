import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

type AppRole = 'PLATFORM_OWNER' | 'MERCHANT';

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function getAdminCreds() {
  return {
    email: normalizeEmail(process.env.ADMIN_EMAIL),
    password: process.env.ADMIN_PASSWORD ?? '',
  };
}

function getMerchantCreds() {
  return {
    email: normalizeEmail(process.env.MERCHANT_EMAIL),
    password: process.env.MERCHANT_PASSWORD ?? '',
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        const admin = getAdminCreds();
        const merchant = getMerchantCreds();

        const isAdmin = email && email === admin.email && password && password === admin.password;
        const isMerchant =
          email && email === merchant.email && password && password === merchant.password;

        if (!isAdmin && !isMerchant) return null;

        const role: AppRole = isAdmin ? 'PLATFORM_OWNER' : 'MERCHANT';

        return {
          id: role === 'PLATFORM_OWNER' ? 'admin' : 'merchant',
          name: role === 'PLATFORM_OWNER' ? 'Platform Owner' : 'Merchant',
          email,
          role,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.role = u.role as AppRole;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user.role = token.role as AppRole;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
