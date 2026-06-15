// components/admin/dashboard-kpi-cards.tsx
import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type TrendDirection = "up" | "down" | "neutral";

export interface DashboardKpiItem {
    title: string;
    value: string | number;
    description?: string;
    trendLabel?: string;
    trendDirection?: TrendDirection;
    href?: string;
    icon: LucideIcon;
}

interface DashboardKpiCardsProps {
    items: DashboardKpiItem[];
}

function TrendIcon({ direction }: { direction?: TrendDirection }) {
    if (direction === "up") {
        return <TrendingUp className="size-4 text-emerald-600" />;
    }

    if (direction === "down") {
        return <TrendingDown className="size-4 text-rose-600" />;
    }

    return <Minus className="size-4 text-muted-foreground" />;
}

export function DashboardKpiCards({ items }: DashboardKpiCardsProps) {
    return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
                const Icon = item.icon;
                const content = (
                    <Card className="group rounded-3xl border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                            <div className="space-y-1">
                                <CardDescription className="text-sm">
                                    {item.title}
                                </CardDescription>
                                <CardTitle className="text-3xl font-semibold tracking-tight">
                                    {item.value}
                                </CardTitle>
                            </div>

                            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                <Icon className="size-5" />
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {item.description ? (
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            ) : null}

                            {(item.trendLabel || item.href) ? (
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 text-sm">
                                        <TrendIcon direction={item.trendDirection} />
                                        <span className="text-muted-foreground">
                                            {item.trendLabel || "No change"}
                                        </span>
                                    </div>

                                    {item.href ? (
                                        <div className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                            Open
                                            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                );

                if (item.href) {
                    return (
                        <Link key={item.title} href={item.href} className="block">
                            {content}
                        </Link>
                    );
                }

                return <div key={item.title}>{content}</div>;
            })}
        </section>
    );
}