import {
    FileImage,
    FileText,
    ScanText,
    Wand2,
} from "lucide-react";

export const menuGroups = [
    {
        title: "Organize",
        items: [
            { title: "Merge PDF", href: "/merge-pdf", icon: FileText },
            { title: "Split PDF", href: "/split-pdf", icon: FileText },
            { title: "Compress Image", href: "/bulk-image-compress", icon: FileImage },
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
] as const;

export const mobileLinks = [
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
] as const;

export function getAvatarUrl(seed: string) {
    return `https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(
        seed
    )}&radius=50&backgroundType=solid,gradientLinear`;
}