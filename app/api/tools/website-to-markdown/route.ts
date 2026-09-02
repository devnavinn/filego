import { NextResponse } from "next/server"
import { z } from "zod"
import dns from "node:dns/promises"
import net from "node:net"

const bodySchema = z.object({
    url: z.string().url(),
})

const MAX_BYTES = 3 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 5

function isDisallowedIp(ip: string): boolean {
    if (net.isIPv4(ip)) {
        const [a, b, c] = ip.split(".").map(Number)
        if (a === 10) return true
        if (a === 127) return true
        if (a === 0) return true
        if (a === 169 && b === 254) return true
        if (a === 172 && b >= 16 && b <= 31) return true
        if (a === 192 && b === 168) return true
        if (a === 100 && b >= 64 && b <= 127) return true
        if (a === 192 && b === 0 && c === 0) return true
        if (a === 198 && (b === 18 || b === 19)) return true
        return false
    }

    if (net.isIPv6(ip)) {
        const lower = ip.toLowerCase()
        if (lower === "::1" || lower === "::") return true
        if (/^fe[89ab]/.test(lower)) return true
        if (/^f[cd]/.test(lower)) return true
        const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
        if (mapped) return isDisallowedIp(mapped[1])
        return false
    }

    return true
}

async function assertSafeUrl(rawUrl: string): Promise<URL> {
    let url: URL
    try {
        url = new URL(rawUrl)
    } catch {
        throw new Error("Please provide a valid URL.")
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Only http and https URLs are supported.")
    }

    const hostname = url.hostname.toLowerCase()
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
        throw new Error("This URL cannot be fetched.")
    }

    if (net.isIP(hostname)) {
        if (isDisallowedIp(hostname)) throw new Error("This URL cannot be fetched.")
        return url
    }

    let records: { address: string }[]
    try {
        records = await dns.lookup(hostname, { all: true, verbatim: true })
    } catch {
        throw new Error("Could not resolve this domain.")
    }

    if (records.length === 0 || records.some((record) => isDisallowedIp(record.address))) {
        throw new Error("This URL cannot be fetched.")
    }

    return url
}

async function fetchHtml(startUrl: URL): Promise<{ html: string; finalUrl: string }> {
    let currentUrl = startUrl

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

        let response: Response
        try {
            response = await fetch(currentUrl, {
                signal: controller.signal,
                redirect: "manual",
                headers: {
                    "User-Agent": "FilegoBot/1.0 (+https://www.filego.in)",
                    Accept: "text/html,application/xhtml+xml",
                },
            })
        } catch {
            throw new Error("Could not reach this URL.")
        } finally {
            clearTimeout(timeout)
        }

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location")
            if (!location) throw new Error("This URL could not be fetched.")
            currentUrl = await assertSafeUrl(new URL(location, currentUrl).toString())
            continue
        }

        if (!response.ok) {
            throw new Error(`The page responded with status ${response.status}.`)
        }

        const contentType = response.headers.get("content-type") ?? ""
        if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
            throw new Error("This URL does not point to an HTML page.")
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("Could not read this page.")

        const chunks: Buffer[] = []
        let received = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) {
                received += value.byteLength
                if (received > MAX_BYTES) {
                    await reader.cancel()
                    throw new Error("This page is too large to convert.")
                }
                chunks.push(Buffer.from(value))
            }
        }

        return { html: Buffer.concat(chunks).toString("utf-8"), finalUrl: currentUrl.toString() }
    }

    throw new Error("Too many redirects.")
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parsed = bodySchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: "Please provide a valid URL." }, { status: 400 })
        }

        let safeUrl: URL
        try {
            safeUrl = await assertSafeUrl(parsed.data.url)
        } catch (err) {
            return NextResponse.json(
                { error: err instanceof Error ? err.message : "This URL cannot be fetched." },
                { status: 400 }
            )
        }

        let html: string
        let finalUrl: string
        try {
            ;({ html, finalUrl } = await fetchHtml(safeUrl))
        } catch (err) {
            return NextResponse.json(
                { error: err instanceof Error ? err.message : "Could not convert this page." },
                { status: 400 }
            )
        }

        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)

        return NextResponse.json({
            html,
            title: titleMatch?.[1]?.trim() || null,
            sourceUrl: finalUrl,
        })
    } catch (error) {
        console.error("[WEBSITE_TO_MARKDOWN_ERROR]", error)
        return NextResponse.json({ error: "Something went wrong while fetching this page." }, { status: 500 })
    }
}
