import { Resend } from "resend";

type SendOtpEmailParams = {
    email: string;
    name: string;
    otp: string;
};

export async function sendOtpEmail({
    email,
    name,
    otp,
}: SendOtpEmailParams) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is missing");
    }

    if (!from) {
        throw new Error("RESEND_FROM_EMAIL is missing");
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
        from,
        to: email,
        subject: "Your verification code",
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name},</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">
          ${otp}
        </p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
    });

    if (error) {
        throw new Error(error.message || "Resend failed to send email");
    }

    return data;
}