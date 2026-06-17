import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ verified?: string; reset?: string }>;
}) {
    const { verified, reset } = await searchParams;

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
                <div className="grid w-full overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-2">
                    <div className="hidden border-r bg-muted/40 p-10 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                Welcome back
                            </div>
                            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground">
                                Sign in to your account
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                                Access your dashboard, manage files, and continue where you left off
                                with a fast and secure sign-in experience.
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-background/80 p-5">
                            <p className="text-sm font-medium text-foreground">
                                Secure access
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                                <li>Email and password authentication.</li>
                                <li>Verified accounts only.</li>
                                <li>Role-based access for protected areas.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                        <div className="mx-auto w-full max-w-md">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Login
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Enter your email and password to continue.
                                </p>
                            </div>

                            {verified === "1" ? (
                                <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                                    Your email has been verified. You can sign in now.
                                </div>
                            ) : null}

                            {reset === "1" ? (
                                <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                                    Your password has been updated. You can sign in now.
                                </div>
                            ) : null}

                            <LoginForm />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}