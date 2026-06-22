import Link from "next/link";
import { FilegoLogo } from "@/components/filego-logo";

const footerLinks = {
  Product: [
    { label: "All Tools", href: "/tools" },
    { label: "PDF Tools", href: "/tools/pdf-tools" },
    { label: "Image Tools", href: "/tools/image-tools" },
    { label: "AI Tools", href: "/tools/ai-tools" },
  ],
  Popular: [
    { label: "Compress Image", href: "/tools/image-tools/image-compressor" },
    { label: "Merge PDF", href: "/tools/pdf-tools/pdf-merge" },
    { label: "Split PDF", href: "/tools/pdf-tools/pdf-split" },
    { label: "JPG to PDF", href: "/tools/pdf-tools/jpg-to-pdf" },
  ],
  Resources: [
    { label: "Help Center", href: "/help" },
    { label: "API", href: "/api-docs" },
    { label: "Status", href: "/status" },
    { label: "Developers", href: "/developers" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "Security", href: "/security" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
  ],
};

const socialLinks = [
  { label: "GitHub", href: "https://github.com/devnavinn" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/devnavin/" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="max-w-md">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                <FilegoLogo className="h-5 w-5" />
              </div>

              <div>
                <div className="font-semibold tracking-tight">Filego</div>
                <div className="text-sm text-muted-foreground">
                  Fast tools for modern file workflows
                </div>
              </div>
            </Link>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Compress, convert, organize, and secure files with a clean product
              experience built for everyday work across PDF, image, document,
              and AI-powered workflows.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/tools"
                className="inline-flex rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Browse tools
              </Link>
              <Link
                href="/bulk-image-compress"
                className="inline-flex rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Start free
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 xl:grid-cols-5">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  {title}
                </h4>

                <ul className="space-y-2.5">
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

        <div className="mt-10 flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2026 Filego. All rights reserved.</p>

          <div className="flex flex-wrap gap-4">
            {socialLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
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