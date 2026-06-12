import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://filego.in";

    const routes = [
        "",
        "/contact",
        "/security",
        "/cookies",
        "/pdf-forms",
        "/pdf-to-jpg",
        "/pdf-to-word",
        "/rotate-pdf",
        "/scan-to-pdf",
        "/split-pdf",
        "/word-to-pdf",
        "/bulk-image-compress",
        "/image-squoosh"
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1 : 0.8,
    }));
}