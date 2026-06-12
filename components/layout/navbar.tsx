"use client";

import Link from "next/link";
import {
  FileImage,
  FileText,
  Menu,
  ArrowRight,
  ScanText,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FilegoLogo } from "@/components/filego-logo";

const menuGroups = [
  {
    title: "Organize",
    items: [
      { title: "Merge PDF", href: "/merge-pdf", icon: FileText },
      { title: "Split PDF", href: "/split-pdf", icon: FileText },
      {
        title: "Compress Image",
        href: "/bulk-image-compress",
        icon: FileImage,
      },
      { title: "Scan to PDF", href: "/scan-to-pdf", icon: ScanText },
    ],
  },
  {
    title: "Convert",
    items: [
      { title: "JPG to PDF", href: "/jpg-to-pdf", icon: FileImage },
      { title: "PDF to JPG", href: "/pdf-to-jpg", icon: FileImage },
      { title: "PDF to Word", href: "/pdf-to-word", icon: FileText },
      { title: "Word to PDF", href: "/word-to-pdf", icon: FileText },
    ],
  },
  {
    title: "Edit",
    items: [
      { title: "Rotate PDF", href: "/rotate-pdf", icon: Wand2 },
      { title: "Add watermark", href: "/add-watermark", icon: Wand2 },
      { title: "Edit PDF", href: "/edit-pdf", icon: Wand2 },
      { title: "PDF forms", href: "/pdf-forms", icon: FileText },
    ],
  },
];

const mobileLinks = [
  { title: "Home", href: "/" },
  { title: "Compress Image", href: "/bulk-image-compress" },
  { title: "Merge PDF", href: "/merge-pdf" },
  { title: "Split PDF", href: "/split-pdf" },
  { title: "JPG to PDF", href: "/jpg-to-pdf" },
  { title: "PDF to JPG", href: "/pdf-to-jpg" },
  { title: "PDF to Word", href: "/pdf-to-word" },
  { title: "Word to PDF", href: "/word-to-pdf" },
  { title: "API", href: "/api-docs" },
  { title: "About", href: "/about" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
            <FilegoLogo className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">
              Filego
            </span>
            <span className="text-xs text-muted-foreground">
              File tools, simplified
            </span>
          </div>
        </Link>

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
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/api-docs">API</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/about">About</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>

          <Button asChild className="rounded-xl">
            <Link href="/bulk-image-compress">
              Start free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[320px]">
              <div className="mt-8 space-y-6">
                <div className="space-y-2">
                  {mobileLinks.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <Button asChild className="w-full rounded-xl">
                    <Link href="/bulk-image-compress">Start free</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
