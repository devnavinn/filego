export function serializeBigInt<T>(data: T): T {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
}

export function bigIntToNumber(value: bigint | null | undefined) {
    if (value == null) return 0;
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : Number(value.toString());
}

export function formatBytes(bytes: number) {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}