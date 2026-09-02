export const mobileLinks = [
    { title: "API", href: "/api-docs" },
    { title: "About", href: "/about" },
    { title: "Blog", href: '/blog' }
] as const;

export function getAvatarUrl(seed: string) {
    return `https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(
        seed
    )}&radius=50&backgroundType=solid,gradientLinear`;
}