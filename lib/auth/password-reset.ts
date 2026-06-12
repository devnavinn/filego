import crypto from "crypto";

export function generatePasswordResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiry(minutes = 30) {
    return new Date(Date.now() + minutes * 60 * 1000);
}