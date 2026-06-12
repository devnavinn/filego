import { VerifyOtpForm } from "@/components/auth/verify-otp-form";

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string }>;
}) {
    const { email } = await searchParams;

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
                <div className="grid w-full overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-2">
                    <div className="hidden border-r bg-muted/40 p-10 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                Email verification
                            </div>
                            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground">
                                Confirm it’s really you
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                                We sent a one-time code to your email. Enter it below to activate
                                your account and continue.
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-background/80 p-5">
                            <p className="text-sm font-medium text-foreground">Security note</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Codes expire quickly and can only be used a limited number of times.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                        <div className="mx-auto w-full max-w-md">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Verify email
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
                                </p>
                            </div>

                            <VerifyOtpForm email={email ?? ""} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}