"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    Bell,
    CalendarClock,
    Sparkles,
    Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ComingSoonProps = {
    title?: string;
    description?: string;
    launchDate?: string;
    backHref?: string;
    notifyPlaceholder?: string;
};

export function ComingSoon({
    title = "Something useful is on the way.",
    description = "We’re building this tool now. It will launch soon with a faster workflow, a cleaner interface, and the same Filego simplicity.",
    launchDate = "2026-08-15T00:00:00",
    backHref = "/",
    notifyPlaceholder = "Enter your email for launch updates",
}: ComingSoonProps) {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(getTimeLeft(launchDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeLeft(launchDate));
        }, 1000);

        return () => clearInterval(timer);
    }, [launchDate]);

    const launchLabel = useMemo(() => {
        const date = new Date(launchDate);
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }, [launchDate]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSubmitted(true);
        setEmail("");
    };

    return (
        <section className="relative overflow-hidden rounded-[2rem] border bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.05),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_24%)]" />
            <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:36px_36px]" />

            <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
                <div className="flex flex-col justify-between">
                    <div>
                        <Badge
                            variant="secondary"
                            className="rounded-full px-3 py-1 text-xs font-medium"
                        >
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            Coming soon
                        </Badge>

                        <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
                            {title}
                        </h2>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                            {description}
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                                <CalendarClock className="h-4 w-4" />
                                Planned launch: {launchLabel}
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2">
                                <Lock className="h-4 w-4" />
                                Early access will open first
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button asChild className="rounded-xl">
                            <Link href={backHref}>
                                Back to home
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="rounded-xl"
                        >
                            <Link href="/pricing">View pricing</Link>
                        </Button>
                    </div>
                </div>

                <div>
                    <Card className="rounded-[1.75rem] border-border/70 bg-background/90 shadow-sm backdrop-blur">
                        <CardContent className="p-5 md:p-6">
                            <div className="grid grid-cols-4 gap-3">
                                <TimeCard label="Days" value={timeLeft.days} />
                                <TimeCard label="Hours" value={timeLeft.hours} />
                                <TimeCard label="Min" value={timeLeft.minutes} />
                                <TimeCard label="Sec" value={timeLeft.seconds} />
                            </div>

                            <div className="mt-6 rounded-2xl border bg-muted/40 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 rounded-xl bg-background p-2 shadow-sm">
                                        <Bell className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">Get launch updates</h3>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            Join the waitlist to get notified when this tool goes live.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={notifyPlaceholder}
                                        className="h-11 rounded-xl"
                                    />

                                    <Button type="submit" className="h-11 w-full rounded-xl">
                                        Notify me
                                    </Button>
                                </form>

                                {submitted ? (
                                    <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                                        You’re on the list. We’ll let you know when it launches.
                                    </p>
                                ) : (
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        No spam. Just launch updates and major product news.
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <MiniStat title="Fast workflow" value="Built for speed" />
                                <MiniStat title="Private by design" value="Minimal friction" />
                                <MiniStat title="Modern tools" value="Focused features" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}

function TimeCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl border bg-muted/35 p-4 text-center">
            <div className="text-2xl font-semibold tracking-tight md:text-3xl">
                {String(value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {label}
            </div>
        </div>
    );
}

function MiniStat({
    title,
    value,
}: {
    title: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {title}
            </p>
            <p className="mt-2 text-sm font-medium">{value}</p>
        </div>
    );
}

function getTimeLeft(targetDate: string) {
    const total = Math.max(0, new Date(targetDate).getTime() - Date.now());

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / (1000 * 60)) % 60);
    const seconds = Math.floor((total / 1000) % 60);

    return { days, hours, minutes, seconds };
}