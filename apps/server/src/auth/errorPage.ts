import { env } from "../env.js";

/**
 * Minimal branded page for the /auth/callback failure paths (3.4) — an
 * expired or already-used link needs a readable message, not a JSON blob.
 */
export function renderAuthErrorPage(message: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background-color:#12060F;font-family:sans-serif;color:#FBF4EA;">
    <div style="max-width:420px;text-align:center;padding:24px;">
      <h1 style="color:#F7C6DD;font-size:22px;margin:0 0 12px;">Translator</h1>
      <p style="margin:0 0 20px;line-height:1.5;">${message}</p>
      <a href="${env.APP_BASE_URL}/" style="color:#F2B705;">Back to sign in</a>
    </div>
  </body>
</html>`;
}
