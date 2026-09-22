import { Resend } from "resend";
import { env } from "../env.js";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendMagicLinkEmail(email: string, link: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: "Your Translator sign-in link",
    html: renderHtml(link),
    text: renderText(link),
  });

  if (error) {
    throw new Error(`Resend failed to send magic link: ${error.message}`);
  }
}

function renderHtml(link: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#12060F;font-family:sans-serif;">
    <table role="presentation" width="100%" style="background-color:#12060F;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" style="background-color:#2A0E2E;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="color:#F7C6DD;font-size:22px;margin:0 0 16px;">Translator</h1>
                <p style="color:#FBF4EA;font-size:15px;line-height:1.5;margin:0 0 24px;">
                  Click below to sign in. This link expires in 15 minutes and can only be
                  used once.
                </p>
                <a
                  href="${link}"
                  style="display:inline-block;background-color:#C21E7A;color:#FBF4EA;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;"
                >
                  Sign in to Translator
                </a>
                <p style="color:#F7C6DD;font-size:13px;margin:24px 0 0;opacity:0.8;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText(link: string): string {
  return [
    "Sign in to Translator",
    "",
    link,
    "",
    "This link expires in 15 minutes and can only be used once.",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");
}
