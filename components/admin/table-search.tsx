// components/admin/table-search.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEBOUNCE_MS = 300;

interface TableSearchProps {
    placeholder?: string;
}

export function TableSearch({
    placeholder = "Search...",
}: TableSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlValue = searchParams.get("q") ?? "";
    const [value, setValue] = React.useState(urlValue);
    const [syncedUrlValue, setSyncedUrlValue] = React.useState(urlValue);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Follow outside URL changes (e.g. header search, back button) without an effect.
    if (urlValue !== syncedUrlValue) {
        setSyncedUrlValue(urlValue);
        setValue(urlValue);
    }

    React.useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    function updateQuery(term: string, immediate = false) {
        if (timer.current) clearTimeout(timer.current);

        const apply = () => {
            const params = new URLSearchParams(searchParams.toString());

            if (term.trim()) params.set("q", term.trim());
            else params.delete("q");
            params.delete("page");

            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname);
        };

        if (immediate) apply();
        else timer.current = setTimeout(apply, DEBOUNCE_MS);
    }

    return (
        <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(e) => {
                    const next = e.target.value;
                    setValue(next);
                    updateQuery(next);
                }}
                placeholder={placeholder}
                aria-label={placeholder}
                className="pl-9 pr-10"
            />
            {value ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Clear search"
                    className="absolute right-1 top-1/2 size-8 -translate-y-1/2 rounded-lg"
                    onClick={() => {
                        setValue("");
                        updateQuery("", true);
                    }}
                >
                    <X className="size-4" />
                </Button>
            ) : null}
        </div>
    );
}
