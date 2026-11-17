import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

/**
 * A subtitle job is split into several audio parts, but should cost one AI credit.
 * The first part consumes the credit and gets back a signed token; later parts present it.
 * The token is stateless (HMAC-signed with NEXTAUTH_SECRET) and tied to the user.
 */
type JobPayload = {
    /** User id. */
    u: string
    /** Job id. */
    j: string
    /** Number of parts this job may send. */
    n: number
    /** Expiry, ms since epoch. */
    exp: number
}

const JOB_TTL_MS = 60 * 60 * 1000

function getSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) throw new Error("NEXTAUTH_SECRET is not set")
    return secret
}

function sign(data: string): string {
    return createHmac("sha256", getSecret()).update(data).digest("base64url")
}

export function createSubtitleJobToken(userId: string, partCount: number): string {
    const payload: JobPayload = { u: userId, j: randomUUID(), n: partCount, exp: Date.now() + JOB_TTL_MS }
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
    return `${data}.${sign(data)}`
}

/** Returns true if the token is genuine, unexpired, belongs to `userId`, and covers `partIndex`. */
export function verifySubtitleJobToken(token: string, userId: string, partIndex: number): boolean {
    const [data, signature] = token.split(".")
    if (!data || !signature) return false

    const expected = Buffer.from(sign(data))
    const actual = Buffer.from(signature)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false

    try {
        const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as JobPayload
        return payload.u === userId && payload.exp > Date.now() && partIndex > 0 && partIndex < payload.n
    } catch {
        return false
    }
}
