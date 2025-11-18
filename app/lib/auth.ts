import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Lazy import to avoid Edge runtime issues
async function getUserByUsername(username: string) {
  const { getUserByUsername: getUser } = await import('./database');
  return getUser(username);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            console.error('Missing credentials');
            return null;
          }

          const user = await getUserByUsername(credentials.username as string);
          if (!user) {
            console.error(`User not found: ${credentials.username}`);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            (user as any).password_hash
          );

          if (!isValid) {
            console.error('Invalid password for user:', credentials.username);
            return null;
          }

          return {
            id: (user as any).id.toString(),
            name: (user as any).username,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

