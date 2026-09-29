import Link from "next/link";
import { FilegoMark } from "@/components/filego-logo";

export function NavbarBrand() {
    return (
        <Link href="/" className="flex items-center gap-2.5" aria-label="Filego home">
            <FilegoMark />
            <span className="font-heading text-lg font-extrabold tracking-tight text-foreground">
                File<span className="text-gradient-brand">go</span>
            </span>
        </Link>
    );
}
