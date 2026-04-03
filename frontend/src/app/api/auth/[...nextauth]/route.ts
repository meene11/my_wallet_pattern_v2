import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },

  callbacks: {
    // Google id_token을 JWT에 보존
    async jwt({ token, account }) {
      if (account?.id_token) {
        token.idToken = account.id_token;
      }
      return token;
    },
    // 세션에 idToken 노출 (클라이언트에서 백엔드로 전송)
    async session({ session, token }) {
      session.idToken = token.idToken;
      session.appToken = token.appToken;
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",   // 로그인 페이지 없이 메인에서 팝업
  },
});

export { handler as GET, handler as POST };
