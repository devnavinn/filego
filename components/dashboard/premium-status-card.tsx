import Link from "next/link";
import { Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PremiumStatusCardProps = {
    activePlan:
    | {
        planType?: string | null;
        billingStatus?: string | null;
        purchasedAt?: string | Date | null;
    }
    | null
    | undefined;
};

export function PremiumStatusCard({
    activePlan,
}: PremiumStatusCardProps) {
    const isActive = activePlan?.billingStatus === "ACTIVE";

    return (
        <Card className="rounded-3xl border border-border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Crown className="size-4" />
                    Premium access
                </CardTitle>
            </CardHeader>

            <CardContent>
                {isActive ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            {activePlan?.planType || "Premium"} active
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            You have access to premium dashboard features and bulk processing.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border bg-background p-5">
                        <p className="text-sm font-medium text-foreground">
                            Upgrade to premium
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Unlock higher bulk limits, advanced options, and premium tools.
                        </p>

                        <Button
                            asChild
                            className="mt-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
                        >
                            <Link href="/dashboard/premium">View plans</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}