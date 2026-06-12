import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendPasswordResetEmailParams = {
    email: string;
    name: string;
    resetUrl: string;
};

export async function sendPasswordResetEmail({
    email,
    name,
    resetUrl,
}: SendPasswordResetEmailParams) {
    const from = process.env.RESEND_FROM_EMAIL;

    if (!process.env.RESEND_API_KEY) {
        throw new Error("Missing RESEND_API_KEY");
    }

    if (!from) {
        throw new Error("Missing RESEND_FROM_EMAIL");
    }

    const { error } = await resend.emails.send({
        from,
        to: email,
        subject: "Reset your password",
        html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
        <h2 style="margin:0 0 12px;font-size:24px;">Reset your password</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
          Hi ${escapeHtml(name || "there")}, we received a request to reset your password.
        </p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
          Click the button below to choose a new password.
        </p>
        <a
          href="${resetUrl}"
          style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;"
        >
          Reset password
        </a>
        <p style="margin:20px 0 0;font-size:12px;color:#6b7280;line-height:1.6;">
          This link expires in 30 minutes. If you did not request this, you can ignore this email.
        </p>
      </div>
    `,
    });

    if (error) {
        throw new Error(error.message || "Resend failed to send password reset email");
    }
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}