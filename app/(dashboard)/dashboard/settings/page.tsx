import Link from "next/link";
import { Crown, KeyRound, Link2, ShieldAlert, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/entitlements";
import { formatDateSafe } from "@/lib/dashboard-formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "@/components/dashboard/settings-forms";

const PROVIDER_LABELS: Record<string, string> = {
    google: "Google",
    github: "GitHub",
};

export default async function SettingsPage() {
    const sessionUser = await requireUser();

    const [user, plan] = await Promise.all([
        prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: {
                name: true,
                email: true,
                password: true,
                emailVerified: true,
                createdAt: true,
                accounts: { select: { provider: true } },
            },
        }),
        getUserPlan(sessionUser.id),
    ]);

    const hasPassword = Boolean(user?.password);
    const providers = [...new Set(user?.accounts.map((account) => account.provider) ?? [])];
    const isPro = plan.tier === "pro";

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Settings</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Account settings
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Manage your profile, sign-in methods, plan and account.
                </p>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <Card className="rounded-3xl border border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <UserRound className="size-4" />
                            Profile
                        </CardTitle>
                        <CardDescription>
                            Member since {formatDateSafe(user?.createdAt)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm name={user?.name ?? ""} email={user?.email ?? sessionUser.email ?? ""} />
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-3xl border border-border bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <Crown className="size-4" />
                                Plan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {isPro ? "Filego Pro" : "Free"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isPro
                                            ? plan.isLifetime
                                                ? "Lifetime access"
                                                : `Active until ${formatDateSafe(plan.expiresAt)}`
                                            : "Ads, smaller files and daily AI limits"}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="rounded-full">
                                    {isPro ? "Pro" : "Free"}
                                </Badge>
                            </div>
                            <Button asChild variant={isPro ? "outline" : "default"} className="w-full rounded-xl">
                                <Link href="/dashboard/premium">{isPro ? "Manage Pro & billing" : "Upgrade to Pro"}</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-border bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <Link2 className="size-4" />
                                Sign-in methods
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                                <span className="text-foreground">Email & password</span>
                                <span className="text-muted-foreground">{hasPassword ? "Enabled" : "Not set"}</span>
                            </div>
                            {providers.map((provider) => (
                                <div
                                    key={provider}
                                    className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                                >
                                    <span className="text-foreground">{PROVIDER_LABELS[provider] ?? provider}</span>
                                    <span className="text-muted-foreground">Connected</span>
                                </div>
                            ))}
                            <p className="pt-1 text-xs text-muted-foreground">
                                Email {user?.emailVerified ? "verified" : "not verified"}.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <KeyRound className="size-4" />
                        Password
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {hasPassword ? (
                        <PasswordForm />
                    ) : (
                        <p className="text-sm leading-6 text-muted-foreground">
                            You sign in with {providers.map((p) => PROVIDER_LABELS[p] ?? p).join(" or ") || "a social account"}, so there’s no password to change.
                            To add one, use{" "}
                            <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
                                forgot password
                            </Link>{" "}
                            with your email.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-3xl border border-destructive/30 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
                        <ShieldAlert className="size-4" />
                        Delete account
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <DeleteAccountForm isPro={isPro} />
                </CardContent>
            </Card>
        </div>
    );
}
