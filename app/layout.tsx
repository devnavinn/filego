import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

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

const siteUrl = "https://filego.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Filego — Fast File Tools for PDF, Image, and Document Workflows",
    template: "%s | Filego",
  },

  description:
    "Filego helps you compress images, merge PDFs, split files, convert documents, and manage file workflows with a fast, clean, privacy-first experience.",

  keywords: [
    "Filego",
    "image compressor",
    "compress image",
    "PDF tools",
    "merge PDF",
    "split PDF",
    "JPG to PDF",
    "PDF to JPG",
    "PDF to Word",
    "Word to PDF",
    "file conversion tools",
    "document tools",
    "online PDF tools",
    "privacy first file tools",
  ],

  applicationName: "Filego",
  category: "technology",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Filego — Fast File Tools for PDF, Image, and Document Workflows",
    description:
      "Compress images, merge PDFs, split files, and convert documents in one clean workspace.",
    siteName: "Filego",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Filego file tools platform preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Filego — Fast File Tools for PDF, Image, and Document Workflows",
    description:
      "Compress images, merge PDFs, split files, and convert documents in one clean workspace.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}