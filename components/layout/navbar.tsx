"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { NavbarBrand } from "./navbar-brand";
import { UserMenu } from "./user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { ToolSearch } from "@/components/tool-search";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <NavbarBrand />

        <div className="hidden md:flex items-center gap-4">
          <DesktopNav />
        </div>

        <div className="hidden lg:block lg:w-64 xl:w-72">
          <ToolSearch key={pathname} variant="nav" />
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ModeToggle />
          <UserMenu status={status} user={session?.user} />
        </div>

        <MobileNav status={status} user={session?.user} />
      </div>
    </header>
  );
}