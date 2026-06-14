import { Geist, Geist_Mono, Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const siteUrl = "https://www.filego.in";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Filego",
    url: siteUrl,
    logo: `${siteUrl}/apple-icon.png`,
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Filego",
    url: siteUrl,
    description:
      "Filego helps you compress images, merge PDFs, split files, convert documents, and manage file workflows with a fast, clean, privacy-first experience.",
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: "Filego",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/apple-icon.png`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <AuthSessionProvider>
        <body className="min-h-full flex flex-col">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationSchema),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          />

          {children}
        </body>
      </AuthSessionProvider>
      <GoogleAnalytics gaId="G-91BF9G6C4E" />
      <Analytics />
      <SpeedInsights />
    </html>
  );
}
