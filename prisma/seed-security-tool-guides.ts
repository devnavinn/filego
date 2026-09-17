// prisma/seed-security-tool-guides.ts
//
// Seeds one high-intent, SEO-oriented guide per Security tool into the
// `blog_posts` table (Neon/Postgres via Prisma). Mirrors
// prisma/seed-tool-guides.ts, but for the Security Tools category
// (hashing, password generation, checksums, encryption, and encoding).
//
// Run with: npm run seed:security-guides

import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { prisma } from "@/lib/prisma";

neonConfig.webSocketConstructor = ws;

interface ToolGuide {
    slug: string;
    title: string;
    excerpt: string;
    seoTitle: string;
    seoDescription: string;
    category: string;
    tags: string[];
    toolLabel: string;
    toolPath: string;
    content: string;
}

const guides: ToolGuide[] = [
    {
        slug: "how-to-generate-a-sha256-hash-online",
        title: "How to Generate a SHA256 Hash Online for Free",
        excerpt:
            "Need to verify a file or generate a checksum for a value? Here's how to create a SHA256 hash online, free, in your browser.",
        seoTitle: "How to Generate a SHA256 Hash Online Free | Filego",
        seoDescription:
            "Generate a SHA256 hash from text or a file online for free, entirely in your browser. Step-by-step guide and common use cases.",
        category: "Security Guides",
        tags: ["sha256", "hash generator", "security tools"],
        toolLabel: "SHA256 Generator",
        toolPath: "/tools/security-tools/sha256-generator",
        content: `SHA256 is one of the most widely used hashing algorithms — it takes any input and produces a fixed-length string that uniquely represents it. Change even one character of the input, and the resulting hash looks completely different. That makes it useful for verifying data integrity, checking passwords, and generating consistent identifiers.

## When you need a SHA256 hash

- Verifying that a downloaded file matches its published checksum
- Generating a consistent, unique identifier from a piece of text
- Checking data integrity after a transfer or backup
- Working with APIs or systems that require SHA256 hashes for signatures or verification

## How to generate a SHA256 hash, step by step

1. Open the [SHA256 Generator](/tools/security-tools/sha256-generator).
2. Type or paste the text you want to hash, or upload a file.
3. The SHA256 hash is generated instantly.
4. Copy the resulting hash for wherever you need it.

## Tips for using SHA256 hashes

- **A single character difference changes the entire hash.** If two hashes don't match exactly, the inputs are different, even if they look nearly identical.
- **Hashing isn't the same as encryption.** A hash can't be reversed back into the original input — use [AES Encrypt/Decrypt](/tools/security-tools/aes-encrypt-decrypt) if you need to recover the original data later.
- **Use a file checksum for verifying downloads** — see the [File Checksum Generator](/tools/security-tools/file-checksum-generator) if you specifically need to confirm file integrity.

## Common questions

**Can I reverse a SHA256 hash back to the original text?**
No — hashing is one-way by design. The only way to "match" a hash is to hash the same input again and compare.

**Is SHA256 the same as MD5?**
No — they're different algorithms. SHA256 produces a longer, more collision-resistant hash and is generally preferred over MD5 for security-sensitive uses. See the [MD5 Generator](/tools/security-tools/md5-generator) if you specifically need MD5.

**Can I hash a whole file, not just text?**
Yes — upload the file directly and the tool generates its SHA256 hash.

Need a SHA256 hash for text or a file? [Generate a SHA256 hash for free →](/tools/security-tools/sha256-generator)`,
    },
    {
        slug: "how-to-generate-an-md5-hash-online",
        title: "How to Generate an MD5 Hash Online for Free",
        excerpt:
            "Need a quick MD5 checksum for a file or piece of text? Here's how to generate one online, free, in seconds.",
        seoTitle: "How to Generate an MD5 Hash Online Free | Filego",
        seoDescription:
            "Generate an MD5 hash from text or a file online for free. Useful for checksums and legacy system compatibility. Step-by-step guide.",
        category: "Security Guides",
        tags: ["md5", "hash generator", "security tools"],
        toolLabel: "MD5 Generator",
        toolPath: "/tools/security-tools/md5-generator",
        content: `MD5 is an older, widely supported hashing algorithm still used for quick checksums and compatibility with legacy systems that expect it, even though newer algorithms like SHA256 are now preferred for anything security-sensitive. It's fast and simple for identifying whether data has changed.

## When you need an MD5 hash

- Working with a legacy system, API, or file format that specifically expects MD5
- Generating a quick checksum to compare two files or values
- Verifying a download against a published MD5 checksum
- Creating a lightweight, consistent identifier for a piece of data

## How to generate an MD5 hash, step by step

1. Open the [MD5 Generator](/tools/security-tools/md5-generator).
2. Type or paste text, or upload a file.
3. The MD5 hash is generated instantly.
4. Copy the resulting hash.

## Tips for using MD5 correctly

- **Don't use MD5 for password storage or security-critical hashing.** It's considered weak against deliberate collision attacks — use SHA256 for anything security-sensitive; see the [SHA256 Generator](/tools/security-tools/sha256-generator).
- **It's fine for quick integrity checks**, like confirming a file wasn't corrupted during a transfer, where security isn't the concern.
- **Match the case and format** the source system expects — some systems expect lowercase hex, others uppercase.

## Common questions

**Is MD5 secure?**
Not for security-critical purposes — MD5 is considered cryptographically broken for that use. It's still fine for basic integrity checks and legacy compatibility.

**What's the difference between MD5 and SHA256?**
MD5 produces a shorter hash and is faster but less collision-resistant; SHA256 is longer and considered much more secure. Use SHA256 unless something specifically requires MD5.

**Can I hash a file instead of text?**
Yes — upload the file directly to generate its MD5 hash.

Need a quick MD5 hash? [Generate an MD5 hash for free →](/tools/security-tools/md5-generator)`,
    },
    {
        slug: "how-to-generate-a-secure-password-online",
        title: "How to Generate a Secure, Random Password Online",
        excerpt:
            "Reusing weak passwords is one of the easiest ways to get an account compromised. Here's how to generate a strong one instantly.",
        seoTitle: "How to Generate a Secure Password Online Free | Filego",
        seoDescription:
            "Generate a strong, random password online for free. Customize length and character types for any account. Step-by-step guide.",
        category: "Security Guides",
        tags: ["password generator", "secure password", "security tools"],
        toolLabel: "Password Generator",
        toolPath: "/tools/security-tools/password-generator",
        content: `A weak or reused password is one of the most common ways accounts get compromised. A long, random password generated specifically for each account closes that gap — and it takes less effort than coming up with one yourself.

## Why a generated password beats one you make up

- Random passwords don't follow predictable patterns that attackers can guess
- A unique password per account means one breach doesn't compromise everything else
- Longer, random passwords resist brute-force attempts far better than short or common ones
- You don't have to rely on memorable-but-weak patterns like substituting letters with numbers

## How to generate a secure password, step by step

1. Open the [Password Generator](/tools/security-tools/password-generator).
2. Choose the length and which character types to include — uppercase, lowercase, numbers, symbols.
3. Generate a new password.
4. Copy it and save it in a password manager.

## Tips for stronger passwords

- **Length matters more than complexity.** A longer password with fewer restrictions is often stronger than a short one packed with symbols.
- **Use a different password for every account.** Reusing one password anywhere means a single leak can affect everything else.
- **Save it in a password manager**, not a plain text file or note, since you shouldn't need to remember a properly random password.

## Common questions

**How long should my password be?**
Longer is generally better — most security guidance now recommends at least 12–16 characters where the account allows it.

**Are symbols necessary for a strong password?**
They help, but length and randomness matter more. A long random password without symbols can still be very strong.

**Should I reuse a generated password across accounts?**
No — generate a new, unique password for each account so a breach on one doesn't put others at risk.

Need a strong password right now? [Generate a secure password for free →](/tools/security-tools/password-generator)`,
    },
    {
        slug: "how-to-generate-a-file-checksum-online",
        title: "How to Generate a File Checksum to Verify Integrity",
        excerpt:
            "Make sure a downloaded or transferred file wasn't corrupted or tampered with. Here's how to generate and check a file checksum, free.",
        seoTitle: "How to Generate a File Checksum Online Free | Filego",
        seoDescription:
            "Generate a file checksum online for free to verify a download or transfer wasn't corrupted or altered. Step-by-step guide.",
        category: "Security Guides",
        tags: ["file checksum", "verify file integrity", "security tools"],
        toolLabel: "File Checksum Generator",
        toolPath: "/tools/security-tools/file-checksum-generator",
        content: `A file can get corrupted during a download or transfer without any obvious sign — it might open fine but contain subtly broken data. A checksum solves this: it's a short fingerprint of the file's exact contents, and comparing it against a published value confirms the file arrived intact.

## When you need a file checksum

- Verifying a downloaded file matches the checksum published by its source
- Confirming a file transferred over a network or removable drive wasn't corrupted
- Checking that two copies of a file are actually identical
- Verifying software downloads haven't been tampered with before installing

## How to generate a file checksum, step by step

1. Open the [File Checksum Generator](/tools/security-tools/file-checksum-generator).
2. Upload the file you want to check.
3. The tool generates its checksum.
4. Compare the result against the checksum published by the file's source.

## Tips for verifying files correctly

- **Compare the full checksum, character by character** — even a single differing character means the file doesn't match.
- **Use the same algorithm the source published.** If they provide a SHA256 checksum, compare against SHA256, not MD5 — see the [SHA256 Generator](/tools/security-tools/sha256-generator) if you need that specifically.
- **Re-download if the checksum doesn't match** — a mismatch usually means the file was corrupted or altered in transit, not that anything is wrong with the checksum tool.

## Common questions

**What does it mean if the checksum doesn't match?**
The file differs from the original in some way — even a tiny corruption changes the checksum completely. Re-download or re-transfer the file.

**Which checksum algorithm should I use?**
Use whichever the source of the file published — commonly SHA256 or MD5. Match the algorithm exactly for the comparison to be meaningful.

**Can I check any file type?**
Yes — the checksum is generated from the file's raw contents regardless of its type.

Need to verify a file's integrity? [Generate a file checksum for free →](/tools/security-tools/file-checksum-generator)`,
    },
    {
        slug: "how-to-encrypt-and-decrypt-text-with-aes-online",
        title: "How to Encrypt and Decrypt Text with AES Online",
        excerpt:
            "Need to protect a piece of text with a password before sharing it? Here's how AES encryption and decryption works online, free.",
        seoTitle: "How to Encrypt Text with AES Online Free | Filego",
        seoDescription:
            "Encrypt and decrypt text using AES online for free, protected by a password you choose. Step-by-step guide and use cases.",
        category: "Security Guides",
        tags: ["aes encryption", "encrypt text", "security tools"],
        toolLabel: "AES Encrypt/Decrypt",
        toolPath: "/tools/security-tools/aes-encrypt-decrypt",
        content: `Sometimes you need to share sensitive text — a password, a private note, a key — through a channel that isn't fully secure, like email or chat. AES encryption scrambles the text so it's unreadable without the password used to encrypt it, and unscrambles it just as easily for whoever has that password.

## When you need AES encryption

- Sharing a sensitive note or credential through an insecure channel
- Storing sensitive text in a way that requires a password to read
- Protecting a value before pasting it somewhere you don't fully trust
- Decrypting text someone else encrypted and shared with you, along with the password

## How to encrypt text with AES, step by step

1. Open [AES Encrypt/Decrypt](/tools/security-tools/aes-encrypt-decrypt).
2. Paste the text you want to protect.
3. Enter a password to encrypt it with.
4. Copy the encrypted output to share.
5. To decrypt, paste the encrypted text and the same password into the decrypt side.

## Tips for using AES encryption safely

- **Share the password through a different channel** than the encrypted text itself — sending both together defeats the purpose.
- **Use a strong, unique password** for the encryption — see the [Password Generator](/tools/security-tools/password-generator) if you need one.
- **Keep a record of the password.** Encrypted text is unrecoverable without the exact password used to encrypt it.

## Common questions

**Can I recover the text if I forget the password?**
No — AES encryption is designed so the text can't be recovered without the exact password. There's no backdoor or reset option.

**Is this the same as hashing?**
No — hashing (like [SHA256](/tools/security-tools/sha256-generator)) is one-way and can't be reversed. AES encryption is two-way: encrypt with a password, decrypt with the same password to get the original text back.

**How strong is the encryption?**
AES is a widely trusted, industry-standard encryption algorithm — the security of your data depends mainly on choosing a strong, unique password.

Need to protect a piece of text? [Encrypt your text with AES for free →](/tools/security-tools/aes-encrypt-decrypt)`,
    },
    {
        slug: "how-to-base64-encode-and-decode-online",
        title: "How to Base64 Encode and Decode Text Online",
        excerpt:
            "Base64 shows up everywhere in web development and data handling. Here's how to encode or decode it online, free, in seconds.",
        seoTitle: "How to Base64 Encode and Decode Online Free | Filego",
        seoDescription:
            "Encode or decode Base64 text online for free. Useful for APIs, data URIs, and debugging encoded strings. Step-by-step guide.",
        category: "Security Guides",
        tags: ["base64", "encode decode", "security tools"],
        toolLabel: "Base64 Encode/Decode",
        toolPath: "/tools/security-tools/base64-encode-decode",
        content: `Base64 is a way of representing binary data as plain text, using only letters, numbers, and a couple of symbols — which makes it safe to embed in places that expect text, like URLs, JSON, or email. It's not encryption; it's just a different, text-safe representation of the same data.

## When you need Base64 encoding or decoding

- Embedding a small image directly into HTML or CSS as a data URI
- Decoding a Base64 string returned by an API to see its actual content
- Encoding data safely for inclusion in a URL, JSON payload, or config file
- Debugging a token, payload, or config value that's Base64-encoded

## How to Base64 encode or decode, step by step

1. Open [Base64 Encode/Decode](/tools/security-tools/base64-encode-decode).
2. Paste the text or data you want to encode, or the Base64 string you want to decode.
3. Choose encode or decode.
4. Copy the result.

## Tips for working with Base64

- **Base64 is not encryption.** Anyone can decode it back to the original data instantly — don't use it to protect sensitive information; use [AES Encrypt/Decrypt](/tools/security-tools/aes-encrypt-decrypt) for that instead.
- **Watch for URL-safe variants.** Some systems use a slightly different Base64 alphabet for URLs — if decoding fails, check whether the source uses a URL-safe variant.
- **Base64 output is always longer than the original.** Roughly a third larger — that's expected, not an error.

## Common questions

**Is Base64 a form of encryption?**
No — it's just an encoding scheme, fully reversible by anyone without a password or key. It's for compatibility, not security.

**Why does the encoded text look longer than the original?**
Base64 encoding expands data by roughly 33% — this is a normal, expected side effect of the encoding scheme.

**Can I encode a whole file, not just text?**
This tool is built around text input and output; for file-level encoding needs, check whether your specific workflow requires a different approach.

Need to encode or decode Base64? [Use the Base64 tool for free →](/tools/security-tools/base64-encode-decode)`,
    },
];

function withToolLink(guide: ToolGuide) {
    const callout = `> **Try it now:** [${guide.toolLabel} →](${guide.toolPath})`;
    return `${callout}\n\n${guide.content}`;
}

async function main() {
    for (const guide of guides) {
        const content = withToolLink(guide);

        await prisma.blogPost.upsert({
            where: { slug: guide.slug },
            create: {
                slug: guide.slug,
                title: guide.title,
                excerpt: guide.excerpt,
                content,
                category: guide.category,
                tags: guide.tags,
                seoTitle: guide.seoTitle,
                seoDescription: guide.seoDescription,
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
            update: {
                title: guide.title,
                excerpt: guide.excerpt,
                content,
                category: guide.category,
                tags: guide.tags,
                seoTitle: guide.seoTitle,
                seoDescription: guide.seoDescription,
            },
        });
        console.log(`Seeded: ${guide.slug}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
