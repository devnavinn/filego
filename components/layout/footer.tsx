import Link from "next/link";
import { FilegoLogo } from "@/components/filego-logo";

const footerLinks = {
  Product: [
    { label: "Compress Image", href: "/bulk-image-compress" },
    { label: "Merge PDF", href: "/merge-pdf" },
    { label: "Split PDF", href: "/split-pdf" },
    { label: "JPG to PDF", href: "/jpg-to-pdf" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Resources: [
    { label: "Help Center", href: "/help" },
    { label: "API", href: "/api-docs" },
    { label: "Status", href: "/status" },
    { label: "Developers", href: "/developers" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
    { label: "Security", href: "/security" },
  ],
};

const socialLinks = [
  // { label: "X", href: "https://x.com/filego" },
  { label: "GitHub", href: "https://github.com/devnavinn" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/devnavin/" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                <FilegoLogo className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold tracking-tight">Filego</div>
                <div className="text-sm text-muted-foreground">
                  File tools for fast, modern workflows
                </div>
              </div>
            </Link>

            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Compress, convert, organize, and secure files with a clean product
              experience built for everyday work.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="mb-3 text-sm font-semibold">{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2026 Filego. All rights reserved.</p>

          <div className="flex gap-4">
            {socialLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
