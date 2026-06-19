import Link from "next/link";
import {
    FileArchive,
    FileImage,
    FileText,
    ImageIcon,
    Crown,
    ArrowRight,
    Sparkles,
    ScanSearch,
    FileOutput,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ToolItem = {
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    premium?: boolean;
    category: "Images" | "PDF" | "Conversion" | "Utilities";
};

const tools: ToolItem[] = [
    {
        title: "Bulk image compressor",
        description: "Compress multiple images at once with fast ZIP export.",
        href: "/bulk-image-compressor",
        icon: ImageIcon,
        category: "Images",
    },
    {
        title: "Single image compressor",
        description: "Optimize one image quickly with quality control.",
        href: "/image-squoosh",
        icon: FileImage,
        category: "Images",
    },
    {
        title: "Image to WebP / AVIF",
        description: "Convert images into lighter web-friendly formats.",
        href: "/image-converter",
        icon: Sparkles,
        category: "Images",
    },
    {
        title: "Compress PDF",
        description: "Reduce PDF file size for sharing and uploads.",
        href: "/compress-pdf",
        icon: FileText,
        category: "PDF",
    },
    {
        title: "Merge PDF",
        description: "Combine multiple PDF files into a single document.",
        href: "/merge-pdf",
        icon: FileArchive,
        category: "PDF",
    },
    {
        title: "Split PDF",
        description: "Extract pages or split large PDFs into smaller files.",
        href: "/split-pdf",
        icon: ScanSearch,
        category: "PDF",
    },
    {
        title: "JPG to PDF",
        description: "Turn image files into one clean PDF document.",
        href: "/jpg-to-pdf",
        icon: FileOutput,
        category: "Conversion",
    },
    {
        title: "PDF to JPG",
        description: "Convert PDF pages into image files.",
        href: "/pdf-to-jpg",
        icon: FileImage,
        category: "Conversion",
        premium: true,
    },
    {
        title: "PDF to Word",
        description: "Convert PDF documents into editable DOCX output.",
        href: "/pdf-to-word",
        icon: FileText,
        category: "Conversion",
        premium: true,
    },
];

const groupedTools = {
    Images: tools.filter((tool) => tool.category === "Images"),
    PDF: tools.filter((tool) => tool.category === "PDF"),
    Conversion: tools.filter((tool) => tool.category === "Conversion"),
    Utilities: tools.filter((tool) => tool.category === "Utilities"),
};

export default async function DashboardToolsPage() {
    const user = await requireUser();
    const data = await getDashboardOverview(user.id);

    const isPremium = data.activePlan?.billingStatus === "ACTIVE";

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border bg-card p-6 shadow-sm md:p-8">
                <p className="text-sm text-muted-foreground">Tools</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Open your Filego tools
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Launch compression, PDF, and conversion tools from one clean workspace.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Card className="rounded-3xl border shadow-sm lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-foreground">
                            Quick actions
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {tools.slice(0, 6).map((tool) => {
                            const Icon = tool.icon;
                            const locked = tool.premium && !isPremium;

                            return (
                                <Link key={tool.href} href={tool.href}>
                                    <div className="group h-full rounded-2xl border bg-background p-4 transition-all hover:-translate-y-0.5 hover:bg-accent/40 hover:shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                <Icon className="size-5" />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {tool.premium ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    >
                                                        <Crown className="mr-1 size-3" />
                                                        Premium
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h3 className="text-sm font-semibold text-foreground">
                                                {tool.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                {tool.description}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span
                                                className={cn(
                                                    "text-sm font-medium",
                                                    locked ? "text-muted-foreground" : "text-primary"
                                                )}
                                            >
                                                {locked ? "Premium required" : "Open tool"}
                                            </span>
                                            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-foreground">
                            Access status
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="rounded-2xl border bg-background p-4">
                            <p className="text-sm font-medium text-foreground">Current plan</p>
                            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                                {isPremium ? "Premium" : "Free"}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {isPremium
                                    ? "You can access premium tools and higher processing limits."
                                    : "Upgrade to unlock premium tools and larger batch workflows."}
                            </p>
                        </div>

                        {!isPremium ? (
                            <Button asChild className="w-full rounded-xl">
                                <Link href="/dashboard/premium">Upgrade to premium</Link>
                            </Button>
                        ) : (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    Premium access active
                                </p>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Your account is ready for premium workflows.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {Object.entries(groupedTools).map(([group, items]) =>
                items.length ? (
                    <section key={group} className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                {group}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Available tools in the {group.toLowerCase()} category.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {items.map((tool) => {
                                const Icon = tool.icon;
                                const locked = tool.premium && !isPremium;

                                return (
                                    <Card
                                        key={tool.href}
                                        className="rounded-3xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                    <Icon className="size-5" />
                                                </div>

                                                {tool.premium ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    >
                                                        <Crown className="mr-1 size-3" />
                                                        Premium
                                                    </Badge>
                                                ) : null}
                                            </div>

                                            <div className="mt-4">
                                                <h3 className="text-base font-semibold text-foreground">
                                                    {tool.title}
                                                </h3>
                                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                    {tool.description}
                                                </p>
                                            </div>

                                            <div className="mt-5">
                                                <Button
                                                    asChild
                                                    variant={locked ? "outline" : "default"}
                                                    className="w-full rounded-xl"
                                                >
                                                    <Link href={locked ? "/dashboard/premium" : tool.href}>
                                                        {locked ? "Unlock premium" : "Open tool"}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                ) : null
            )}
        </div>
    );
}