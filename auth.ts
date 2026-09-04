import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/auth/schemas";

const dummyPasswordHash = bcrypt.hashSync("sunnex-timing-guard", 10);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        const passwordOk = await bcrypt.compare(
          parsed.data.password,
          user?.passwordHash ?? dummyPasswordHash,
        );

        if (!user || !passwordOk || user.status !== "active") {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});

export { loginSchema };
