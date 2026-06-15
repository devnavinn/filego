// app/admin/blog/new/page.tsx
import { requireAdmin } from "@/lib/auth";
import { AddEditBlogForm } from "@/components/admin/add-edit-blog-form";

export default async function CreateBlogPostPage() {
    await requireAdmin();

    return (
        <main className="space-y-6">
            <section className="rounded-3xl border bg-background p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">Blog management</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Create new post</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Add a new article for Filego’s blog and publish it when ready.
                </p>
            </section>

            <AddEditBlogForm mode="create" />
        </main>
    );
}