import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc.js";
import { issueMagicToken } from "../auth/magicLink.js";
import { sendMagicLinkEmail } from "../auth/email.js";
import { checkLinkRequestRateLimit } from "../auth/rateLimit.js";
import { revokeSession } from "../auth/session.js";
import { env } from "../env.js";

export const authRouter = router({
  /**
   * Byte-identical response for every email, known or not, rate-limited or
   * not, send-failure or not — no enumeration (3.3).
   */
  requestLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ ok: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase();

      if (checkLinkRequestRateLimit(email, ctx.ip)) {
        const token = await issueMagicToken(email);
        const link = `${env.APP_BASE_URL}/auth/callback?token=${token}`;
        try {
          await sendMagicLinkEmail(email, link);
        } catch (err) {
          ctx.logError(err, "failed to send magic link email");
        }
      }

      return { ok: true };
    }),

  session: publicProcedure
    .output(z.object({ email: z.string() }).nullable())
    .query(({ ctx }) => (ctx.session ? { email: ctx.session.email } : null)),

  signOut: protectedProcedure
    .output(z.object({ ok: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      await revokeSession(ctx.session.id);
      ctx.clearSessionCookie();
      return { ok: true };
    }),
});
