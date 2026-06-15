// components/admin/table-pagination.tsx
import Link from "next/link";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface TablePaginationProps {
    page: number;
    totalPages: number;
    searchParams?: Record<string, string | string[] | undefined>;
}

export function TablePagination({
    page,
    totalPages,
    searchParams = {},
}: TablePaginationProps) {
    if (totalPages <= 1) return null;

    const createHref = (nextPage: number) => {
        const params = new URLSearchParams();

        Object.entries(searchParams).forEach(([key, value]) => {
            if (typeof value === "string") params.set(key, value);
        });

        params.set("page", String(nextPage));
        return `?${params.toString()}`;
    };

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
        Math.max(0, page - 3),
        Math.min(totalPages, page + 2)
    );

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href={page > 1 ? createHref(page - 1) : "#"}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>

                {pages.map((p) => (
                    <PaginationItem key={p}>
                        <PaginationLink href={createHref(p)} isActive={p === page}>
                            {p}
                        </PaginationLink>
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <PaginationNext
                        href={page < totalPages ? createHref(page + 1) : "#"}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}