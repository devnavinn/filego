// components/admin/table-search.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TableSearchProps {
    placeholder?: string;
}

export function TableSearch({
    placeholder = "Search...",
}: TableSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [value, setValue] = React.useState(searchParams.get("q") ?? "");

    React.useEffect(() => {
        setValue(searchParams.get("q") ?? "");
    }, [searchParams]);

    function updateQuery(term: string) {
        const params = new URLSearchParams(searchParams.toString());

        if (term.trim()) {
            params.set("q", term.trim());
            params.set("page", "1");
        } else {
            params.delete("q");
            params.set("page", "1");
        }

        router.replace(`${pathname}?${params.toString()}`);
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
                className="pl-9 pr-10"
            />
            {value ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 size-8 -translate-y-1/2 rounded-lg"
                    onClick={() => {
                        setValue("");
                        updateQuery("");
                    }}
                >
                    <X className="size-4" />
                </Button>
            ) : null}
        </div>
    );
}