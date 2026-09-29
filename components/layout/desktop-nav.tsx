import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { categoryIconMap, toolCategories } from "@/lib/tools-data";
import { cn } from "@/lib/utils";

const TOOLS_PER_CATEGORY = 4;

export function DesktopNav() {
    return (
        <div className="hidden items-center gap-6 md:flex">
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <div className="w-[920px] max-w-[calc(100vw-48px)] p-6">
                                <div className="grid grid-cols-3 gap-x-6 gap-y-7">
                                    {toolCategories.map((category) => {
                                        const CategoryIcon = categoryIconMap[category.slug];
                                        const visibleTools = category.tools.slice(0, TOOLS_PER_CATEGORY);
                                        const remaining = category.tools.length - visibleTools.length;

                                        return (
                                            <div key={category.id} className="min-w-0">
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href={`/tools/${category.slug}`}
                                                        className="mb-3 flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:text-primary"
                                                    >
                                                        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm", category.accent)}>
                                                            <CategoryIcon className="h-3.5 w-3.5" />
                                                        </span>
                                                        <span className="truncate text-sm font-semibold">
                                                            {category.title}
                                                        </span>
                                                    </Link>
                                                </NavigationMenuLink>

                                                <div className="space-y-0.5">
                                                    {visibleTools.map((tool) => (
                                                        <NavigationMenuLink key={tool.slug} asChild>
                                                            <Link
                                                                href={`/tools/${category.slug}/${tool.slug}`}
                                                                className="block truncate rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                            >
                                                                {tool.name}
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    ))}
                                                </div>

                                                {remaining > 0 ? (
                                                    <NavigationMenuLink asChild>
                                                        <Link
                                                            href={`/tools/${category.slug}`}
                                                            className="mt-1 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:underline"
                                                        >
                                                            View all {category.tools.length}
                                                            <ArrowRight className="h-3 w-3" />
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 border-t border-border/60 pt-4">
                                    <NavigationMenuLink asChild>
                                        <Link
                                            href="/tools"
                                            className="bg-gradient-brand flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-opacity hover:opacity-90"
                                        >
                                            Browse all tools
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </NavigationMenuLink>
                                </div>
                            </div>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/about">About</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/blog">Blog</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );
}
