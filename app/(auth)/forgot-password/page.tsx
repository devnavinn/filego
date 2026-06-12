import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
                <div className="grid w-full overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-2">
                    <div className="hidden border-r bg-muted/40 p-10 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                Password recovery
                            </div>
                            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground">
                                Forgot your password?
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                                Enter the email address associated with your account and we’ll send
                                you a secure link to reset your password.
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-background/80 p-5">
                            <p className="text-sm font-medium text-foreground">
                                Security note
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Reset links expire automatically and can only be used once.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                        <div className="mx-auto w-full max-w-md">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Reset password
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    We’ll email you a password reset link.
                                </p>
                            </div>

                            <ForgotPasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}