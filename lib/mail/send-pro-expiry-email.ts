import { Resend } from "resend";
import { SITE_URL } from "@/lib/seo";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendProExpiryEmailParams = {
    email: string;
    name: string;
    expiresAt: Date;
};

export async function sendProExpiryEmail({ email, name, expiresAt }: SendProExpiryEmailParams) {
    const from = process.env.RESEND_FROM_EMAIL;

    if (!process.env.RESEND_API_KEY) {
        throw new Error("Missing RESEND_API_KEY");
    }

    if (!from) {
        throw new Error("Missing RESEND_FROM_EMAIL");
    }

    const date = expiresAt.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });

    const { error } = await resend.emails.send({
        from,
        to: email,
        subject: `Your Filego Pro pass ends on ${date}`,
        html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
        <h2 style="margin:0 0 12px;font-size:24px;">Your Pro pass ends soon</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
          Hi ${escapeHtml(name || "there")}, your Filego Pro access ends on <strong>${date}</strong>.
          Pro passes don't renew automatically, so after that your account goes back to the Free plan.
        </p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
          To keep ad-free access and higher limits, buy another pass. Its days are added after your current pass ends.
        </p>
        <a
          href="${SITE_URL}/dashboard/premium"
          style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;"
        >
          Extend Pro
        </a>
      </div>
    `,
    });

    if (error) {
        throw new Error(error.message || "Resend failed to send Pro expiry email");
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
