export function formatBytesSafe(value: string | number | bigint | null | undefined) {
    const bytes = Number(value ?? 0);

    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const formatted = bytes / Math.pow(1024, index);

    return `${formatted.toFixed(formatted >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDateSafe(value: string | Date | null | undefined) {
    if (!value) return "—";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}