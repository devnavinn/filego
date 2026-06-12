import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
                <div className="grid w-full overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-2">
                    <div className="hidden border-r bg-muted/40 p-10 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                Secure signup
                            </div>
                            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground">
                                Create your account
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                                Fast signup with email verification. We verify every new account with
                                a one-time code to reduce fake registrations and protect your app.
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-background/80 p-5">
                            <p className="text-sm font-medium text-foreground">
                                What happens next
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                                <li>Enter your details.</li>
                                <li>Receive a 6-digit verification code.</li>
                                <li>Verify your email and sign in.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                        <div className="mx-auto w-full max-w-md">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Sign up
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Use your email and a strong password to get started.
                                </p>
                            </div>

                            <RegisterForm />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}