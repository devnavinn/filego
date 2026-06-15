import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { menuGroups } from "./navbar-data";

export function DesktopNav() {
    return (
        <div className="hidden items-center gap-6 md:flex">
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <div className="w-[760px] max-w-[calc(100vw-48px)] p-6">
                                <div className="grid grid-cols-3 gap-6">
                                    {menuGroups.map((group) => (
                                        <div key={group.title} className="min-w-0">
                                            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                {group.title}
                                            </div>

                                            <div className="space-y-1">
                                                {group.items.map((item) => {
                                                    const Icon = item.icon;

                                                    return (
                                                        <NavigationMenuLink key={item.title} asChild>
                                                            <Link
                                                                href={item.href}
                                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                                                            >
                                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                                    <Icon className="h-4 w-4 text-foreground" />
                                                                </span>
                                                                <span className="truncate font-medium">
                                                                    {item.title}
                                                                </span>
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/api-docs">API</Link>
                        </NavigationMenuLink>
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