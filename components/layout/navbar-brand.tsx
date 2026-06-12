import Link from "next/link";
import { FilegoLogo } from "@/components/filego-logo";

export function NavbarBrand() {
    return (
        <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
                <FilegoLogo className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                    Filego
                </span>
                <span className="text-xs text-muted-foreground">
                    File tools, simplified
                </span>
            </div>
        </Link>
    );
}