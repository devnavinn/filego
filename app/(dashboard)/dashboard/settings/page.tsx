import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
    const user = await requireUser();

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Settings</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Account settings
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Manage your profile, preferences, and default account details.
                </p>
            </section>

            <Card className="rounded-3xl border border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-foreground">
                        Profile
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            Name
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                            {user.name || "—"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            Email
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                            {user.email || "—"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            Role
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                            {user.role || "USER"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}