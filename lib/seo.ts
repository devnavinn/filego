import type { Metadata } from "next";

export const SITE_URL = "https://www.filego.in";
export const SITE_NAME = "Filego";

interface ToolMetadataInput {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
}

export function buildToolMetadata({
  path,
  title,
  description,
  keywords,
}: ToolMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

interface ToolJsonLdInput {
  path: string;
  name: string;
  description: string;
  featureList: string[];
}

export function buildToolJsonLd({
  path,
  name,
  description,
  featureList,
}: ToolJsonLdInput) {
  const url = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        isPartOf: { "@id": `${SITE_URL}#website` },
        about: { "@id": `${url}#app` },
      },
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name,
        url,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern browser.",
        description,
        publisher: { "@id": `${SITE_URL}#organization` },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
        featureList,
      },
    ],
  };
}
