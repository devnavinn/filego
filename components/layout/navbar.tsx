"use client";

import { useSession } from "next-auth/react";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { NavbarBrand } from "./navbar-brand";
import { UserMenu } from "./user-menu";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <NavbarBrand />
        <DesktopNav />
        <UserMenu status={status} user={session?.user} />
        <MobileNav status={status} user={session?.user} />
      </div>
    </header>
  );
}